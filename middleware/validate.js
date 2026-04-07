import { validationResult } from 'express-validator';
import { param, query } from 'express-validator/check';

export function validate(schema) {
  return async (req, res, next) => {
    await Promise.all([
      schema.run(req),
      validationResult(req).throw()
    ]);

    try {
      validationResult(req).throw();
      next();
    } catch (errors) {
      res.status(422).json({ errors: errors.array() });
    }
  };
}

export const paginationQuery = [
  query('page').optional().isInt({ min: 1, max: 99999 }),
  query('limit').optional().isInt({ min: 0, max: 50 })
];

export const mongoIdParam = [
  param('id').exists().isMongoId()
];