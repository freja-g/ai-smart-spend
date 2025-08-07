# SmartSpend - Personal Finance Tracker

A comprehensive personal finance management application built with React, TypeScript, and Supabase. Track expenses, manage budgets, set savings goals, and gain insights into your financial habits.

## 🚀 Features

### 💰 Financial Management
- **Transaction Tracking**: Record income and expenses with categories and dates
- **Budget Management**: Set monthly budgets and track spending by category
- **Savings Goals**: Create and monitor progress towards financial goals
- **Smart Notifications**: Automatic alerts for budget limits and goal milestones

### 📊 Data & Analytics
- **Financial Dashboard**: Visual overview of your financial health
- **Spending Charts**: Interactive charts showing spending patterns
- **Trends Analysis**: Track financial trends over time
- **Category Insights**: Detailed breakdown of spending by category

### 🔄 Import/Export
- **CSV Import**: Import transactions and budgets from CSV files
- **Data Export**: Export all financial data to CSV format
- **Flexible Formats**: Support for various CSV structures

### 📱 Mobile Ready
- **Responsive Design**: Optimized for mobile and tablet devices
- **Android App**: Built with Capacitor for native Android deployment
- **Push Notifications**: Real-time alerts for important financial events

### 🔐 Security & Authentication
- **User Authentication**: Secure signup/login with Supabase Auth
- **Data Privacy**: Row-level security ensures users only see their own data
- **Profile Management**: Customizable user profiles and preferences

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn-ui components
- **Backend**: Supabase (Database, Auth, Real-time)
- **State Management**: Zustand with persistence
- **Mobile**: Capacitor for native Android/iOS apps
- **Charts**: Recharts for data visualization

## 📦 Installation & Setup

### Web Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd smartspend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Android Development

```bash
# Install dependencies
npm install

# Add Android platform
npx cap add android

# Build the web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

**Prerequisites for Android:**
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

### Database Setup

The app uses Supabase for backend services. The database includes:

- **Users & Profiles**: User authentication and profile management
- **Transactions**: Financial transaction records
- **Budget Items**: Monthly budget allocations by category
- **Savings Goals**: Financial goals with progress tracking
- **Notifications**: System-generated alerts and messages

## 🚀 Deployment

### Web Deployment
Deploy directly from Lovable by clicking Share → Publish, or deploy to your preferred hosting platform.

### Android Deployment
Build the APK/AAB in Android Studio for distribution via Google Play Store or direct installation.

## 🔧 Development Workflow

### Making Changes
1. **Via Lovable**: Visit the [Lovable Project](https://lovable.dev/projects/e5458f28-a63f-4085-9b73-487964bf1e9e) and use AI assistance
2. **Local Development**: Clone repo, make changes, and push to sync with Lovable
3. **Mobile Updates**: After changes, run `npm run build && npx cap sync android`

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npx cap sync         # Sync changes to mobile platforms
npx cap run android  # Run on Android device/emulator
```

## 📊 Features Overview

### Dashboard
- Financial overview with income, expenses, and balance
- Quick action buttons for common tasks
- Recent transactions and spending insights
- Budget alerts and goal progress

### Expense Tracking
- Add/edit/delete transactions
- Categorize expenses and income
- Date-based filtering and search
- Bulk operations and CSV import

### Budget Management
- Set monthly budgets by category
- Real-time spending tracking
- Visual progress indicators
- Automatic overspending alerts

### Savings Goals
- Create multiple savings goals
- Track progress with visual indicators
- Set target amounts and deadlines
- Achievement notifications

### Profile & Settings
- User profile management
- Notification preferences
- Data export/import options
- Account security settings

## 🔐 Security Features

- **Row-Level Security**: Database policies ensure data privacy
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Client and server-side validation
- **HTTPS Only**: Secure data transmission
- **Regular Security Audits**: Automated security linting

## 📱 Mobile Features

- **Native Performance**: Capacitor provides native app experience
- **Offline Support**: Core features work without internet
- **Push Notifications**: Real-time alerts for financial events
- **Touch Optimized**: Mobile-first UI design
- **App Store Ready**: Build process for distribution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is built with Lovable and follows standard web development practices.

## 🆘 Support

- **Documentation**: [Lovable Docs](https://docs.lovable.dev/)
- **Community**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Project URL**: https://lovable.dev/projects/e5458f28-a63f-4085-9b73-487964bf1e9e

---

**Built with ❤️ using Lovable - The AI-powered web development platform**
