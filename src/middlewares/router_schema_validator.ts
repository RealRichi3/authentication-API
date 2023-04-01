import * as z from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * This function is used to validate the request body against a zod schema.
 * 
 * @param {Request} req - the request object.
 * @param {Response} res - the response object.
 * @param {NextFunction} next - the next function.
 * 
 * @returns {void}
 * 
 * @throws {Error} - if the validation schema for the request path is not defined.
 */
function routerSchemaValidator(schema: z.AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { body } = await schema.parseAsync({
            body: req.body,
            param: req.params,
            query: req.query,
        })

        req.body = body;

        next();
    }
}

export default routerSchemaValidator;
