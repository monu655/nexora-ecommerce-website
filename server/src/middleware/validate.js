import { ApiError } from '../utils/ApiError.js';

/**
 * Zod-backed request validation. Parsed output replaces the raw input so
 * controllers always work with coerced, trimmed, known-shape data.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    if (err.issues) {
      const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(ApiError.unprocessable('Please check the highlighted fields', details));
    }
    next(err);
  }
};
