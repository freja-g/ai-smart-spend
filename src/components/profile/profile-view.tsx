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
  Download,
  Upload,
  Trash2,
  Save,
  Loader2,
  LogOut
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { clearFinancialData, useFinancialStore, importTransactionsFromCSV, importBudgetFromFile } from "@/store/financial-store"
import { useLocalNotifications } from "@/hooks/use-local-notifications"

interface UserProfile {
  display_name: string
  email: string
  phone: string
  local_notifications_enabled: boolean
}

export function ProfileView() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const { cancelAllNotifications } = useLocalNotifications()

  const [profile, setProfile] = useState<UserProfile>({
    display_name: "",
    email: "",
    phone: "",
    local_notifications_enabled: true
  })

  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("profile")
  const [showImport, setShowImport] = useState(false)
  const { transactions, budgets, goals } = useFinancialStore()

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = () => {
    if (!user) return

    // Load profile from localStorage or use defaults
    const savedProfile = localStorage.getItem(`profile_${user.id}`)

    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        setProfile({
          display_name: parsedProfile.display_name || user.user_metadata?.display_name || "",
          email: user.email || "",
          phone: parsedProfile.phone || "",
          local_notifications_enabled: parsedProfile.local_notifications_enabled ?? true
        })
      } catch (error) {
        console.error('Error loading profile from localStorage:', error)
        setDefaultProfile()
      }
    } else {
      setDefaultProfile()
    }
  }

  const setDefaultProfile = () => {
    if (!user) return

    setProfile({
      display_name: user.user_metadata?.display_name || "",
      email: user.email || "",
      phone: "",
      local_notifications_enabled: true
    })
  }

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Save profile to localStorage
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile))

      // Handle notification settings
      if (!profile.local_notifications_enabled) {
        await cancelAllNotifications()
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
                        <p className="font-medium">Local Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive notifications on your device for budget alerts and goal progress</p>
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
                {notificationsError ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-destructive mb-4" />
                    <p className="text-sm font-medium text-destructive">Failed to load notifications</p>
                    <p className="text-xs mt-1 text-muted-foreground">{notificationsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={fetchNotifications}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : notifications.length === 0 ? (
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
