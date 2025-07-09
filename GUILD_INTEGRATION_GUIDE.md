# Guild Frontend-Backend Integration Guide

## Overview

The PeerQuest guild system has been successfully connected between the Django backend and Next.js frontend. This document explains how the integration works and how to test it.

## Integration Architecture

### Backend (Django REST API)
- **Models**: `guilds/models.py` - Guild, GuildMembership, GuildJoinRequest
- **API Views**: `guilds/views.py` - Full CRUD operations for guilds
- **Serializers**: `guilds/serializers.py` - Data serialization for API responses
- **URLs**: `guilds/urls.py` - Guild API endpoints
- **Database**: SQLite with proper guild schema

### Frontend (Next.js/React)
- **API Client**: `lib/api/guilds.ts` - HTTP client for guild operations
- **React Hooks**: `hooks/useGuilds.ts` - State management and API integration
- **Components**: `components/guilds/` - UI components for guild functionality
- **Types**: `lib/types.ts` - TypeScript interfaces matching backend models
- **Pages**: `app/guilds/page.tsx` - Dedicated guild page with full API integration

## Key Features Implemented

### Backend API Endpoints
```
GET    /api/guilds/                    # List all guilds
POST   /api/guilds/create/             # Create new guild
GET    /api/guilds/{id}/               # Get guild details
PUT    /api/guilds/{id}/update/        # Update guild
DELETE /api/guilds/{id}/delete/        # Delete guild
GET    /api/guilds/my-guilds/          # User's guilds
GET    /api/guilds/{id}/members/       # Guild members
POST   /api/guilds/{id}/join/          # Join guild request
POST   /api/guilds/{id}/leave/         # Leave guild
GET    /api/guilds/{id}/join-requests/ # Guild join requests
POST   /api/guilds/{id}/join-requests/{req_id}/process/ # Process join request
POST   /api/guilds/{id}/kick/{user_id}/ # Kick member
```

### Frontend Integration
- **Guild Display**: Real-time guild list from backend API
- **Guild Creation**: Form submission to backend with file upload support
- **Guild Joining**: Join request system with message submission
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Loading indicators during API calls
- **Type Safety**: Full TypeScript integration with backend data models

## How to Test the Integration

### 1. Start Both Servers

**Backend (Django):**
```bash
cd PeerQuestBackEnd
python manage.py runserver
# Server runs at http://localhost:8000
```

**Frontend (Next.js):**
```bash
cd PeerQuestFrontEnd
npm run dev
# Server runs at http://localhost:3000
```

### 2. Test API Endpoints Directly

Visit these URLs in your browser to test the backend:

- **Guild List**: http://localhost:8000/api/guilds/
- **API Root**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/ (if superuser created)

### 3. Test Frontend Integration

Visit these URLs to test the frontend:

- **Main App**: http://localhost:3000/
- **Dedicated Guild Page**: http://localhost:3000/guilds

### 4. Test Guild Operations

1. **View Guilds**: The guild page should load and display guilds from the backend
2. **Create Guild**: Click "Create a Guild" to open the modal and submit a new guild
3. **Join Guild**: Click "JOIN GUILD" on any guild card to submit a join request
4. **Error Handling**: Test with invalid data to see error messages

## Data Flow

### Guild Creation Flow
```
1. User fills form in EnhancedCreateGuildModal
2. Form data processed in handleGuildSubmit
3. Data sent to createGuild API function
4. HTTP POST to /api/guilds/create/
5. Django creates guild in database
6. Response sent back to frontend
7. Guild list refreshed via refetchGuilds()
8. UI updated with new guild
```

### Guild Joining Flow
```
1. User clicks "JOIN GUILD" button
2. handleApplyForGuild called with guild ID and message
3. joinGuild API function called
4. HTTP POST to /api/guilds/{id}/join/
5. Django creates GuildJoinRequest
6. Response sent back to frontend
7. Guild list refreshed to show updated status
8. Success/error message displayed
```

## Configuration

### Environment Variables
The frontend uses these environment variables for API configuration:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Authentication
The system expects JWT tokens stored in localStorage or sessionStorage:
- Key: `authToken` or `sessionToken`
- Format: `Bearer {token}`

## File Structure

### Backend Files
```
PeerQuestBackEnd/
├── guilds/
│   ├── models.py              # Guild data models
│   ├── views.py               # API views and logic
│   ├── serializers.py         # Data serialization
│   ├── urls.py                # URL routing
│   ├── admin.py               # Admin interface
│   └── tests.py               # Test cases
├── core/
│   ├── settings.py            # Django settings
│   └── urls.py                # Main URL config
└── manage.py                  # Django management
```

### Frontend Files
```
PeerQuestFrontEnd/
├── app/
│   ├── guilds/
│   │   └── page.tsx           # Dedicated guild page
│   └── page.tsx               # Main app (legacy)
├── components/
│   └── guilds/
│       ├── guild-hall.tsx     # Main guild display
│       ├── enhanced-create-guild-modal.tsx
│       └── other guild components...
├── hooks/
│   └── useGuilds.ts           # Guild state management
├── lib/
│   ├── api/
│   │   └── guilds.ts          # API client functions
│   └── types.ts               # TypeScript definitions
└── next.config.mjs
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Django CORS settings allow frontend domain
2. **API Not Found**: Check if Django server is running on port 8000
3. **Authentication Errors**: Verify JWT token is properly stored and sent
4. **Type Errors**: Check if frontend types match backend data structure

### Debug Steps

1. **Check Network Tab**: Monitor API calls in browser dev tools
2. **Backend Logs**: Check Django console for error messages
3. **Frontend Console**: Check browser console for JavaScript errors
4. **Database**: Use Django admin to verify data is being created

### Database Reset (if needed)
```bash
cd PeerQuestBackEnd
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

## Next Steps

### Recommended Enhancements

1. **Authentication Integration**: Connect with your existing auth system
2. **Real-time Updates**: Add WebSocket support for live guild updates
3. **File Upload**: Complete custom emblem upload functionality
4. **Advanced Features**: Add guild quests, member roles, and permissions
5. **Testing**: Add comprehensive frontend and backend test suites

### Production Deployment

1. **Environment Setup**: Configure production environment variables
2. **Database Migration**: Move from SQLite to PostgreSQL/MySQL
3. **Static Files**: Configure proper static file serving
4. **Security**: Add proper authentication and authorization
5. **Performance**: Add caching and optimization

## Conclusion

The guild system is now fully integrated between backend and frontend. The dedicated guild page at `/guilds` provides a clean interface for testing and development. The system supports all basic guild operations and is ready for further enhancement based on your specific requirements.

For testing, use the `/guilds` page as it has the most up-to-date integration with proper error handling and loading states.
