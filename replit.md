# Prachi's Personal Dashboard

## Overview

This is a romantic personal dashboard web application built with Flask and frontend technologies. The application serves as a personalized interface for Prachi, featuring time displays, weather information, special date countdowns, and customizable backgrounds. It's designed with a romantic theme using pink and gold color schemes with glass-morphism UI effects.

## User Preferences

Preferred communication style: Simple, everyday language.

## Personal Details
- Her name: Prachi
- His name: Deep
- Special dates for annual countdown (with original years):
  - First Talk: September 22, 2023
  - Prachi's Birthday: January 6, 2004
  - Deep's Birthday: September 29, 2004
  - Expressed Feelings: November 8, 2023
  - Proposal Day: November 24, 2023
  - First Met: November 15, 2023
  - First Kiss: May 5, 2024

## Technical Requirements
- Live weather using user's device location (OpenWeather API)
- Background photo upload functionality
- Annual recurring countdown system (automatically switches to next upcoming date)
- To-do list with localStorage persistence

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Server**: Development server with debug mode enabled
- **Deployment**: Configured for hosting on 0.0.0.0:5000 with proxy support
- **Session Management**: Basic session handling with secret key configuration

### Frontend Architecture
- **Template Engine**: Jinja2 (Flask's default)
- **CSS Framework**: Bootstrap 5.3.0 for responsive design
- **Icons**: Font Awesome 6.4.0 for iconography
- **Fonts**: Google Fonts (Poppins and Dancing Script)
- **JavaScript**: Vanilla ES6 classes for dashboard functionality

## Key Components

### 1. Main Application (app.py)
- **Purpose**: Core Flask application with routing and file upload handling
- **Key Routes**:
  - `/` - Serves the main dashboard
  - `/upload-photo` - Handles background photo uploads
  - `/static/<path:filename>` - Serves static assets

### 2. Dashboard Interface (templates/index.html)
- **Structure**: Single-page application with responsive grid layout
- **Features**: Greeting card, weather display, countdown timers, task management
- **Design**: Glass-morphism effects with romantic color scheme

### 3. Styling System (static/css/style.css)
- **Theme**: Custom CSS variables for consistent theming
- **Effects**: Glass-morphism cards, gradient backgrounds, smooth transitions
- **Responsiveness**: Mobile-first responsive design approach

### 4. Interactive Features (static/js/dashboard.js)
- **Class-based Architecture**: `RomanticDashboard` class managing all functionality
- **Real-time Updates**: Time display, countdowns, and greeting updates
- **Special Dates**: Hardcoded anniversary and birthday tracking
- **Background Management**: Rotating background images from Unsplash

## Data Flow

### 1. Initial Load
1. Flask serves the main template with embedded CSS/JS
2. JavaScript initializes the dashboard class
3. Time, weather, and countdown information is loaded
4. Background images are set and rotated

### 2. Photo Upload Flow
1. User selects photo via file input
2. AJAX request sent to `/upload-photo` endpoint
3. Flask validates file type and processes upload
4. Success/error response returned to frontend

### 3. Real-time Updates
- Time updates every second
- Countdowns recalculate every second
- Greeting messages update every minute
- Background images rotate automatically

## External Dependencies

### Frontend Libraries
- **Bootstrap 5.3.0**: UI components and responsive grid
- **Font Awesome 6.4.0**: Icon library
- **Google Fonts**: Typography (Poppins, Dancing Script)

### Backend Dependencies
- **Flask**: Web framework
- **Werkzeug**: WSGI utilities (ProxyFix middleware)

### External Services
- **Unsplash**: Background image sources
- **OpenWeather API**: Weather data (API key required)

## Deployment Strategy

### Current Configuration
- **Development Mode**: Debug enabled for local development
- **Host Configuration**: Bound to 0.0.0.0 for container compatibility
- **Proxy Support**: ProxyFix middleware for reverse proxy deployments
- **Environment Variables**: Session secret and API keys via environment

### File Structure
```
/
├── app.py              # Main Flask application
├── main.py             # Application entry point
├── templates/
│   └── index.html      # Main dashboard template
└── static/
    ├── css/
    │   └── style.css   # Custom styling
    └── js/
        └── dashboard.js # Frontend functionality
```

### Security Considerations
- File upload validation for image types only
- Session secret key configuration
- CSRF protection should be added for production
- API key management needs environment variable integration

### Production Readiness
- Photo upload functionality is stubbed (needs file storage implementation)
- Weather API key needs proper environment variable integration
- HTTPS configuration recommended
- Static file serving should use dedicated web server in production
- Database integration may be needed for persistent data storage