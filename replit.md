# Overview

This is a race registration system built as a full-stack web application. The system provides a public registration interface for runners to sign up for races and an administrative panel for managing registrations and payment statuses. The application features a premium, minimalist design using a black and yellow color scheme with Apple-inspired aesthetics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with two main routes (registration and admin)
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **State Management**: TanStack Query for server state management and React Hook Form for form handling
- **Form Validation**: Zod schemas for type-safe validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions for admin authentication
- **API Design**: RESTful endpoints with proper HTTP status codes
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage Solutions
- **ORM**: Drizzle ORM for type-safe database interactions
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Development Storage**: In-memory storage for development/testing

## Authentication and Authorization
- **Admin Authentication**: Simple session-based authentication
- **Credentials**: Hardcoded admin credentials (username: "john", password: "batata123")
- **Session Storage**: Express sessions with configurable storage
- **Route Protection**: Middleware-based protection for admin endpoints

## Key Features
- **Registration System**: Public form for runner registration with automatic bib number generation (1-999)
- **Admin Panel**: Protected dashboard for managing registrations and payment statuses
- **Search Functionality**: Search registrants by name or bib number
- **Data Export**: CSV export functionality for registration data
- **Payment Tracking**: Status management (pendente/confirmado) for payment processing

## Design System
- **Color Palette**: Black (#0b0b0b) and yellow (#FFD400) for premium branding
- **Typography**: System fonts (-apple-system, system-ui, etc.) for native feel
- **Components**: Reusable UI components with consistent spacing and styling
- **Responsive Design**: Mobile-first approach with responsive breakpoints

# External Dependencies

## Database
- Neon PostgreSQL serverless database
- Connection via DATABASE_URL environment variable

## UI Libraries
- Radix UI primitives for accessible component foundation
- shadcn/ui component library for consistent design patterns
- Lucide React for iconography

## Development Tools
- Vite for fast development and building
- ESBuild for server-side bundling
- TypeScript for type safety across the stack

## Form Management
- React Hook Form for form state management
- Hookform resolvers for validation integration
- Zod for schema validation and type inference

## Styling
- Tailwind CSS for utility-first styling
- PostCSS for CSS processing
- Custom CSS variables for theming

## Date Handling
- date-fns for date formatting and manipulation

## Session Management
- express-session for server-side session handling
- connect-pg-simple for PostgreSQL session storage (when database is configured)