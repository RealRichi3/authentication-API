# Node.js + Express.js + MongoDB Authentication API

This project is meant to be used as a starting point for APIs that require user Authentication (registration and sign in).
All sign in sessions are directed to protected routes that pass through an authentication middleware.

The project uses ;

- Mongoose for data modelling.
- Express.js for server setup.
- randomtoken node.js module as authentication token
- bcrypt to hash passwords before storing in database

It API includes;

- User registration
- Login
- Password Reset
- User Account verification
- Account activation and deactivation by admin


## Setup

- Clone repo
- From server folder
  > npm install
- Add MongoDB URI and email credentials to .env file
  > npm start
- Test endpoints

## Overview of auth system:

1. User registers account. Password is hashed and salted with bcrypt before being stored in the database.
2. User enters login credentials for login, server validates the credentials, if it's valid, it generates a JWT token.
   this token will be used along side every request post-login.
3. Token is sent in a json format after server response.
4. On every request post-login, client attaches the access token in the request header.
5. Request sent to protected endpoints go through an authentication middleware, which validates the accesstoken received.

## Password reset
1. User sends password reset request
2. API issues a reset token and sends to user's email address (token expires after 2mins).
3. API creates a JWT access token, will be required to authenticate the user when completing the password reset process
4. User sends request with new password and reset-token and access token (access token will be used in the Authorization header as Bearer token).
4. API confirms token then updates user's password in DB.

The email client requires an email address and password, not the password to the email, but a secondary password to access email function with google.

#


# Authentication API Documentation



<!--- If we have only one group/collection, then no need for the "ungrouped" heading -->
- [Node.js + Express.js + MongoDB Authentication API](#nodejs--expressjs--mongodb-authentication-api)
  - [Setup](#setup)
  - [Overview of auth system:](#overview-of-auth-system)
  - [Password reset](#password-reset)
- [Authentication API Documentation](#authentication-api-documentation)
  - [Variables](#variables)
  - [Endpoints](#endpoints)
    - [1. Login](#1-login)
      - [I. Example Request: Error - Login Credentials invalid](#i-example-request-error---login-credentials-invalid)
      - [I. Example Response: Error - Login Credentials invalid](#i-example-response-error---login-credentials-invalid)
      - [II. Example Request: Error - Missing required parameter](#ii-example-request-error---missing-required-parameter)
      - [II. Example Response: Error - Missing required parameter](#ii-example-response-error---missing-required-parameter)
      - [III. Example Request: Error - Server error](#iii-example-request-error---server-error)
      - [III. Example Response: Error - Server error](#iii-example-response-error---server-error)
      - [IV. Example Request: Success - Login successful](#iv-example-request-success---login-successful)
      - [IV. Example Response: Success - Login successful](#iv-example-response-success---login-successful)
    - [2. Confirm password reset](#2-confirm-password-reset)
      - [I. Example Request: Error - Server error](#i-example-request-error---server-error)
      - [I. Example Response: Error - Server error](#i-example-response-error---server-error)
      - [II. Example Request: Errror - Missing required parameter in request body](#ii-example-request-errror---missing-required-parameter-in-request-body)
      - [II. Example Response: Errror - Missing required parameter in request body](#ii-example-response-errror---missing-required-parameter-in-request-body)
      - [III. Example Request: Error - Invalid reset code](#iii-example-request-error---invalid-reset-code)
      - [III. Example Response: Error - Invalid reset code](#iii-example-response-error---invalid-reset-code)
      - [IV. Example Request: Success - Password reset successful](#iv-example-request-success---password-reset-successful)
      - [IV. Example Response: Success - Password reset successful](#iv-example-response-success---password-reset-successful)
    - [3. Password Reset](#3-password-reset)
      - [I. Example Request: Success - Password Reset](#i-example-request-success---password-reset)
      - [I. Example Response: Success - Password Reset](#i-example-response-success---password-reset)
      - [II. Example Request: Error - User account does not exist](#ii-example-request-error---user-account-does-not-exist)
      - [II. Example Response: Error - User account does not exist](#ii-example-response-error---user-account-does-not-exist)
      - [III. Example Request: Error - Missing required parameter in request body](#iii-example-request-error---missing-required-parameter-in-request-body)
      - [III. Example Response: Error - Missing required parameter in request body](#iii-example-response-error---missing-required-parameter-in-request-body)
      - [IV. Example Request: Error - Server error](#iv-example-request-error---server-error)
      - [IV. Example Response: Error - Server error](#iv-example-response-error---server-error)
    - [4. Verify Email](#4-verify-email)
      - [I. Example Request: Success - Verify Email](#i-example-request-success---verify-email)
      - [I. Example Response: Success - Verify Email](#i-example-response-success---verify-email)
      - [II. Example Request: Error - Account already verified](#ii-example-request-error---account-already-verified)
      - [II. Example Response: Error - Account already verified](#ii-example-response-error---account-already-verified)
      - [III. Example Request: Error - Expired JWT token](#iii-example-request-error---expired-jwt-token)
      - [III. Example Response: Error - Expired JWT token](#iii-example-response-error---expired-jwt-token)
      - [IV. Example Request: Error - Missing required parameter in request body](#iv-example-request-error---missing-required-parameter-in-request-body)
      - [IV. Example Response: Error - Missing required parameter in request body](#iv-example-response-error---missing-required-parameter-in-request-body)
      - [V. Example Request: Error - Server error](#v-example-request-error---server-error)
      - [V. Example Response: Error - Server error](#v-example-response-error---server-error)
    - [5. Sign up](#5-sign-up)
      - [I. Example Request: Sign up - Successful](#i-example-request-sign-up---successful)
      - [I. Example Response: Sign up - Successful](#i-example-response-sign-up---successful)
      - [II. Example Request: Error - Missing required parameter in request body](#ii-example-request-error---missing-required-parameter-in-request-body)
      - [II. Example Response: Error - Missing required parameter in request body](#ii-example-response-error---missing-required-parameter-in-request-body)
      - [III. Example Request: Error - Failed email format validation](#iii-example-request-error---failed-email-format-validation)
      - [III. Example Response: Error - Failed email format validation](#iii-example-response-error---failed-email-format-validation)
      - [IV. Example Request: Error - Duplicate registration and unverified account](#iv-example-request-error---duplicate-registration-and-unverified-account)
      - [IV. Example Response: Error - Duplicate registration and unverified account](#iv-example-response-error---duplicate-registration-and-unverified-account)
      - [V. Example Request: Error - Server error](#v-example-request-error---server-error-1)
      - [V. Example Response: Error - Server error](#v-example-response-error---server-error-1)


## Variables

| Key | Value | Type |
| --- | ------|-------------|
| serverURL | http://127.0.0.1:5525/api | string |



## Endpoints


--------



### 1. Login


Returns access token, will be required for post login controls


***Endpoint:***

```bash
Method: POST
Type: RAW
URL: {{serverURL}}/auth/login
```



***Body:***

```js        
{
    "email": "moluno.r.ichie@gmail.com",
    "password": "thisistfhenewpassword"
}

```



***More example Requests/Responses:***


#### I. Example Request: Error - Login Credentials invalid



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thismainina;df;lajsdfsmypassword",
    "role": "EndUser"
}

```



#### I. Example Response: Error - Login Credentials invalid
```js
{
    "message": "Login credentials invalid"
}
```


***Status Code:*** 401

<br>



#### II. Example Request: Error - Missing required parameter



***Body:***

```js        
{
    "password": "thismainina;df;lajsdfsmypassword",
    "role": "EndUser"
}

```



#### II. Example Response: Error - Missing required parameter
```js
{
    "message": "Missing required parameter: Validation failed"
}
```


***Status Code:*** 400

<br>



#### III. Example Request: Error - Server error



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### III. Example Response: Error - Server error
```js
{
    "message": "An error occured"
}
```


***Status Code:*** 500

<br>



#### IV. Example Request: Success - Login successful



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### IV. Example Response: Success - Login successful
```js
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzBlZTcwN2U3ZDcxMzMzZDI0M2ZjMjIiLCJlbWFpbCI6Im1vbHVub3JpY2hpZUBnbWFpbC5jb20iLCJyb2xlIjoiRW5kVXNlciIsImlhdCI6MTY2MTkyNDAxMiwiZXhwIjoxNjYyMDEwNDEyfQ.FwtPPUID7mdX81AShIwsF3B_l23v0JjJTXw9LzHbuQI"
}
```


***Status Code:*** 200

<br>



### 2. Confirm password reset


Requires bearer token from password reset response


***Endpoint:***

```bash
Method: PUT
Type: RAW
URL: {{serverURL}}/auth/password/confirmtoken
```



***Body:***

```js        
{
    "reset_token": "849476",
    "password": "thisistfhenewpassword"
}
```



***More example Requests/Responses:***


#### I. Example Request: Error - Server error



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### I. Example Response: Error - Server error
```js
{
    "message": "An error occured"
}
```


***Status Code:*** 500

<br>



#### II. Example Request: Errror - Missing required parameter in request body



***Body:***

```js        
{
    "password": "thismainina;df;lajsdfsmypassword"
}
```



#### II. Example Response: Errror - Missing required parameter in request body
```js
{
    "message": "Missing required parameter: Validation failed"
}
```


***Status Code:*** 400

<br>



#### III. Example Request: Error - Invalid reset code



***Body:***

```js        
{
    "reset_token": "494815",
    "password": "thismainina;df;lajsdfsmypassword"
}
```



#### III. Example Response: Error - Invalid reset code
```js
{
    "message": " Reset token is invalid "
}
```


***Status Code:*** 400

<br>



#### IV. Example Request: Success - Password reset successful



***Body:***

```js        
{
    "reset_token": "543490",
    "password": "thisisthenewpassword"
}
```



#### IV. Example Response: Success - Password reset successful
```js
{
    "message": "Password Reset successful"
}
```


***Status Code:*** 200

<br>



### 3. Password Reset


Returns JWT token on success, should be used as bearer authorization token when confirming reset token


***Endpoint:***

```bash
Method: POST
Type: RAW
URL: {{serverURL}}/auth/password/reset
```



***Body:***

```js        
{
    "email": "moluno.r.ichie@gmail.com"
}
```



***More example Requests/Responses:***


#### I. Example Request: Success - Password Reset



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "role": "EndUser"
}
```



#### I. Example Response: Success - Password Reset
```js
{
    "message": "Password reset code sent you user email",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzBlZTcwN2U3ZDcxMzMzZDI0M2ZjMjIiLCJyZXNldF90b2tlbiI6IjU0MzQ5MCIsImVtYWlsIjoibW9sdW5vcmljaGllQGdtYWlsLmNvbSIsInJvbGUiOiJFbmRVc2VyIiwiaWF0IjoxNjYxOTIyOTU2LCJleHAiOjE2NjIwMDkzNTZ9.IkdEHk-c0cRFbx7ezjERyyVPViifq3ss21sIZ_yK5_Y"
}
```


***Status Code:*** 201

<br>



#### II. Example Request: Error - User account does not exist



***Body:***

```js        
{
    "email": "richie.mo.l.uno@gmail.com",
    "role": "EndUser"
}
```



#### II. Example Response: Error - User account does not exist
```js
{
    "message": "User does not exist"
}
```


***Status Code:*** 400

<br>



#### III. Example Request: Error - Missing required parameter in request body



***Body:***

```js        
{
    "email": "richie.mo.l.uno@gmail.com"
}
```



#### III. Example Response: Error - Missing required parameter in request body
```js
{
    "message": "Missing required parameter: Validation failed"
}
```


***Status Code:*** 400

<br>



#### IV. Example Request: Error - Server error



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### IV. Example Response: Error - Server error
```js
{
    "message": "An error occured"
}
```


***Status Code:*** 500

<br>



### 4. Verify Email



***Endpoint:***

```bash
Method: POST
Type: RAW
URL: {{serverURL}}/auth/verify
```



***Body:***

```js        
{
    "verification_token": "190909"
}
```



***More example Requests/Responses:***


#### I. Example Request: Success - Verify Email



***Body:***

```js        
{
    "verification_token": "401729"
}
```



#### I. Example Response: Success - Verify Email
```js
{
    "message": "User Email verified successfully"
}
```


***Status Code:*** 200

<br>



#### II. Example Request: Error - Account already verified



***Body:***

```js        
{
    "verification_token": "401729"
}
```



#### II. Example Response: Error - Account already verified
```js
{
    "message": "User Account already verified"
}
```


***Status Code:*** 400

<br>



#### III. Example Request: Error - Expired JWT token



***Body:***

```js        
{
    "verification_token": "401729"
}
```



#### III. Example Response: Error - Expired JWT token
```js
{
    "message": "JWT token exired"
}
```


***Status Code:*** 401

<br>



#### IV. Example Request: Error - Missing required parameter in request body



***Body:***

```js        
{
}
```



#### IV. Example Response: Error - Missing required parameter in request body
```js
{
    "message": "Missing parameter: Validation failed"
}
```


***Status Code:*** 400

<br>



#### V. Example Request: Error - Server error



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### V. Example Response: Error - Server error
```js
{
    "message": "An error occured"
}
```


***Status Code:*** 500

<br>



### 5. Sign up



***Endpoint:***

```bash
Method: POST
Type: RAW
URL: {{serverURL}}/auth/signup
```



***Body:***

```js        
{
    "firstname": "Richie",
    "lastname": "Moluno",
    "email": "molunorichie@gmail.com",
    "phonenumber": "+2341234567890",
    "password": "mymainpassword",
    "role": "EndUser",
    "verified": true
}
```



***More example Requests/Responses:***


#### I. Example Request: Sign up - Successful



***Body:***

```js        
{
    "firstname": "Richie",
    "lastname": "Moluno",
    "email": "richiemoluno@gmail.com",
    "phonenumber": "+2341234567890",
    "password": "mymainpassword",
    "role": "EndUser"
}
```



#### I. Example Response: Sign up - Successful
```js
{
    "user": {
        "firstname": "Richie",
        "lastname": "Moluno"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzBlZWRiMjQwNTYyMzAzY2ZlNGRmNTYiLCJlbWFpbCI6InJpY2hpZW1vbHVub0BnbWFpbC5jb20iLCJyb2xlIjoiRW5kVXNlciIsImlhdCI6MTY2MTkyMjc0MiwiZXhwIjoxNjYyMDA5MTQyfQ.0V33W7__bB-G70XxT5ePXSfRHOokKTmxTjvqIPv6alI"
}
```


***Status Code:*** 201

<br>



#### II. Example Request: Error - Missing required parameter in request body



***Body:***

```js        
{
    "firstname": "Richie",
    "lastname": "Moluno",
    "email": "moluno.richie@gmail.com",
    "phonenumber": "+2341234567890",
    "role": "EndUser"
}
```



#### II. Example Response: Error - Missing required parameter in request body
```js
{
    "message": "Password validation failed: password: Path `password` is required."
}
```


***Status Code:*** 401

<br>



#### III. Example Request: Error - Failed email format validation



***Body:***

```js        
{
    "firstname": "Richie",
    "lastname": "Moluno",
    "email": "molunorichie@gmail.com",
    "phonenumber": "+2341234567890",
    "password": "mymainpassword",
    "role": "EndUser"
}
```



#### III. Example Response: Error - Failed email format validation
```js
{
    "message": "Email validation failed"
}
```


***Status Code:*** 400

<br>



#### IV. Example Request: Error - Duplicate registration and unverified account



***Body:***

```js        
{
    "firstname": "Richie",
    "lastname": "Moluno",
    "email": "molunorichie@gmail.com",
    "phonenumber": "+2341234567890",
    "password": "mymainpassword",
    "role": "EndUser"
}
```



#### IV. Example Response: Error - Duplicate registration and unverified account
```js
{
    "message": "User exists, please verify your account",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzBlZTcwN2U3ZDcxMzMzZDI0M2ZjMjIiLCJlbWFpbCI6Im1vbHVub3JpY2hpZUBnbWFpbC5jb20iLCJyb2xlIjoiRW5kVXNlciIsImlhdCI6MTY2MTkyMTYxMywiZXhwIjoxNjYyMDA4MDEzfQ.SbVhFdkIDx06gh-C3P7-Igh6abA2rboPKDMJ02aFjDk"
}
```


***Status Code:*** 400

<br>



#### V. Example Request: Error - Server error



***Body:***

```js        
{
    "email": "molunorichie@gmail.com",
    "password": "thisisthenewpassword",
    "role": "EndUser"
}

```



#### V. Example Response: Error - Server error
```js
{
    "message": "An error occured"
}
```


***Status Code:*** 500

<br>



---
[Back to top](#authentication-api)

>Generated at 2022-09-09 01:36:30 by [docgen](https://github.com/thedevsaddam/docgen)


#

Feedback and PR's are welcomed. Contact me on [Richie Moluno](https://twitter.com/MolunoRichie)
