import BenignError from '@/server/errors/benign-error';
import { Request } from 'express';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';


export function validateObject<T extends z.ZodTypeAny>(object: unknown, schema: T): z.infer<T> {
	const result = schema.safeParse(object);
	if (result.success === false) {
		// normally as benign error
		throw new BenignError(fromZodError(result.error as any).message);
	}

	return result.data;
}

export function validate<T extends z.ZodTypeAny>(req: Request, schema: T): z.infer<T> {
	return validateObject({ ...req.body, ...req.query, ...req.params }, schema);
}
