import { Car } from "../types/car";
import {
  FinancialStatement,
  ExpenseBreakdown,
  FinancialMetrics,
  MonthlyReportData,
  //   AnnualReportData,
} from "../types/reports";

export class ReportGenerator {
  private cars: Car[];
  private period: string;
  private reportType: "monthly" | "annual";

  constructor(cars: Car[], period: string, reportType: "monthly" | "annual") {
    this.cars = cars;
    this.period = period;
    this.reportType = reportType;
  }

  // Generate complete financial statement
  generateFinancialStatement(vehicleId?: string): FinancialStatement {
    const filteredCars = vehicleId
      ? this.cars.filter((car) => car.id === vehicleId)
      : this.cars;

    const summary = this.calculateFinancialMetrics(filteredCars);
    const incomeStatement = this.generateIncomeStatement(filteredCars);
    const balanceSheet = this.generateBalanceSheet(filteredCars);
    const detailedBreakdown = this.generateDetailedBreakdown(filteredCars);

    return {
      filters: {
        reportType: this.reportType,
        period: this.period,
        vehicleId,
        includeCharts: true,
      },
      generatedAt: new Date().toISOString(),
      summary,
      incomeStatement,
      balanceSheet,
      detailedBreakdown,
    };
  }

  // Calculate key financial metrics
  private calculateFinancialMetrics(cars: Car[]): FinancialMetrics {
    const totalRevenue = cars.reduce((sum, car) => sum + car.total_revenue, 0);
    const totalExpenses = cars.reduce((sum, car) => sum + car.total_expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate total capital invested (purchase price)
    const totalInvestment = cars.reduce(
      (sum, car) => sum + (car.purchasePrice ?? 0),
      0
    );
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // Calculate utilization rate
    const totalBookings = cars.reduce(
      (sum, car) => sum + car.bookings.length,
      0
    );
    const completedBookings = cars.reduce(
      (sum, car) =>
        sum + car.bookings.filter((b) => b.status === "completed").length,
      0
    );
    const utilizationRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate average daily rate
    // const totalDailyRate = cars.reduce(
    //   (sum, car) => sum + (car.dailyRate ?? 0),
    //   0
    // );
    // const averageDailyRate = cars.length > 0 ? totalDailyRate / cars.length : 0;

    return {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      netProfit,
      profitMargin,
      roi,
      utilizationRate,
      // averageDailyRate,
    };
  }

  // Generate income statement
  private generateIncomeStatement(
    cars: Car[]
  ): FinancialStatement["incomeStatement"] {
    const rentalIncome = cars.reduce((sum, car) => sum + car.total_revenue, 0);

    // Calculate other income from timeline events
    const otherIncome = cars.reduce(
      (sum, car) =>
        sum +
        car.timelineEvents
          .filter(
            (event) =>
              event.type === "revenue" && event.title !== "Rental Booking"
          )
          .reduce((eventSum, event) => eventSum + (event.amount || 0), 0),
      0
    );

    const expenseBreakdown = this.calculateExpenseBreakdown(cars);

    // Calculate depreciation
    const depreciation = cars.reduce((sum, car) => {
      if (car.depreciationRate && car.purchasePrice) {
        const years = new Date().getFullYear() - car.year;
        return sum + car.purchasePrice * (car.depreciationRate / 100) * years;
      }
      return sum;
    }, 0);

    const totalExpenses = expenseBreakdown.total + depreciation;

    return {
      revenue: {
        rentalIncome,
        otherIncome,
        totalRevenue: rentalIncome + otherIncome,
      },
      expenses: {
        ...expenseBreakdown,
        depreciation,
        totalExpenses,
      },
      netIncome: rentalIncome + otherIncome - totalExpenses,
    };
  }

  // Calculate expense breakdown
  private calculateExpenseBreakdown(cars: Car[]): ExpenseBreakdown {
    let maintenance = 0;
    let insurance = 0;
    const fuel = 0;
    let other = 0;

    cars.forEach((car) => {
      // Maintenance expenses
      maintenance += car.maintenanceRecords.reduce(
        (sum, record) => sum + record.cost,
        0
      );

      // Insurance expenses (annual premiums)
      insurance += car.insurancePolicies.reduce(
        (sum, policy) => sum + policy.insurance_amount,
        0
      );

      // Other expenses from timeline events
      car.timelineEvents.forEach((event) => {
        if (event.amount && event.amount > 0) {
          switch (event.type) {
            case "maintenance":
              // Already counted in maintenanceRecords
              break;
            case "insurance":
              // Already counted in insurancePolicies
              break;
            case "accident":
              other += event.amount;
              break;
            case "inspection":
            case "other":
              other += event.amount;
              break;
          }
        }
      });
    });

    const total = maintenance + insurance + fuel + other;

    return {
      maintenance,
      insurance,
      fuel,
      other,
      total,
    };
  }

  // Generate balance sheet
  private generateBalanceSheet(
    cars: Car[]
  ): FinancialStatement["balanceSheet"] {
    const currentValue = cars.reduce(
      (sum, car) => sum + (car.currentValue || 0),
      0
    );
    const totalPurchasePrice = cars.reduce(
      (sum, car) => sum + (car.purchasePrice ?? 0),
      0
    );
    const accumulatedDepreciation = totalPurchasePrice - currentValue;

    return {
      assets: {
        currentValue,
        accumulatedDepreciation,
        totalAssets: currentValue,
      },
    };
  }

  // Generate detailed breakdown
  private generateDetailedBreakdown(
    cars: Car[]
  ): FinancialStatement["detailedBreakdown"] {
    const byVehicle = cars.map((car) => ({
      vehicleId: car.id,
      make: car.make,
      model: car.model,
      revenue: car.total_revenue,
      expenses: car.total_expenses,
      profit: car.total_revenue - car.total_expenses,
    }));

    const expenseBreakdown = this.calculateExpenseBreakdown(cars);
    const totalExpenses = expenseBreakdown.total;

    const byCategory = Object.entries(expenseBreakdown)
      .filter(([key]) => key !== "total")
      .map(([category, amount]) => ({
        category: this.formatCategoryName(category),
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      byVehicle,
      byCategory,
    };
  }

  private formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Generate monthly report data
  generateMonthlyReport(): MonthlyReportData[] {
    const months: MonthlyReportData[] = [];
    const [year, month] = this.period.split("-").map(Number);

    // Get data for the past 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(year, month - 1 - i);
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      // Calculate revenue for this month
      const revenue = this.cars.reduce((sum, car) => {
        const monthBookings = car.bookings.filter((booking) => {
          const bookingDate = new Date(booking.startDate);
          return (
            bookingDate.getMonth() === date.getMonth() &&
            bookingDate.getFullYear() === date.getFullYear() &&
            booking.status === "completed"
          );
        });
        return (
          sum +
          monthBookings.reduce(
            (bookingSum, booking) => bookingSum + booking.totalAmount,
            0
          )
        );
      }, 0);

      // Calculate expenses for this month
      const expenses = this.calculateMonthlyExpenses(date);

      // Calculate bookings count
      const bookings = this.cars.reduce(
        (sum, car) =>
          sum +
          car.bookings.filter((booking) => {
            const bookingDate = new Date(booking.startDate);
            return (
              bookingDate.getMonth() === date.getMonth() &&
              bookingDate.getFullYear() === date.getFullYear()
            );
          }).length,
        0
      );

      // Calculate utilization rate for this month
      const totalPossibleDays = 30 * this.cars.length; // Approximation
      const bookedDays = this.cars.reduce(
        (sum, car) =>
          sum +
          car.bookings.filter((booking) => {
            const bookingDate = new Date(booking.startDate);
            return (
              bookingDate.getMonth() === date.getMonth() &&
              bookingDate.getFullYear() === date.getFullYear() &&
              booking.status === "completed"
            );
          }).length,
        0
      );
      const utilization =
        totalPossibleDays > 0 ? (bookedDays / totalPossibleDays) * 100 : 0;

      months.unshift({
        month: monthStr,
        revenue,
        expenses,
        bookings,
        utilization,
      });
    }

    return months;
  }

  // Calculate expenses for a specific month
  private calculateMonthlyExpenses(date: Date): ExpenseBreakdown {
    const month = date.getMonth();
    const year = date.getFullYear();

    let maintenance = 0;
    let insurance = 0;
    const fuel = 0;
    let other = 0;

    this.cars.forEach((car) => {
      // Maintenance in this month
      maintenance += car.maintenanceRecords
        .filter((record) => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getMonth() === month && recordDate.getFullYear() === year
          );
        })
        .reduce((sum, record) => sum + record.cost, 0);

      // Insurance premium allocation for this month
      insurance += car.insurancePolicies
        .filter((policy) => {
          const startDate = new Date(policy.startDate);
          const endDate = new Date(policy.endDate);
          return startDate <= date && endDate >= date;
        })
        .reduce((sum, policy) => sum + policy.insurance_amount / 12, 0); // Monthly allocation

      // Other expenses in this month
      car.timelineEvents.forEach((event) => {
        if (event.amount && event.amount > 0 && event.type !== "revenue") {
          const eventDate = new Date(event.date);
          if (
            eventDate.getMonth() === month &&
            eventDate.getFullYear() === year
          ) {
            other += event.amount;
          }
        }
      });
    });

    const total = maintenance + insurance + fuel + other;

    return {
      maintenance,
      insurance,
      fuel,
      other,
      total,
    };
  }
}
