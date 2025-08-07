import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Target, Trash2, Calendar } from "lucide-react"
import { useFinancialStore } from "@/store/financial-store"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinancialStore()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    description: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const goalData = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: new Date(formData.deadline),
      description: formData.description
    }

    addGoal(goalData).then(() => {
      toast({
        title: "Goal created",
        description: `Your goal "${formData.name}" has been added.`
      })
      setFormData({ name: "", targetAmount: "", deadline: "", description: "" })
      setIsAdding(false)
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive"
      })
    })
  }

  const handleAddMoney = (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount)
    updateGoal(goalId, { currentAmount: newAmount }).then(() => {
      toast({
        title: "Progress updated",
        description: `Added Ksh. ${amount.toLocaleString()} to ${goal.name}`
      })
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to update goal progress. Please try again.",
        variant: "destructive"
      })
    })
  }

  const handleDelete = (id: string, name: string) => {
    deleteGoal(id).then(() => {
      toast({
        title: "Goal deleted",
        description: `${name} has been removed.`
      })
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive"
      })
    })
  }

  const totalGoalValue = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const overallProgress = totalGoalValue > 0 ? (totalSaved / totalGoalValue) * 100 : 0

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-20 space-y-4">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Savings Goals
              </div>
              <Button onClick={() => setIsAdding(!isAdding)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </CardTitle>
            <CardDescription>
              Track your savings progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-medium">{overallProgress.toFixed(0)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">Ksh. {totalSaved.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">Ksh. {totalGoalValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Target Amount</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Goal Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Emergency Fund, Vacation"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAmount">Target Amount</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="What is this goal for?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Create Goal
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

        {/* Goals List */}
        {goals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No savings goals yet.</p>
              <Button onClick={() => setIsAdding(true)} variant="outline">
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100
              const isCompleted = goal.currentAmount >= goal.targetAmount
              const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className={isCompleted ? "text-success" : ""}>{goal.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(goal.id, goal.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    {goal.description && (
                      <CardDescription>{goal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Saved: </span>
                        <span className="font-medium">Ksh. {goal.currentAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target: </span>
                        <span className="font-medium">Ksh. {goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysLeft > 0 
                          ? `${daysLeft} days left (${format(new Date(goal.deadline), 'MMM dd, yyyy')})`
                          : isCompleted 
                            ? "Goal completed!" 
                            : "Deadline passed"
                        }
                      </span>
                    </div>

                    {!isCompleted && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddMoney(goal.id, 5000)}
                          className="flex-1"
                        >
                          +Ksh. 5,000
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddMoney(goal.id, 10000)}
                          className="flex-1"
                        >
                          +Ksh. 10,000
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddMoney(goal.id, 25000)}
                          className="flex-1"
                        >
                          +Ksh. 25,000
                        </Button>
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