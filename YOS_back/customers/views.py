import requests
from django.conf import settings
import re
from rest_framework import viewsets, permissions, status, filters as filtre
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from django_filters import rest_framework as filters

from .models import Customer, Guarantor
from .serializers import (
    CustomerListSerializer, CustomerDetailSerializer, 
    CreateCustomerSerializer, UpdateCustomerSerializer,
    GuarantorSerializer, BookingWithGuarantorSerializer
)
from bookings.models import Booking

class CustomerFilter(filters.FilterSet):
    """Filter for Customer model"""
    name = filters.CharFilter(method='filter_by_name')
    status = filters.ChoiceFilter(choices=Customer.STATUS_CHOICES)
    loyalty_tier = filters.ChoiceFilter(choices=Customer.LOYALTY_TIERS)
    min_bookings = filters.NumberFilter(field_name='total_bookings', lookup_expr='gte')
    min_spent = filters.NumberFilter(field_name='total_spent', lookup_expr='gte')
    
    class Meta:
        model = Customer
        fields = ['status', 'loyalty_tier']
    
    def filter_by_name(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) | 
            Q(last_name__icontains=value) |
            Q(email__icontains=value) |
            Q(phone__icontains=value)
        )

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing customers.
    """
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend, filtre.SearchFilter, filtre.OrderingFilter]
    filterset_class = CustomerFilter
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'ghana_card_id']
    ordering_fields = ['first_name', 'last_name', 'created_at', 'total_bookings', 'total_spent']
    
    def get_serializer_class(self): #type: ignore
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        elif self.action == 'create':
            return CreateCustomerSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateCustomerSerializer
        return CustomerListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Optimize queries for list view
        if self.action == 'list':
            queryset = queryset.prefetch_related('guarantors')
        
        # Optimize for detail view
        elif self.action == 'retrieve':
            queryset = queryset.prefetch_related('guarantors', 'bookings', 'bookings__car')
        
        return queryset
    
    def get_permissions(self):
        return [permissions.AllowAny()]  # Change to proper permissions later
    
    @action(detail=True, methods=['get'])
    def bookings(self, request, pk=None):
        """Get all bookings for a customer"""
        customer = self.get_object()
        bookings = Booking.objects.filter(customer=customer).order_by('-created_at')
        
        from bookings.serializers import BookingSerializer
        serializer = BookingSerializer(bookings, many=True)
        
        return Response({
            'customer': CustomerDetailSerializer(customer).data,
            'bookings': serializer.data,
            'total_bookings': bookings.count(),
            'total_spent': float(customer.total_spent),
            'active_bookings': bookings.filter(status='active').count(),
            'completed_bookings': bookings.filter(status='completed').count()
        })
    
    @action(detail=True, methods=['post'])
    def add_guarantor(self, request, pk=None):
        """Add a guarantor to customer"""
        customer = self.get_object()
        serializer = GuarantorSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get customer analytics"""
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        new_customers_this_month = Customer.objects.filter(
            created_at__month=timezone.now().month,
            created_at__year=timezone.now().year
        ).count()
        
        # Top customers by spending
        top_customers = []
        for customer in Customer.objects.all():
            top_customers.append({
                'id': str(customer.id),
                'name': customer.full_name,
                'total_spent': float(customer.total_spent),
                'total_bookings': customer.total_bookings,
                'loyalty_tier': customer.loyalty_tier
            })
        
        top_customers = sorted(top_customers, key=lambda x: x['total_spent'], reverse=True)[:10]
        
        # Customer growth last 6 months
        growth_data = []
        for i in range(6):
            month = timezone.now() - timedelta(days=30 * i)
            month_customers = Customer.objects.filter(
                created_at__month=month.month,
                created_at__year=month.year
            ).count()
            growth_data.append({
                'month': month.strftime('%b %Y'),
                'customers': month_customers
            })
        
        growth_data.reverse()
        
        return Response({
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_customers_this_month': new_customers_this_month,
            'top_customers': top_customers,
            'growth_data': growth_data,
            'loyalty_distribution': {
                'bronze': Customer.objects.filter(loyalty_tier='bronze').count(),
                'silver': Customer.objects.filter(loyalty_tier='silver').count(),
                'gold': Customer.objects.filter(loyalty_tier='gold').count(),
                'platinum': Customer.objects.filter(loyalty_tier='platinum').count(),
                'diamond': Customer.objects.filter(loyalty_tier='diamond').count(),
            }
        })
    
    @action(detail=False, methods=['post'], url_path='send-bulk-sms')
    def send_bulk_sms(self, request):
        """
        Send a bulk SMS to multiple customers via mNotify.
        Expects: { "customer_ids": [...], "message": "..." }
        """
        customer_ids = request.data.get('customer_ids', [])
        message = request.data.get('message', '').strip()

        if not customer_ids:
            return Response({'error': 'No customer IDs provided'}, status=400)
        if not message:
            return Response({'error': 'Message cannot be empty'}, status=400)

        customers = Customer.objects.filter(id__in=customer_ids)
        if not customers.exists():
            return Response({'error': 'No valid customers found'}, status=404)

        # Collect and format phone numbers
        phones = []
        for customer in customers:
            if customer.phone:
                phone = customer.phone
                # Convert local format (0XX...) to international (233XX...)
                if phone.startswith('0'):
                    phone = '233' + phone[1:]
                # Remove any non-digit characters (just in case)
                phone = re.sub(r'\D', '', phone)
                phones.append(phone)

        if not phones:
            return Response({'error': 'No customers with valid phone numbers'}, status=400)

        # mNotify API call
        endpoint = 'https://api.mnotify.com/api/sms/quick'
        api_key = settings.MNOTIFY_API_KEY
        url = f"{endpoint}?key={api_key}"

        payload = {
            "recipient": phones,
            "sender": settings.MNOTIFY_SENDER_ID or "mNotify",
            "message": message,
            "is_schedule": "false",
            "schedule_date": ""
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                return Response({
                    'status': 'SMS sent',
                    'sent_to': len(phones),
                    'total_customers': len(customers)
                })
            else:
                return Response(
                    {'error': 'SMS sending failed', 'details': response.text},
                    status=500
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], url_path='send-sms')
    def send_sms(self, request, pk=None):
        """
        Send a single SMS to one customer.
        Expects: { "message": "..." }
        """
        customer = self.get_object()
        message = request.data.get('message', '').strip()

        if not message:
            return Response({'error': 'Message cannot be empty'}, status=400)
        if not customer.phone:
            return Response({'error': 'Customer has no phone number'}, status=400)

        phone = customer.phone
        if phone.startswith('0'):
            phone = '233' + phone[1:]
        phone = re.sub(r'\D', '', phone)

        endpoint = 'https://api.mnotify.com/api/sms/quick'
        api_key = settings.MNOTIFY_API_KEY
        url = f"{endpoint}?key={api_key}"

        payload = {
            "recipient": [phone],
            "sender": getattr(settings, 'MNOTIFY_SENDER_ID', 'mNotify'),
            "message": message,
            "is_schedule": "false",
            "schedule_date": ""
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                return Response({'status': 'SMS sent'})
            else:
                return Response(
                    {'error': 'SMS sending failed', 'details': response.text},
                    status=500
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)
        
    @action(detail=True, methods=['get'], url_path='bookings-with-guarantor')
    def bookings_with_guarantor(self, request, pk=None):
        """Return all bookings for a customer with guarantor details."""
        customer = self.get_object()
        bookings = Booking.objects.filter(customer=customer).select_related('guarantor').order_by('-start_date')
        serializer = BookingWithGuarantorSerializer(bookings, many=True)
        return Response(serializer.data)

class GuarantorViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing guarantors.
    """
    queryset = Guarantor.objects.all()
    serializer_class = GuarantorSerializer
    
    def get_permissions(self):
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get('customer_id')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset