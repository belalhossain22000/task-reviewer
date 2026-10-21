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
    // Comma separated list of browser origins allowed to call the API with cookies.
    client_origins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    // How many reverse proxies sit in front of the server (0 = none).
    trust_proxy: Number(process.env.TRUST_PROXY) || 0,
    // How long "I'm reviewing this" holds a project before anyone else may take it.
    claim_ttl_minutes: Number(process.env.CLAIM_TTL_MINUTES) || 30,
    rate_limit: {
        global_max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 300,
        submission_max: Number(process.env.SUBMISSION_RATE_LIMIT_MAX) || 5,
        submission_window_minutes: Number(process.env.SUBMISSION_RATE_LIMIT_WINDOW_MINUTES) || 10,
    },
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        expires_in: process.env.EXPIRES_IN || '7d',
    },
}
