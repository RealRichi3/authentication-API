require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const { default: mongoose } = require('mongoose')
const request = require('supertest')
const expect = require('chai').expect

const server = require('../app')
const app = request.agent(server)
const connectDatabase = require('../db/connectDB')
const { Status } = require('../models/accountStatusModel')
const { Token, BlacklistedTokens } = require('../models/tokenModel')
const { User } = require('../models/usersModel')



// Clear the test database before running tests
describe('SuperAdmin authentication for signup, account activation, password reset and login', () => {

    // Clear the test database before running tests
    before(async () => {
        await mongoose.connection.dropDatabase()
    })

    let bearer_token;

    describe('POST /signup', () => {
        const url = '/api/auth/superadmin/signup'
        beforeEach(() => {
            signup_data = {
                firstname: "testfirstname",
                lastname: "testlastname",
                email: "testemail@gmail.com",
                phonenumber: "132434432324",
                password: "testpassword",
            }
        })

        it('should return status code 400 for invalid email format', async () => {
            signup_data.email = 'testemail@'
            const res = await app.post(url).send(signup_data)

            expect(res.statusCode).to.equal(400)
        })

        it('should return statuscode 200 for successful signup', async () => {
            const res = await app.post(url).send(signup_data)

            expect(res.statusCode).to.equal(201)
            expect(res.body).to.be.a('object')
            expect(res.body).to.have.property('access_token').to.be.a('string')

            expect(res.body).to.have.property('user')
            expect(res.body).to.have.nested.property('user\.firstname')
            expect(res.body).to.have.nested.property('user\.lastname')

            bearer_token = res.body.access_token
        })

        it('should return status code 400 for duplicate signup for unverified account', async () => {
            const res = await app.post(url).send(signup_data)
            expect(res.statusCode).to.equal(400)
            expect(res.body).to.be.a('object')
            expect(res.body).to.have.property('access_token')
        })

        it('should return status code 400 for duplicate signup for active account', async () => {
            const res = await app.post(url).send(signup_data)
            expect(res.statusCode).to.equal(400)
            expect(res.body).to.be.a('object')
        })


        it('should return status code 400 for duplicate signup for active and verifiedaccount', async () => {
            const res = await app.post(url).send(signup_data)
            expect(res.statusCode).to.equal(400)
            expect(res.body).to.be.a('object')
        })

        it('should have a verification token in the database', async () => {
            const user = await User.findOne({ email: signup_data.email })
            const verification_token = await Token.findOne({ user })

            expect(verification_token).to.be.a('object')
            expect(verification_token).to.have.a.property('verification').to.be.a('string')
        })
    })

    describe('POST /activateuser', () => {
        const url = '/api/auth/superadmin/activate'
        let user, ver_token;

        beforeEach(() => {
            user_email = 'testemail@gmail.com'
            activate_user_data = {
                head_token_1: null,
                head_token_2: null,
                user_token: null
            }
            dummy_data = {
                head_token_1: 'thisisnottherealtoken',
                head_token_2: 'thisisnottherealtoken',
                user_token: 'thisisnotherealtoken'
            }
        })

        it('should return status code 400 for Missing required parameter in request body', async () => {
            const res = await app.post(url).set("Authorization", `Bearer ${bearer_token}`)
            
            expect(res.statusCode).to.equal(400)
            expect(res.body.message).to.be.a('string').to.equal("Missing Required parameter: Validation failed")
        })

        it('should return status code 401 for no Bearer Token in authorization header', async () => {
            const res = await app.post(url).send(dummy_data)
            
            expect(res.statusCode).to.equal(401)
            expect(res.body.message).to.be.a('string').to.equal('Authentication invalid')
        })

        it('should return status code 401 for expired authorization JWT token', async () => {
            bearer_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzI3NDFiODc1MGVmMzc0YzJhNWE1NzYiLCJlbWFpbCI6ImJvYXlhbnRlbmR1c2VyQGdtYWlsLmNvbSIsInJvbGUiOiJFbmRVc2VyIiwicmVzZXRfdG9rZW4iOm51bGwsImlhdCI6MTY2MzcyOTIyMCwiZXhwIjoxNjYzNzM2NDIwfQ.w-i1fhLiOhWCvvVamdQRww-euf5XYRizkVUEIxhj3O0"
            const res = await app.post(url).send(dummy_data).set("Authorization", `Bearer ${bearer_token}`)
            
            expect(res.statusCode).to.equal(401)
            expect(res.body.message).to.be.a('string').to.equal("JWT Token expired")
        })

        it('should return status code 400 for wrong verification code', async () => {
            bearer_token = await app.post('/api/auth/superadmin/signup').send(signup_data).then((response) => { return response.body.access_token })
            user = await User.findOne({ email: signup_data.email })

            const res = await app.post(url).send({ verification_token: 'thisisnottheverificationtoken' }).set("Authorization", `Bearer ${bearer_token}`)
            
            expect(res.statusCode).to.equal(400)
            expect(res.body.message).to.be.a('string').to.equal("Missing Required parameter: Validation failed")
        })

        it('should return status code 200 for successful acccount activation', async () => {
            user = await User.findOne({ email: user_email })
            ver_token = await Token.findOne({ user })
            verification_tokens = {
                head_token_1: ver_token.verification.slice(0, 6),
                head_token_2: ver_token.verification.slice(6, 12),
                user_token: ver_token.verification.slice(12, 18)
            }
            const res = await app.post(url).send(verification_tokens).set("Authorization", `Bearer ${bearer_token}`).then((res) => { return res }, (err) => { return err })

            expect(bearer_token).to.be.a('string')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.be.a('string').to.equal('SuperAdmin account activated successfully')
        })

        it('should return status code 401 for already used access token', async () => {
            const res = await app.post(url).send(dummy_data).set("Authorization", `Bearer ${bearer_token}`)

            expect(res.statusCode).to.equal(401)
            expect(res.body.message).to.be.a('string').to.equal("JWT token expired")
        })

    })

    describe('POST /login', async () => {
        const url = '/api/auth/superadmin/login'
        let user;

        beforeEach(() => {
            signup_data = {
                firstname: "testfirstname",
                lastname: "testlastname",
                email: "testemail@gmail.com",
                phonenumber: "132434432324",
                password: "testpassword",
                role: "EndUser"
            }

            login_data = {
                email: "testemail@gmail.com",
                password: "testpassword"
            }
        })

        it('should return status code 400 for missing parameter in request body', async () => {
            const res = await app.post(url).send({ email: login_data.email })

            expect(res.statusCode).to.equal(400)
            expect(res.body.message).to.be.a('string').to.equal("Missing required parameter: Validation failed")
        })

        it('should return status code 400 for invalid login credentials', async () => {
            const res = await app.post(url).send({ email: login_data.email, password: 'thisisnotthecorrectpassword' })

            expect(res.statusCode).to.equal(401)
            expect(res.body.message).to.be.a('string').to.equal("User account is not active")
        })

        it('should return status code 200 for successful login', async () => {
            await app.post('/api/auth/signup').send(signup_data)
            user = await User.findOne({ email: signup_data.email })
            await Status.findOneAndUpdate({ user }, { isVerified: true, isActive: true })

            const res = await app.post(url).send(login_data)

            expect(res.body).to.have.a.property('access_token').to.be.a('string')
            expect(res.body).to.have.a.property('refresh_token').to.be.a('string')
            expect(res.statusCode).to.equal(200)
            expect(res.body.message).to.be.a('string').to.equal("Successful login")
        })

        it('should return status code 400 for unverified account', async () => {
            await Status.findOneAndUpdate({ user }, { isVerified: false })
            const res = await app.post(url).send(login_data)
            
            expect(res.statusCode).to.equal(400)
            expect(res.body.message).to.be.a('string').to.equal("SuperAdmin exists, please verify account")
        })

        it('should return status code 401 for inactive account', async () => {
            await Status.findOneAndUpdate({ user }, { isVerified: true, isActive: false })
            const res = await app.post(url).send(login_data)
            
            expect(res.statusCode).to.equal(401)
            expect(res.body.message).to.be.a('string').to.equal("User account is not active")
        })

    })

    describe('/password PASSWORD RESET ', () => {
        const url = "/api/auth/superadmin/password/reset"
        let user, access_token;

        beforeEach(() => {
            login_data = {
                email: "testemail@gmail.com",
                password: "testpassword"
            }
        })

        describe('POST /password/reset', () => {
            it('should return status code 400 for non existing account', async () => {
                const res = await app.post(url).send({ email: 'noexistingaccount@test.com' })
                
                expect(res.statusCode).to.equal(400)
                expect(res.body.message).to.be.a('string').to.equal("User does not exist")
            })

            it('should return status code 201 for successful password reset request', async () => {
                user = await User.findOne({ email: login_data.email })
                await Status.findOneAndUpdate({ user }, { isVerified: true, isActive: true })

                const res = await app.post(url).send({ email: login_data.email })

                expect(res.statusCode).to.equal(201)
                expect(res.body).to.have.a.property('access_token').to.be.a('string')
                expect(res.body.message).to.be.a('string').to.equal("Password reset code sent you user email")

                access_token = res.body.access_token
            })
        })

        describe('PUT /password/confirmtoken Confirm password reset', () => {
            beforeEach(() => {
                bearer_token = access_token
            })

            const url = '/api/auth/superadmin/password/confirmtoken'
            let new_password = 'thisisthenewpassword'

            it('should return status code 401 for no Bearer Token in authorization header', async () => {
                const res = await app.put(url)
                
                expect(res.statusCode).to.equal(401)
                expect(res.body.message).to.be.a('string').to.equal("Authentication required")
            })

            it('should return status code 401 for expired authorization JWT token', async () => {
                bearer_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MzI3NDFiODc1MGVmMzc0YzJhNWE1NzYiLCJlbWFpbCI6ImJvYXlhbnRlbmR1c2VyQGdtYWlsLmNvbSIsInJvbGUiOiJFbmRVc2VyIiwicmVzZXRfdG9rZW4iOm51bGwsImlhdCI6MTY2MzcyOTIyMCwiZXhwIjoxNjYzNzM2NDIwfQ.w-i1fhLiOhWCvvVamdQRww-euf5XYRizkVUEIxhj3O0"
                const res = await app.put(url).set("Authorization", `Bearer ${bearer_token}`)
                
                expect(res.statusCode).to.equal(401)
                expect(res.body.message).to.be.a('string').to.equal("JWT Token expired")
            })

            it('should return status code 400 for Missing required parameter in request body', async () => {
                const res = await app.put(url).set('Authorization', `Bearer ${bearer_token}`)
                
                expect(res.statusCode).to.equal(400)
                expect(res.body.message).to.be.a('string').to.equal("Missing required parameter: Validation failed")
            })

            it('should return status code 400 for invalid reset token', async () => {
                const res = await app.put(url).send({ reset_token: "thisisthewrongresettoken", password: new_password }).set("Authorization", `Bearer ${bearer_token}`)
                
                expect(res.statusCode).to.equal(400)
                expect(res.body.message).to.be.a('string').to.equal("Missing required parameter: Validation failed")
            })

            it('should return status code 200 for successful password reset', async () => {
                const reset_token = await Token.findOne({ user })
                user = await User.findOne({ email: user_email })
                reset_tokens = {
                    head_token_1: reset_token.password_reset.slice(0, 6),
                    head_token_2: reset_token.password_reset.slice(6, 12),
                    user_token: reset_token.password_reset.slice(12, 18)
                }

                const res = await app.put(url).send({ ...reset_tokens, password: new_password }).set("Authorization", `Bearer ${bearer_token}`)
                
                expect(res.statusCode).to.equal(200)
                expect(res.body.message).to.be.a('string').to.equal("Successful password reset")
            })
            it('should return status code 200 for successful login with new password', async () => {
                const res = await app.post('/api/auth/superadmin/login').send({ email: login_data.email, password: new_password })

                expect(res.statusCode).to.equal(200)
                expect(res.body).to.have.a.property('access_token').to.be.a('string')
                expect(res.body).to.have.a.property('refresh_token').to.be.a('string')
                expect(res.body.message).to.be.a('string').to.equal("Successful login")
            })
        })
    })

})
