import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: Date
  type: 'income' | 'expense'
}

export interface BudgetItem {
  id: string
  category: string
  budgeted: number
  spent: number
  month: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  description?: string
}

interface FinancialState {
  transactions: Transaction[]
  budgets: BudgetItem[]
  goals: SavingsGoal[]
  monthlyBudget: number
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  
  // Budget actions
  addBudget: (budget: Omit<BudgetItem, 'id'>) => void
  updateBudget: (id: string, budget: Partial<BudgetItem>) => void
  deleteBudget: (id: string) => void
  setMonthlyBudget: (amount: number) => void
  
  // Goal actions
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void
  updateGoal: (id: string, goal: Partial<SavingsGoal>) => void
  deleteGoal: (id: string) => void
  
  // Computed values
  getTotalIncome: () => number
  getTotalExpenses: () => number
  getBudgetedExpenses: () => number
  getTotalBudgetAmount: () => number 
  getBalance: () => number
  getSpendingByCategory: () => { [key: string]: number }
  getBudgetStatus: () => { [key: string]: { spent: number; budgeted: number; remaining: number } }
  
  // Sync actions
  syncWithSupabase: () => Promise<void>
  loadFromSupabase: () => Promise<void>
}

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id || null
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      budgets: [],
      goals: [],
      monthlyBudget: 0,
      // Transaction actions
      addTransaction: async (transaction) => {
        const newTransaction = { ...transaction, id: Date.now().toString() }
        
        // Add to local state first
        set((state) => ({
          transactions: [...state.transactions, newTransaction]
        }))

        // Sync to Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error } = await supabase
              .from('transactions')
              .insert({
                id: newTransaction.id,
                user_id: user.id,
                description: newTransaction.description,
                amount: newTransaction.amount,
                category: newTransaction.category,
                date: newTransaction.date.toISOString().split('T')[0],
                type: newTransaction.type
              })
            
            if (error) {
              console.error('Error syncing transaction to Supabase:', error)
            }
          }
        } catch (error) {
          console.error('Error syncing transaction:', error)
        }
      },

      deleteTransaction: async (id) => {
        // Remove from local state first
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }))

        // Sync to Supabase
        try {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('Error deleting transaction from Supabase:', error)
          }
        } catch (error) {
          console.error('Error deleting transaction:', error)
        }
      },

      updateTransaction: async (id, updates) => {
        // Update local state first
        set((state) => ({
          transactions: state.transactions.map(t => 
            t.id === id ? { ...t, ...updates } : t
          )
        }))

        // Sync to Supabase
        try {
          const updateData: any = { ...updates }
          if (updateData.date) {
            updateData.date = updateData.date.toISOString().split('T')[0]
          }
          
          const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)
          
          if (error) {
            console.error('Error updating transaction in Supabase:', error)
          }
        } catch (error) {
          console.error('Error updating transaction:', error)
        }
      },

      // Budget actions
      addBudget: async (budget) => {
        const newBudget = { ...budget, id: Date.now().toString() }
        
        // Add to local state first
        set((state) => ({
          budgets: [...state.budgets, newBudget]
        }))

        // Sync to Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error } = await supabase
              .from('budget_items')
              .insert({
                id: newBudget.id,
                user_id: user.id,
                category: newBudget.category,
                budgeted_amount: newBudget.budgeted,
                spent_amount: newBudget.spent,
                month: newBudget.month
              })
            
            if (error) {
              console.error('Error syncing budget to Supabase:', error)
            }
          }
        } catch (error) {
          console.error('Error syncing budget:', error)
        }
      },

      updateBudget: async (id, updates) => {
        // Update local state first
        set((state) => ({
          budgets: state.budgets.map(b => 
            b.id === id ? { ...b, ...updates } : b
          )
        }))

        // Sync to Supabase
        try {
          const updateData: any = {}
          if (updates.budgeted !== undefined) updateData.budgeted_amount = updates.budgeted
          if (updates.spent !== undefined) updateData.spent_amount = updates.spent
          if (updates.category !== undefined) updateData.category = updates.category
          if (updates.month !== undefined) updateData.month = updates.month
          
          const { error } = await supabase
            .from('budget_items')
            .update(updateData)
            .eq('id', id)
          
          if (error) {
            console.error('Error updating budget in Supabase:', error)
          }
        } catch (error) {
          console.error('Error updating budget:', error)
        }
      },

      deleteBudget: async (id) => {
        // Remove from local state first
        set((state) => ({
          budgets: state.budgets.filter(b => b.id !== id)
        }))

        // Sync to Supabase
        try {
          const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('Error deleting budget from Supabase:', error)
          }
        } catch (error) {
          console.error('Error deleting budget:', error)
        }
      },

      // Goal actions
      addGoal: async (goal) => {
        const newGoal = { ...goal, id: Date.now().toString() }
        
        // Add to local state first
        set((state) => ({
          goals: [...state.goals, newGoal]
        }))

        // Sync to Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error } = await supabase
              .from('savings_goals')
              .insert({
                id: newGoal.id,
                user_id: user.id,
                name: newGoal.name,
                target_amount: newGoal.targetAmount,
                current_amount: newGoal.currentAmount,
                deadline: newGoal.deadline.toISOString().split('T')[0],
                description: newGoal.description
              })
            
            if (error) {
              console.error('Error syncing goal to Supabase:', error)
            }
          }
        } catch (error) {
          console.error('Error syncing goal:', error)
        }
      },

      updateGoal: async (id, updates) => {
        // Update local state first
        set((state) => ({
          goals: state.goals.map(g => 
            g.id === id ? { ...g, ...updates } : g
          )
        }))

        // Sync to Supabase
        try {
          const updateData: any = {}
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount
          if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount
          if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString().split('T')[0]
          if (updates.description !== undefined) updateData.description = updates.description
          
          const { error } = await supabase
            .from('savings_goals')
            .update(updateData)
            .eq('id', id)
          
          if (error) {
            console.error('Error updating goal in Supabase:', error)
          }
        } catch (error) {
          console.error('Error updating goal:', error)
        }
      },

      deleteGoal: async (id) => {
        // Remove from local state first
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id)
        }))

        // Sync to Supabase
        try {
          const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('Error deleting goal from Supabase:', error)
          }
        } catch (error) {
          console.error('Error deleting goal:', error)
        }
      },

      setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),

      getBudgetedExpenses: () => {
        const { transactions, budgets } = get()
        const budgetCategories = budgets.map(b => b.category)
        
        return Math.abs(transactions
          .filter(t => t.type === 'expense' && budgetCategories.includes(t.category))
          .reduce((sum, t) => sum + t.amount, 0))
      },
      getTotalBudgetAmount: () => {
        const { budgets } = get()
          return budgets.reduce((sum, budget) => sum + budget.budgeted, 0)
      },
      // Computed values
      getTotalIncome: () => {
        const { transactions } = get()
        return transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
      },

      getTotalExpenses: () => {
        const { transactions } = get()
        return Math.abs(transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0))
      },

      getBalance: () => {
        const { getTotalIncome, getTotalExpenses } = get()
        return getTotalIncome() - getTotalExpenses()
      },

      getSpendingByCategory: () => {
        const { transactions } = get()
        const spending: { [key: string]: number } = {}
        
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount)
          })
        
        return spending
      },

      getBudgetStatus: () => {
        const { budgets } = get()
        const status: { [key: string]: { spent: number; budgeted: number; remaining: number } } = {}
        
        budgets.forEach(b => {
          status[b.category] = {
            spent: b.spent,
            budgeted: b.budgeted,
            remaining: b.budgeted - b.spent
          }
        })
        
        return status
      },

      // Sync functions
      loadFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Load transactions
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (transactionsError) {
            console.error('Error loading transactions:', transactionsError)
          } else if (transactions) {
            const formattedTransactions = transactions.map(t => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
              category: t.category,
              date: new Date(t.date),
              type: t.type as 'income' | 'expense'
            }))
            set({ transactions: formattedTransactions })
          }

          // Load budget items
          const { data: budgets, error: budgetsError } = await supabase
            .from('budget_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (budgetsError) {
            console.error('Error loading budgets:', budgetsError)
          } else if (budgets) {
            const formattedBudgets = budgets.map(b => ({
              id: b.id,
              category: b.category,
              budgeted: b.budgeted_amount,
              spent: b.spent_amount,
              month: b.month
            }))
            set({ budgets: formattedBudgets })
          }

          // Load savings goals
          const { data: goals, error: goalsError } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (goalsError) {
            console.error('Error loading goals:', goalsError)
          } else if (goals) {
            const formattedGoals = goals.map(g => ({
              id: g.id,
              name: g.name,
              targetAmount: g.target_amount,
              currentAmount: g.current_amount,
              deadline: new Date(g.deadline),
              description: g.description
            }))
            set({ goals: formattedGoals })
          }
        } catch (error) {
          console.error('Error loading data from Supabase:', error)
        }
      },

      syncWithSupabase: async () => {
        const { loadFromSupabase } = get()
        await loadFromSupabase()
      }
    }),
    {
      name: 'smartspend-storage',
      // Clear storage when user changes (sign out/sign in)
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        monthlyBudget: state.monthlyBudget
      })
    }
  )
)

// Helper function to clear all financial data (for new users or sign out)
export const clearFinancialData = () => {
  useFinancialStore.setState({
    transactions: [],
    budgets: [],
    goals: [],
    monthlyBudget: 0
  })
}

// Helper function to import transactions from CSV
export const importTransactionsFromCSV = (csvData: string) => {
  try {
    const lines = csvData.split('\n')
    if (lines.length < 2) return { success: false, message: 'CSV file is empty or has no data rows' }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    let importedCount = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))

      // Find indices for required fields
      const descIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'))
      const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('value'))
      const categoryIndex = headers.findIndex(h => h.includes('category'))
      const dateIndex = headers.findIndex(h => h.includes('date'))
      const typeIndex = headers.findIndex(h => h.includes('type'))

      // Use fallback indices if headers not found
      const description = values[descIndex >= 0 ? descIndex : 0] || 'Imported Transaction'
      const amount = parseFloat(values[amountIndex >= 0 ? amountIndex : 1] || '0')
      const category = values[categoryIndex >= 0 ? categoryIndex : 2] || 'General'
      const dateStr = values[dateIndex >= 0 ? dateIndex : 3] || new Date().toISOString()
      const type = (values[typeIndex >= 0 ? typeIndex : 4] || 'expense').toLowerCase() as 'income' | 'expense'

      if (!isNaN(amount) && amount !== 0) {
        const transaction = {
          description,
          amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
          category,
          date: new Date(dateStr),
          type
        }

        useFinancialStore.getState().addTransaction(transaction)
        importedCount++
      }
    }

    return { success: true, message: `Successfully imported ${importedCount} transactions` }
  } catch (error) {
    return { success: false, message: 'Failed to parse CSV file. Please check the format.' }
  }
}

// Helper function to import budget from Excel/CSV
export const importBudgetFromFile = (fileData: string) => {
  try {
    const lines = fileData.split('\n')
    if (lines.length < 2) return { success: false, message: 'File is empty or has no data rows' }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    let importedCount = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))

      // Find indices for required fields
      const categoryIndex = headers.findIndex(h => h.includes('category'))
      const budgetedIndex = headers.findIndex(h => h.includes('budgeted') || h.includes('budget'))
      const spentIndex = headers.findIndex(h => h.includes('spent') || h.includes('spend'))
      const monthIndex = headers.findIndex(h => h.includes('month') || h.includes('period'))

      // Use fallback indices if headers not found
      const category = values[categoryIndex >= 0 ? categoryIndex : 0] || 'General'
      const budgeted = parseFloat(values[budgetedIndex >= 0 ? budgetedIndex : 1] || '0')
      const spent = parseFloat(values[spentIndex >= 0 ? spentIndex : 2] || '0')
      const month = values[monthIndex >= 0 ? monthIndex : 3] || new Date().toISOString().slice(0, 7)

      if (!isNaN(budgeted) && budgeted > 0) {
        const budget = {
          category,
          budgeted,
          spent: isNaN(spent) ? 0 : spent,
          month
        }

        useFinancialStore.getState().addBudget(budget)
        importedCount++
      }
    }

    return { success: true, message: `Successfully imported ${importedCount} budget items` }
  } catch (error) {
    return { success: false, message: 'Failed to parse file. Please check the format.' }
  }
};
