import {ErrorMapperBuilder} from "@pallad/error-mapper";
import {ZodError} from 'zod';


const errorMapper = ErrorMapperBuilder.fromEnv()
	.registerMapping((err) => {
		if (err instanceof ZodError) {
			return {message: 'Invalid data', issues: err.issues};
		}
	})
	.get();

errorMapper(someZodError); // {message: 'Invalid data', issues: [{ issues }]}
errorMapper(new Error('Fatal error')); // {message: 'Internal server error. Please try again later.'}
