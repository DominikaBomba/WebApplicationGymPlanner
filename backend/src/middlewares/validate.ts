import type { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validate = (schema: ZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            return next();
        } catch (error: any) {
            try {
                const parsedErrors = JSON.parse(error.message);

                return res.status(400).json({
                    error: "Validation failed",
                    details: parsedErrors.map((err: any) => ({
                        field: err.path ? err.path.join('.') : 'unknown',
                        message: err.message
                    }))
                });
            } catch (fallbackError) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: error.message
                });
            }
        }
    };