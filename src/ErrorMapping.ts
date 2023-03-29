import {ErrorOutput} from "./ErrorOutput";

export interface ErrorMapping<TOutput extends ErrorOutput> {
	(error: unknown): TOutput | undefined;
}
