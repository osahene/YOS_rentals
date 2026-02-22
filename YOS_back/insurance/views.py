from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import InsurancePolicy, InsuranceRenewal
from .serializers import InsurancePolicySerializer

class InsurancePolicyViewSet(viewsets.ModelViewSet):
    queryset = InsurancePolicy.objects.all().order_by('-created_at')
    serializer_class = InsurancePolicySerializer
    permission_classes = [AllowAny]  # Change to IsAuthenticated if you want to restrict access

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by vehicle (car) if vehicleId query param is provided
        vehicle_id = self.request.query_params.get('vehicleId')
        if vehicle_id:
            queryset = queryset.filter(car_id=vehicle_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Renew an existing insurance policy"""
        policy = self.get_object()
        serializer = InsurancePolicySerializer(policy, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Update policy fields (end_date, premium, etc.)
            updated_policy = serializer.save()

            # Create renewal record
            renewal = InsuranceRenewal.objects.create(
                policy=policy,
                previous_end_date=policy.end_date,
                new_end_date=updated_policy.end_date,
                new_insurance_amount=updated_policy.insurance_amount,
                renewed_by=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def expiring(self, request):
        """Return policies expiring within given days (default 30)"""
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=days)

        expiring_policies = self.get_queryset().filter(
            Q(end_date__lte=expiry_threshold) & Q(end_date__gte=today) & Q(status='active')
        )
        serializer = self.get_serializer(expiring_policies, many=True)
        return Response(serializer.data)