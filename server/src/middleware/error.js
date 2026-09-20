import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, _res, next) =>
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));

/**
 * Translates internal failures into messages a customer can act on.
 * Stack traces and driver errors never reach the client in production.
 */
export const errorHandler = (err, _req, res, _next) => {
  let { statusCode = 500, message, details } = err;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Please check the highlighted fields';
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'That record could not be found';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again.';
  }

  res.status(statusCode).json({
    success: false,
    message: message || 'Request failed',
    ...(details ? { details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};
