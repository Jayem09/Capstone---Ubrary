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

## User Roles & Permissions

### Students

- Search and browse approved academic works
- View and download published documents
- Upload thesis/capstone projects to assigned advisers
- Track submission status through workflow stages

### Faculty/Advisers

- Review student submissions
- Approve, reject, or request revisions with feedback
- Manage assigned student documents
- Access workflow dashboard for oversight

### Library Staff

- Perform quality control and metadata enhancement
- Curate documents using Dublin Core standards
- Manage digital preservation standards (PDF/A)
- Oversee final publication process

### Administrators

- System configuration and user management
- Analytics and reporting dashboard
- Role assignment and permission management
- System maintenance and monitoring

## Workflow Process

The UBrary system follows a structured 4-step submission workflow:

### Step 1: Student Submission

- Students upload thesis/capstone with metadata
- Documents are automatically assigned to designated advisers
- Initial metadata capture and file validation

### Step 2: Adviser Review

- Faculty review submissions for academic quality
- Can approve, reject, or request revisions
- Provide detailed feedback and comments
- Track revision cycles

### Step 3: Library Curation

- Library staff perform quality checks
- Enhance metadata using Dublin Core standards
- Ensure digital preservation compliance
- Validate document formatting and accessibility

### Step 4: Publication

- Approved works become searchable and accessible
- Full-text indexing for comprehensive search
- Public access with proper attribution
- Digital preservation with checksums and backups

## Key Features

### Document Management

- **Upload System**: Drag-and-drop interface with progress tracking
- **PDF Viewer**: In-browser viewing with annotation support
- **Version Control**: Track document revisions and changes
- **Metadata Management**: Comprehensive Dublin Core metadata schema

### Search & Discovery

- **Advanced Search**: Multi-faceted search with filters
- **Full-text Search**: Search within document content
- **Faceted Browsing**: Filter by program, year, author, subject
- **Starred Documents**: Personal bookmark system

### Digital Preservation

- **PDF/A Standards**: Long-term preservation format compliance
- **Checksum Validation**: File integrity verification
- **Automated Backups**: Regular system backups
- **Metadata Standards**: Dublin Core compliance

### Integration

- **Single Sign-On (SSO)**: University authentication system
- **Ubian LMS Integration**: Seamless learning management system connection
- **API Access**: RESTful API for external integrations

## Environment Configuration

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup Instructions

For complete database setup, run the following SQL files in order:

1. **Core Schema**: `supabase/complete_database_setup.sql`
2. **Authentication Fix**: `supabase/COMPREHENSIVE_AUTH_FIX.sql`
3. **Workflow Functions**: `supabase/FIX_FACULTY_WORKFLOW.sql`
4. **Search Implementation**: `supabase/COMPREHENSIVE_SEARCH_FUNCTION.sql`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed for the University of Batangas as part of academic requirements.

## Support

For support and questions, please contact the development team or refer to the project documentation.

---

## University of Batangas

**Educational Excellence Through Innovation**

This repository system supports the University of Batangas' commitment to preserving and sharing academic knowledge, enabling students, faculty, and researchers to contribute to and access the institution's scholarly works.
