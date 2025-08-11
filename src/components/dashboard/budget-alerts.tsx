import { AlertTriangle, CheckCircle, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useFinancialStore } from "@/store/financial-store"
import { Badge } from "@/components/ui/badge"

export function BudgetAlerts() {
  const { budgets, getSpendingByCategory } = useFinancialStore()
  const spendingByCategory = getSpendingByCategory()

  const budgetStatus = budgets.map(budget => {
    const spent = spendingByCategory[budget.category] || 0
    const percentage = (spent / budget.budgeted) * 100
    const remaining = budget.budgeted - spent

    let status: 'safe' | 'warning' | 'danger' | 'over' = 'safe'
    if (percentage >= 100) status = 'over'
    else if (percentage >= 90) status = 'danger'
    else if (percentage >= 70) status = 'warning'

    return {
      ...budget,
      spent,
      percentage: Math.min(percentage, 100),
      remaining,
      status
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-destructive'
      case 'danger': return 'text-destructive'
      case 'warning': return 'text-warning'
      default: return 'text-success'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'danger': return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      default: return <CheckCircle className="h-4 w-4 text-success" />
    }
  }

  const getStatusMessage = (budget: any) => {
    switch (budget.status) {
      case 'over':
        return `Over budget by Ksh. ${Math.abs(budget.remaining).toFixed(2)}`
      case 'danger':
        return `Only Ksh. ${budget.remaining.toFixed(2)} left`
      case 'warning':
        return `Ksh. ${budget.remaining.toFixed(2)} remaining`
      default:
        return `Ksh. ${budget.remaining.toFixed(2)} remaining`
    }
  }

  const criticalAlerts = budgetStatus.filter(b => b.status === 'over' || b.status === 'danger')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Budget Status
        </CardTitle>
        <CardDescription>
          Monitor your spending against budgets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalAlerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {criticalAlerts.length} budget{criticalAlerts.length > 1 ? 's' : ''} need{criticalAlerts.length === 1 ? 's' : ''} attention
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {budgetStatus.slice(0, 4).map((budget) => (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.status)}
                  <span className="font-medium text-sm">{budget.category}</span>
                  <Badge variant={budget.status === 'over' ? 'destructive' : 'secondary'} className="text-xs">
                    {budget.percentage.toFixed(0)}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Ksh. {budget.spent.toFixed(2)} / Ksh. {budget.budgeted.toFixed(2)}
                </div>
              </div>
              <Progress 
                value={budget.percentage} 
                className="h-2"
              />
              <p className={`text-xs ${getStatusColor(budget.status)}`}>
                {getStatusMessage(budget)}
              </p>
            </div>
          ))}
        </div>

        {budgetStatus.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No budgets set yet</p>
            <p className="text-xs">Create budgets to track your spending</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
