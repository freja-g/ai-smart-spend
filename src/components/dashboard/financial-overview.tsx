import { DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react"
import { FinancialCard } from "@/components/ui/financial-card"
import { useFinancialStore } from "@/store/financial-store"

export function FinancialOverview() {
  const { getTotalIncome, getTotalExpenses, getBalance, goals, monthlyBudget, getBudgetedExpenses } = useFinancialStore()
  
  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()
  const balance = getBalance()
  
  // Calculate total progress on all goals
  const totalGoalProgress = goals.reduce((sum, goal) => {
    return sum + (goal.currentAmount / goal.targetAmount)
  }, 0) / goals.length * 100

  // Calculate monthly budget remaining (simplified)
  const budgetedExpenses = getBudgetedExpenses()
    const budgetRemaining = monthlyBudget - budgetedExpenses
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
        title="Budget Remaining"
        value={`Ksh. ${budgetRemaining.toLocaleString()}`}
        trend={budgetRemaining > 0 ? "up" : "down"}
        trendValue={`${((budgetRemaining / monthlyBudget) * 100).toFixed(0)}% left`}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="default"
      />
    </div>
  )
}
