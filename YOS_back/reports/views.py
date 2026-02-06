from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from cars.models import Car
from bookings.models import Booking
from events.models import MaintenanceRecord
from insurance.models import InsurancePolicy
from staff.models import SalaryPayment

class FinancialReportAPI(APIView):
    """Generate financial reports for main admin"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        report_type = request.query_params.get('type', 'monthly')  # monthly, annual
        period = request.query_params.get('period', timezone.now().strftime('%Y-%m'))
        vehicle_id = request.query_params.get('vehicle_id', 'all')
        
        # Parse period
        if report_type == 'monthly':
            year, month = map(int, period.split('-'))
            start_date = datetime(year, month, 1).date()
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        else:  # annual
            year = int(period)
            start_date = datetime(year, 1, 1).date()
            end_date = datetime(year, 12, 31).date()
        
        # Get data
        if vehicle_id == 'all':
            cars = Car.objects.filter(is_active=True)
        else:
            cars = Car.objects.filter(id=vehicle_id, is_active=True)
        
        report_data = self.generate_financial_report(cars, start_date, end_date, report_type)
        
        return Response(report_data)
    
    def generate_financial_report(self, cars, start_date, end_date, report_type):
        """Generate comprehensive financial report"""
        
        # Revenue calculation
        bookings = Booking.objects.filter(
            car__in=cars,
            status='completed',
            created_at__date__range=[start_date, end_date]
        )
        
        total_revenue = bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        # Expense calculation
        maintenance_cost = MaintenanceRecord.objects.filter(
            car__in=cars,
            status='completed',
            created_at__date__range=[start_date, end_date]
        ).aggregate(total=Sum('cost'))['total'] or Decimal('0')
        
        insurance_cost = InsurancePolicy.objects.filter(
            car__in=cars,
            is_current=True,
            created_at__date__range=[start_date, end_date]
        ).aggregate(total=Sum('premium'))['total'] or Decimal('0')
        
        salary_cost = SalaryPayment.objects.filter(
            month__range=[start_date, end_date],
            is_paid=True
        ).aggregate(total=Sum('net_salary'))['total'] or Decimal('0')
        
        total_expenses = maintenance_cost + insurance_cost + salary_cost
        
        # Vehicle breakdown
        vehicle_breakdown = []
        for car in cars:
            car_revenue = bookings.filter(car=car).aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0')
            
            car_expenses = MaintenanceRecord.objects.filter(
                car=car,
                status='completed',
                created_at__date__range=[start_date, end_date]
            ).aggregate(total=Sum('cost'))['total'] or Decimal('0')
            
            vehicle_breakdown.append({
                'vehicle_id': str(car.id),
                'make': car.make,
                'model': car.model,
                'revenue': float(car_revenue),
                'expenses': float(car_expenses),
                'profit': float(car_revenue - car_expenses),
                'utilization_rate': self.calculate_utilization_rate(car, start_date, end_date)
            })
        
        # Capital expenditure
        total_investment = cars.aggregate(total=Sum('purchase_price'))['total'] or Decimal('0')
        current_value = sum(car.current_value or Decimal('0') for car in cars)
        accumulated_depreciation = total_investment - current_value
        
        # ROI calculation
        roi = ((total_revenue - total_expenses) / total_investment * 100) if total_investment > 0 else 0
        
        report = {
            'summary': {
                'total_revenue': float(total_revenue),
                'total_expenses': float(total_expenses),
                'net_profit': float(total_revenue - total_expenses),
                'profit_margin': float(((total_revenue - total_expenses) / total_revenue * 100) if total_revenue > 0 else 0),
                'roi': float(roi),
                'utilization_rate': self.calculate_overall_utilization_rate(cars, start_date, end_date),
            },
            'income_statement': {
                'revenue': {
                    'rental_income': float(total_revenue),
                    'other_income': 0,  # Could add other income sources
                    'total_revenue': float(total_revenue)
                },
                'expenses': {
                    'maintenance': float(maintenance_cost),
                    'insurance': float(insurance_cost),
                    'salaries': float(salary_cost),
                    'fuel': 0,  # Could track fuel expenses
                    'other': 0,
                    'depreciation': float(accumulated_depreciation),
                    'total_expenses': float(total_expenses)
                },
                'net_income': float(total_revenue - total_expenses)
            },
            'detailed_breakdown': {
                'by_vehicle': vehicle_breakdown,
                'by_month': self.get_monthly_breakdown(cars, start_date, end_date) if report_type == 'annual' else []
            },
            'capital_expenditure': {
                'total_investment': float(total_investment),
                'current_value': float(current_value),
                'accumulated_depreciation': float(accumulated_depreciation)
            },
            'generated_at': timezone.now().isoformat(),
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'type': report_type
            }
        }
        
        return report
    
    def calculate_utilization_rate(self, car, start_date, end_date):
        """Calculate utilization rate for a specific car"""
        total_days = (end_date - start_date).days
        booked_days = Booking.objects.filter(
            car=car,
            status='completed',
            start_date__lte=end_date,
            end_date__gte=start_date
        ).aggregate(
            days=Sum('duration_days')
        )['days'] or 0
        
        return (booked_days / total_days * 100) if total_days > 0 else 0
    
    def calculate_overall_utilization_rate(self, cars, start_date, end_date):
        """Calculate overall fleet utilization rate"""
        total_days = (end_date - start_date).days * cars.count()
        if total_days == 0:
            return 0
        
        total_booked_days = 0
        for car in cars:
            booked_days = Booking.objects.filter(
                car=car,
                status='completed',
                start_date__lte=end_date,
                end_date__gte=start_date
            ).aggregate(days=Sum('duration_days'))['days'] or 0
            total_booked_days += booked_days
        
        return (total_booked_days / total_days * 100) if total_days > 0 else 0
    
    def get_monthly_breakdown(self, cars, start_date, end_date):
        """Get monthly breakdown for annual report"""
        monthly_data = []
        current_date = start_date
        
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            if month_end > end_date:
                month_end = end_date
            
            month_bookings = Booking.objects.filter(
                car__in=cars,
                status='completed',
                created_at__date__range=[month_start, month_end]
            )
            
            month_revenue = month_bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            
            month_expenses = MaintenanceRecord.objects.filter(
                car__in=cars,
                status='completed',
                created_at__date__range=[month_start, month_end]
            ).aggregate(total=Sum('cost'))['total'] or Decimal('0')
            
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'revenue': float(month_revenue),
                'expenses': {
                    'maintenance': float(month_expenses),
                    'insurance': 0,
                    'total': float(month_expenses)
                }
            })
            
            current_date = month_end + timedelta(days=1)
        
        return monthly_data