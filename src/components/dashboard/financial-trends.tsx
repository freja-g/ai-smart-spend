import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useFinancialStore } from "@/store/financial-store"
import { format, subMonths, startOfMonth } from "date-fns"
import { useMemo } from "react"

export function FinancialTrends() {
  const { transactions } = useFinancialStore()

  // Memoize trend data calculation to prevent unnecessary re-renders
  const trendData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = startOfMonth(subMonths(new Date(), i))
      const monthKey = format(date, 'yyyy-MM')

      // Filter transactions for this month
      const monthTransactions = transactions.filter(t =>
        new Date(t.date).toISOString().startsWith(monthKey)
      )

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = Math.abs(monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0))

      const savings = income - expenses

      months.push({
        month: format(date, 'MMM'),
        income,
        expenses,
        savings,
        netWorth: income - expenses // Simplified calculation
      })
    }
    return months
  }, [transactions])
  
  // Calculate trend indicators
  const currentMonth = trendData[trendData.length - 1]
  const previousMonth = trendData[trendData.length - 2]
  
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, direction: 'neutral' as const }
    const change = ((current - previous) / Math.abs(previous)) * 100
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const
    }
  }

  const incomeTrend = calculateTrend(currentMonth?.income || 0, previousMonth?.income || 0)
  const expenseTrend = calculateTrend(currentMonth?.expenses || 0, previousMonth?.expenses || 0)
  const savingsTrend = calculateTrend(currentMonth?.savings || 0, previousMonth?.savings || 0)

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />
      default: return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (direction: 'up' | 'down' | 'neutral', isExpense = false) => {
    if (isExpense) {
      // For expenses, up is bad, down is good
      switch (direction) {
        case 'up': return 'text-destructive'
        case 'down': return 'text-success'
        default: return 'text-muted-foreground'
      }
    } else {
      // For income and savings, up is good, down is bad
      switch (direction) {
        case 'up': return 'text-success'
        case 'down': return 'text-destructive'
        default: return 'text-muted-foreground'
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Financial Trends
        </CardTitle>
        <CardDescription>
          6-month overview of your financial patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Trend Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              {getTrendIcon(incomeTrend.direction)}
              <span className="text-xs font-medium">Income</span>
            </div>
            <div className={`text-sm font-bold ${getTrendColor(incomeTrend.direction)}`}>
              {incomeTrend.direction !== 'neutral' && (incomeTrend.direction === 'up' ? '+' : '-')}
              {incomeTrend.percentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              {getTrendIcon(expenseTrend.direction)}
              <span className="text-xs font-medium">Expenses</span>
            </div>
            <div className={`text-sm font-bold ${getTrendColor(expenseTrend.direction, true)}`}>
              {expenseTrend.direction !== 'neutral' && (expenseTrend.direction === 'up' ? '+' : '-')}
              {expenseTrend.percentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              {getTrendIcon(savingsTrend.direction)}
              <span className="text-xs font-medium">Savings</span>
            </div>
            <div className={`text-sm font-bold ${getTrendColor(savingsTrend.direction)}`}>
              {savingsTrend.direction !== 'neutral' && (savingsTrend.direction === 'up' ? '+' : '-')}
              {savingsTrend.percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any, name: string) => [
                  `Ksh. ${Math.abs(value).toLocaleString()}`,
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Net Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-primary">Monthly Insight</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {savingsTrend.direction === 'up' && 'Great progress! Your savings are trending upward.'}
            {savingsTrend.direction === 'down' && 'Consider reviewing your expenses to improve your savings rate.'}
            {savingsTrend.direction === 'neutral' && 'Your savings rate is stable. Look for opportunities to increase income or reduce expenses.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
