import { FinancialOverview } from "./financial-overview"
import { SpendingChart } from "./spending-chart"
import { RecentTransactions } from "./recent-transactions"
import { QuickActions } from "./quick-actions"
import { BudgetAlerts } from "./budget-alerts"
import { SavingsInsights } from "./savings-insights"
import { FinancialTrends } from "./financial-trends"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Target } from "lucide-react"
import { useFinancialStore, importTransactionsFromCSV, importBudgetFromFile } from "@/store/financial-store"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function DashboardView() {
  const { transactions, budgets, goals, addTransaction, addGoal } = useFinancialStore()
  const { toast } = useToast()
  const hasData = transactions.length > 0 || budgets.length > 0 || goals.length > 0

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [transactionForm, setTransactionForm] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense"
  })

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    deadline: ""
  })

  const categories = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment",
    "Bills & Utilities", "Healthcare", "Education", "Travel",
    "Investment", "Salary", "Freelance", "Business", "Other"
  ]

  const handleAddTransaction = () => {
    if (!transactionForm.description || !transactionForm.amount || !transactionForm.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    addTransaction({
      description: transactionForm.description,
      amount: transactionForm.type === "expense" ? -Math.abs(parseFloat(transactionForm.amount)) : Math.abs(parseFloat(transactionForm.amount)),
      category: transactionForm.category,
      date: new Date(),
      type: transactionForm.type
    })

    setTransactionForm({ description: "", amount: "", category: "", type: "expense" })
    setIsAddTransactionOpen(false)
    toast({
      title: "Success",
      description: "Transaction added successfully"
    })
  }

  const handleAddGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.deadline) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    addGoal({
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: 0,
      deadline: new Date(goalForm.deadline)
    })

    setGoalForm({ name: "", targetAmount: "", deadline: "" })
    setIsAddGoalOpen(false)
    toast({
      title: "Success",
      description: "Savings goal created successfully"
    })
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'transactions' | 'budget') => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string

      let result
      if (type === 'transactions') {
        result = importTransactionsFromCSV(content)
      } else {
        result = importBudgetFromFile(content)
      }

      toast({
        title: result.success ? "Import Successful" : "Import Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      })
    }
    reader.readAsText(file)
    setIsImportOpen(false)
  }

  if (!hasData) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 pb-20">
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">Welcome to SmartSpend!</CardTitle>
              <CardDescription className="text-lg">
                Get started by adding your first transaction or importing your financial data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Add Transactions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by manually adding your income and expenses
                  </p>
                  <Button size="sm" className="w-full" onClick={() => setIsAddTransactionOpen(true)}>
                    Add Transaction
                  </Button>
                </Card>

                <Card className="p-6">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your CSV or Excel files to import existing data
                  </p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setIsImportOpen(true)}>
                    Import Files
                  </Button>
                </Card>

                <Card className="p-6">
                  <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Set Goals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create savings goals to track your financial progress
                  </p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setIsAddGoalOpen(true)}>
                    Create Goal
                  </Button>
                </Card>
              </div>
              
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold mb-2">Quick Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Use the "+" button in Quick Actions to add transactions</li>
                  <li>• Import bank statements to get started quickly</li>
                  <li>• Set up budgets to track your spending limits</li>
                  <li>• Create savings goals to stay motivated</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Add Transaction Dialog */}
          <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Record a new income or expense transaction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Grocery shopping"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={transactionForm.type}
                    onValueChange={(value) => setTransactionForm(prev => ({ ...prev, type: value as "income" | "expense" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={transactionForm.category}
                    onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddTransaction} className="flex-1">
                    Add Transaction
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Goal Dialog */}
          <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>
                  Set a new target to save towards
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input
                    id="goalName"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Emergency Fund"
                  />
                </div>
                <div>
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddGoal} className="flex-1">
                    Create Goal
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Data Dialog */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Financial Data</DialogTitle>
                <DialogDescription>
                  Import your transactions or budget from CSV files
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transactions-file">Import Transactions (CSV)</Label>
                  <Input
                    id="transactions-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileImport(e, 'transactions')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected columns: description, amount, category, date, type
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-file">Import Budget (CSV)</Label>
                  <Input
                    id="budget-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileImport(e, 'budget')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected columns: category, budgeted, spent, month
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="pb-20"> {/* Bottom padding for mobile nav */}
        <FinancialOverview />
        
        <div className="p-4 space-y-4">
          <QuickActions />
          
          <div className="grid gap-4 md:grid-cols-2">
            <BudgetAlerts />
            <SavingsInsights />
          </div>
          
          <FinancialTrends />
          
          <div className="space-y-4">
            <SpendingChart variant="pie" />
            <SpendingChart variant="bar" />
          </div>
        </div>

        <RecentTransactions />
      </div>
    </ScrollArea>
  )
}
