// src/utils/AppError.js
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        
        this.statusCode = statusCode;
        // Егер статус 400-бен басталса (client error) -> 'fail', әйтпесе 'error'
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Бұл біз күткен (бақыланатын) қателер

        Error.captureStackTrace(this, this.constructor);
    }
}