import {ErrorOutput} from "./ErrorOutput";

export interface OutputTransformer<TOutput extends ErrorOutput> {
	(output: TOutput, error: unknown, meta: OutputTransformer.Meta): TOutput;
}

export namespace OutputTransformer {
	export interface Meta {
		isKnown: boolean;
	}
}
