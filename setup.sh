#!/bin/bash

# Create the main application directory
mkdir -p notes-app
cd notes-app

# Create server directory structure
mkdir -p server/config
mkdir -p server/services
mkdir -p server/controllers
mkdir -p server/routes
mkdir -p server/middleware
mkdir -p server/utils

# Create server config files
touch server/config/firebase-admin.js
touch server/config/firebase-client.js
touch server/config/config.js

# Create server service files
touch server/services/auth.service.js
touch server/services/module.service.js
touch server/services/note.service.js
touch server/services/media.service.js
touch server/services/storage.service.js
touch server/services/tier.service.js

# Create server controller files
touch server/controllers/auth.controller.js
touch server/controllers/account.controller.js
touch server/controllers/module.controller.js
touch server/controllers/note.controller.js
touch server/controllers/media.controller.js
touch server/controllers/tier.controller.js

# Create server route files
touch server/routes/auth.routes.js
touch server/routes/account.routes.js
touch server/routes/module.routes.js
touch server/routes/note.routes.js
touch server/routes/media.routes.js
touch server/routes/tier.routes.js

# Create server middleware files
touch server/middleware/auth.middleware.js
touch server/middleware/tier.middleware.js
touch server/middleware/error.middleware.js
touch server/middleware/upload.middleware.js

# Create server utility files
touch server/utils/validators.js
touch server/utils/tier-limits.js
touch server/utils/firebase-helpers.js

# Create main server app file
touch server/app.js

# Create public directory structure
mkdir -p public/css
mkdir -p public/js
mkdir -p public/libs/quill
mkdir -p public/libs/dropzone
mkdir -p public/libs/sortable

# Create public CSS files
touch public/css/style.css
touch public/css/bootstrap.min.css

# Create public JS files
touch public/js/app.js
touch public/js/firebase-init.js
touch public/js/auth.js
touch public/js/account.js
touch public/js/modules.js
touch public/js/notes.js
touch public/js/editor.js
touch public/js/media-uploader.js
touch public/js/tier-management.js

# Create public HTML file
touch public/index.html

# Create views directory structure
mkdir -p views/partials
mkdir -p views/auth
mkdir -p views/account
mkdir -p views/modules
mkdir -p views/notes

# Create views partial files
touch views/partials/header.ejs
touch views/partials/footer.ejs
touch views/partials/sidebar.ejs
touch views/partials/navbar.ejs

# Create views auth files
touch views/auth/login.ejs
touch views/auth/register.ejs
touch views/auth/reset-password.ejs
touch views/auth/verify-email.ejs

# Create views account files
touch views/account/profile.ejs
touch views/account/usage.ejs
touch views/account/tier.ejs

# Create views module files
touch views/modules/index.ejs
touch views/modules/view.ejs

# Create views note files
touch views/notes/view.ejs
touch views/notes/edit.ejs

# Create firebase directory and files
mkdir -p firebase
touch firebase/firestore.rules
touch firebase/storage.rules
touch firebase/firebase.json

# Create root level files
touch .env.example
touch .gitignore
touch package.json
touch server.js

echo "File structure created successfully!"