# Halfway Meet Web App

## Overview

Halfway Meet is a delightful, UX-first web application designed to help two or more people find the perfect meeting point between their locations. The app calculates geographic midpoints and suggests nearby venues like restaurants, cafés, parks, and trails to make meeting up simple and enjoyable. Built with a modern full-stack architecture, it offers both quick anonymous sessions and collaborative planning features with optional premium functionality through Stripe integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a React Single Page Application (SPA) using modern tooling:
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Component Structure**: Modular component architecture with reusable UI components

### Backend Architecture
The backend follows a RESTful API pattern with Express.js:
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints for plans, venues, and participant management
- **Middleware**: Custom logging and error handling middleware
- **Services Layer**: Separated business logic for places/geocoding and midpoint calculations

### Data Storage Solutions
The application uses PostgreSQL as its primary database:
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version control of database changes
- **Data Models**: Users (optional auth), Plans (meeting sessions), and Venues (cached location data)
- **Connection**: Connection pooling with @neondatabase/serverless for optimal performance

### Authentication and Authorization
The system is designed with flexible authentication:
- **Anonymous Usage**: Primary flow allows usage without sign-up for quick meeting planning
- **Optional Authentication**: User accounts for saving favorites, meeting history, and collaborative features
- **Session Management**: Plan-based sessions that can be shared via URLs
- **Access Control**: Public plans by default with private plan options for authenticated users

### External Service Integrations
The application integrates with several third-party services:
- **Google Places API**: Geocoding addresses, searching nearby venues, and retrieving detailed venue information
- **Maps Integration**: Deep-linking to Apple Maps and Google Maps for navigation
- **OpenTable**: Deep-linking for restaurant reservations
- **Stripe**: Payment processing for premium features (collaborative rooms, advanced filters, booking assistance)
- **Maps Display**: Placeholder for future Google Maps or Leaflet integration for interactive map visualization

The architecture prioritizes simplicity and user experience, with the ability to handle both quick anonymous sessions and more sophisticated collaborative planning workflows.

## External Dependencies

- **Google Places API**: Core service for address geocoding and venue discovery
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Stripe**: Payment processing for premium subscription features
- **OpenTable**: Restaurant reservation deep-linking service
- **Replit**: Development environment integration with custom Vite plugins
- **shadcn/ui**: Comprehensive React component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TanStack React Query**: Server state management and data fetching library
- **Drizzle ORM**: Type-safe TypeScript ORM for PostgreSQL operations