# Authentication System

## Overview

Better Docs includes a complete authentication system for managing user access and project documentation.

## Backend Authentication

### Setup

The authentication system uses `better-auth` with MongoDB:

```typescript
// backend/src/lib/auth.ts
export const auth = betterAuth({
    database: mongodbAdapter(db, { client }),
    plugins: [
        admin({
            defaultRole: 'user',
            adminRoles: ['admin'],
        }),
    ],
    emailAndPassword: {
        enabled: true,
    },
    secret:
        process.env.BETTER_AUTH_SECRET || 'default-secret-change-in-production',
})
```

### Environment Variables

```bash
# Required
MONGODB_URL=mongodb://localhost:27017/your-db
BETTER_AUTH_SECRET=your-secret-key

# Optional
BETTER_AUTH_URL=http://localhost:3000
AUTODOC_ENABLED=true
```

### API Endpoints

#### Register User

```bash
POST /autodoc/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "projectName": "My Project"
}
```

**Response:**

```json
{
    "success": true,
    "message": "User account created successfully",
    "role": "user"
}
```

#### Login

```bash
POST /autodoc/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Login successful",
    "session": "jwt-token-here",
    "user": {
        "id": "user-id",
        "email": "user@example.com",
        "name": "My Project",
        "role": "user"
    }
}
```

## User Roles

### Admin Role

-   **First registered user** automatically becomes admin
-   Can manage other users
-   Full access to all features

### User Role

-   Standard user access
-   Can generate documentation for their projects
-   Limited administrative access

## Integration with Better Docs

### Protected Endpoints

Use the session token in API requests:

```bash
# Example: Generate documentation with authentication
curl -X POST http://localhost:3000/autodoc/generate \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "./my-project"}'
```

### Frontend Integration

```javascript
// Login and store token
const response = await fetch('/autodoc/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
})

const { session } = await response.json()
localStorage.setItem('auth-token', session)

// Use token for authenticated requests
const docsResponse = await fetch('/autodoc/generate', {
    headers: { Authorization: `Bearer ${session}` },
})
```

## Security Features

-   **JWT Tokens**: Secure session management
-   **Password Hashing**: Automatic password encryption
-   **Role-Based Access**: Admin and user permissions
-   **MongoDB Storage**: Scalable user data storage

## Next Steps

-   [Installation Guide](./installation.md)
-   [Configuration Guide](./configuration.md)
-   [Usage Guide](./usage.md)
