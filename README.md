# UBrary - University of Batangas Repository

A comprehensive digital repository system for managing and accessing academic theses and capstone projects.

## Features

- **Document Management**: Upload, review, and publish academic works
- **Role-based Access**: Student, Faculty, Librarian, and Admin roles
- **Workflow System**: Structured submission and approval process
- **Advanced Search**: Filter by program, year, keywords, and more
- **Modern UI**: Responsive design with intuitive interface

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   cp env.example .env.local
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Database Setup

Run the SQL files in the `supabase/` directory in your Supabase dashboard:

1. `schema.sql` - Main database schema
2. `functions.sql` - Database functions
3. `workflow_schema.sql` - Workflow management

## Project Structure

```
src/
├── components/     # UI components
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── lib/            # Utilities and configurations
├── services/       # API services
└── types/          # TypeScript definitions
```

## University of Batangas

Educational Excellence
