import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

// Accepts any zod schema, including ones with `.refine` / `.superRefine`.
const validateRequest =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Keep the parsed result: it carries the zod transforms (trim, lowercase, defaults).
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
