import {ErrorOutput} from "./ErrorOutput";

export interface OutputTransformer<TOutput extends ErrorOutput> {
	(output: ErrorOutput, error: unknown, meta: OutputTransformer.Meta): ErrorOutput;
}

export namespace OutputTransformer {
	export interface Meta {
		isKnown: boolean;
	}
}
