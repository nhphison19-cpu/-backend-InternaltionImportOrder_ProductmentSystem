// middleware/validate.js
const { AppError } = require('./errorHandler');

/**
 * Validates and replaces req.body with the parsed/coerced result.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError('Validation failed', 422, formatIssues(result.error)));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates and replaces req.query with the parsed/coerced result.
 * Use for list/filter endpoints (page, limit, search, etc).
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError('Invalid query parameters', 422, formatIssues(result.error)));
    }
    req.query = result.data;
    next();
  };
}

/**
 * Validates and replaces req.params with the parsed/coerced result.
 * Use for route params like cuid checks on :id, :orderId, etc.
 */
function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new AppError('Invalid route parameters', 422, formatIssues(result.error)));
    }
    req.params = result.data;
    next();
  };
}

/**
 * Validates multiple request parts in one call:
 * validateRequest({ body: schema1, query: schema2, params: schema3 })
 */
function validateRequest(schemas) {
  return (req, res, next) => {
    const errors = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) errors.push(...formatIssues(result.error, 'body'));
      else req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) errors.push(...formatIssues(result.error, 'query'));
      else req.query = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) errors.push(...formatIssues(result.error, 'params'));
      else req.params = result.data;
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 422, errors));
    }
    next();
  };
}

function formatIssues(zodError, scope = null) {
  return zodError.issues.map((issue) => ({
    ...(scope ? { in: scope } : {}),
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

module.exports = { validate, validateQuery, validateParams, validateRequest };