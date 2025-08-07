import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/integrations/supabase/client'

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: Date
  type: 'income' | 'expense'
  user_id?: string
}

export interface BudgetItem {
  id: string
  category: string
  budgeted: number
  spent: number
  month: string
  user_id?: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  description?: string
  user_id?: string
}

interface FinancialState {
  transactions: Transaction[]
  budgets: BudgetItem[]
  goals: SavingsGoal[]
  isLoading: boolean
  lastSyncTime: number
  
  // Sync actions
  syncData: () => Promise<void>
  loadUserData: (userId: string) => Promise<void>
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  
  // Budget actions
  addBudget: (budget: Omit<BudgetItem, 'id' | 'user_id'>) => Promise<void>
  updateBudget: (id: string, budget: Partial<BudgetItem>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  
  // Goal actions
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id'>) => Promise<void>
  updateGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  
  // Computed values
  getTotalIncome: () => number
  getTotalExpenses: () => number
  getBalance: () => number
  getSpendingByCategory: () => { [key: string]: number }
  getBudgetStatus: () => { [key: string]: { spent: number; budgeted: number; remaining: number } }
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      budgets: [],
      goals: [],
      isLoading: false,
      lastSyncTime: 0,

      // Sync data with Supabase
      syncData: async () => {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return

        set({ isLoading: true })
        
        try {
          await get().loadUserData(user.id)
          set({ lastSyncTime: Date.now() })
        } catch (error) {
          console.error('Error syncing data:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      // Load user data from Supabase
      loadUserData: async (userId: string) => {
        try {
          // Load transactions
          const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })

          if (transactionsError) throw transactionsError

          // Load budget items
          const { data: budgets, error: budgetsError } = await supabase
            .from('budget_items')
            .select('*')
            .eq('user_id', userId)
            .order('month', { ascending: false })

          if (budgetsError) throw budgetsError

          // Load savings goals
          const { data: goals, error: goalsError } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (goalsError) throw goalsError

          // Transform data to match local format
          const transformedTransactions = (transactions || []).map(t => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            category: t.category,
            date: new Date(t.date),
            type: t.type as 'income' | 'expense',
            user_id: t.user_id
          }))

          const transformedBudgets = (budgets || []).map(b => ({
            id: b.id,
            category: b.category,
            budgeted: b.budgeted_amount,
            spent: b.spent_amount,
            month: b.month,
            user_id: b.user_id
          }))

          const transformedGoals = (goals || []).map(g => ({
            id: g.id,
            name: g.name,
            targetAmount: g.target_amount,
            currentAmount: g.current_amount,
            deadline: new Date(g.deadline || new Date()),
            description: g.description || '',
            user_id: g.user_id
          }))

          set({
            transactions: transformedTransactions,
            budgets: transformedBudgets,
            goals: transformedGoals
          })
        } catch (error) {
          console.error('Error loading user data:', error)
          throw error
        }
      },

      // Transaction actions with Supabase sync
      addTransaction: async (transaction) => {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('transactions')
            .insert({
              description: transaction.description,
              amount: transaction.amount,
              category: transaction.category,
              date: transaction.date.toISOString(),
              type: transaction.type,
              user_id: user.id
            })
            .select()
            .single()

          if (error) throw error

          const newTransaction = {
            id: data.id,
            description: data.description,
            amount: data.amount,
            category: data.category,
            date: new Date(data.date),
            type: data.type as 'income' | 'expense',
            user_id: data.user_id
          }

          set((state) => ({
            transactions: [newTransaction, ...state.transactions]
          }))
        } catch (error) {
          console.error('Error adding transaction:', error)
          throw error
        }
      },

      deleteTransaction: async (id) => {
        try {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)

          if (error) throw error

          set((state) => ({
            transactions: state.transactions.filter(t => t.id !== id)
          }))
        } catch (error) {
          console.error('Error deleting transaction:', error)
          throw error
        }
      },

      updateTransaction: async (id, updates) => {
        try {
          const updateData: any = { ...updates }
          if (updates.date) {
            updateData.date = updates.date.toISOString()
          }

          const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)

          if (error) throw error

          set((state) => ({
            transactions: state.transactions.map(t => 
              t.id === id ? { ...t, ...updates } : t
            )
          }))
        } catch (error) {
          console.error('Error updating transaction:', error)
          throw error
        }
      },

      // Budget actions with Supabase sync
      addBudget: async (budget) => {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('budget_items')
            .insert({
              category: budget.category,
              budgeted_amount: budget.budgeted,
              spent_amount: budget.spent,
              month: budget.month,
              user_id: user.id
            })
            .select()
            .single()

          if (error) throw error

          const newBudget = {
            id: data.id,
            category: data.category,
            budgeted: data.budgeted_amount,
            spent: data.spent_amount,
            month: data.month,
            user_id: data.user_id
          }

          set((state) => ({
            budgets: [newBudget, ...state.budgets]
          }))
        } catch (error) {
          console.error('Error adding budget:', error)
          throw error
        }
      },

      updateBudget: async (id, updates) => {
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

          if (error) throw error

          set((state) => ({
            budgets: state.budgets.map(b => 
              b.id === id ? { ...b, ...updates } : b
            )
          }))
        } catch (error) {
          console.error('Error updating budget:', error)
          throw error
        }
      },

      deleteBudget: async (id) => {
        try {
          const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', id)

          if (error) throw error

          set((state) => ({
            budgets: state.budgets.filter(b => b.id !== id)
          }))
        } catch (error) {
          console.error('Error deleting budget:', error)
          throw error
        }
      },

      // Goal actions with Supabase sync
      addGoal: async (goal) => {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('savings_goals')
            .insert({
              name: goal.name,
              target_amount: goal.targetAmount,
              current_amount: goal.currentAmount,
              deadline: goal.deadline.toISOString(),
              description: goal.description,
              user_id: user.id
            })
            .select()
            .single()

          if (error) throw error

          const newGoal = {
            id: data.id,
            name: data.name,
            targetAmount: data.target_amount,
            currentAmount: data.current_amount,
            deadline: new Date(data.deadline || new Date()),
            description: data.description || '',
            user_id: data.user_id
          }

          set((state) => ({
            goals: [newGoal, ...state.goals]
          }))
        } catch (error) {
          console.error('Error adding goal:', error)
          throw error
        }
      },

      updateGoal: async (id, updates) => {
        try {
          const updateData: any = {}
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount
          if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount
          if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString()
          if (updates.description !== undefined) updateData.description = updates.description

          const { error } = await supabase
            .from('savings_goals')
            .update(updateData)
            .eq('id', id)

          if (error) throw error

          set((state) => ({
            goals: state.goals.map(g => 
              g.id === id ? { ...g, ...updates } : g
            )
          }))
        } catch (error) {
          console.error('Error updating goal:', error)
          throw error
        }
      },

      deleteGoal: async (id) => {
        try {
          const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', id)

          if (error) throw error

          set((state) => ({
            goals: state.goals.filter(g => g.id !== id)
          }))
        } catch (error) {
          console.error('Error deleting goal:', error)
          throw error
        }
      },

      // Computed values (unchanged)
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
      }
    }),
    {
      name: 'smartspend-storage',
      partialize: (state) => ({
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        lastSyncTime: state.lastSyncTime
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
    lastSyncTime: 0
  })
}

// Helper function to import transactions from CSV
export const importTransactionsFromCSV = (csvData: string) => {
  // This will be implemented to parse CSV and add transactions
  console.log('CSV import functionality to be implemented', csvData)
}

// Helper function to import budget from Excel/CSV
export const importBudgetFromFile = (fileData: string) => {
  // This will be implemented to parse Excel/CSV and add budget items
  console.log('Budget import functionality to be implemented', fileData)
}