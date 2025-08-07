import { DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react"
import { FinancialCard } from "@/components/ui/financial-card"
import { useFinancialStore } from "@/store/financial-store"

export function FinancialOverview() {
  const { getTotalIncome, getTotalExpenses, getBalance, expenses, goals, budget } = useFinancialStore()

  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()
  const balance = getBalance()

  // Calculate total progress on all goals
  const totalGoalProgress = goals.length > 0
    ? goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount), 0) / goals.length * 100
    : 0

  // Calculate total budgeted amount
  const monthlyBudget = budget.reduce((sum, item) => sum + item.amount, 0)

  // Filter expenses that belong to budgeted categories only
  const budgetedCategories = budget.map(item => item.category)

  const budgetedSpending = expenses
    .filter(expense => budgetedCategories.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0)

  const budgetRemaining = monthlyBudget - budgetedSpending

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <FinancialCard
        title="Total Balance"
        value={`Ksh. ${balance.toLocaleString()}`}
        trend={balance > 0 ? "up" : "down"}
        trendValue={balance > 0 ? "Positive balance" : "Negative balance"}
        icon={<DollarSign className="h-4 w-4" />}
        variant="income"
      />
      <FinancialCard
        title="Monthly Expenses"
        value={`Ksh. ${totalExpenses.toLocaleString()}`}
        trend="down"
        trendValue="This month"
        icon={<TrendingDown className="h-4 w-4" />}
        variant="expense"
      />
      <FinancialCard
        title="Savings Goals"
        value={`${totalGoalProgress.toFixed(0)}%`}
        trend="up"
        trendValue="Average progress"
        icon={<Target className="h-4 w-4" />}
        variant="savings"
      />
      <FinancialCard
        title={budgetRemaining >= 0 ? "Budget Remaining" : "Over Budget"}
        value={`Ksh. ${Math.abs(budgetRemaining).toLocaleString()}`}
        trend={budgetRemaining >= 0 ? "up" : "down"}
        trendValue={`${Math.abs((budgetRemaining / monthlyBudget) * 100).toFixed(0)}% ${budgetRemaining >= 0 ? "left" : "over"}`}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="default"
      />
    </div>
  )
}
