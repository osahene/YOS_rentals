# vehicle/views.py
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch, Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django.core.cache import cache
from django.db import transaction
import logging

from backend_YOS.permissions import RolePermission
from .models import (
    Vehicle, VehicleInsurance, MaintenanceRecord,
    InspectionChecklist, Booking, Payment,
    FinancialTransaction, Receipt, VehicleAvailability
)
from .serializers import (
    VehicleSerializer, VehicleInsuranceSerializer,
    MaintenanceRecordSerializer, InspectionChecklistSerializer,
    BookingSerializer, PaymentSerializer,
    FinancialTransactionSerializer, ReceiptSerializer,
    VehicleAvailabilitySerializer
)
from .tasks import send_receipt_email

logger = logging.getLogger(__name__)


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['transport_manager', 'ceo', 'accountant']

    def get_queryset(self):
        """
        Optimized queryset with select_related and prefetch_related
        to avoid N+1 queries
        """
        queryset = Vehicle.objects.select_related('created_by').prefetch_related(
            Prefetch('insurances', queryset=VehicleInsurance.objects.filter(
                is_active=True)),
            Prefetch('maintenance_records', queryset=MaintenanceRecord.objects.filter(
                is_completed=False)),
            Prefetch('bookings', queryset=Booking.objects.filter(
                status__in=['confirmed', 'in_progress']
            )),
            'inspections'
        ).all()

        # Apply filters
        status_filter = self.request.query_params.get('status')
        category_filter = self.request.query_params.get('category')
        make_filter = self.request.query_params.get('make')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        if make_filter:
            queryset = queryset.filter(make__icontains=make_filter)

        return queryset

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        vehicle = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Vehicle.VEHICLE_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle.update_status(new_status)
        return Response({'status': 'Status updated successfully'})

    @action(detail=False, methods=['get'])
    def available_vehicles(self, request):
        """Get vehicles available for booking between dates"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find vehicles that are not booked or in maintenance during the period
        booked_vehicle_ids = Booking.objects.filter(
            Q(pickup_date__lt=end, return_date__gt=start),
            status__in=['confirmed', 'in_progress']
        ).values_list('vehicle_id', flat=True)

        maintenance_vehicle_ids = VehicleAvailability.objects.filter(
            Q(start_date__lt=end, end_date__gt=start),
            status='maintenance'
        ).values_list('vehicle_id', flat=True)

        unavailable_ids = set(booked_vehicle_ids) | set(
            maintenance_vehicle_ids)

        available_vehicles = Vehicle.objects.filter(
            status='available'
        ).exclude(
            id__in=unavailable_ids
        ).select_related('created_by')

        serializer = self.get_serializer(available_vehicles, many=True)
        return Response(serializer.data)


class VehicleInsuranceViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleInsuranceSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['transport_manager', 'ceo']

    def get_queryset(self):
        vehicle_id = self.request.query_params.get('vehicle_id')

        queryset = VehicleInsurance.objects.select_related(
            'vehicle', 'created_by'
        ).all()

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['transport_manager', 'ceo']

    def get_queryset(self):
        vehicle_id = self.request.query_params.get('vehicle_id')
        is_completed = self.request.query_params.get('is_completed')

        queryset = MaintenanceRecord.objects.select_related(
            'vehicle', 'created_by'
        ).all()

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        if is_completed is not None:
            queryset = queryset.filter(
                is_completed=is_completed.lower() == 'true')

        return queryset

    @action(detail=True, methods=['post'])
    def complete_maintenance(self, request, pk=None):
        maintenance = self.get_object()

        if maintenance.is_completed:
            return Response(
                {'error': 'Maintenance already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance.is_completed = True
        maintenance.actual_date = timezone.now().date()
        maintenance.save()

        # Update vehicle status back to available
        vehicle = maintenance.vehicle
        vehicle.update_status('available')

        # Update vehicle availability
        availability = VehicleAvailability.objects.filter(
            vehicle=vehicle,
            maintenance=maintenance,
            status='maintenance'
        ).first()

        if availability:
            availability.end_date = timezone.now().date()
            availability.save()

        return Response({'status': 'Maintenance completed successfully'})


class InspectionChecklistViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionChecklistSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['transport_manager', 'ceo']

    def get_queryset(self):
        vehicle_id = self.request.query_params.get('vehicle_id')
        inspection_type = self.request.query_params.get('inspection_type')

        queryset = InspectionChecklist.objects.select_related(
            'vehicle', 'inspector'
        ).all()

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        if inspection_type:
            queryset = queryset.filter(inspection_type=inspection_type)

        return queryset.order_by('-inspection_date')

    def perform_create(self, serializer):
        serializer.save(inspector=self.request.user)

        # Update vehicle status based on inspection
        vehicle = serializer.validated_data['vehicle']
        if serializer.validated_data['inspection_type'] == 'damage':
            vehicle.update_status('unavailable')
        elif serializer.validated_data['inspection_type'] == 'post_rental':
            # Check if vehicle needs maintenance
            if serializer.validated_data['overall_rating'] < 3:
                vehicle.update_status('maintenance')
            else:
                vehicle.update_status('available')


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Users see their own bookings, managers see all
        """
        user = self.request.user

        queryset = Booking.objects.select_related(
            'vehicle', 'customer', 'created_by',
            'pre_inspection', 'post_inspection'
        ).prefetch_related(
            'payments', 'receipts'
        ).all()

        if user.role in ['customer']:
            queryset = queryset.filter(customer=user)

        # Apply filters
        status_filter = self.request.query_params.get('status')
        vehicle_filter = self.request.query_params.get('vehicle_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if vehicle_filter:
            queryset = queryset.filter(vehicle_id=vehicle_filter)
        if date_from:
            queryset = queryset.filter(pickup_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(return_date__lte=date_to)

        return queryset.order_by('-created_at')

    def get_permissions(self):
        """
        Walk-in bookings can be created by transport managers
        """
        if self.action == 'create':
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def cancel_booking(self, request, pk=None):
        booking = self.get_object()

        if booking.status in ['completed', 'cancelled']:
            return Response(
                {'error': f'Cannot cancel booking with status {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate cancellation fee (free if cancelled 48 hours before)
        now = timezone.now()
        hours_before = (booking.pickup_date - now).total_seconds() / 3600

        if hours_before < 48:
            # Charge 20% cancellation fee
            cancellation_fee = booking.total_amount * 0.2
            booking.late_fee = cancellation_fee
            booking.total_amount += cancellation_fee
            booking.balance_due += cancellation_fee

        booking.status = 'cancelled'
        booking.save()

        # Update vehicle status and availability
        vehicle = booking.vehicle
        vehicle.update_status('available')

        # Remove availability record
        VehicleAvailability.objects.filter(booking=booking).delete()

        return Response({'status': 'Booking cancelled successfully'})

    @action(detail=True, methods=['post'])
    def complete_booking(self, request, pk=None):
        booking = self.get_object()

        if booking.status != 'in_progress':
            return Response(
                {'error': 'Only in-progress bookings can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'completed'
        booking.actual_return_date = timezone.now()
        booking.save()

        # Update vehicle status
        vehicle = booking.vehicle

        # Check if vehicle needs inspection or maintenance
        # (This would typically trigger an inspection)
        vehicle.update_status('available')

        # Update availability
        availability = VehicleAvailability.objects.filter(
            booking=booking).first()
        if availability:
            availability.end_date = timezone.now().date()
            availability.status = 'available'
            availability.save()

        return Response({'status': 'Booking completed successfully'})


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['customer', 'transport_manager', 'accountant', 'ceo']

    def get_queryset(self):
        user = self.request.user

        queryset = Payment.objects.select_related(
            'booking', 'booking__vehicle', 'booking__customer'
        ).all()

        if user.role == 'customer':
            queryset = queryset.filter(booking__customer=user)

        # Apply filters
        booking_filter = self.request.query_params.get('booking_id')
        status_filter = self.request.query_params.get('status')

        if booking_filter:
            queryset = queryset.filter(booking_id=booking_filter)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-payment_date')


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialTransactionSerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['accountant', 'ceo']

    def get_queryset(self):
        queryset = FinancialTransaction.objects.select_related(
            'vehicle', 'booking', 'created_by', 'approved_by'
        ).all()

        # Apply filters
        transaction_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if category:
            queryset = queryset.filter(category=category)
        if date_from:
            queryset = queryset.filter(transaction_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(transaction_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve_transaction(self, request, pk=None):
        transaction = self.get_object()

        if transaction.is_approved:
            return Response(
                {'error': 'Transaction already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.is_approved = True
        transaction.approved_by = request.user
        transaction.approved_date = timezone.now()
        transaction.save()

        return Response({'status': 'Transaction approved successfully'})

    @action(detail=False, methods=['get'])
    def financial_report(self, request):
        """
        Generate financial reports with various time periods
        """
        period = request.query_params.get('period', 'monthly')
        year = request.query_params.get('year', timezone.now().year)

        # Base queryset
        queryset = FinancialTransaction.objects.filter(
            is_approved=True
        )

        if period == 'monthly':
            # Monthly report
            report_data = queryset.filter(
                transaction_date__year=year
            ).values(
                'transaction_date__month'
            ).annotate(
                total_revenue=Sum('amount', filter=Q(
                    transaction_type='revenue')),
                total_expenses=Sum('amount', filter=Q(
                    transaction_type='expense')),
                net_profit=Sum('net_amount')
            ).order_by('transaction_date__month')

        elif period == 'quarterly':
            # Quarterly report
            report_data = []
            for quarter in range(1, 5):
                start_month = (quarter - 1) * 3 + 1
                end_month = quarter * 3

                quarter_data = queryset.filter(
                    transaction_date__year=year,
                    transaction_date__month__gte=start_month,
                    transaction_date__month__lte=end_month
                ).aggregate(
                    total_revenue=Sum('amount', filter=Q(
                        transaction_type='revenue')),
                    total_expenses=Sum('amount', filter=Q(
                        transaction_type='expense')),
                    transaction_count=Count('id')
                )

                quarter_data['quarter'] = quarter
                quarter_data['net_profit'] = (
                    (quarter_data['total_revenue'] or 0) -
                    (quarter_data['total_expenses'] or 0)
                )
                report_data.append(quarter_data)

        elif period == 'vehicle':
            # Vehicle-wise profitability
            report_data = queryset.filter(
                vehicle__isnull=False,
                transaction_date__year=year
            ).values(
                'vehicle__plate_number',
                'vehicle__make',
                'vehicle__model'
            ).annotate(
                total_revenue=Sum('amount', filter=Q(
                    transaction_type='revenue')),
                total_expenses=Sum('amount', filter=Q(
                    transaction_type='expense')),
                maintenance_cost=Sum(
                    'amount', filter=Q(category='maintenance')),
                rental_count=Count('id', filter=Q(transaction_type='revenue'))
            ).order_by('-total_revenue')

        else:
            # Annual summary
            report_data = queryset.filter(
                transaction_date__year=year
            ).aggregate(
                total_revenue=Sum('amount', filter=Q(
                    transaction_type='revenue')),
                total_expenses=Sum('amount', filter=Q(
                    transaction_type='expense')),
                total_transactions=Count('id'),
                avg_transaction=Avg('amount')
            )

            report_data['year'] = year
            report_data['net_profit'] = (
                (report_data['total_revenue'] or 0) -
                (report_data['total_expenses'] or 0)
            )

        return Response(report_data)


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Receipt.objects.select_related(
            'booking', 'payment', 'booking__vehicle', 'booking__customer'
        ).all()

        if user.role == 'customer':
            queryset = queryset.filter(booking__customer=user)

        return queryset

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        receipt = self.get_object()

        # Call async task to send email
        send_receipt_email.delay(receipt.id)

        receipt.is_emailed = True
        receipt.emailed_at = timezone.now()
        receipt.save()

        return Response({'status': 'Receipt email sent successfully'})

    @action(detail=True, methods=['get'])
    def download_data(self, request, pk=None):
        """
        Return receipt data for frontend PDF generation
        """
        receipt = self.get_object()

        data = {
            'receipt_number': receipt.receipt_number,
            'issue_date': receipt.issue_date,
            'due_date': receipt.due_date,
            'company': {
                'name': 'Your Vehicle Rental Service',
                'address': '123 Rental Street, City, Country',
                'phone': '+1234567890',
                'email': 'info@rentalservice.com'
            },
            'customer': {
                'name': receipt.booking.customer_name or
                f"{receipt.booking.customer.first_name} {receipt.booking.customer.last_name}",
                'email': receipt.booking.customer_email or receipt.booking.customer.email,
                'phone': receipt.booking.customer_phone or receipt.booking.customer.phone_number
            },
            'vehicle': {
                'make': receipt.booking.vehicle.make,
                'model': receipt.booking.vehicle.model,
                'year': receipt.booking.vehicle.year,
                'plate': receipt.booking.vehicle.plate_number,
                'vin': receipt.booking.vehicle.vin
            },
            'booking': {
                'reference': receipt.booking.booking_reference,
                'pickup_date': receipt.booking.pickup_date,
                'return_date': receipt.booking.return_date,
                'days': receipt.booking.rental_days
            },
            'charges': {
                'subtotal': float(receipt.subtotal),
                'tax_rate': float(receipt.tax_rate),
                'tax_amount': float(receipt.tax_amount),
                'security_deposit': float(receipt.booking.security_deposit),
                'late_fee': float(receipt.booking.late_fee),
                'damage_charges': float(receipt.booking.damage_charges),
                'total_amount': float(receipt.total_amount),
                'amount_paid': float(receipt.amount_paid),
                'balance_due': float(receipt.balance_due)
            },
            'payment': {
                'method': receipt.payment.payment_method,
                'date': receipt.payment.payment_date,
                'reference': receipt.payment.payment_reference
            },
            'notice': 'If the vehicle is returned late, a surcharge of 50% of the daily rate will apply for each additional day.'
        }

        return Response(data)


class VehicleAvailabilityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VehicleAvailabilitySerializer
    permission_classes = [IsAuthenticated, RolePermission]
    allowed_roles = ['transport_manager', 'ceo']

    def get_queryset(self):
        vehicle_id = self.request.query_params.get('vehicle_id')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        queryset = VehicleAvailability.objects.select_related(
            'vehicle', 'booking', 'maintenance'
        ).all()

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if date_from:
            queryset = queryset.filter(end_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(start_date__lte=date_to)

        return queryset.order_by('start_date')
