#!/bin/bash

# Create root project directory
mkdir -p notetaker_backend

# Create directory structure
mkdir -p notetaker_backend/src/controllers
mkdir -p notetaker_backend/src/middleware
mkdir -p notetaker_backend/src/models
mkdir -p notetaker_backend/src/routes
mkdir -p notetaker_backend/src/services
mkdir -p notetaker_backend/src/utils
mkdir -p notetaker_backend/src/config
mkdir -p notetaker_backend/tests

# Create main application files
touch notetaker_backend/src/app.js
touch notetaker_backend/src/server.js
touch notetaker_backend/.env.example
touch notetaker_backend/.gitignore
touch notetaker_backend/package.json

# Create config files
touch notetaker_backend/src/config/firebase.config.js
touch notetaker_backend/src/config/app.config.js
touch notetaker_backend/src/config/tier.config.js

# Create controller files
touch notetaker_backend/src/controllers/auth.controller.js
touch notetaker_backend/src/controllers/user.controller.js
touch notetaker_backend/src/controllers/module.controller.js
touch notetaker_backend/src/controllers/note.controller.js
touch notetaker_backend/src/controllers/media.controller.js

# Create middleware files
touch notetaker_backend/src/middleware/auth.middleware.js
touch notetaker_backend/src/middleware/error.middleware.js
touch notetaker_backend/src/middleware/upload.middleware.js
touch notetaker_backend/src/middleware/validation.middleware.js

# Create route files
touch notetaker_backend/src/routes/auth.routes.js
touch notetaker_backend/src/routes/user.routes.js
touch notetaker_backend/src/routes/module.routes.js
touch notetaker_backend/src/routes/note.routes.js
touch notetaker_backend/src/routes/media.routes.js

# Create service files
touch notetaker_backend/src/services/auth.service.js
touch notetaker_backend/src/services/user.service.js
touch notetaker_backend/src/services/module.service.js
touch notetaker_backend/src/services/note.service.js
touch notetaker_backend/src/services/media.service.js
touch notetaker_backend/src/services/firebase.service.js
touch notetaker_backend/src/services/storage.service.js

# Create utility files
touch notetaker_backend/src/utils/response.util.js
touch notetaker_backend/src/utils/logger.util.js
touch notetaker_backend/src/utils/validators.util.js
touch notetaker_backend/src/utils/file.util.js

# Create README.md with project info
touch notetaker_backend/README.md

echo "Backend directory structure created successfully!"