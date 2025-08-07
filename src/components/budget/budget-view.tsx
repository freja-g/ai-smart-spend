import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, CreditCard, Trash2, AlertTriangle } from "lucide-react"
import { useFinancialStore } from "@/store/financial-store"
import { useToast } from "@/hooks/use-toast"

const budgetCategories = [
  "Food", "Transport", "Entertainment", "Shopping", "Bills", 
  "Healthcare", "Education", "Travel", "Other"
]

export function BudgetView() {
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetStatus, getSpendingByCategory } = useFinancialStore()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    budgeted: "",
    month: new Date().toISOString().slice(0, 7) // YYYY-MM format
  })

  const spendingByCategory = getSpendingByCategory()
  const budgetStatus = getBudgetStatus()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || !formData.budgeted) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    // Check if budget already exists for this category and month
    const existingBudget = budgets.find(b => b.category === formData.category && b.month === formData.month)
    if (existingBudget) {
      toast({
        title: "Budget exists",
        description: "A budget for this category already exists for this month.",
        variant: "destructive"
      })
      return
    }

    const spent = spendingByCategory[formData.category] || 0

    addBudget({
      category: formData.category,
      budgeted: parseFloat(formData.budgeted),
      spent,
      month: formData.month
    })

    toast({
      title: "Budget created",
      description: `Budget for ${formData.category} has been set to Ksh. ${parseFloat(formData.budgeted).toLocaleString()}.`
    })

    setFormData({ category: "", budgeted: "", month: formData.month })
    setIsAdding(false)
  }

  const handleDelete = (id: string, category: string) => {
    deleteBudget(id)
    toast({
      title: "Budget deleted",
      description: `Budget for ${category} has been removed.`
    })
  }

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgeted, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  // Update spent amounts based on actual transactions
  React.useEffect(() => {
    budgets.forEach(budget => {
      const actualSpent = Math.abs(spendingByCategory[budget.category] || 0)
      if (actualSpent !== budget.spent) {
        updateBudget(budget.id, { spent: actualSpent })
      }
    })
  }, [spendingByCategory, budgets, updateBudget])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-20 space-y-4">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Monthly Budget
              </div>
              <Button onClick={() => setIsAdding(!isAdding)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your spending limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Budget Usage</span>
                  <span className="text-sm font-medium">{overallProgress.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={overallProgress} 
                  className={`h-2 ${overallProgress > 100 ? 'text-destructive' : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${totalSpent > totalBudgeted ? 'text-destructive' : 'text-foreground'}`}>
                    Ksh. {totalSpent.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Spent This Month</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">Ksh. {totalBudgeted.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Budget</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Budget Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Set Category Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {budgetCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgeted">Budget Amount</Label>
                    <Input
                      id="budgeted"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.budgeted}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgeted: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Set Budget
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Budget List */}
        {budgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No budgets set yet.</p>
              <Button onClick={() => setIsAdding(true)} variant="outline">
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const progress = (budget.spent / budget.budgeted) * 100
              const isOverBudget = budget.spent > budget.budgeted
              const remaining = budget.budgeted - budget.spent

              return (
                <Card key={budget.id} className={isOverBudget ? "border-destructive" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{budget.category}</span>
                        {isOverBudget && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(budget.id, budget.category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Budget for {new Date(budget.month + '-01').toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          {isOverBudget ? "Over budget" : "Spent"}
                        </span>
                        <span className={`text-sm font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-2 ${isOverBudget ? 'bg-destructive/20' : ''}`}
                      />
                      {isOverBudget && (
                        <Progress 
                          value={progress - 100} 
                          className="h-1 mt-1"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Spent: </span>
                        <span className={`font-medium ${isOverBudget ? 'text-destructive' : ''}`}>
                          Ksh. {budget.spent.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Budget: </span>
                        <span className="font-medium">Ksh. {budget.budgeted.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                        </span>
                        <span className={`font-medium ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                          {remaining < 0 
                          ? `-Ksh. ${Math.abs(remaining).toLocaleString()}`
                          : `Ksh. ${remaining.toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {isOverBudget && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Over budget by Ksh. {Math.abs(remaining).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider reducing spending in this category
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
