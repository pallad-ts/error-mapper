export interface ErrorOutput {
	message: string;
	code?: string;
	name?: string;
	stack?: string;

	[extraProperty: string]: unknown;
}
