# WordPress-like CMS with Next.js

A modern, production-ready Content Management System built with Next.js, TypeScript, Tailwind CSS, Prisma, and MySQL.

## Features

- 🔐 **Secure Admin Authentication** - Single admin login with NextAuth.js
- ✏️ **WYSIWYG Editor** - Rich text editing with TipTap
- 📝 **Posts & Pages Management** - Create, edit, and delete content
- 🏷️ **Categories & Tags** - Organize content effectively
- 🔍 **SEO Optimization** - Meta titles, descriptions, and slug-based routing
- 📱 **Responsive Design** - Beautiful UI with Tailwind CSS
- ⚡ **Fast Performance** - Built on Next.js 15 with TypeScript
- 🗄️ **MySQL Database** - Reliable data storage with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MySQL with Prisma ORM
- **Editor**: TipTap (WYSIWYG)
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ 
- MySQL server running locally
- npm or yarn package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Dependencies are already installed
# If you need to reinstall: npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/wone"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# Admin Credentials (change these in production)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### 3. Database Setup

```bash
# Create the database (make sure MySQL is running)
# Create database 'wone' in your MySQL server

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Admin Access

- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@example.com`
- **Password**: `admin123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   ├── posts/           # Public post pages
│   └── page.tsx         # Homepage
├── components/          # Reusable components
├── lib/                 # Utility functions and configurations
├── prisma/              # Database schema and migrations
├── scripts/             # Database seeding scripts
└── types/               # TypeScript type definitions
```

## Production Deployment

### 1. Environment Variables

Update your production `.env` file:

```env
DATABASE_URL="your-production-mysql-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secure-secret-key"
ADMIN_EMAIL="your-admin-email"
ADMIN_PASSWORD="your-secure-password"
```

### 2. Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### 3. Database Migration

```bash
# Run migrations in production
npm run db:migrate

# Seed production database (optional)
npm run db:seed
```

## Usage Guide

### Creating Posts

1. Login to admin panel at `/admin`
2. Navigate to "Posts" → "Add New Post"
3. Fill in title, content, SEO fields
4. Select categories and tags
5. Set publication status
6. Click "Create Post"

### Managing Categories & Tags

- Create categories to organize your content
- Add tags for better content discovery
- View usage statistics in the admin panel

### SEO Optimization

- Set custom meta titles and descriptions
- URLs are automatically generated from titles
- All pages include proper meta tags

## Troubleshooting

### Database Connection Issues

1. Ensure MySQL server is running
2. Verify database credentials in `.env`
3. Check if database `wone` exists
4. Run `npm run db:push` to sync schema

### Authentication Issues

1. Verify `NEXTAUTH_SECRET` is set
2. Check admin credentials in database
3. Clear browser cookies and try again

### Build Errors

1. Run `npm run lint` to check for errors
2. Ensure all dependencies are installed
3. Check TypeScript errors: `npx tsc --noEmit`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions, please create an issue in the GitHub repository.
