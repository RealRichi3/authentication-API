import { Entity, Schema } from 'redis-om';
import redis_client from '../database/redis'

class AuthCode extends Entity {
    constructor () {
        super()
                
        user!: string;
        verification_code?: number;
        password_reset_code?: number;
        activation_code?: number;
        deactivation_code?: number;
    }
}

class AuthToken extends Entity { }
class BlacklistedToken extends Entity { }

const auth_code_schema = new Schema(AuthCode, {
    user: { type: 'string' },
    verification_code: { type: 'number' },
    password_reset_code: { type: 'number' },
    activation_code: { type: 'number' },
    deactivation_code: { type: 'number' },
})

const auth_token_schema = new Schema(AuthToken, {
    user: { type: 'string' },
    access_token: { type: 'string' },
    refresh_token: { type: 'string' }
})

const blacklisted_token_schema = new Schema(BlacklistedToken, {
    user: { type: 'string' },
    token: { type: 'string' }
})

const AuthCodeRepository = redis_client.fetchRepository(auth_code_schema)
const AuthTokenRepository = redis_client.fetchRepository(auth_token_schema)
const BlacklistedTokenRepository = redis_client.fetchRepository(blacklisted_token_schema)

export {
    AuthCode,
    AuthToken,
    BlacklistedToken,
    AuthCodeRepository,
    AuthTokenRepository,
    BlacklistedTokenRepository
};
