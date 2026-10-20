export type ErrorSource = {
    path: string;
    message: string;
};

class ApiError extends Error {
    statusCode: number;
    // Field level errors, same shape as the zod validation errors: lets the client
    // attach a message to the right form field (e.g. a duplicate `repoUrl`).
    errorSources?: ErrorSource[];

    constructor(
        statusCode: number,
        message: string | undefined,
        stack = '',
        errorSources?: ErrorSource[]
    ) {
        super(message)
        this.statusCode = statusCode
        this.errorSources = errorSources
        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
