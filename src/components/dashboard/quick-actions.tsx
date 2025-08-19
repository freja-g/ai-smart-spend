import { Plus,FileUp,FileDown, Target, PiggyBank, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useFinancialStore } from "@/store/financial-store"
import { useToast } from "@/hooks/use-toast"

export function QuickActions() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const { addTransaction, addGoal } = useFinancialStore()
  const { toast } = useToast()

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

  const quickActionButtons = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Add Transaction",
      description: "Record income or expense",
      action: () => setIsAddTransactionOpen(true),
      variant: "default" as const
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "New Goal",
      description: "Set savings target",
      action: () => setIsAddGoalOpen(true),
      variant: "secondary" as const
    },
    {
      icon: <FileDown className="h-5 w-5" />,
      label: "Export Data",
      description: "Download your data",
      action: () => {
        const { transactions, budgets, goals } = useFinancialStore.getState()

        if (transactions.length === 0 && budgets.length === 0 && goals.length === 0) {
          toast({
            title: "No Data to Export",
            description: "Add some transactions, budgets, or goals first",
            variant: "destructive"
          })
          return
        }

        // Export all data as a combined CSV
        let csvContent = 'type,description,amount,category,date,budgeted,spent,month,targetAmount,currentAmount,deadline,goalName\n'

        // Add transactions
        transactions.forEach(t => {
          csvContent += `transaction,"${t.description}",${t.amount},"${t.category}","${t.date.toISOString().split('T')[0]}",,,,,,,\n`
        })

        // Add budgets
        budgets.forEach(b => {
          csvContent += `budget,,,${b.category},,${b.budgeted},${b.spent},"${b.month}",,,,,\n`
        })

        // Add goals
        goals.forEach(g => {
          csvContent += `goal,,,,,,,,"${g.targetAmount}","${g.currentAmount}","${g.deadline.toISOString().split('T')[0]}","${g.name}"\n`
        })

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'smartspend-data.csv'
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: "Your financial data has been downloaded"
        })
      },
      variant: "outline" as const
    },
    {
      icon: <FileUp className="h-5 w-5" />,
      label: "Import Data",
      description: "Upload CSV file",
      action: () => {
        toast({
          title: "Import",
          description: "Import feature coming soon"
        })
      },
      variant: "outline" as const
    }
  ]

  const categories = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment", 
    "Bills & Utilities", "Healthcare", "Education", "Travel", 
    "Investment", "Salary", "Freelance", "Business", "Other"
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used actions for managing your finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActionButtons.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center gap-2 text-center"
                onClick={action.action}
              >
                {action.icon}
                <div>
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            ))}
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
    </>
  )
}
