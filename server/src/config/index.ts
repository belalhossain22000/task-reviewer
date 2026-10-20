import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in .env');
}

export default {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    auth_cookie_name: 'token',
    rate_limit: {
        submission_max: Number(process.env.SUBMISSION_RATE_LIMIT_MAX) || 5,
        submission_window_minutes: Number(process.env.SUBMISSION_RATE_LIMIT_WINDOW_MINUTES) || 10,
    },
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        expires_in: process.env.EXPIRES_IN || '7d',
    },
}
