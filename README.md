# Fujitsu Fraud Ring Detection System

A comprehensive fraud detection and investigation platform built with React, TypeScript, and Tailwind CSS. This system is designed to detect, analyze, and investigate fraud rings with advanced analytics and network visualization.

## 🎯 Features

### Core Functionality
- **Fraud Ring Detection**: Identify connected fraud patterns and suspicious relationships
- **Network Explorer**: Visualize fraud rings and connections in an interactive network graph
- **Alert Management**: Real-time alerts and notifications for suspicious activities
- **Audit Logging**: Complete audit trail for compliance and investigation purposes
- **Detection Rules**: Create and manage custom fraud detection rules

### Dashboard & Analytics
- **Dashboard**: Real-time overview of system metrics and fraud statistics
- **Model Analytics**: Performance metrics and model accuracy tracking
- **Insights**: AI-powered insights and trend analysis
- **System Activity**: Monitor system health and performance

### Investigation & Management
- **Investigations**: Create and manage fraud investigations
- **Transactions**: Detailed transaction analysis and history
- **Accounts**: Account management and risk assessment
- **Users**: User management and permissions
- **Team Overview**: Team collaboration and activity monitoring
- **Settings**: System configuration and preferences

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Build Tool**: Vite
- **State Management**: React Context API
- **Authentication**: Custom Auth Context

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── AppShell.tsx    # Main app shell/layout
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication context
├── data/               # Mock data and constants
│   └── mockData.ts     # Sample data for development
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── FraudRingsPage.tsx
│   ├── NetworkExplorerPage.tsx
│   ├── InvestigationsPage.tsx
│   ├── AlertsPage.tsx
│   ├── TransactionsPage.tsx
│   ├── AccountsPage.tsx
│   ├── UsersPage.tsx
│   ├── DetectionRulesPage.tsx
│   ├── ModelAnalyticsPage.tsx
│   ├── AuditLogPage.tsx
│   ├── InsightsPage.tsx
│   ├── TeamOverviewPage.tsx
│   ├── SystemActivityPage.tsx
│   ├── RingDetailPage.tsx
│   ├── SettingsPage.tsx
│   └── LandingPage.tsx
├── assets/             # Images and static files
├── App.tsx             # Main App component
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── style.css           # Additional styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nidhi071113/Fujitsu-Fraudring-project.git
cd Fujitsu-Fraudring-project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 📝 Configuration

### Tailwind CSS
Configuration file: `tailwind.config.js`

### TypeScript
Configuration file: `tsconfig.json`

### PostCSS
Configuration file: `postcss.config.js`

## 🔐 Authentication

The application includes a custom authentication context (`AuthContext.tsx`) for managing user sessions and authentication state.

## 📊 Mock Data

Development data is provided in `src/data/mockData.ts` for testing and development purposes.

## 🎨 Styling

The project uses Tailwind CSS for styling with a utility-first approach. All styles are defined in:
- `src/index.css` - Global styles
- `src/style.css` - Additional component styles
- Component-level Tailwind classes

## 🧪 Testing & Quality

- Run linting: `npm run lint`
- Format code: `npm run format`

## 📦 Dependencies

Key dependencies include:
- React 18
- TypeScript
- Tailwind CSS
- Vite

For complete list, see `package.json`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary and confidential.

## 🔗 Links

- GitHub Repository: [https://github.com/nidhi071113/Fujitsu-Fraudring-project](https://github.com/nidhi071113/Fujitsu-Fraudring-project)

## 📞 Support

For issues, bug reports, or feature requests, please open an issue on GitHub.

---

**Last Updated**: October 30, 2026
