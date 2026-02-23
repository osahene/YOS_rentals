import requests
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
import calendar
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Staff, SalaryPayment
from .serializers import (
    StaffSerializer, StaffDetailSerializer, SalaryPaymentSerializer,
    StaffWithBookingsSerializer, CreateStaffSerializer, UpdateStaffStatusSerializer
)
from bookings.models import Booking

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'department', 'status', 'employment_type']
    
    def get_permissions(self):
        # if self.action in ['create', 'update', 'partial_update', 'destroy', 'suspend', 'terminate']:
        #     return [IsAdminUser()]
        # return [IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def get_serializer_class(self): #type: ignore
        if self.action == 'create':
            return CreateStaffSerializer
        elif self.action == 'retrieve':
            return StaffDetailSerializer
        elif self.action == 'list':
            return StaffSerializer
        return StaffSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search term
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(employee_id__icontains=search)
            )
        
        # Filter by role if specified
        role = self.request.query_params.get('role', '')
        if role:
            queryset = queryset.filter(role=role)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['get'])
    def bookings(self, request, pk=None):
        """Get bookings for a driver"""
        staff = self.get_object()
        
        if staff.role != 'driver':
            return Response(
                {'error': 'Only drivers have bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bookings = Booking.objects.filter(driver=staff).select_related(
            'car', 'customer'
        ).order_by('-created_at')
        
        # Paginate
        page = self.paginate_queryset(bookings)
        if page is not None:
            from bookings.serializers import BookingSerializer
            serializer = BookingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        from bookings.serializers import BookingSerializer
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def salary_history(self, request, pk=None):
        """Get salary payment history for staff"""
        staff = self.get_object()
        salary_payments = SalaryPayment.objects.filter(
            staff=staff
        ).order_by('-month')
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date and end_date:
            salary_payments = salary_payments.filter(
                month__range=[start_date, end_date]
            )
        
        # Paginate
        page = self.paginate_queryset(salary_payments)
        if page is not None:
            serializer = SalaryPaymentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = SalaryPaymentSerializer(salary_payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a staff member"""
        staff = self.get_object()
        
        if staff.status == 'terminated':
            return Response(
                {'error': 'Cannot suspend a terminated staff member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        staff.status = 'suspended'
        staff.save()
        
        # Log the suspension
        # You can create an AuditLog model for this
        
        return Response({
            'message': f'Staff {staff.name} has been suspended',
            'status': staff.status
        })
    
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """Terminate a staff member"""
        serializer = UpdateStaffStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        staff = self.get_object()
        
        # If already terminated
        if staff.status == 'terminated':
            return Response(
                {'error': 'Staff member is already terminated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        staff.status = 'terminated'
        staff.termination_date = serializer.validated_data.get('termination_date', timezone.now().date())
        staff.save()
        
        # If driver, remove from active bookings
        if staff.role == 'driver':
            active_bookings = Booking.objects.filter(
                driver=staff,
                status__in=['active', 'confirmed']
            )
            for booking in active_bookings:
                booking.driver = None
                booking.save()
        
        return Response({
            'message': f'Staff {staff.name} has been terminated',
            'status': staff.status,
            'termination_date': staff.termination_date
        })
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a suspended or inactive staff member"""
        staff = self.get_object()
        
        if staff.status == 'terminated':
            return Response(
                {'error': 'Cannot reactivate a terminated staff member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        staff.status = 'active'
        staff.save()
        
        return Response({
            'message': f'Staff {staff.name} has been reactivated',
            'status': staff.status
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        """Get staff dashboard metrics"""
        total_staff = Staff.objects.count()
        active_staff = Staff.objects.filter(status='active').count()
        
        # Count by department
        departments = Staff.objects.values('department').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Count by role
        roles = Staff.objects.values('role').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Drivers with completed bookings
        drivers = Staff.objects.filter(role='driver')
        drivers_with_stats = []
        for driver in drivers:
            completed_bookings = Booking.objects.filter(
                driver=driver,
                status='completed'
            ).count()
            
            drivers_with_stats.append({
                'id': str(driver.id),
                'name': driver.name,
                'completed_bookings': completed_bookings,
                'status': driver.status
            })
        
        return Response({
            'total_staff': total_staff,
            'active_staff': active_staff,
            'suspended_staff': Staff.objects.filter(status='suspended').count(),
            'terminated_staff': Staff.objects.filter(status='terminated').count(),
            'by_department': list(departments),
            'by_role': list(roles),
            'driver_stats': drivers_with_stats
        })
    
    @action(detail=False, methods=['get'])
    def driver_performance(self, request):
        """Get driver performance metrics"""
        drivers = Staff.objects.filter(role='driver')
        
        performance_data = []
        for driver in drivers:
            # Get completed bookings
            completed_bookings = Booking.objects.filter(
                driver=driver,
                status='completed'
            )
            
            total_revenue = completed_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            # Calculate rating based on completed bookings and any penalties
            total_bookings = Booking.objects.filter(driver=driver).count()
            completed_count = completed_bookings.count()
            
            rating = 0
            if total_bookings > 0:
                completion_rate = (completed_count / total_bookings) * 100
                rating = min(5.0, completion_rate / 20)  # Convert to 0-5 scale
            
            performance_data.append({
                'driver_id': str(driver.id),
                'driver_name': driver.name,
                'total_bookings': total_bookings,
                'completed_bookings': completed_count,
                'completion_rate': (completed_count / total_bookings * 100) if total_bookings > 0 else 0,
                'total_revenue': float(total_revenue),
                'average_rating': round(rating, 1),
                'status': driver.status
            })
        
        return Response(sorted(performance_data, key=lambda x: x['completed_bookings'], reverse=True))
    
class SalaryPaymentViewSet(viewsets.ModelViewSet):
    queryset = SalaryPayment.objects.all()
    serializer_class = SalaryPaymentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by staff if specified
        staff_id = self.request.query_params.get('staff_id')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(month__range=[start_date, end_date])
        
        return queryset.order_by('-month')
    
    @action(detail=False, methods=['get'])
    def upcoming_payments(self, request):
        """Get upcoming salary payments for current month"""
        current_month = timezone.now().replace(day=1).date()
        
        # Get active staff
        active_staff = Staff.objects.filter(status='active')
        
        upcoming = []
        for staff in active_staff:
            # Check if payment already exists for this month
            existing_payment = SalaryPayment.objects.filter(
                staff=staff,
                month=current_month
            ).first()
            
            if not existing_payment:
                upcoming.append({
                    'staff_id': str(staff.id),
                    'staff_name': staff.name,
                    'role': staff.role,
                    'basic_salary': float(staff.salary),
                    'month': current_month.isoformat()
                })
        
        return Response(upcoming)
    
    @action(detail=False, methods=['post'])
    def bulk_pay(self, request):
        """Bulk pay salaries for multiple staff"""
        staff_ids = request.data.get('staff_ids', [])
        month = request.data.get('month', timezone.now().replace(day=1).date())
        payment_date = request.data.get('payment_date', timezone.now().date())
        payment_method = request.data.get('payment_method', 'bank_transfer')
        
        results = []
        errors = []
        
        for staff_id in staff_ids:
            try:
                staff = Staff.objects.get(id=staff_id)
                
                # Check if payment already exists
                if SalaryPayment.objects.filter(staff=staff, month=month).exists():
                    errors.append(f"Salary already paid for {staff.name} in {month}")
                    continue
                
                # Create salary payment
                salary_payment = SalaryPayment.objects.create(
                    staff=staff,
                    month=month,
                    basic_salary=staff.salary,
                    net_salary=staff.salary,  # Basic only, can add overtime/bonuses
                    is_paid=True,
                    payment_date=payment_date,
                    payment_method=payment_method,
                    paid_by=request.user
                )
                
                results.append({
                    'staff': staff.name,
                    'amount': float(staff.salary),
                    'payment_id': str(salary_payment.id)
                })
                
            except Staff.DoesNotExist:
                errors.append(f"Staff with ID {staff_id} not found")
        
        return Response({
            'success': len(results),
            'errors': errors,
            'results': results
        })
        
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send a professional HTML email with salary details."""
        payment = self.get_object()
        staff = payment.staff

        if not staff.email:
            return Response({'error': 'Staff has no email address'}, status=400)

        subject = f"Salary Payment Confirmation – {payment.month.strftime('%B %Y')}"

        # Prepare context for the email template
        context = {
            'staff_name': staff.name,
            'month': payment.month.strftime('%B %Y'),
            'basic_salary': payment.basic_salary,
            'overtime': payment.overtime or 0,
            'bonuses': payment.bonuses or 0,
            'deductions': payment.deductions or 0,
            'net_salary': payment.net_salary,
            'payment_date': payment.payment_date.strftime('%d %B %Y'),
            'payment_method': payment.get_payment_method_display(),
            'company_name': 'YOS Car Rentals',  # customize
        }

        # Render HTML email
        html_message = render_to_string('salary_payment.html', context)
        plain_message = strip_tags(html_message)  # fallback plain text

        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[staff.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send()

        return Response({'status': 'email sent'})

    @action(detail=True, methods=['post'])
    def send_sms(self, request, pk=None):
        """Send a professional SMS via mNotify."""
        payment = self.get_object()
        staff = payment.staff
        phone = staff.phone

        if not phone:
            return Response({'error': 'Staff has no phone number'}, status=400)

        # if phone.startswith('0'):
        #     phone = '233' + phone[1:]  # convert 024... to 23324...

        month_str = payment.month.strftime('%B %Y')
        amount = f"GHS {payment.net_salary:,.2f}"
        message = (
            f"Dear {staff.name},\n Your salary of {amount} for {month_str} has been processed. "
            f"Payment method: {payment.get_payment_method_display()}. "
            f"Thank you for your dedication. \n YOS Car Rentals"
        )

        # Prepare mNotify API request
        endpoint = 'https://api.mnotify.com/api/sms/quick'
        api_key = settings.MNOFTIFY_SMS
        url = f"{endpoint}?key={api_key}"

        payload = {
            "recipient": [phone],
            "sender": settings.MNOTIFY_SENDER_ID or "mNotify",
            "message": message,
            "is_schedule": "false",
            "schedule_date": ""
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                return Response({'status': 'sms sent'})
            else:
                return Response(
                    {'error': 'SMS sending failed', 'details': response.text},
                    status=500
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)