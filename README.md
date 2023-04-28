
# Auth Service
This is a simple API for managing authentication and authorization for your web application. It was built using Node.js with Typescript, Express, and MongoDB. It can be used as a standalone service or as a microservice in a microservice architecture.

### Prerequisites
- Node.js
- Typescript
- MongoDB
- Redis
- Docker (optional)

Download the project and install the dependencies.

```bash
git clone https://github.com/RealRichi3/authentication-API

cd https://github.com/RealRichi3/authentication-API

cd v1

npm install
```

### Running the app
To run the app you need to set the environment variables. You can do this by creating a `.env` file in the `services/auth_service/v1/src` directory. The `.env` file should look like this:

```bash
# .env
MONGO_URI = <your_mongo_uri>
REDIS_URL = <your_redis_db_url>
PORT = <your_port>
JWT_SECRET = <your_jwt_secret> 
JWT_COOKIE_EXPIRES = <your_jwt_cookie_expires>
JWT_ACCESS_SECRET = <your_jwt_access_secret>
JWT_ACCESS_EXP = <your_jwt_access_exp>
JWT_REFRESH_SECRET = <your_jwt_refresh_secret>
JWT_REFRESH_EXP = <your_jwt_refresh_exp>gg
JWT_PASSWORDRESET_SECRET = <your_jwt_passwordreset_secret>
JWT_PASSWORDRESET_EXP = <your_jwt_passwordreset_exp>
JWT_EMAILVERIFICATION_SECRET = <your_jwt_emailverification_secret>
JWT_EMAILVERIFICATION_EXP = <your_jwt_emailverification_exp>
JWT_SUPERADMINACTIVATION_SECRET = <your_jwt_superadminactivation_secret>
JWT_SUPERADMINACTIVATION_EXP = <your_jwt_superadminactivation_exp>
JWT_TWOFACTOR_SECRET = <your_jwt_twofactor_secret>
JWT_TWOFACTOR_EXP = <your_jwt_twofactor_exp>

EMAIL_USER = <your_email_user>
EMAIL_PASS = <your_email_pass>
EMAIL_HOST = <your_email_host>
EMAIL_PORT = <your_email_port>
EMAIL_HOST_ADDRESS = <your_email_host_address>
PROJECT_HOST_EMAIL = <your_project_host_email>

OAUTH_CLIENT_ID = <your_oauth_client_id>
OAUTH_CLIENT_SECRET = <your_oauth_client_secret>
OAUTH_REFRESH_TOKEN = <your_oauth_refresh_token>
OAUTH_ACCESS_TOKEN = <your_oauth_access_token>

CRYPTO_ALGORITHM = <your_crypto_algorithm>
CRYPTO_PASSWORD = <your_crypto_password>
CRYPTO_IV = <your_crypto_iv>

CLIENT_APP_URL = <your_client_app_url>

CLOUDINARY_CLOUD_NAME = <your_cloudinary_cloud_name>
CLOUDINARY_API_KEY = <your_cloudinary_api_key>
CLOUDINARY_API_SECRET = <your_cloudinary_api_secret>
```

For development, change file name from `.env` to `.env.dev` and run the following command:
And change the `MONGO_URI` variable name to `MONGO_URI_DEV`.

Run the following command to start the app in development mode:

```bash
npm run dev
```

Navigate to `http://localhost:<your_port>/api/v1/`. The app will automatically reload if you change any of the source files.

### Running the app with Docker
To run the app with Docker the `.env` or `.env.dev` file should remain the same. Navigate to the root directory and run the following command to build the Docker image:

```bash
docker build -t taskgenie .
```

Run the following command to start the app in development mode:

```bash
docker run -p <your_port>:5555 taskgenie
```

Note that the exposed port in the Dockerfile is `5555`. You can change this to any port you want.
And make sure that the port you are exposing is the same as the port you set in the `.env` or `.env.dev` file.

Navigate to `http://localhost:<your_port>/api/v1/`.

### API Documentation
The API documentation can be found [here](https://documenter.getpostman.com/view/20633788/2s93XzwN5M).


### Built by
- Name: Riche Moluno
- Github: [RealRichi3](https://github.com/RealRichi3)
- Email: [molunorichie@gmail.com](mailto:molunorichie@gmail.com)
- Twitter: [MolunoRiche](https://twitter.com/MolunoRiche)