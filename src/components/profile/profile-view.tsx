import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  User,
  Settings,
  Bell,
  Shield,
  FileUp,
  FileDown,
  Download,
  Upload,
  Trash2,
  Save,
  Loader2,
  LogOut
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { clearFinancialData, useFinancialStore, importTransactionsFromCSV, importBudgetFromFile } from "@/store/financial-store"

interface UserProfile {
  display_name: string
  email: string
  phone: string
  notifications_enabled: boolean
  local_notifications_enabled: boolean
}

export function ProfileView() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<UserProfile>({
    display_name: "",
    email: "",
    phone: "",
    notifications_enabled: true,
    local_notifications_enabled: true
  })

  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("profile")
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const { transactions, budgets, goals } = useFinancialStore()

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchNotifications()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          notifications_enabled: data.notifications_enabled ?? true,
          local_notifications_enabled: data.push_notifications_enabled ?? true
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!user) {
      console.log('No user available for notification fetching in profile')
      return
    }

    try {
      console.log('Fetching notifications in profile for user:', user.id)

      // First, check if the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Profile check failed in profile view:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          userId: user.id
        })

        // If profile doesn't exist, notifications will fail too
        if (profileError.code === 'PGRST116') { // No rows found
          console.log('Profile not found in profile view for user:', user.id)
          setNotifications([]) // Set empty notifications if no profile
          return
        } else {
          return
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching notifications in profile view:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          userId: user.id,
          error
        })
        return
      }

      console.log('Notifications fetched successfully in profile view:', data?.length || 0, 'notifications')
      setNotifications(data || [])
    } catch (error) {
      console.error('Unexpected error fetching notifications in profile view:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userId: user?.id,
        error
      })
    }
  }

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          phone: profile.phone,
          notifications_enabled: profile.notifications_enabled,
          push_notifications_enabled: profile.local_notifications_enabled
        })
        .eq('user_id', user.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        notificationId,
        error
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "Signed out",
      description: "You have been successfully signed out."
    })
  }

  const handleExport = (type: 'transactions' | 'budget' | 'goals' | 'all') => {
    let csvContent = ''
    let filename = ''

    if (type === 'all') {
      csvContent = 'type,description,amount,category,date,budgeted,spent,month,targetAmount,currentAmount,deadline,goalName\n'

      transactions.forEach(t => {
        csvContent += `transaction,"${t.description}",${t.amount},"${t.category}","${t.date.toISOString().split('T')[0]}",,,,,,,\n`
      })

      budgets.forEach(b => {
        csvContent += `budget,,,${b.category},,${b.budgeted},${b.spent},"${b.month}",,,,,\n`
      })

      goals.forEach(g => {
        csvContent += `goal,,,,,,,,"${g.targetAmount}","${g.currentAmount}","${g.deadline.toISOString().split('T')[0]}","${g.name}"\n`
      })

      filename = 'smartspend-complete-data.csv'
    } else if (type === 'transactions') {
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
    setShowImport(false)
  }

  const menuItems = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data & Privacy", icon: Download },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-4 pb-20 space-y-4">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                  {profile.display_name ? profile.display_name[0]?.toUpperCase() : user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{profile.display_name || 'User'}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Verified</Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card>
          <CardContent className="pt-6">
            {activeSection === "profile" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={profile.notifications_enabled}
                        onCheckedChange={(checked) => setProfile(prev => ({ ...prev, notifications_enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Local Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive local notifications on device</p>
                      </div>
                      <Switch
                        checked={profile.local_notifications_enabled}
                        onCheckedChange={(checked) => setProfile(prev => ({ ...prev, local_notifications_enabled: checked }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleProfileUpdate} className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </h3>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 border rounded-lg ${notification.read ? 'bg-muted/50' : 'bg-background'}`}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
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
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </h3>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your account is secured with Supabase authentication.
                  </p>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "data" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Data & Privacy
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Data Management</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage your financial data and privacy settings.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <FileUp className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                      <Button variant="outline" className="w-full">
                        <FileUp className="mr-2 h-4 w-4" />
                        Import Data
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />

                  <div className="p-4 border border-destructive rounded-lg">
                    <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
