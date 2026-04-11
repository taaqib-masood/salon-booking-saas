import jwt from 'jsonwebtoken';

export default function errorHandler(err, req, res, next) {
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  // Supabase/Postgres unique constraint violations
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with this value already exists';
  }
  // JWT errors
  else if (
    err instanceof jwt.JsonWebTokenError ||
    err instanceof jwt.NotBeforeError ||
    err instanceof jwt.TokenExpiredError
  ) {
    statusCode = 401;
    message = 'Unauthorized: invalid or expired credentials';
  }

  // Never leak internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    errors = undefined;
  }

  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
}