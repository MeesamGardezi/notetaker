#!/bin/bash


cd backend

# Create empty .env and .gitignore files
touch .env
echo "node_modules
.env
.DS_Store" > .gitignore

# Create empty server.js file
touch server.js

# Create subdirectories and their files
mkdir -p config
touch config/firebase.js

mkdir -p middleware
touch middleware/auth.js
touch middleware/validation.js
touch middleware/tierLimits.js
touch middleware/errorHandler.js
touch middleware/rateLimiter.js
touch middleware/fileUpload.js

mkdir -p routes
touch routes/auth.js
touch routes/users.js
touch routes/modules.js
touch routes/notes.js
touch routes/tags.js
touch routes/images.js

mkdir -p controllers
touch controllers/authController.js
touch controllers/userController.js
touch controllers/moduleController.js
touch controllers/noteController.js
touch controllers/tagController.js
touch controllers/imageController.js

mkdir -p utils
touch utils/jwt.js
touch utils/password.js
touch utils/validators.js
touch utils/logger.js

# Create a basic package.json file
cat > package.json << EOF
{
  "name": "notes-app-backend",
  "version": "1.0.0",
  "description": "Backend for the notes application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-rate-limit": "^6.7.0",
    "firebase-admin": "^11.8.0",
    "joi": "^17.9.2",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOF

echo "Directory structure created successfully!"