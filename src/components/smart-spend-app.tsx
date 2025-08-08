import { useState } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ExpensesView } from "@/components/expenses/expenses-view"
import { GoalsView } from "@/components/goals/goals-view"
import { BudgetView } from "@/components/budget/budget-view"
import { ProfileView } from "@/components/profile/profile-view"

export function SmartSpendApp() {
  const [activeTab, setActiveTab] = useState("dashboard")

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard"
      case "expenses":
        return "Expenses"
      case "goals":
        return "Goals"
      case "budget":
        return "Budget"
      case "profile":
        return "Profile"
      default:
        return "SmartSpend"
    }
  }

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Your financial overview"
      case "expenses":
        return "Track your spending"
      case "goals":
        return "Achieve your targets"
      case "budget":
        return "Manage your money"
      case "profile":
        return "Account settings"
      default:
        return ""
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />
      case "expenses":
        return <ExpensesView />
      case "goals":
        return <GoalsView />
      case "budget":
        return <BudgetView />
      case "profile":
        return <ProfileView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader 
        title={getHeaderTitle()} 
        subtitle={getHeaderSubtitle()}
        onNavigateToProfile={() => setActiveTab("profile")}
      />
      
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  )
}