from django.urls import path
from .views import (
    ComprehensiveFinancialReportAPI,
    ExportFinancialReportAPI,
    FinancialProjectionsAPI
)

urlpatterns = [
    path('financial/', ComprehensiveFinancialReportAPI.as_view(), name='financial-report'),
    path('financial/export/', ExportFinancialReportAPI.as_view(), name='export-financial-report'),
    path('financial/projections/', FinancialProjectionsAPI.as_view(), name='financial-projections'),
]