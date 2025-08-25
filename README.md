# Admin User Management Setup

## Overview

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Page secret for accessing the admin management page
ADMIN_PAGE_SECRET=your_secure_page_secret_here

# Auth secret for validating admin API operations
ADMIN_AUTH_SECRET=your_secure_auth_secret_here
```

## Setup by creating first batch of admin users

### Admin Management Page (`/admin-manage`)

The admin management page provides the following functionality:

1. **Page Access Control**
   - Protected by `ADMIN_PAGE_SECRET` environment variable
   - Must enter correct page secret to access the interface

2. **User Management Functions** (all require `ADMIN_AUTH_SECRET`):
   - **Create Users**: Create new admin user accounts
   - **Update Passwords**: Change passwords for existing users
   - **Toggle Activation**: Activate or deactivate user accounts (preserves data)
   - **List Users**: View all admin users in the system with activation status

## User Management Approach

This system uses **user deactivation** instead of permanent deletion for better data integrity:

- **Deactivated users** cannot log in but their data is preserved
- Uses `user_metadata.is_active` field to control access
- Maintains referential integrity across the database
- Allows for user reactivation if needed
- Provides audit trail with deactivation timestamps

## Authentication & Authorization

The system implements comprehensive access control for deactivated users:

1. **Login-time Validation**: 
   - Users are checked for activation status immediately after authentication
   - Deactivated users are signed out and shown an error message

2. **Middleware Protection**:
   - All routes are protected by middleware that checks user activation status
   - Deactivated users are automatically signed out and redirected to login
   - Prevents access to any protected routes

3. **Session Management**:
   - Active sessions of deactivated users are automatically terminated
   - Real-time protection across all application routes

## Usage

1. Set up environment variables in `.env.local`
2. Navigate to `/admin-manage`
3. Enter the page secret to access the admin panel
4. Enter the auth secret to enable user management operations
5. Use the interface to create, update, or delete admin users