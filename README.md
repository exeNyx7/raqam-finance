# Raqam - Collaborative Finance Management App

A modern, full-stack collaborative finance management application with personal and shared financial tracking capabilities.

## Project Structure

```
raqam-finance/
├── Backend/          # Node.js/Express API server
├── Frontend/         # Next.js React application
└── README.md        # This file
```

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with refresh tokens
- **Security**: bcryptjs for password hashing

### Frontend
- **Framework**: Next.js 14 with TypeScript and App Router
- **UI**: Radix UI components with Tailwind CSS
- **State Management**: React Context API
- **API Client**: Custom API client with automatic token refresh

## Features

- **Personal & Shared Ledgers**: Manage personal finances and collaborate with others
- **Budget Management**: Set and track budgets with real-time monitoring
- **Goal Tracking**: Set financial goals and track progress
- **Bill Splitting**: Split bills with friends and track payments
- **Recurring Transactions**: Automated recurring income/expense tracking
- **Reports & Analytics**: Comprehensive financial insights and reporting
- **Secure Authentication**: JWT-based user authentication
- **Real-time Collaboration**: Multi-user financial tracking

## Quick Start

### 1. Environment Setup

#### Backend Environment
Create `Backend/.env` file:
```bash
cp Backend/.env.example Backend/.env
```

Edit the `.env` file with your configurations:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/raqam-finance

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-this-in-production

# Development Seed Configuration (optional)
DEV_SEED_KEY=dev-seed-key-for-testing
```

#### Frontend Environment
Create `Frontend/.env.local` file:
```bash
cp Frontend/.env.example Frontend/.env.local
```

Edit the `.env.local` file:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Database Setup

Make sure MongoDB is running on your system:
- **Windows**: Install MongoDB Community Server
- **macOS**: `brew install mongodb-community`
- **Linux**: Follow MongoDB installation guide for your distribution

Start MongoDB:
```bash
# Windows (if installed as service, it should start automatically)
net start MongoDB

# macOS/Linux
mongod
```

### 3. Install Dependencies

#### Backend
```bash
cd Backend
npm install
```

#### Frontend
```bash
cd Frontend
npm install
# or
pnpm install
```

### 4. Run the Application

#### Start Backend (Terminal 1)
```bash
cd Backend
npm run dev
```
Backend will be available at `http://localhost:5000`

#### Start Frontend (Terminal 2)
```bash
cd Frontend
npm run dev
```
Frontend will be available at `http://localhost:3000`

### 5. Development Seed Data (Optional)

To populate the database with sample data for development:

```bash
# Make a POST request to the dev seed endpoint
curl -X POST http://localhost:5000/api/dev/seed \
  -H "Content-Type: application/json" \
  -d '{"key": "dev-seed-key-for-testing"}'
```

## API Documentation

The backend provides a RESTful API with the following main endpoints:

- **Authentication**: `/api/auth/*`
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/refresh` - Refresh access token
  - `GET /api/auth/me` - Get current user

- **Transactions**: `/api/transactions/*`
- **Budgets**: `/api/budgets/*`
- **Goals**: `/api/goals/*`
- **Ledgers**: `/api/ledgers/*`
- **Bills**: `/api/bills/*`
- **Recurring**: `/api/recurrings/*`
- **Analytics**: `/api/analytics/*`
- **People**: `/api/people/*`
- **Notifications**: `/api/notifications/*`

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/raqam-finance` | Yes |
| `PORT` | Server port | `5000` | Yes |
| `NODE_ENV` | Environment mode | `development` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | Yes |
| `JWT_SECRET` | JWT access token secret | - | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - | Yes |
| `DEV_SEED_KEY` | Development seed protection key | - | No |

### Frontend (.env.local)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` | Yes |

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong, unique JWT secrets
3. Configure production MongoDB instance
4. Set appropriate CORS origins
5. Use environment variables for all secrets

### Frontend
1. Update `NEXT_PUBLIC_API_URL` to production backend URL
2. Build the application: `npm run build`
3. Deploy using your preferred platform (Vercel, Netlify, etc.)

## Development Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.