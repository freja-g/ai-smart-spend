import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
import { useFinancialStore } from "@/store/financial-store"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const categories = [
  "Food", "Transport", "Entertainment", "Shopping", "Bills", 
  "Healthcare", "Education", "Travel", "Other"
]

export function ExpensesView() {
  const { transactions, addTransaction, deleteTransaction } = useFinancialStore()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    type: "expense" as "income" | "expense"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const amount = formData.type === "expense" 
      ? -Math.abs(parseFloat(formData.amount))
      : Math.abs(parseFloat(formData.amount))

    const transactionData = {
      description: formData.description,
      amount,
      category: formData.category,
      date: new Date(),
      type: formData.type
    }

    addTransaction(transactionData).then(() => {
      toast({
        title: "Transaction added",
        description: `${formData.type === "income" ? "Income" : "Expense"} of Ksh. ${Math.abs(amount).toLocaleString()} has been recorded.`
      })
      setFormData({ description: "", amount: "", category: "", type: "expense" })
      setIsAdding(false)
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive"
      })
    })
  }

  const handleDelete = (id: string, description: string) => {
    deleteTransaction(id).then(() => {
      toast({
        title: "Transaction deleted",
        description: `${description} has been removed.`
      })
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive"
      })
    })
  }

  const expenseTransactions = transactions
    .filter(t => t.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-20 space-y-4">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Total Expenses
              <Button 
                onClick={() => setIsAdding(!isAdding)}
                size="sm"
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </CardTitle>
            <CardDescription>
              Track and manage your expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              Ksh. {totalExpenses.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {expenseTransactions.length} transactions this month
            </p>
          </CardContent>
        </Card>

        {/* Add Transaction Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: "income" | "expense") => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
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
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What was this for?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add Transaction
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

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Your complete transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions yet.</p>
                <Button 
                  onClick={() => setIsAdding(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <Badge 
                          variant={transaction.type === 'income' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-success' 
                          : 'text-destructive'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}Ksh. {Math.abs(transaction.amount).toLocaleString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(transaction.id, transaction.description)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}