# Raqam Finance App - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Setup Environment Variables
```bash
npm run setup
```
This will copy `env.template` to `.env`. Edit the `.env` file with your actual values.

### 3. Start Development Servers
```bash
npm run dev
```
This starts both Backend (port 3001) and Frontend (port 3000) simultaneously.

## Available Scripts

### Root Level (from project root)
- `npm run dev` - Start both Backend and Frontend in development mode
- `npm run start` - Start both Backend and Frontend in production mode
- `npm run build` - Build Frontend for production
- `npm run setup` - Copy env.template to .env

### Backend Only
- `npm run dev:backend` - Start Backend in development mode
- `npm run start:backend` - Start Backend in production mode

### Frontend Only
- `npm run dev:frontend` - Start Frontend in development mode
- `npm run start:frontend` - Start Frontend in production mode

## Environment Configuration

The app now uses a **shared `.env` file** in the root directory:

- **Backend**: Loads environment variables using `dotenv/config` with path `../.env`
- **Frontend**: Loads environment variables using `dotenv-cli` with path `../.env`

## File Structure
```
Raqam/
├── .env                    # Shared environment variables (create from env.template)
├── env.template           # Environment template
├── package.json           # Root package.json with convenience scripts
├── Backend/               # Backend application
│   ├── package.json       # Backend dependencies
│   └── src/
├── Frontend/              # Frontend application
│   ├── package.json       # Frontend dependencies
│   └── app/
└── .gitignore            # Ignores .env files
```

## Development Workflow

1. **First time setup:**
   ```bash
   npm run install:all
   npm run setup
   # Edit .env file with your values
   ```

2. **Daily development:**
   ```bash
   npm run dev
   ```

3. **Production build:**
   ```bash
   npm run build
   npm run start
   ```

## Troubleshooting

### Environment variables not loading
- Ensure `.env` file exists in root directory
- Check that `.env` file has correct format (no spaces around `=`)
- Verify file paths in package.json scripts

### Port conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- Check if ports are available or change in `.env`

### Dependencies issues
- Run `npm run install:all` to install all dependencies
- Clear `node_modules` and reinstall if needed
