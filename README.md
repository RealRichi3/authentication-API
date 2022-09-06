# NodeJS project template

This repository contains the necessary setup and files needed for most NodeJS templates

The included dependencies in the package.json are 
- Express
- Nodemon
- Morgan
- Bcrypt
- Jsonwebtoken
- Mongoose
- Nodemailer
- dotenv

NOTE: By default running 'npm start' runs 'nodemon server.js'

Added utils in the ./controller directory are 
- hash.js - to hash and compare hashed strings example for the case of passwords or sensittive data
- mailer.js - Sending mails with nodemailer
- jwt.js - decode JWT tokens

