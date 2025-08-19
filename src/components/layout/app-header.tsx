import { Bell, Settings, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { importTransactionsFromCSV, importBudgetFromFile, useFinancialStore } from "@/store/financial-store"
import { useLocalNotifications } from "@/hooks/use-local-notifications"

interface AppHeaderProps {
  title: string
  subtitle?: string
  onNavigateToProfile?: () => void
}

export function AppHeader({ title, subtitle, onNavigateToProfile }: AppHeaderProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { scheduleNotification } = useLocalNotifications()
  const [localNotifications, setLocalNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const { transactions, budgets, goals } = useFinancialStore()

  // Generate local notifications based on financial data
  useEffect(() => {
    if (!user || !transactions.length) return

    const checkBudgetAlerts = () => {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyExpenses = transactions
        .filter(t => t.type === 'expense' && t.date.toISOString().startsWith(currentMonth))
        .reduce((total, t) => total + Math.abs(t.amount), 0)

      const monthlyBudget = budgets.reduce((total, b) => total + b.budgeted, 0)

      if (monthlyBudget > 0 && monthlyExpenses > monthlyBudget * 0.8) {
        const notification = {
          id: `budget-alert-${Date.now()}`,
          title: 'Budget Alert',
          message: `You've spent 80% of your monthly budget`,
          timestamp: new Date(),
          read: false
        }

        setLocalNotifications(prev => {
          // Don't add duplicate alerts
          if (prev.some(n => n.title === 'Budget Alert' && !n.read)) return prev
          return [notification, ...prev.slice(0, 9)]
        })

        scheduleNotification(notification.title, notification.message)
      }
    }

    const checkGoalProgress = () => {
      goals.forEach(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100

        if (progress >= 75 && progress < 100) {
          const notification = {
            id: `goal-progress-${goal.id}-${Date.now()}`,
            title: 'Goal Progress',
            message: `You're ${progress.toFixed(0)}% towards your ${goal.name} goal!`,
            timestamp: new Date(),
            read: false
          }

          setLocalNotifications(prev => {
            // Don't add duplicate goal notifications
            if (prev.some(n => n.message.includes(goal.name) && !n.read)) return prev
            return [notification, ...prev.slice(0, 9)]
          })

          scheduleNotification(notification.title, notification.message)
        }
      })
    }

    checkBudgetAlerts()
    checkGoalProgress()
  }, [user, transactions, budgets, goals, scheduleNotification])

  const addWelcomeNotification = () => {
    if (localNotifications.length === 0) {
      const welcomeNotification = {
        id: `welcome-${Date.now()}`,
        title: 'Welcome to SmartSpend!',
        message: 'Start tracking your expenses and achieving your financial goals.',
        timestamp: new Date(),
        read: false
      }
      setLocalNotifications([welcomeNotification])
    }
  }

  useEffect(() => {
    if (user) {
      addWelcomeNotification()
    }
  }, [user])

  const markNotificationAsRead = (notificationId: string) => {
    setLocalNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const getUnreadCount = () => {
    return localNotifications.filter(n => !n.read).length
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'transactions' | 'budget') => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      try {
        if (type === 'transactions') {
          const lines = content.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim())
              const transaction = {
                description: values[headers.indexOf('description')] || values[0] || 'Imported Transaction',
                amount: parseFloat(values[headers.indexOf('amount')] || values[1] || '0'),
                category: values[headers.indexOf('category')] || values[2] || 'General',
                date: new Date(values[headers.indexOf('date')] || values[3] || new Date()),
                type: (values[headers.indexOf('type')] || values[4] || 'expense') as 'income' | 'expense'
              }
              useFinancialStore.getState().addTransaction(transaction)
            }
          }
          
          toast({
            title: "Import Successful",
            description: `Imported ${lines.length - 1} transactions.`
          })
        } else {
          const lines = content.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim())
              const budget = {
                category: values[headers.indexOf('category')] || values[0] || 'General',
                budgeted: parseFloat(values[headers.indexOf('budgeted')] || values[1] || '0'),
                spent: parseFloat(values[headers.indexOf('spent')] || values[2] || '0'),
                month: values[headers.indexOf('month')] || values[3] || new Date().toISOString().slice(0, 7)
              }
              useFinancialStore.getState().addBudget(budget)
            }
          }
          
          toast({
            title: "Import Successful", 
            description: `Imported ${lines.length - 1} budget items.`
          })
        }
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse the file. Please check the format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    setShowImport(false)
  }

  const handleExport = (type: 'transactions' | 'budget' | 'goals') => {
    let csvContent = ''
    let filename = ''
    
    if (type === 'transactions') {
      csvContent = 'description,amount,category,date,type\n'
      transactions.forEach(t => {
        csvContent += `"${t.description}",${t.amount},"${t.category}","${t.date.toISOString().split('T')[0]}","${t.type}"\n`
      })
      filename = 'transactions.csv'
    } else if (type === 'budget') {
      csvContent = 'category,budgeted,spent,month\n'
      budgets.forEach(b => {
        csvContent += `"${b.category}",${b.budgeted},${b.spent},"${b.month}"\n`
      })
      filename = 'budget.csv'
    } else if (type === 'goals') {
      csvContent = 'name,targetAmount,currentAmount,deadline,description\n'
      goals.forEach(g => {
        csvContent += `"${g.name}",${g.targetAmount},${g.currentAmount},"${g.deadline.toISOString().split('T')[0]}","${g.description || ''}"\n`
      })
      filename = 'goals.csv'
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Export Successful",
      description: `${filename} has been downloaded.`
    })
    
    setShowExport(false)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Export Data">
              <Download className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Financial Data</DialogTitle>
              <DialogDescription>
                Download your financial data as CSV files
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleExport('transactions')}
                disabled={transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Transactions ({transactions.length} items)
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleExport('budget')}
                disabled={budgets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Budget ({budgets.length} items)
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleExport('goals')}
                disabled={goals.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Goals ({goals.length} items)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Import Data">
              <Upload className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Financial Data</DialogTitle>
              <DialogDescription>
                Import your transactions or budget from CSV or Excel files
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-file">Import Budget (CSV/Excel)</Label>
                <Input
                  id="budget-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileImport(e, 'budget')}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {getUnreadCount() > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                >
                  {getUnreadCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                Your recent notifications
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {localNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-2">Local notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {localNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'bg-muted/50' : 'bg-background border-primary/20'
                      }`}
                      onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Settings</DialogTitle>
              <DialogDescription>
                Access your account settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access your account settings and preferences.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowSettings(false)
                  onNavigateToProfile?.()
                }}
              >
                Go to Profile Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
