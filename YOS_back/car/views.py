from django.db.models.functions import Cast
from django.db.models import Sum, Count, Avg, F, FloatField
from django.db.models.functions import TruncMonth, TruncYear
from datetime import datetime, timedelta
import pandas as pd
from django.shortcuts import render
from django.http import HttpResponse

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
    BookingHistory, Invoice, SMSLog, EmailLog, Expense,
    CapitalExpenditure, ExpenseCategory, FinancialReport
)
from .serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, DriverSerializer,
    PaymentSerializer, BookingSerializer, BookingCreateSerializer, InvoiceSerializer,
    BookingHistorySerializer, SMSLogSerializer, EmailLogSerializer, DashboardStatsSerializer,
    ExpenseCategorySerializer, FinancialReportSerializer, ExpenseSerializer, CapitalExpenditureSerializer,
    ReportRequestSerializer
)
from .paystack_service import PaystackService
from .permissions import IsAdminOrStaff, IsCustomer, IsOwnerOrAdmin
from django.core.mail import send_mail
from django.conf import settings


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class RegisterCarView(APIView):
    # permission_classes = [IsAdminOrStaff]

    def post(self, request):
        serializer = CarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


# class CarViewSet(viewsets.ModelViewSet):
#     queryset = Car.objects.all()
#     serializer_class = CarSerializer
#     permission_classes = [IsAdminOrStaff]
#     filter_backends = [DjangoFilterBackend, filters.SearchFilter]
#     filterset_fields = ['status', 'make', 'fuel_type', 'transmission']
#     search_fields = ['make', 'model', 'license_plate', 'vin']

#     @action(detail=False, methods=['get'])
#     def available(self, request):
#         start_date = request.query_params.get('start_date')
#         end_date = request.query_params.get('end_date')

#         if not start_date or not end_date:
#             return Response(
#                 {"error": "start_date and end_date parameters are required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             start_date = timezone.datetime.fromisoformat(start_date)
#             end_date = timezone.datetime.fromisoformat(end_date)
#         except ValueError:
#             return Response(
#                 {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Get cars that are available and not booked for the selected dates
#         booked_car_ids = Booking.objects.filter(
#             status__in=['confirmed', 'active'],
#             start_date__lt=end_date,
#             end_date__gt=start_date
#         ).values_list('car_id', flat=True)

#         available_cars = Car.objects.filter(
#             status='available'
#         ).exclude(
#             id__in=booked_car_ids
#         )

#         serializer = self.get_serializer(available_cars, many=True)
#         return Response(serializer.data)


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()

    @action(detail=True, methods=['get'])
    def booking_calendar(self, request, pk=None):
        """Get all bookings for a car for calendar view"""
        car = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        bookings = Booking.objects.filter(
            car=car,
            start_date__gte=start_date if start_date else timezone.now().date() -
            timedelta(days=30),
            end_date__lte=end_date if end_date else timezone.now().date() +
            timedelta(days=90)
        ).exclude(status='cancelled')

        calendar_data = []
        for booking in bookings:
            calendar_data.append({
                'id': booking.id,
                'title': f"{booking.customer.first_name} {booking.customer.last_name}",
                'start': booking.start_date.isoformat(),
                'end': booking.end_date.isoformat(),
                'status': booking.status,
                'color': self._get_status_color(booking.status),
                'extendedProps': {
                    'customer_phone': booking.customer.phone,
                    'total_amount': float(booking.total_amount),
                    'payment_status': booking.payment_status
                }
            })

        return Response({
            'car_id': car.id,
            'car_name': f"{car.make} {car.model}",
            'bookings': calendar_data
        })

    def _get_status_color(self, status):
        colors = {
            'pending': '#fbbf24',  # yellow
            'confirmed': '#3b82f6',  # blue
            'active': '#10b981',  # green
            'completed': '#6b7280',  # gray
            'cancelled': '#ef4444',  # red
        }
        return colors.get(status, '#6b7280')


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


# class BookingViewSet(viewsets.ModelViewSet):
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


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related('customer', 'car', 'driver')

    @action(detail=True, methods=['post'])
    def mark_as_returned(self, request, pk=None):
        """Mark a car as returned and update all related records"""
        booking = self.get_object()

        if booking.status != 'active':
            return Response(
                {'error': 'Only active bookings can be marked as returned'},
                status=status.HTTP_400_BAD_REQUEST
            )
        actual_return_time = request.data.get('actual_return_time')
        penalty_amount = Decimal(request.data.get('penalty_amount', 0))
        penalty_paid = request.data.get('penalty_paid', False)
        penalty_payment_method = request.data.get(
            'penalty_payment_method', 'cash')
        receipt_number = request.data.get('receipt_number', '')

        try:
            with transaction.atomic():

                actual_return = datetime.fromisoformat(
                    actual_return_time.replace('Z', '+00:00'))

                # Calculate expected return time (9:00 AM on end date)
                expected_return = datetime.combine(
                    booking.end_date, datetime.min.time())
                expected_return = expected_return.replace(
                    hour=9, minute=0, second=0)

                # Calculate late penalty based on company policy
                calculated_penalty = Decimal(0)
                late_days = 0

                if actual_return > expected_return:
                    # Calculate hours late
                    hours_late = (actual_return -
                                  expected_return).total_seconds() / 3600

                    # Company policy: Any return after 9:00 AM = full day penalty
                    late_days = max(1, math.ceil(hours_late / 24))
                    calculated_penalty = Decimal(
                        late_days) * booking.daily_rate

                    # Add 10% late fee
                    late_fee = calculated_penalty * Decimal('0.1')
                    calculated_penalty += late_fee

                # Update booking status
                booking.status = 'completed'
                booking.actual_return_time = actual_return

                # Calculate any late fees or additional charges
                booking.penalty_amount = calculated_penalty
                booking.penalty_paid = penalty_paid
                booking.penalty_payment_method = penalty_payment_method
                booking.receipt_number = receipt_number

                # Update total amount with penalty
                booking.total_amount += calculated_penalty
                booking.save()

                # Update car status
                car = booking.car
                car.status = 'available'
                car.save()

                # Update customer stats
                customer = booking.customer
                customer.total_bookings += 1
                customer.total_spent += booking.total_amount

                # Update loyalty tier based on total spent
                if customer.total_spent >= 50000:
                    customer.loyalty_tier = 'platinum'
                elif customer.total_spent >= 20000:
                    customer.loyalty_tier = 'gold'
                elif customer.total_spent >= 10000:
                    customer.loyalty_tier = 'silver'

                customer.save()

                # Create transaction record for penalty payment
                if penalty_paid and calculated_penalty > 0:
                    Transaction.objects.create(
                        booking=booking,
                        amount=calculated_penalty,
                        transaction_type='penalty',
                        payment_method=penalty_payment_method,
                        receipt_number=receipt_number,
                        status='completed',
                        notes=f'Late return penalty for {late_days} day(s)'
                    )

                # Create history record
                BookingHistory.objects.create(
                    booking=booking,
                    action='returned',
                    description=f'Car returned at {actual_return}. Penalty: ${calculated_penalty} ({late_days} day(s) late)',
                    performed_by=request.user.username
                )

                return Response({
                    'message': 'Car successfully marked as returned',
                    'booking_id': booking.id,
                    'status': booking.status,
                    'car_status': car.status,
                    'late_fee_applied': late_fee if 'late_fee' in locals() else 0
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel_with_refund(self, request, pk=None):
        """Cancel a booking and process refund"""
        booking = self.get_object()
        refund_amount = Decimal(request.data.get('refund_amount', 0))
        reason = request.data.get('reason', '')

        # Validate booking can be cancelled
        if booking.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'This booking cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate refund amount
        if refund_amount > booking.amount_paid:
            return Response(
                {'error': 'Refund amount cannot exceed amount paid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Calculate cancellation fee based on cancellation time
                today = timezone.now().date()
                start_date = booking.start_date

                cancellation_fee = Decimal(0)
                if today >= start_date:
                    # No refund if already past start date
                    cancellation_fee = booking.amount_paid
                elif (start_date - today).days <= 1:
                    # Less than 24 hours notice - 50% fee
                    cancellation_fee = booking.total_amount * Decimal('0.5')
                elif (start_date - today).days <= 3:
                    # 1-3 days notice - 25% fee
                    cancellation_fee = booking.total_amount * Decimal('0.25')
                elif (start_date - today).days <= 7:
                    # 4-7 days notice - 10% fee
                    cancellation_fee = booking.total_amount * Decimal('0.1')

                # Set refund amount
                refund_amount = booking.amount_paid - cancellation_fee
                if refund_amount < 0:
                    refund_amount = Decimal(0)

                # Update booking
                booking.status = 'cancelled'
                booking.payment_status = 'partially_refunded' if cancellation_fee > 0 else 'fully_refunded'
                booking.refund_amount = refund_amount
                booking.cancellation_reason = reason
                booking.cancelled_at = timezone.now()
                booking.save()

                # Create refund record
                refund = Refund.objects.create(
                    booking=booking,
                    amount=refund_amount,
                    reason=reason,
                    status='pending'  # Manual approval for refunds
                )

                # Update car availability
                car = booking.car

                # Check if car is currently in use for this booking
                if booking.status == 'active':
                    car.status = 'available'
                    car.save()

                # Create history record
                BookingHistory.objects.create(
                    booking=booking,
                    action='cancelled',
                    description=f'Booking cancelled. Refund: ${refund_amount}. Reason: {reason}',
                    performed_by=request.user.username
                )

                return Response({
                    'message': 'Booking cancelled successfully',
                    'booking_id': booking.id,
                    'status': booking.status,
                    'refund_amount': refund_amount,
                    'cancellation_fee': cancellation_fee,
                    'refund_status': refund.status
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        """Check car availability for overlapping dates"""
        car_id = request.query_params.get('car_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not all([car_id, start_date, end_date]):
            return Response(
                {'error': 'Missing required parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

            # Check for overlapping bookings
            overlapping_bookings = Booking.objects.filter(
                car_id=car_id,
                status__in=['confirmed', 'active'],
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exclude(
                status='cancelled'
            )

            # Check car status
            car = Car.objects.get(id=car_id)

            available = not overlapping_bookings.exists() and car.status == 'available'

            conflicting_bookings = []
            if overlapping_bookings.exists():
                conflicting_bookings = list(overlapping_bookings.values(
                    'id', 'start_date', 'end_date', 'customer__first_name', 'customer__last_name'
                ))

            return Response({
                'available': available,
                'car_status': car.status,
                'conflicting_bookings': conflicting_bookings,
                'message': 'Car is available' if available else 'Car is not available for selected dates'
            })

        except Car.DoesNotExist:
            return Response(
                {'error': 'Car not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def force_reassign(self, request, pk=None):
        """
        Force reassign car from one booking to another (for emergency/critical situations)
        This cancels the original booking and creates a new one
        """
        original_booking = self.get_object()
        new_customer_id = request.data.get('new_customer_id')
        new_start_date = request.data.get('new_start_date')
        new_end_date = request.data.get('new_end_date')
        reason = request.data.get('reason', '')

        if not all([new_customer_id, new_start_date, new_end_date, reason]):
            return Response(
                {'error': 'Missing required parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 1. Cancel original booking with full refund
                original_booking.status = 'cancelled'
                original_booking.payment_status = 'fully_refunded'
                original_booking.refund_amount = original_booking.amount_paid
                original_booking.cancellation_reason = f'Force reassigned: {reason}'
                original_booking.cancelled_at = timezone.now()
                original_booking.save()

                # Create refund for original booking
                Refund.objects.create(
                    booking=original_booking,
                    amount=original_booking.amount_paid,
                    reason=f'Force reassignment: {reason}',
                    status='pending'
                )

                # 2. Create new booking for the new customer
                new_customer = Customer.objects.get(id=new_customer_id)

                new_booking = Booking.objects.create(
                    customer=new_customer,
                    car=original_booking.car,
                    start_date=new_start_date,
                    end_date=new_end_date,
                    daily_rate=original_booking.daily_rate,
                    total_amount=original_booking.daily_rate * (
                        (datetime.strptime(new_end_date, '%Y-%m-%d').date() -
                         datetime.strptime(new_start_date, '%Y-%m-%d').date()).days
                    ),
                    status='confirmed',
                    payment_status='pending',
                    special_requests=f'Force reassigned from booking {original_booking.id}'
                )

                # Create history records
                BookingHistory.objects.create(
                    booking=original_booking,
                    action='cancelled',
                    description=f'Force reassigned to new customer. Reason: {reason}',
                    performed_by=request.user.username
                )

                BookingHistory.objects.create(
                    booking=new_booking,
                    action='created',
                    description=f'Created from force reassignment of booking {original_booking.id}',
                    performed_by=request.user.username
                )

                return Response({
                    'message': 'Car successfully reassigned',
                    'original_booking_id': original_booking.id,
                    'new_booking_id': new_booking.id,
                    'refund_processed': True,
                    'new_customer': new_customer.first_name + ' ' + new_customer.last_name
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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


# Add these imports at the top

# Add these view classes at the end of views.py


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'car',
                        'status', 'payment_method', 'is_recurring']
    search_fields = ['description', 'reference_number', 'vendor', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date']

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class CapitalExpenditureViewSet(viewsets.ModelViewSet):
    queryset = CapitalExpenditure.objects.all()
    serializer_class = CapitalExpenditureSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['car', 'depreciation_method']


class FinancialReportViewSet(viewsets.ModelViewSet):
    queryset = FinancialReport.objects.all()
    serializer_class = FinancialReportSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['report_type', 'is_published']
    search_fields = ['title', 'notes']


class FinancialAnalysisView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        serializer = ReportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        report_type = data['report_type']
        include_charts = data.get('include_charts', True)

        # Determine date range based on report type
        if report_type == 'monthly':
            year = data['year']
            month = data['month']
            period_start = datetime(year, month, 1).date()
            if month == 12:
                period_end = datetime(
                    year + 1, 1, 1).date() - timedelta(days=1)
            else:
                period_end = datetime(
                    year, month + 1, 1).date() - timedelta(days=1)

        elif report_type == 'annual':
            year = data['year']
            period_start = datetime(year, 1, 1).date()
            period_end = datetime(year, 12, 31).date()

        elif report_type == 'custom':
            period_start = data['start_date']
            period_end = data['end_date']

        # Generate financial summary
        summary = self.generate_financial_summary(
            period_start, period_end, include_charts)

        return Response(summary)

    def generate_financial_summary(self, period_start, period_end, include_charts=True):
        # Calculate income from bookings
        booking_income = Booking.objects.filter(
            start_date__date__gte=period_start,
            start_date__date__lte=period_end,
            status__in=['completed', 'confirmed']
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Calculate other income (if any - you can add other income sources)
        other_income = 0
        total_income = booking_income + other_income

        # Calculate expenses by category
        expenses = Expense.objects.filter(
            date__gte=period_start,
            date__lte=period_end,
            status__in=['approved', 'paid']
        )

        # Group expenses by category
        expense_categories = ExpenseCategory.objects.all()
        expense_breakdown = {}
        total_expenses = 0

        for category in expense_categories:
            category_expenses = expenses.filter(category=category).aggregate(
                total=Sum('amount')
            )['total'] or 0
            expense_breakdown[category.name] = float(category_expenses)
            total_expenses += category_expenses

        # Calculate capital expenditure
        capital_expenditure = CapitalExpenditure.objects.filter(
            purchase_date__gte=period_start,
            purchase_date__lte=period_end
        ).aggregate(total=Sum('total_initial_cost'))['total'] or 0

        # Vehicle performance metrics
        total_vehicles = Car.objects.count()
        active_vehicles = Car.objects.filter(status='available').count()

        # Calculate utilization rate (simplified)
        total_booking_days = Booking.objects.filter(
            start_date__date__gte=period_start,
            end_date__date__lte=period_end,
            status__in=['completed', 'confirmed']
        ).annotate(
            duration_days=F('end_date') - F('start_date')
        ).aggregate(total_days=Sum('duration_days'))['total_days'] or 0

        total_possible_days = total_vehicles * \
            ((period_end - period_start).days + 1)
        average_utilization_rate = (
            total_booking_days / total_possible_days * 100) if total_possible_days > 0 else 0

        # Calculate profitability
        gross_profit = total_income - total_expenses
        net_profit = gross_profit
        profit_margin = (net_profit / total_income *
                         100) if total_income > 0 else 0

        # Prepare response data
        summary = {
            'period_start': period_start,
            'period_end': period_end,
            'total_income': float(total_income),
            'booking_income': float(booking_income),
            'other_income': float(other_income),
            'total_expenses': float(total_expenses),
            'capital_expenditure': float(capital_expenditure),
            'gross_profit': float(gross_profit),
            'net_profit': float(net_profit),
            'profit_margin': float(profit_margin),
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'average_utilization_rate': float(average_utilization_rate),
            'revenue_per_vehicle': float(total_income / total_vehicles) if total_vehicles > 0 else 0,
            'profit_per_vehicle': float(net_profit / total_vehicles) if total_vehicles > 0 else 0,
            'expense_breakdown': expense_breakdown,
        }

        # Generate charts data if requested
        if include_charts:
            summary.update(self.generate_charts_data(period_start, period_end))

        return summary

    def generate_charts_data(self, period_start, period_end):
        # Monthly breakdown for the period
        monthly_data = []
        current = period_start
        while current <= period_end:
            month_end = (current.replace(day=28) + timedelta(days=4)
                         ).replace(day=1) - timedelta(days=1)
            if month_end > period_end:
                month_end = period_end

            # Monthly income
            monthly_income = Booking.objects.filter(
                start_date__date__gte=current,
                start_date__date__lte=month_end,
                status__in=['completed', 'confirmed']
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            # Monthly expenses
            monthly_expenses = Expense.objects.filter(
                date__gte=current,
                date__lte=month_end,
                status__in=['approved', 'paid']
            ).aggregate(total=Sum('amount'))['total'] or 0

            monthly_data.append({
                'month': current.strftime('%b %Y'),
                'income': float(monthly_income),
                'expenses': float(monthly_expenses),
                'profit': float(monthly_income - monthly_expenses)
            })

            current = month_end + timedelta(days=1)

        # Vehicle performance data
        vehicle_performance = []
        vehicles = Car.objects.all()

        for vehicle in vehicles:
            vehicle_bookings = Booking.objects.filter(
                car=vehicle,
                start_date__date__gte=period_start,
                start_date__date__lte=period_end,
                status__in=['completed', 'confirmed']
            )

            vehicle_income = vehicle_bookings.aggregate(
                total=Sum('total_amount'))['total'] or 0
            vehicle_expenses = Expense.objects.filter(
                car=vehicle,
                date__gte=period_start,
                date__lte=period_end,
                status__in=['approved', 'paid']
            ).aggregate(total=Sum('amount'))['total'] or 0

            vehicle_profit = vehicle_income - vehicle_expenses

            vehicle_performance.append({
                'vehicle': f"{vehicle.make} {vehicle.model}",
                'license_plate': vehicle.license_plate,
                'income': float(vehicle_income),
                'expenses': float(vehicle_expenses),
                'profit': float(vehicle_profit),
                'utilization': vehicle_bookings.count() * 10  # Simplified utilization metric
            })

        return {
            'monthly_breakdown': monthly_data,
            'vehicle_performance': vehicle_performance
        }


class GenerateReportPDFView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.graphics.shapes import Drawing
            from reportlab.graphics.charts.barcharts import VerticalBarChart
            from reportlab.graphics.charts.linecharts import HorizontalLineChart
            from reportlab.graphics.charts.piecharts import Pie
            import io
            import os

            # Get report data
            serializer = ReportRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            data = serializer.validated_data
            report_type = data['report_type']

            # Determine date range
            if report_type == 'monthly':
                year = data['year']
                month = data['month']
                period_start = datetime(year, month, 1).date()
                if month == 12:
                    period_end = datetime(
                        year + 1, 1, 1).date() - timedelta(days=1)
                else:
                    period_end = datetime(
                        year, month + 1, 1).date() - timedelta(days=1)
                title = f"Monthly Financial Report - {period_start.strftime('%B %Y')}"

            elif report_type == 'annual':
                year = data['year']
                period_start = datetime(year, 1, 1).date()
                period_end = datetime(year, 12, 31).date()
                title = f"Annual Financial Report - {year}"

            elif report_type == 'custom':
                period_start = data['start_date']
                period_end = data['end_date']
                title = f"Financial Report - {period_start.strftime('%b %d, %Y')} to {period_end.strftime('%b %d, %Y')}"

            # Generate financial summary
            analysis_view = FinancialAnalysisView()
            summary = analysis_view.generate_financial_summary(
                period_start, period_end, include_charts=True)

            # Create PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=landscape(letter),
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.5*inch,
                bottomMargin=0.5*inch
            )

            story = []
            styles = getSampleStyleSheet()

            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=1  # Center aligned
            )
            story.append(Paragraph(title, title_style))

            # Company Information
            company_info = f"""
            <b>YOS Car Rentals</b><br/>
            123 Main Street, City, Country<br/>
            Phone: +1 (555) 123-4567 | Email: accounting@yoscarrentals.com<br/>
            Report Period: {period_start.strftime('%B %d, %Y')} to {period_end.strftime('%B %d, %Y')}<br/>
            Generated on: {timezone.now().strftime('%B %d, %Y at %I:%M %p')}
            """
            story.append(Paragraph(company_info, styles['Normal']))
            story.append(Spacer(1, 0.25*inch))

            # Executive Summary
            exec_summary = f"""
            <b>Executive Summary</b><br/>
            This report provides a comprehensive financial analysis of YOS Car Rentals' performance
            during the reporting period. Key metrics include total revenue of ${summary['total_income']:,.2f},
            total expenses of ${summary['total_expenses']:,.2f}, and a net profit of ${summary['net_profit']:,.2f}
            with a profit margin of {summary['profit_margin']:.1f}%.
            """
            story.append(Paragraph(exec_summary, styles['Normal']))
            story.append(Spacer(1, 0.25*inch))

            # Key Metrics Table
            metrics_data = [
                ['Key Financial Metrics', 'Amount', 'Percentage'],
                ['Total Revenue', f"${summary['total_income']:,.2f}", '100%'],
                ['Total Operating Expenses', f"${summary['total_expenses']:,.2f}",
                    f"{summary['total_expenses']/summary['total_income']*100:.1f}%" if summary['total_income'] > 0 else '0%'],
                ['Gross Profit', f"${summary['gross_profit']:,.2f}",
                    f"{summary['profit_margin']:.1f}%"],
                ['Capital Expenditure',
                    f"${summary['capital_expenditure']:,.2f}", 'N/A'],
                ['Net Profit', f"${summary['net_profit']:,.2f}",
                    f"{summary['profit_margin']:.1f}%"],
            ]

            metrics_table = Table(metrics_data, colWidths=[
                                  3*inch, 2*inch, 2*inch])
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ecf0f1')),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
            ]))
            story.append(metrics_table)
            story.append(Spacer(1, 0.25*inch))

            # Expense Breakdown Chart
            story.append(
                Paragraph('<b>Expense Breakdown</b>', styles['Heading2']))

            if summary['expense_breakdown']:
                expense_data = []
                for category, amount in summary['expense_breakdown'].items():
                    if amount > 0:
                        expense_data.append([category, f"${amount:,.2f}"])

                if expense_data:
                    expense_table = Table(
                        expense_data, colWidths=[4*inch, 2*inch])
                    expense_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0),
                         colors.HexColor('#3498db')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1),
                         colors.HexColor('#f8f9fa')),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ]))
                    story.append(expense_table)

            story.append(Spacer(1, 0.25*inch))

            # Monthly Breakdown
            if 'monthly_breakdown' in summary:
                story.append(
                    Paragraph('<b>Monthly Performance</b>', styles['Heading2']))

                monthly_data = [['Month', 'Revenue', 'Expenses', 'Profit']]
                for month_data in summary['monthly_breakdown']:
                    monthly_data.append([
                        month_data['month'],
                        f"${month_data['income']:,.2f}",
                        f"${month_data['expenses']:,.2f}",
                        f"${month_data['profit']:,.2f}"
                    ])

                monthly_table = Table(monthly_data, colWidths=[
                                      1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
                monthly_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#27ae60')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1),
                     [colors.white, colors.HexColor('#f2f2f2')]),
                ]))
                story.append(monthly_table)

            story.append(Spacer(1, 0.25*inch))

            # Vehicle Performance
            if 'vehicle_performance' in summary and summary['vehicle_performance']:
                story.append(
                    Paragraph('<b>Vehicle Performance Analysis</b>', styles['Heading2']))

                # Sort vehicles by profit
                sorted_vehicles = sorted(
                    summary['vehicle_performance'], key=lambda x: x['profit'], reverse=True)

                vehicle_data = [
                    ['Vehicle', 'Revenue', 'Expenses', 'Profit', 'ROI']]
                for vehicle in sorted_vehicles[:10]:  # Top 10 vehicles
                    roi = (vehicle['profit'] / vehicle['income']
                           * 100) if vehicle['income'] > 0 else 0
                    vehicle_data.append([
                        vehicle['vehicle'][:20],
                        f"${vehicle['income']:,.2f}",
                        f"${vehicle['expenses']:,.2f}",
                        f"${vehicle['profit']:,.2f}",
                        f"{roi:.1f}%"
                    ])

                vehicle_table = Table(vehicle_data, colWidths=[
                                      2*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1*inch])
                vehicle_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e74c3c')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8f9fa')),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1),
                     [colors.white, colors.HexColor('#f2f2f2')]),
                ]))
                story.append(vehicle_table)

            story.append(Spacer(1, 0.25*inch))

            # Recommendations
            recommendations = """
            <b>Recommendations & Insights</b><br/>
            1. Focus on vehicles with highest ROI for fleet optimization<br/>
            2. Review expense categories showing high percentages of revenue<br/>
            3. Consider strategic investments in vehicles showing highest utilization<br/>
            4. Monitor seasonal trends for better inventory management<br/>
            5. Implement regular maintenance schedule optimization
            """
            story.append(Paragraph(recommendations, styles['Normal']))

            # Footer
            footer = """
            <i>This report is confidential and intended for internal use only.<br/>
            For questions or additional analysis, contact the accounting department.</i>
            """
            story.append(Spacer(1, 0.25*inch))
            story.append(Paragraph(footer, styles['Italic']))

            # Build PDF
            doc.build(story)

            # Get PDF content
            pdf_content = buffer.getvalue()
            buffer.close()

            # Generate filename
            filename = f"financial_report_{period_start.strftime('%Y%m%d')}_{period_end.strftime('%Y%m%d')}.pdf"

            # Return PDF as response
            response = HttpResponse(
                pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except Exception as e:
            return Response(
                {"error": f"Failed to generate PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SaveReportView(APIView):
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        try:
            data = request.data
            report_type = data.get('report_type')
            period_start = data.get('period_start')
            period_end = data.get('period_end')
            title = data.get('title')

            # Generate financial summary
            analysis_view = FinancialAnalysisView()
            summary = analysis_view.generate_financial_summary(
                datetime.strptime(period_start, '%Y-%m-%d').date(),
                datetime.strptime(period_end, '%Y-%m-%d').date(),
                include_charts=True
            )

            # Create report record
            report = FinancialReport.objects.create(
                report_type=report_type,
                period_start=period_start,
                period_end=period_end,
                title=title,
                generated_by=request.user,
                total_income=summary['total_income'],
                total_operating_expenses=summary['total_expenses'],
                total_capital_expenditure=summary['capital_expenditure'],
                net_profit=summary['net_profit'],
                profit_margin=summary['profit_margin'],
                income_breakdown={
                    'booking_income': summary['booking_income'],
                    'other_income': summary['other_income']
                },
                expense_breakdown=summary['expense_breakdown'],
                vehicle_performance=summary.get('vehicle_performance', []),
                financial_metrics={
                    'average_utilization_rate': summary['average_utilization_rate'],
                    'revenue_per_vehicle': summary['revenue_per_vehicle'],
                    'profit_per_vehicle': summary['profit_per_vehicle']
                }
            )

            # Generate and save PDF
            pdf_response = GenerateReportPDFView().post(request)
            if pdf_response.status_code == 200:
                from django.core.files.base import ContentFile
                report.pdf_file.save(
                    f"report_{report.id}.pdf",
                    ContentFile(pdf_response.content)
                )
                report.save()

            serializer = FinancialReportSerializer(report)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"Failed to save report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
