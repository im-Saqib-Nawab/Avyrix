import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

type ValidationSource = 'body' | 'query' | 'params';

function getSourceData(req: Request, source: ValidationSource): unknown {
  switch (source) {
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    default:
      return req.body;
  }
}

function setSourceData(req: Request, source: ValidationSource, data: unknown): void {
  switch (source) {
    case 'query':
      req.query = data as Request['query'];
      break;
    case 'params':
      req.params = data as Request['params'];
      break;
    default:
      req.body = data;
  }
}

function createValidator(source: ValidationSource) {
  return (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(getSourceData(req, source));
      if (!result.success) {
        next(new ZodError(result.error.issues));
        return;
      }
      setSourceData(req, source, result.data);
      next();
    };
  };
}

/** Validate `req.body` with a Zod schema (throws ZodError → error middleware). */
export const validate = createValidator('body');

/** Validate `req.query` with a Zod schema. */
export const validateQuery = createValidator('query');

/** Validate `req.params` with a Zod schema. */
export const validateParams = createValidator('params');
