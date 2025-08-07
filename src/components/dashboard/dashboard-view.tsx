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
import { Plus,FileUp,FileDown, Target, RefreshCw } from "lucide-react"
import { useFinancialStore } from "@/store/financial-store"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function DashboardView() {
  const { transactions, budgets, goals, syncData, isLoading } = useFinancialStore()
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const hasData = transactions.length > 0 || budgets.length > 0 || goals.length > 0

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncData()
      toast({
        title: "Data synced",
        description: "Your financial data has been synchronized across all devices."
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync data. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }
  if (!hasData) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 pb-20">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={isSyncing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
          </div>
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
                  <Button size="sm" className="w-full">
                    Add Transaction
                  </Button>
                </Card>
                
                <Card className="p-6">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your CSV or Excel files to import existing data
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Import Files
                  </Button>
                </Card>
                
                <Card className="p-6">
                  <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Set Goals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create savings goals to track your financial progress
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
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
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="pb-20"> {/* Bottom padding for mobile nav */}
        <div className="flex justify-end p-4 pb-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
        
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