import {ErrorOutput} from "./ErrorOutput";
import {ErrorMapper} from "./ErrorMapper";
import {Builder} from "@pallad/builder";
import {Info, info} from "@pallad/app-env";
import {OutputTransformer} from "./OutputTransformer";
import {ErrorMapping} from "./ErrorMapping";
import {UnknownErrorListener} from "./UnknownErrorListener";

export class ErrorMapperBuilder<TOutput extends ErrorOutput> extends Builder {
	private mappings: Array<ErrorMapping<TOutput>> = [];
	private onUnknownErrorListeners: UnknownErrorListener[] = [];
	private outputTransformers: Array<OutputTransformer<TOutput>> = [];

	constructor(private options: ErrorMapperBuilder.Options = {
		showStackTrace: false,
		showUnknownErrorMessage: false
	}) {
		super();
	}

	setOptions(options: Partial<ErrorMapperBuilder.Options>) {
		this.options = {
			...this.options,
			...options
		};
		return this;
	}

	/**
	 * Creates preconfigured mapper with options suitable for environment
	 */
	static fromEnv<TOutput extends ErrorOutput>(env: Info = info) {
		return new ErrorMapperBuilder<TOutput>({
			showStackTrace: env.isDevelopment || env.isTest,
			showUnknownErrorMessage: env.isDevelopment || env.isTest
		});
	}

	registerOutputTransformer(transformer: OutputTransformer<TOutput>) {
		this.outputTransformers.push(transformer);
		return this;
	}

	onUnknownError(listener: UnknownErrorListener) {
		this.onUnknownErrorListeners.push(listener);
		return this;
	}

	registerMapping(mapper: ErrorMapping<TOutput>): this {
		this.mappings.push(mapper);
		return this;
	}

	get(): ErrorMapper<TOutput> {
		this.preconfigure();
		const computeInitialOutputForError = (err: unknown): TOutput | undefined => {
			for (const mapping of this.mappings) {
				const mappingResult = mapping(err);
				if (mappingResult) {
					return mappingResult;
				}
			}
		}

		return (err: unknown): TOutput => {
			const mappingResult = computeInitialOutputForError(err);
			const errorMeta: OutputTransformer.Meta = {
				isKnown: !!mappingResult
			};

			if (!mappingResult) {
				for (const onUnknownErrorListener of this.onUnknownErrorListeners) {
					onUnknownErrorListener(err);
				}
			}

			return this.outputTransformers.reduce(
				(output, transformer) => {
					return transformer(output, err, errorMeta);
				},
				mappingResult ?? {
					message: err instanceof Error ? err.message : 'Unknown error'
				} as TOutput
			) as TOutput;
		}
	}

	private preconfigure() {
		this.runIf(this.options.showStackTrace, () => {
			this.registerOutputTransformer((output, error) => {
				if (error && error instanceof Error && 'stack' in error) {
					return {
						...output,
						stack: error.stack
					}
				}

				return output;
			});
		});

		this.registerOutputTransformer((output, error) => {
			if (error && typeof error === 'object' && 'code' in error) {
				return {
					...output,
					code: (error as { code: string }).code
				};
			}
			return output;
		});

		this.runIf(!this.options.showUnknownErrorMessage, () => {
			this.registerOutputTransformer((output, error, {isKnown}) => {
				if (!isKnown) {
					return {
						...output,
						message: 'Internal server error. Please try again later.'
					}
				}
				return output;
			});
		})
	}
}

export namespace ErrorMapperBuilder {
	export interface Options {
		/**
		 * Whether to include stack trace in every error
		 */
		showStackTrace: boolean;

		/**
		 * Whether to show message of errors that have no registered mapper, for example for unknown or critical errors.
		 */
		showUnknownErrorMessage: boolean;
	}
}

