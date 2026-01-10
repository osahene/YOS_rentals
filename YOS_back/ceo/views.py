from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from datetime import timedelta, datetime
import json

from .models import (
    User, Customer, Car, Driver, Payment, Booking,
    BookingHistory, Invoice, SMSLog, EmailLog
)
from .serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, DriverSerializer,
    PaymentSerializer, BookingSerializer, BookingCreateSerializer, InvoiceSerializer,
    BookingHistorySerializer, SMSLogSerializer, EmailLogSerializer, DashboardStatsSerializer
)
from .paystack_service import PaystackService
from .permissions import IsAdminOrStaff, IsCustomer, IsOwnerOrAdmin
from django.core.mail import send_mail
from django.conf import settings


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['first_name', 'last_name',
                     'email', 'phone', 'ghana_card_id']

    @action(detail=True, methods=['get'])
    def bookings(self, request, pk=None):
        customer = self.get_object()
        bookings = Booking.objects.filter(customer=customer)
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'make', 'fuel_type', 'transmission']
    search_fields = ['make', 'model', 'license_plate', 'vin']

    @action(detail=False, methods=['get'])
    def available(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = timezone.datetime.fromisoformat(start_date)
            end_date = timezone.datetime.fromisoformat(end_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get cars that are available and not booked for the selected dates
        booked_car_ids = Booking.objects.filter(
            status__in=['confirmed', 'active'],
            start_date__lt=end_date,
            end_date__gt=start_date
        ).values_list('car_id', flat=True)

        available_cars = Car.objects.filter(
            status='available'
        ).exclude(
            id__in=booked_car_ids
        )

        serializer = self.get_serializer(available_cars, many=True)
        return Response(serializer.data)


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'role']
    search_fields = ['name', 'license_number', 'phone', 'email']

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_drivers = Driver.objects.filter(status='available')
        serializer = self.get_serializer(available_drivers, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['method', 'status']


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'customer', 'car', 'is_self_drive']
    search_fields = ['customer__first_name',
                     'customer__last_name', 'car__make', 'car__model']

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return Booking.objects.all()
        elif user.role == 'customer':
            # Return only customer's own bookings
            try:
                customer = Customer.objects.get(user=user)
                return Booking.objects.filter(customer=customer)
            except Customer.DoesNotExist:
                return Booking.objects.none()
        return Booking.objects.none()

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()

        if booking.status != 'pending':
            return Response(
                {"error": f"Booking is already {booking.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'confirmed'
        booking.save()

        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status='confirmed',
            notes="Booking confirmed",
            changed_by=request.user
        )

        # Send confirmation notifications
        self._send_confirmation_notifications(booking)

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()

        if not booking.can_cancel:
            return Response(
                {"error": "Booking cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')
        booking.status = 'cancelled'
        booking.cancellation_reason = reason
        booking.cancellation_date = timezone.now()
        booking.save()

        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status='cancelled',
            notes=f"Booking cancelled: {reason}",
            changed_by=request.user
        )

        # Update car status
        booking.car.status = 'available'
        booking.car.save()

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        booking = self.get_object()

        if booking.status != 'confirmed':
            return Response(
                {"error": f"Cannot checkout booking with status {booking.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'active'
        booking.checked_out_at = timezone.now()
        booking.checked_out_by = request.user
        booking.save()

        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status='active',
            notes="Vehicle checked out",
            changed_by=request.user
        )

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        booking = self.get_object()

        if booking.status != 'active':
            return Response(
                {"error": f"Cannot checkin booking with status {booking.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'completed'
        booking.checked_in_at = timezone.now()
        booking.checked_in_by = request.user
        booking.save()

        # Update car status
        booking.car.status = 'available'
        booking.car.save()

        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status='completed',
            notes="Vehicle checked in",
            changed_by=request.user
        )

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming_bookings = Booking.objects.filter(
            start_date__gt=timezone.now(),
            status__in=['pending', 'confirmed']
        ).order_by('start_date')

        serializer = self.get_serializer(upcoming_bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_bookings = Booking.objects.filter(
            status='active'
        )

        serializer = self.get_serializer(active_bookings, many=True)
        return Response(serializer.data)

    def _send_confirmation_notifications(self, booking):
        # Send email confirmation
        try:
            subject = f"Booking Confirmation - {booking.car.full_name}"
            message = f"""
            Dear {booking.customer.full_name},
            
            Your booking has been confirmed with the following details:
            
            Vehicle: {booking.car.full_name} ({booking.car.license_plate})
            Pickup Date: {booking.start_date.strftime('%B %d, %Y')}
            Return Date: {booking.end_date.strftime('%B %d, %Y')}
            Pickup Location: {booking.pickup_location}
            Return Location: {booking.dropoff_location}
            Total Amount: GHS {booking.total_amount}
            Payment Method: {booking.payment.method.replace('_', ' ').title()}
            
            Thank you for choosing our service!
            
            Best regards,
            YOS Car Rentals Team
            """

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [booking.customer.email],
                fail_silently=False,
            )

            # Log email
            EmailLog.objects.create(
                recipient=booking.customer.email,
                subject=subject,
                status='sent',
                provider='SMTP'
            )

        except Exception as e:
            # Log email failure
            EmailLog.objects.create(
                recipient=booking.customer.email,
                subject="Booking Confirmation",
                status='failed',
                provider_response={'error': str(e)}
            )

        # Send SMS (mock implementation)
        try:
            sms_message = f"Dear {booking.customer.first_name}, your booking for {booking.car.make} {booking.car.model} has been confirmed. Pickup: {booking.start_date.strftime('%d/%m')} at {booking.pickup_location}. Total: GHS {booking.total_amount}."

            # Here you would integrate with your SMS provider
            # For now, we'll just log it
            SMSLog.objects.create(
                recipient=booking.customer.phone,
                message=sms_message,
                status='sent',
                provider='Mock SMS Provider'
            )

        except Exception as e:
            SMSLog.objects.create(
                recipient=booking.customer.phone,
                message="Booking confirmation",
                status='failed',
                provider_response={'error': str(e)}
            )


class PaymentGatewayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Initialize Paystack payment
        booking_id = request.data.get('booking_id')
        email = request.data.get('email')
        amount = request.data.get('amount')

        try:
            booking = Booking.objects.get(id=booking_id)
            payment = booking.payment

            # Only process mobile money payments through gateway
            if payment.method != 'mobile_money':
                return Response(
                    {"error": "Payment gateway only supports mobile money payments"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize Paystack payment
            paystack_service = PaystackService()
            response = paystack_service.initialize_transaction(
                email=email,
                amount=amount,
                reference=f"BOOK_{booking_id}",
                metadata={
                    'booking_id': str(booking_id),
                    'customer_id': str(booking.customer.id)
                }
            )

            if response.get('status'):
                # Update payment with gateway details
                payment.transaction_reference = response['data']['reference']
                payment.authorization_url = response['data']['authorization_url']
                payment.payment_gateway = 'paystack'
                payment.save()

                return Response({
                    'authorization_url': response['data']['authorization_url'],
                    'reference': response['data']['reference'],
                    'access_code': response['data']['access_code']
                })
            else:
                return Response(
                    {"error": "Failed to initialize payment"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        # Verify Paystack payment
        reference = request.query_params.get('reference')

        if not reference:
            return Response(
                {"error": "Reference parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = Payment.objects.get(transaction_reference=reference)
            paystack_service = PaystackService()
            verification = paystack_service.verify_transaction(reference)

            if verification.get('status'):
                if verification['data']['status'] == 'success':
                    # Update payment status
                    payment.status = 'completed'
                    payment.mobile_money_transaction_id = verification['data']['id']
                    payment.gateway_response = verification
                    payment.save()

                    # Update booking status
                    booking = payment.booking
                    booking.status = 'confirmed'
                    booking.save()

                    # Send confirmation notifications
                    booking_viewset = BookingViewSet()
                    booking_viewset._send_confirmation_notifications(booking)

                    return Response({
                        'status': 'success',
                        'message': 'Payment verified successfully',
                        'booking_id': str(booking.id)
                    })
                else:
                    payment.status = 'failed'
                    payment.gateway_response = verification
                    payment.save()

                    return Response({
                        'status': 'failed',
                        'message': 'Payment was not successful'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(
                    {"error": "Failed to verify payment"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrStaff]

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        invoice = self.get_object()

        # Generate invoice PDF (mock implementation)
        # In production, use a library like ReportLab or WeasyPrint
        invoice.invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{invoice.id.hex[:8].upper()}"
        invoice.due_date = timezone.now().date() + timedelta(days=30)
        invoice.save()

        serializer = self.get_serializer(invoice)
        return Response(serializer.data)


class DashboardStatsView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        month_end = (month_start + timedelta(days=32)
                     ).replace(day=1) - timedelta(days=1)

        # Calculate stats
        total_bookings = Booking.objects.count()
        total_revenue = Booking.objects.aggregate(
            total=Sum('total_amount'))['total'] or 0
        active_bookings = Booking.objects.filter(status='active').count()
        available_cars = Car.objects.filter(status='available').count()
        pending_payments = Payment.objects.filter(status='pending').count()

        # Monthly stats
        monthly_bookings = Booking.objects.filter(
            created_at__date__gte=month_start,
            created_at__date__lte=month_end
        ).count()

        monthly_revenue = Booking.objects.filter(
            created_at__date__gte=month_start,
            created_at__date__lte=month_end
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Payment method distribution
        payment_methods = Payment.objects.values('method').annotate(
            count=Count('id'),
            total=Sum('amount')
        )

        # Booking status distribution
        booking_statuses = Booking.objects.values('status').annotate(
            count=Count('id')
        )

        stats = {
            'total_bookings': total_bookings,
            'total_revenue': total_revenue,
            'active_bookings': active_bookings,
            'available_cars': available_cars,
            'pending_payments': pending_payments,
            'monthly_bookings': monthly_bookings,
            'monthly_revenue': monthly_revenue,
            'payment_methods': list(payment_methods),
            'booking_statuses': list(booking_statuses),
        }

        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class ReportView(APIView):
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        report_type = request.query_params.get('type', 'monthly')

        if report_type == 'monthly':
            # Get data for the last 12 months
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=365)

            # Generate monthly report data
            months = []
            revenue = []
            bookings = []

            current = start_date.replace(day=1)
            while current <= end_date:
                next_month = current.replace(day=28) + timedelta(days=4)
                month_end = next_month - timedelta(days=next_month.day)

                month_bookings = Booking.objects.filter(
                    created_at__date__gte=current,
                    created_at__date__lte=month_end
                )

                months.append(current.strftime('%b %Y'))
                revenue.append(month_bookings.aggregate(
                    total=Sum('total_amount'))['total'] or 0)
                bookings.append(month_bookings.count())

                # Move to next month
                current = month_end + timedelta(days=1)

            return Response({
                'labels': months,
                'revenue': revenue,
                'bookings': bookings
            })

        elif report_type == 'revenue_by_payment_method':
            data = Payment.objects.values('method').annotate(
                total=Sum('amount'),
                count=Count('id')
            )
            return Response(list(data))

        else:
            return Response(
                {"error": "Invalid report type"},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_booking_confirmation(request, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)

        # Send notifications
        viewset = BookingViewSet()
        viewset._send_confirmation_notifications(booking)

        return Response({
            'success': True,
            'message': 'Confirmation sent successfully'
        })

    except Booking.DoesNotExist:
        return Response(
            {"error": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND
        )
