import {ErrorMapperBuilder} from '../ErrorMapperBuilder';
import * as sinon from 'sinon';

describe('ErrorMapperBuilder', () => {
	describe('forwarding "code"', () => {
		const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: true}).get();
		it('forward "code" if available', () => {
			const error = new Error('message');
			(error as any).code = 'TEST';

			expect(mapper(error))
				.toHaveProperty('code', 'TEST');
		});

		it('does not forward code if not available', () => {
			const error = new Error('message');

			expect(mapper(error))
				.not.toHaveProperty('code');
		});
	});

	describe('forwarding "stack"', () => {
		it('forward if enabled and "stack" is available', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: true, showUnknownErrorMessage: false}).get();
			const error = new Error('test');
			expect(mapper(error))
				.toHaveProperty('stack', error.stack);
		})

		it('does not forward if enabled and "stack" is not available', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: true, showUnknownErrorMessage: false}).get();
			const error = {not: 'an error'} as any;
			expect(mapper(error))
				.not.toHaveProperty('stack');
		});

		it('does not forward if disabled and "stack" is available', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false}).get();
			const error = new Error('test');
			expect(mapper(error))
				.not.toHaveProperty('stack');
		});
	});

	describe('showing critical error', () => {
		it('showing if enabled and it is an unknown error', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: true}).get();
			const error = new Error('test');
			expect(mapper(error))
				.toHaveProperty('message', error.message);
		});

		it('not showing if enabled and it is not an unknown error', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: true})
				.registerMapping(() => {
					return {
						message: 'Not Found'
					};
				})
				.get();

			const error = new Error('test');
			expect(mapper(error))
				.toHaveProperty('message', 'Not Found');
		});

		it('not showing if disabled', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false}).get();
			const error = new Error('test');
			expect(mapper(error))
				.toHaveProperty('message', 'Internal server error. Please try again later.');
		});

		it('properly shows message of errors that are not unknown', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false})
				.registerMapping(() => {
					return {message: 'Not Found'}
				})
				.get();

			const error = new Error('test');
			expect(mapper(error))
				.toHaveProperty('message', 'Not Found');
		});
	});

	describe('mapping error', () => {
		it('stops on first mapper that returns mapping result', () => {
			const errorMapper1 = sinon.stub();
			const errorMapper2 = sinon.stub().callsFake(() => {
				return {message: 'Not Found'}
			});
			const errorMapper3 = sinon.stub();

			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: true})
				.registerMapping(errorMapper1)
				.registerMapping(errorMapper2)
				.registerMapping(errorMapper3)
				.get();

			const error = new Error('test')
			expect(mapper(error))
				.toHaveProperty('message', 'Not Found');
			sinon.assert.calledOnce(errorMapper1);
			sinon.assert.calledOnce(errorMapper2);
			sinon.assert.notCalled(errorMapper3);
		});
	});

	describe('unknown error listeners', () => {
		it('called on unknown errors', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false})
				.onUnknownError(spy1)
				.onUnknownError(spy2)
				.get();

			const error = new Error('test');
			mapper(error);

			sinon.assert.calledWith(spy1, error);
			sinon.assert.calledWith(spy2, error);
		});

		it('not called on known errors', () => {
			const spy1 = sinon.spy();
			const spy2 = sinon.spy();

			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false})
				.registerMapping(() => {
					return {
						message: 'Not Found'
					}
				})
				.onUnknownError(spy1)
				.onUnknownError(spy2)
				.get();

			mapper(new Error('test'));

			sinon.assert.notCalled(spy1);
			sinon.assert.notCalled(spy2);
		});
	});

	describe('setting options', () => {
		it('showing stack trace', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false})
				.setOptions({showStackTrace: true})
				.get()

			expect(mapper(new Error('test')))
				.toHaveProperty('stack');
		});

		it('showing unknown error', () => {
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: false})
				.setOptions({showUnknownErrorMessage: true})
				.get()

			expect(mapper(new Error('test')))
				.toHaveProperty('message', 'test');
		})
	});

	describe('output formatters', () => {
		describe('output formatter is called with a regular original error and meta', () => {
			const formatter = sinon.stub().callsFake((output: any) => ({...output, fake: 1}));

			const mappedOutput = {
				message: 'Invalid'
			};
			const error1 = new Error('test');
			const error2 = new Error('test2');
			const mapper = new ErrorMapperBuilder({showStackTrace: false, showUnknownErrorMessage: true})
				.registerMapping(error => {
					if (error1 === error) {
						return mappedOutput;
					}
				})
				.registerOutputTransformer(formatter)
				.get();

			afterEach(() => {
				formatter.resetHistory();
			});

			it('where meta marks error as known if mapper is registered for it', () => {
				expect(mapper(error1))
					.toHaveProperty('fake', 1);

				sinon.assert.calledWith(
					formatter,
					mappedOutput,
					error1,
					{isKnown: true}
				);
			});

			it('where meta marks error as unknown if there is no mapper registered for it', () => {
				expect(mapper(error2))
					.toHaveProperty('fake', 1);

				sinon.assert.calledWith(
					formatter,
					{message: error2.message},
					error2,
					{isKnown: false}
				);
			});
		});
	});
});
