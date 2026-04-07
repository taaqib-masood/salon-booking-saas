import { ValidationError } from 'mongoose';
import jwt from 'jsonwebtoken';

export default function errorHandler(err, req, res, next) {
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';
    let errors = undefined;
  
    if (err instanceof ValidationError) {
        statusCode = 400;
        message = 'Validation error';
        errors = Object.values(err.errors).map((error) => error.message);
    } else if (err.code === 11000) {
        statusCode = 409;
        message = `Duplicate key error for field ${Object.keys(err.keyValue)[0]}`;
    } else if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.NotBeforeError || err instanceof jwt.TokenExpiredError) {
        statusCode = 401;
        message = 'Unauthorized: Access is denied due to invalid credentials';
    }
  
    res.status(statusCode).json({ success: false, message, errors });
}