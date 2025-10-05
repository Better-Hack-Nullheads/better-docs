# Examples

## Express.js Project

### Project Structure

```
my-express-app/
├── src/
│   ├── routes/
│   │   ├── users.ts
│   │   └── products.ts
│   ├── controllers/
│   │   ├── userController.ts
│   │   └── productController.ts
│   └── app.ts
└── package.json
```

### Generated Documentation

**Routes Analysis:**

```json
{
    "routes": [
        {
            "path": "/api/users",
            "method": "GET",
            "handler": "getUsers",
            "middleware": ["auth"],
            "parameters": []
        }
    ]
}
```

**AI Documentation:**

```markdown
# User Management API

## GET /api/users

Retrieves a list of all users in the system.

**Authentication:** Required
**Response:** Array of user objects
```

## NestJS Project

### Project Structure

```
my-nestjs-app/
├── src/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── app.module.ts
└── package.json
```

### Generated Output

**Controllers:**

```json
{
    "controllers": [
        {
            "name": "UsersController",
            "path": "/users",
            "methods": [
                {
                    "name": "findAll",
                    "path": "",
                    "method": "GET",
                    "decorators": ["@Get()"]
                }
            ]
        }
    ]
}
```

## Configuration Examples

### Basic Configuration

```json
{
    "ai": {
        "provider": "google",
        "model": "gemini-2.5-flash"
    },
    "files": {
        "outputDir": "./docs"
    }
}
```

### Advanced Configuration

```json
{
    "ai": {
        "provider": "openai",
        "model": "gpt-4",
        "temperature": 0.3,
        "maxTokens": 8000
    },
    "database": {
        "enabled": true,
        "type": "mongodb",
        "url": "mongodb://localhost:27017/docs"
    },
    "files": {
        "outputDir": "./documentation",
        "timestampFiles": true,
        "saveRawAnalysis": true
    }
}
```

## Command Examples

### Quick Start

```bash
# Install
npm install -g @better-docs/universal

# Configure
better-docs config

# Set API key
export GOOGLE_AI_API_KEY="your_key"

# Analyze
better-docs analyze ./my-project
```

### Advanced Usage

```bash
# Custom config
better-docs analyze . --config ./custom-config.json

# Verbose output
better-docs analyze . --verbose

# Watch mode
better-docs analyze . --watch

# Specific output directory
better-docs analyze . --output ./my-docs
```

## Output Examples

### Analysis JSON

```json
{
  "project": {
    "name": "my-express-app",
    "framework": "express",
    "version": "4.18.0"
  },
  "routes": [...],
  "controllers": [...],
  "types": [...],
  "analysis": {
    "timestamp": "2025-01-05T12:00:00Z",
    "duration": "2.3s"
  }
}
```

### AI Documentation

```markdown
# API Documentation

## Overview

This Express.js application provides a RESTful API for user and product management.

## Authentication

All endpoints require authentication via JWT tokens.

## Endpoints

### Users

-   `GET /api/users` - List all users
-   `POST /api/users` - Create new user
-   `GET /api/users/:id` - Get user by ID
```

## Next Steps

-   [Installation Guide](./installation.md)
-   [Configuration Guide](./configuration.md)
-   [Usage Guide](./usage.md)
