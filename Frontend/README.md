# Raqam - Collaborative Finance Management App

A modern, cloud-synced collaborative finance management application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Personal & Shared Ledgers**: Manage personal finances and collaborate with others
- **Budget Management**: Set and track budgets with real-time monitoring
- **Goal Tracking**: Set financial goals and track progress
- **Bill Splitting**: Split bills with friends and track payments
- **Reports & Analytics**: Comprehensive financial insights and reporting
- **Real-time Collaboration**: Live updates across all devices
- **Secure Authentication**: User authentication and authorization

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React Context API with useReducer
- **Authentication**: Custom auth context (ready for Supabase integration)
- **API Layer**: Comprehensive service layer with error handling
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd raqam-finance-app
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Run the development server
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contexts/             # React contexts
├── lib/                  # Utilities and API services
│   └── api/              # API service layer
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
\`\`\`

## API Integration

The app includes a comprehensive API service layer located in `lib/api/` with:

- **Authentication Service**: Login, register, profile management
- **Transaction Service**: CRUD operations for transactions
- **Ledger Service**: Manage personal and shared ledgers
- **Budget Service**: Budget creation and tracking
- **Goal Service**: Financial goal management
- **Bill Service**: Bill splitting and payment tracking
- **Notification Service**: Real-time notifications
- **Analytics Service**: Financial reports and insights

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

\`\`\`bash
npm run build
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
