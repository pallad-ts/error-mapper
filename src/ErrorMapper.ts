import {ErrorOutput} from "./ErrorOutput";

export type ErrorMapper<TOutput extends ErrorOutput> = (error: unknown) => TOutput;
