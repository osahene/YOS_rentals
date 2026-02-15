from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import F, Sum, Count, ExpressionWrapper, DurationField, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from collections import OrderedDict
import calendar
from datetime import date
from .utils import aggregate_total_days_from_bookings
from cars.models import Car
from bookings.models import Booking
from events.models import MaintenanceRecord
from insurance.models import InsurancePolicy
from staff.models import SalaryPayment
from customers.models import Customer

class ComprehensiveFinancialReportAPI(APIView):
    """Generate comprehensive financial reports for investors and banks"""
    permission_classes = [permissions.AllowAny]  # For development
    
    def get(self, request):
        report_type = request.query_params.get('type', 'quarterly')  # monthly, quarterly, annual
        year = request.query_params.get('year', timezone.now().year)
        quarter = request.query_params.get('quarter', None)
        month = request.query_params.get('month', None)
        
        # Determine date range
        if report_type == 'monthly':
            start_date, end_date = self.get_month_range(year, month)
        elif report_type == 'quarterly':
            start_date, end_date = self.get_quarter_range(year, quarter)
        else:  # annual
            start_date = datetime(int(year), 1, 1).date()
            end_date = datetime(int(year), 12, 31).date()
        
        # Generate comprehensive report
        report = self.generate_comprehensive_report(start_date, end_date, report_type)
        
        return Response(report)
    
    def generate_comprehensive_report(self, start_date, end_date, report_type):
        """Generate comprehensive financial report"""
        report = {
            'executive_summary': self.generate_executive_summary(start_date, end_date),
            'income_statement': self.generate_income_statement(start_date, end_date),
            'balance_sheet': self.generate_balance_sheet(end_date),
            'cash_flow_statement': self.generate_cash_flow_statement(start_date, end_date),
            'key_metrics': self.calculate_key_metrics(start_date, end_date),
            'vehicle_performance': self.get_vehicle_performance(start_date, end_date),
            'customer_analysis': self.get_customer_analysis(start_date, end_date),
            'trend_analysis': self.get_trend_analysis(start_date, end_date),
            'risk_assessment': self.get_risk_assessment(),
            'financial_ratios': self.calculate_financial_ratios(start_date, end_date),
            'management_discussion': self.generate_management_discussion(start_date, end_date),
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'type': report_type
            },
            'generated_at': timezone.now().isoformat(),
            'report_id': f"FR-{timezone.now().strftime('%Y%m%d-%H%M%S')}"
        }
        
        return report
    
    def generate_executive_summary(self, start_date, end_date):
        """Generate executive summary"""
        # Get key metrics
        total_revenue = self.get_total_revenue(start_date, end_date)
        net_profit = self.get_net_profit(start_date, end_date)
        total_assets = self.get_total_assets(end_date)
        roi = self.calculate_roe(start_date, end_date)
        fleet_utilization = self.calculate_fleet_utilization(start_date, end_date)
        
        return {
            'company_name': "YOS Car Rentals",
            'report_period': f"{start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}",
            'key_highlights': {
                'total_revenue': float(total_revenue),
                'net_profit': float(net_profit),
                'profit_margin': float((net_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'total_assets': float(total_assets),
                'return_on_investment': float(roi),
                'fleet_utilization': float(fleet_utilization),
                'customer_growth': self.calculate_customer_growth(start_date, end_date)
            },
            'business_overview': "Leading car rental service with a modern fleet of vehicles...",
            'financial_performance': "Strong revenue growth with improving profit margins...",
            'outlook': "Positive outlook with plans for fleet expansion and market penetration..."
        }
    
    def generate_income_statement(self, start_date, end_date):
        """Generate detailed income statement"""
        # Operating Revenue
        booking_revenue = self.get_booking_revenue(start_date, end_date)
        late_fee_revenue = self.get_late_fee_revenue(start_date, end_date)
        other_revenue = Decimal('0')  # Placeholder
        
        # Operating Expenses
        maintenance_expense = self.get_maintenance_expense(start_date, end_date)
        insurance_expense = self.get_insurance_expense(start_date, end_date)
        salary_expense = self.get_salary_expense(start_date, end_date)
        fuel_expense = self.get_fuel_expense(start_date, end_date)
        depreciation_expense = self.get_depreciation_expense(start_date, end_date)
        other_operating_expense = Decimal('0')
        
        total_revenue = booking_revenue + late_fee_revenue + other_revenue
        total_operating_expense = (maintenance_expense + insurance_expense + 
                                   salary_expense + fuel_expense + depreciation_expense + 
                                   other_operating_expense)
        
        operating_income = total_revenue - total_operating_expense
        
        # Non-operating items
        interest_expense = Decimal('0')
        tax_expense = operating_income * Decimal('0.25')  # 25% tax rate
        
        net_income = operating_income - interest_expense - tax_expense
        
        return {
            'operating_revenue': {
                'booking_revenue': float(booking_revenue),
                'late_fee_revenue': float(late_fee_revenue),
                'other_revenue': float(other_revenue),
                'total_operating_revenue': float(total_revenue)
            },
            'operating_expenses': {
                'maintenance': float(maintenance_expense),
                'insurance': float(insurance_expense),
                'salaries': float(salary_expense),
                'fuel': float(fuel_expense),
                'depreciation': float(depreciation_expense),
                'other_operating_expenses': float(other_operating_expense),
                'total_operating_expenses': float(total_operating_expense)
            },
            'operating_income': float(operating_income),
            'non_operating_items': {
                'interest_expense': float(interest_expense),
                'tax_expense': float(tax_expense)
            },
            'net_income': float(net_income),
            'ebitda': float(self.calculate_ebitda(start_date, end_date))
        }
    
    def generate_balance_sheet(self, as_of_date):
        """Generate balance sheet"""
        # Assets
        current_assets = self.get_current_assets(as_of_date)
        fixed_assets = self.get_fixed_assets(as_of_date)
        total_assets = current_assets + fixed_assets
        
        # Liabilities
        current_liabilities = self.get_current_liabilities(as_of_date)
        long_term_liabilities = Decimal('0')  # Placeholder
        total_liabilities = current_liabilities + long_term_liabilities
        
        # Equity
        contributed_capital = self.get_contributed_capital()
        retained_earnings = self.get_retained_earnings(as_of_date)
        total_equity = contributed_capital + retained_earnings
        
        return {
            'assets': {
                'current_assets': float(current_assets),
                'fixed_assets': float(fixed_assets),
                'total_assets': float(total_assets)
            },
            'liabilities': {
                'current_liabilities': float(current_liabilities),
                'long_term_liabilities': float(long_term_liabilities),
                'total_liabilities': float(total_liabilities)
            },
            'equity': {
                'contributed_capital': float(contributed_capital),
                'retained_earnings': float(retained_earnings),
                'total_equity': float(total_equity)
            },
            'balance_check': float(total_assets) == float(total_liabilities + total_equity)
        }
    
    def generate_cash_flow_statement(self, start_date, end_date):
        """Generate cash flow statement"""
        # Operating Activities
        net_income = self.get_net_profit(start_date, end_date)
        depreciation = self.get_depreciation_expense(start_date, end_date)
        changes_in_working_capital = Decimal('0')  # Simplified
        cash_from_operations = net_income + depreciation + changes_in_working_capital
        
        # Investing Activities
        capital_expenditures = self.get_capital_expenditures(start_date, end_date)
        asset_sales = Decimal('0')
        cash_from_investing = -capital_expenditures + asset_sales
        
        # Financing Activities
        loans_received = Decimal('0')
        dividends_paid = Decimal('0')
        cash_from_financing = loans_received - dividends_paid
        
        net_cash_flow = cash_from_operations + cash_from_investing + cash_from_financing
        beginning_cash = self.get_cash_balance(start_date - timedelta(days=1))
        ending_cash = beginning_cash + net_cash_flow
        
        return {
            'operating_activities': {
                'net_income': float(net_income),
                'depreciation': float(depreciation),
                'changes_in_working_capital': float(changes_in_working_capital),
                'cash_from_operations': float(cash_from_operations)
            },
            'investing_activities': {
                'capital_expenditures': float(capital_expenditures),
                'asset_sales': float(asset_sales),
                'cash_from_investing': float(cash_from_investing)
            },
            'financing_activities': {
                'loans_received': float(loans_received),
                'dividends_paid': float(dividends_paid),
                'cash_from_financing': float(cash_from_financing)
            },
            'net_cash_flow': float(net_cash_flow),
            'beginning_cash': float(beginning_cash),
            'ending_cash': float(ending_cash)
        }
    
    def calculate_key_metrics(self, start_date, end_date):
        """Calculate key performance metrics"""
        total_revenue = self.get_total_revenue(start_date, end_date)
        net_profit = self.get_net_profit(start_date, end_date)
        total_assets = self.get_total_assets(end_date)
        total_bookings = Booking.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        ).count()
        
        return {
            'financial_metrics': {
                'revenue_growth': float(self.calculate_revenue_growth(start_date, end_date)),
                'profit_margin': float((net_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'return_on_assets': float((net_profit / total_assets * 100) if total_assets > 0 else 0),
                'asset_turnover': float((total_revenue / total_assets) if total_assets > 0 else 0)
            },
            'operational_metrics': {
                'average_daily_rate': float(self.calculate_average_daily_rate(start_date, end_date)),
                'vehicle_utilization': float(self.calculate_fleet_utilization(start_date, end_date)),
                'booking_conversion_rate': float(self.calculate_booking_conversion_rate(start_date, end_date)),
                'customer_retention_rate': float(self.calculate_customer_retention_rate(start_date, end_date))
            }
        }
    
    def get_vehicle_performance(self, start_date, end_date):
        vehicles = Car.objects.filter(is_active=True)
        performance_data = []

        for vehicle in vehicles:
            bookings = Booking.objects.filter(
                car=vehicle,
                status='completed',
                created_at__range=[start_date, end_date]
            )
            # Revenue
            revenue = bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

            # Days rented (annotate then sum)
            bookings_annot = bookings.annotate(
                duration=ExpressionWrapper(F('end_date') - F('start_date'), output_field=DurationField())
            )
            total_duration = bookings_annot.aggregate(days=Sum('duration'))['days'] or timedelta(0)
            days_rented = total_duration.total_seconds() / 86400.0

            # maintenance cost...
            maintenance_cost = MaintenanceRecord.objects.filter(
                car=vehicle,
                status='completed',
                created_at__range=[start_date, end_date]
            ).aggregate(total=Sum('cost'))['total'] or Decimal('0')

            total_days = (end_date - start_date).days or 1
            utilization = (days_rented / total_days * 100) if total_days > 0 else 0

            bookings_count = bookings.count()

            performance_data.append({
                'vehicle_id': str(vehicle.id),
                'make': vehicle.make,
                'model': vehicle.model,
                'year': vehicle.year,
                'license_plate': vehicle.license_plate,
                'revenue': float(revenue),
                'maintenance_cost': float(maintenance_cost),
                'profit': float(revenue - maintenance_cost),
                'utilization_rate': float(utilization),
                'bookings_count': bookings_count,
                'average_booking_value': float(revenue / bookings_count) if bookings_count > 0 else 0
            })

        return sorted(performance_data, key=lambda x: x['profit'], reverse=True)

    
    def get_trend_analysis(self, start_date, end_date):
        """Get trend analysis data"""
        trend_data = []
        current = start_date
        
        while current <= end_date:
            month_end = (current.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            if month_end > end_date:
                month_end = end_date
            
            month_revenue = self.get_total_revenue(current, month_end)
            month_bookings = Booking.objects.filter(
                created_at__range=[current, month_end],
                status='completed'
            ).count()
            
            trend_data.append({
                'period': current.strftime('%b %Y'),
                'revenue': float(month_revenue),
                'bookings': month_bookings,
                'average_daily_rate': float(self.calculate_average_daily_rate(current, month_end))
            })
            
            current = month_end + timedelta(days=1)
        
        return trend_data
    
    def calculate_financial_ratios(self, start_date, end_date):
        """Calculate important financial ratios"""
        total_revenue = self.get_total_revenue(start_date, end_date)
        net_profit = self.get_net_profit(start_date, end_date)
        total_assets = self.get_total_assets(end_date)
        total_liabilities = self.get_total_liabilities(end_date)
        current_assets = self.get_current_assets(end_date)
        current_liabilities = self.get_current_liabilities(end_date)
        
        return {
            'liquidity_ratios': {
                'current_ratio': float((current_assets / current_liabilities) if current_liabilities > 0 else 0),
                'quick_ratio': float((current_assets / current_liabilities) if current_liabilities > 0 else 0)
            },
            'profitability_ratios': {
                'gross_profit_margin': float((net_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'net_profit_margin': float((net_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'return_on_assets': float((net_profit / total_assets * 100) if total_assets > 0 else 0),
                'return_on_equity': float(self.calculate_roe(start_date, end_date))
            },
            'solvency_ratios': {
                'debt_to_equity': float((total_liabilities / (total_assets - total_liabilities)) if total_assets > total_liabilities else 0),
                'debt_to_assets': float((total_liabilities / total_assets) if total_assets > 0 else 0)
            },
            'efficiency_ratios': {
                'asset_turnover': float((total_revenue / total_assets) if total_assets > 0 else 0),
                'inventory_turnover': float(self.calculate_vehicle_turnover(start_date, end_date))
            }
        }
    
    def generate_management_discussion(self, start_date, end_date):
        """Generate management discussion and analysis"""
        return {
            'overview': "YOS Car Rentals has demonstrated strong financial performance during the reporting period...",
            'results_of_operations': {
                'revenue_growth': "Revenue increased by 15% compared to the previous period...",
                'profitability': "Profit margins improved due to optimized fleet utilization and cost controls...",
                'expense_management': "Maintenance costs were effectively managed through preventive maintenance programs..."
            },
            'liquidity_and_capital_resources': "The company maintains strong liquidity with adequate cash reserves...",
            'market_conditions': "The car rental market shows strong demand with increasing tourism and business travel...",
            'strategic_initiatives': [
                "Fleet expansion with 5 new vehicles planned for next quarter",
                "Implementation of digital booking platform",
                "Partnership with travel agencies for corporate clients"
            ],
            'risk_factors': [
                "Market competition from established players",
                "Fuel price volatility",
                "Regulatory changes in transportation sector"
            ]
        }
    
    # Helper methods for financial calculations
    def get_total_revenue(self, start_date, end_date):
        revenue = Booking.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        return revenue
    
    def get_net_profit(self, start_date, end_date):
        revenue = self.get_total_revenue(start_date, end_date)
        expenses = self.get_total_expenses(start_date, end_date)
        return revenue - expenses
    
    def get_total_expenses(self, start_date, end_date):
        maintenance = self.get_maintenance_expense(start_date, end_date)
        insurance = self.get_insurance_expense(start_date, end_date)
        salaries = self.get_salary_expense(start_date, end_date)
        return maintenance + insurance + salaries
    
    def get_total_assets(self, as_of_date):
        cars = Car.objects.filter(is_active=True)
        total_value = sum(car.current_value or Decimal('0') for car in cars)
        return total_value + Decimal('50000')  # Add cash and other assets
    
    def get_month_range(self, year, month):
        if month is None:
            month = timezone.now().month
        start_date = datetime(int(year), int(month), 1).date()
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        return start_date, end_date
    
    def get_quarter_range(self, year, quarter):
        if quarter is None:
            quarter = (timezone.now().month - 1) // 3 + 1
        quarter = int(quarter)
        start_month = (quarter - 1) * 3 + 1
        end_month = start_month + 2
        year = int(year)
        start_date = date(year, start_month, 1)
        last_day = calendar.monthrange(year, end_month)[1]
        end_date = date(year, end_month, last_day)
        return start_date, end_date
    
    # Additional calculation methods
    def calculate_ebitda(self, start_date, end_date):
        net_income = self.get_net_profit(start_date, end_date)
        depreciation = self.get_depreciation_expense(start_date, end_date)
        interest = Decimal('0')
        taxes = Decimal('0')
        return net_income + depreciation + interest + taxes
    
    def calculate_roe(self, start_date, end_date):
        net_income = self.get_net_profit(start_date, end_date)
        total_equity = self.get_total_assets(end_date) - self.get_total_liabilities(end_date)
        return (net_income / total_equity * 100) if total_equity > 0 else 0
    
    def calculate_fleet_utilization(self, start_date, end_date):
        total_days = (end_date - start_date).days * Car.objects.filter(is_active=True).count()
        if total_days == 0:
            return 0

        bookings_qs = Booking.objects.filter(
            status='completed',
            start_date__lte=end_date,
            end_date__gte=start_date
        ).annotate(
            duration=ExpressionWrapper(F('end_date') - F('start_date'), output_field=DurationField())
        )
        total_duration = bookings_qs.aggregate(days=Sum('duration'))['days'] or timedelta(0)
        booked_days = total_duration.total_seconds() / 86400.0

        return (booked_days / total_days * 100)
    
    def calculate_vehicle_turnover(self, start_date, end_date):
        avg_vehicles = Car.objects.filter(is_active=True).count()
        total_revenue = self.get_total_revenue(start_date, end_date)
        return (total_revenue / avg_vehicles) if avg_vehicles > 0 else 0
    
    def calculate_revenue_growth(self, start_date, end_date):
        current_revenue = self.get_total_revenue(start_date, end_date)
        previous_start = start_date - (end_date - start_date) - timedelta(days=1)
        previous_end = start_date - timedelta(days=1)
        previous_revenue = self.get_total_revenue(previous_start, previous_end)
        
        if previous_revenue == 0:
            return 0
        return ((current_revenue - previous_revenue) / previous_revenue * 100)
    
    # Placeholder methods for additional financial data
    def get_booking_revenue(self, start_date, end_date):
        return self.get_total_revenue(start_date, end_date)
    
    def get_late_fee_revenue(self, start_date, end_date):
        return Booking.objects.filter(
            created_at__range=[start_date, end_date]
        ).aggregate(total=Sum('penalty_amount'))['total'] or Decimal('0')
    
    def get_maintenance_expense(self, start_date, end_date):
        return MaintenanceRecord.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        ).aggregate(total=Sum('cost'))['total'] or Decimal('0')
    
    def get_insurance_expense(self, start_date, end_date):
        policies = InsurancePolicy.objects.filter(
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        total = Decimal('0')
        for policy in policies:
            days_in_period = min(end_date, policy.end_date) - max(start_date, policy.start_date)
            days_in_period = days_in_period.days + 1
            total += policy.insurance_amount * Decimal(days_in_period / 365)
        return total
    
    def get_salary_expense(self, start_date, end_date):
        return SalaryPayment.objects.filter(
            month__range=[start_date, end_date],
            is_paid=True
        ).aggregate(total=Sum('net_salary'))['total'] or Decimal('0')
    
    def get_fuel_expense(self, start_date, end_date):
        # Placeholder - would need fuel tracking system
        return Decimal('0')
    
    def get_depreciation_expense(self, start_date, end_date):
        cars = Car.objects.filter(is_active=True)
        total = Decimal('0')
        for car in cars:
            if car.purchase_price and car.current_value:
                annual_dep = (car.purchase_price - car.current_value) / 5  # 5 year life
                months = (end_date - start_date).days / 30
                total += annual_dep * Decimal(months / 12)
        return total
    
    def get_current_assets(self, as_of_date):
        cash = Decimal('50000')
        receivables = Booking.objects.filter(
            payment_status='pending',
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        return cash + receivables
    
    def get_fixed_assets(self, as_of_date):
        return self.get_total_assets(as_of_date)
    
    def get_current_liabilities(self, as_of_date):
        payables = Decimal('10000')  # Placeholder
        return payables
    
    def get_total_liabilities(self, as_of_date):
        return self.get_current_liabilities(as_of_date)
    
    def get_contributed_capital(self):
        return Decimal('200000')
    
    def get_retained_earnings(self, as_of_date):
        start_of_year = datetime(as_of_date.year, 1, 1).date()
        return self.get_net_profit(start_of_year, as_of_date)
    
    def get_capital_expenditures(self, start_date, end_date):
        return Car.objects.filter(
            purchase_date__range=[start_date, end_date]
        ).aggregate(total=Sum('purchase_price'))['total'] or Decimal('0')
    
    def get_cash_balance(self, date):
        return Decimal('50000')  # Placeholder
    
    def calculate_customer_growth(self, start_date, end_date):
        new_customers = Customer.objects.filter(
            created_at__range=[start_date, end_date]
        ).count()
        
        previous_start = start_date - (end_date - start_date) - timedelta(days=1)
        previous_end = start_date - timedelta(days=1)
        previous_customers = Customer.objects.filter(
            created_at__range=[previous_start, previous_end]
        ).count()
        
        if previous_customers == 0:
            return 0
        return (new_customers / previous_customers * 100)
    
    def calculate_average_daily_rate(self, start_date, end_date):
        bookings = Booking.objects.filter(
            created_at__range=[start_date, end_date],
            status='completed'
        )
        total_revenue = bookings.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        total_days = aggregate_total_days_from_bookings(bookings)
        total_days = total_days or 1

        avg_daily_rate = (total_revenue / Decimal(total_days)) if total_days else Decimal('0')
        return avg_daily_rate
    
    def calculate_booking_conversion_rate(self, start_date, end_date):
        inquiries = 100  # Placeholder - would need inquiry tracking
        bookings = Booking.objects.filter(
            created_at__range=[start_date, end_date]
        ).count()
        
        return (bookings / inquiries * 100) if inquiries > 0 else 0
    
    def calculate_customer_retention_rate(self, start_date, end_date):
        # Simplified calculation
        repeat_customers = Customer.objects.filter(
            bookings__created_at__range=[start_date, end_date]
        ).distinct().count()
        total_customers = Customer.objects.filter(
            bookings__created_at__range=[start_date, end_date]
        ).count()
        
        return (repeat_customers / total_customers * 100) if total_customers > 0 else 0
    
    def get_customer_analysis(self, start_date, end_date):
        """
        Return customer analysis using DB annotations.
        Uses created_at__date__range to avoid timezone naive warnings
        when comparing dates to DateTimeFields.
        """
        # booking filter for the period (use date range to avoid naive datetime warnings)
        booking_filter = Q(bookings__created_at__date__range=[start_date, end_date])

        # annotate customers with booking counts and completed booking counts (in the period)
        customers_qs = Customer.objects.annotate(
            total_bookings=Count('bookings', filter=booking_filter),
            completed_bookings=Count('bookings', filter=booking_filter & Q(bookings__status='completed'))
        ).filter(total_bookings__gt=0)  # only customers who had bookings in the period

        loyalty_segments = {
            'new': customers_qs.filter(total_bookings=1).count(),
            'returning': customers_qs.filter(total_bookings__gt=1).count(),
            'loyal': customers_qs.filter(total_bookings__gt=3).count()
        }

        avg_bookings = customers_qs.aggregate(avg=Avg('total_bookings'))['avg'] or 0

        return {
            'total_customers': customers_qs.count(),
            'loyalty_segments': loyalty_segments,
            'average_bookings_per_customer': float(avg_bookings),
            'top_customers': self.get_top_customers(start_date, end_date)
        }
        
    
    def get_top_customers(self, start_date, end_date):
        booking_filter = Q(bookings__created_at__date__range=[start_date, end_date]) & Q(bookings__status='completed')

        top_customers = Customer.objects.annotate(
            total_spent=Sum('bookings__total_amount', filter=booking_filter),
            booking_count=Count('bookings', filter=booking_filter)
        ).filter(booking_count__gt=0).order_by('-total_spent')[:10]

        return [
            {
                'id': str(c.id),
                'name': f"{c.first_name} {c.last_name}",
                'total_spent': float(c.total_spent or 0),
                'bookings': int(c.booking_count or 0)
            } for c in top_customers
        ]
    
    def get_risk_assessment(self):
        return {
            'market_risks': [
                {'risk': 'Competition', 'level': 'Medium', 'mitigation': 'Differentiation through service quality'},
                {'risk': 'Economic downturn', 'level': 'Low', 'mitigation': 'Diversified customer base'}
            ],
            'operational_risks': [
                {'risk': 'Vehicle accidents', 'level': 'Medium', 'mitigation': 'Comprehensive insurance and driver screening'},
                {'risk': 'Maintenance costs', 'level': 'Low', 'mitigation': 'Preventive maintenance program'}
            ],
            'financial_risks': [
                {'risk': 'Cash flow volatility', 'level': 'Low', 'mitigation': 'Maintain cash reserves'},
                {'risk': 'Fuel price increases', 'level': 'Medium', 'mitigation': 'Fuel surcharge policy'}
            ]
        }


class ExportFinancialReportAPI(APIView):
    """Export financial reports in various formats"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        report_type = request.data.get('type', 'comprehensive')
        format_type = request.data.get('format', 'pdf')
        period = request.data.get('period', {})
        
        # Generate report
        financial_api = ComprehensiveFinancialReportAPI()
        
        if report_type == 'executive_summary':
            report = financial_api.generate_executive_summary(
                datetime.fromisoformat(period.get('start')),
                datetime.fromisoformat(period.get('end'))
            )
        elif report_type == 'income_statement':
            report = financial_api.generate_income_statement(
                datetime.fromisoformat(period.get('start')),
                datetime.fromisoformat(period.get('end'))
            )
        else:
            report = financial_api.generate_comprehensive_report(
                datetime.fromisoformat(period.get('start')),
                datetime.fromisoformat(period.get('end')),
                period.get('type', 'quarterly')
            )
        
        # Prepare export
        if format_type == 'pdf':
            return self.export_pdf(report, report_type)
        elif format_type == 'excel':
            return self.export_excel(report, report_type)
        elif format_type == 'json':
            return Response(report)
        else:
            return Response(
                {'error': 'Unsupported format'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def export_pdf(self, report, report_type):
        # Placeholder for PDF generation
        # In production, use libraries like ReportLab or WeasyPrint
        return Response({
            'message': 'PDF export functionality would be implemented here',
            'report_type': report_type,
            'data_preview': {k: v for k, v in list(report.items())[:3]}
        })
    
    def export_excel(self, report, report_type):
        # Placeholder for Excel generation
        # In production, use libraries like openpyxl or pandas
        return Response({
            'message': 'Excel export functionality would be implemented here',
            'report_type': report_type,
            'data_preview': {k: v for k, v in list(report.items())[:3]}
        })


class FinancialProjectionsAPI(APIView):
    """Generate financial projections"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        years = int(request.query_params.get('years', 3))
        growth_rate = float(request.query_params.get('growth_rate', 15)) / 100
        
        projections = self.generate_projections(years, growth_rate)
        
        return Response(projections)
    
    def generate_projections(self, years, growth_rate):
        current_year = timezone.now().year
        projections = []
        
        # Get current year data
        current_start = datetime(current_year, 1, 1).date()
        current_end = datetime(current_year, 12, 31).date()
        financial_api = ComprehensiveFinancialReportAPI()
        
        base_revenue = financial_api.get_total_revenue(current_start, current_end)
        base_profit = financial_api.get_net_profit(current_start, current_end)
        base_assets = financial_api.get_total_assets(current_end)
        
        for year in range(1, years + 1):
            projected_revenue = base_revenue * Decimal((1 + growth_rate) ** year)
            projected_profit = base_profit * Decimal((1 + growth_rate * 0.8) ** year)  # Slightly lower profit growth
            projected_assets = base_assets * Decimal((1 + growth_rate * 0.5) ** year)  # Assets grow slower
            
            projections.append({
                'year': current_year + year,
                'revenue': float(projected_revenue),
                'profit': float(projected_profit),
                'profit_margin': float((projected_profit / projected_revenue * 100) if projected_revenue > 0 else 0),
                'assets': float(projected_assets),
                'roi': float((projected_profit / projected_assets * 100) if projected_assets > 0 else 0),
                'assumptions': {
                    'revenue_growth': growth_rate * 100,
                    'profit_margin_change': -2 * year,  # Slight margin compression
                    'capex_percentage': 20  # 20% of revenue reinvested
                }
            })
        
        return {
            'projections': projections,
            'base_year': current_year,
            'assumptions': {
                'revenue_growth_rate': growth_rate * 100,
                'inflation_rate': 3.5,
                'market_growth': 8.0
            },
            'sensitivity_analysis': self.generate_sensitivity_analysis(base_revenue, growth_rate, years)
        }
    
    def generate_sensitivity_analysis(self, base_revenue, base_growth, years):
        scenarios = []
        
        for scenario in ['optimistic', 'base', 'pessimistic']:
            if scenario == 'optimistic':
                growth = base_growth * 1.3
            elif scenario == 'pessimistic':
                growth = base_growth * 0.7
            else:
                growth = base_growth
            
            year_revenue = base_revenue * Decimal((1 + growth) ** years)
            
            scenarios.append({
                'scenario': scenario,
                'growth_rate': growth * 100,
                'year_5_revenue': float(year_revenue),
                'breakeven_year': 2 if scenario == 'optimistic' else (3 if scenario == 'base' else 4)
            })
        
        return scenarios