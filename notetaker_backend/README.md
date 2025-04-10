# NoteTaker Backend

A robust backend API for the NoteTaker application, built with Express.js and Firebase.

## Features

- User authentication with JWT tokens
- Module management (create, update, delete, reorder)
- Note management within modules
- Media file uploads and storage
- Tiered account levels with different limitations
- Secure API with validations and error handling

## Tech Stack

- Node.js and Express.js
- Firebase Authentication
- Firestore Database
- Firebase Storage
- JSON Web Tokens (JWT)
- Express Validator
- Multer for file uploads

## Project Structure

```
├── src/
│   ├── app.js                  # Express app setup
│   ├── server.js               # Application entry point
│   ├── config/                 # Configuration files
│   │   ├── app.config.js       # App configuration
│   │   ├── firebase.config.js  # Firebase setup
│   │   └── tier.config.js      # User tier settings
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.js
│   │   ├── media.controller.js
│   │   ├── module.controller.js
│   │   ├── note.controller.js
│   │   └── user.controller.js
│   ├── middleware/             # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── upload.middleware.js
│   │   └── validation.middleware.js
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── media.routes.js
│   │   ├── module.routes.js
│   │   ├── note.routes.js
│   │   └── user.routes.js
│   ├── services/               # Business logic
│   │   ├── auth.service.js
│   │   ├── media.service.js
│   │   ├── module.service.js
│   │   ├── note.service.js
│   │   └── user.service.js
│   └── utils/                  # Utility functions
│       ├── response.util.js
│       ├── logger.util.js
│       ├── file.util.js
│       └── validators.util.js
├── uploads/                    # Local file uploads
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore file
├── firebase_service.json       # Firebase service account key
├── package.json                # NPM dependencies
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- Firebase project with Firestore and Storage set up

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/notetaker-backend.git
   cd notetaker-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Add your Firebase configuration to the `.env` file

5. Place your Firebase service account key in `firebase_service.json`

### Running the Server

For development:
```
npm run dev
```

For production:
```
npm start
```

## API Documentation

### Authentication Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/verify-token` - Verify JWT token
- `POST /api/auth/reset-password` - Request password reset

### User Routes

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/usage-stats` - Get usage statistics
- `DELETE /api/users/delete-account` - Delete user account
- `POST /api/users/upgrade-tier` - Upgrade account tier

### Module Routes

- `GET /api/modules` - Get all user modules
- `POST /api/modules` - Create a new module
- `GET /api/modules/:id` - Get module by ID
- `PUT /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Delete module
- `PUT /api/modules/reorder` - Reorder modules

### Note Routes

- `POST /api/notes` - Create a new note
- `GET /api/notes/module/:moduleId` - Get all notes for a module
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PUT /api/notes/reorder` - Reorder notes within a module

### Media Routes

- `POST /api/media/upload` - Upload media to a note
- `GET /api/media/note/:noteId` - Get all media for a note
- `GET /api/media/url/:id` - Get signed URL for media
- `DELETE /api/media/:id` - Delete media file

## License

This project is licensed under the MIT License - see the LICENSE file for details.