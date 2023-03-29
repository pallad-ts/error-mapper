<div align="center">
<h1>error-mapper ❄️</h1>

<p>Minimal, general purpose error mapping</p>
</div>

---
[![CircleCI](https://circleci.com/gh/pallad-ts/error-mapper/tree/master.svg?style=svg)](https://circleci.com/gh/pallad-ts/error-mapper/tree/master)
[![npm version](https://badge.fury.io/js/@pallad%2Ferror-mapper.svg)](https://badge.fury.io/js/@pallad%2Ferror-mapper)
[![Coverage Status](https://coveralls.io/repos/github/pallad-ts/error-mapper/badge.svg?branch=master)](https://coveralls.io/github/pallad-ts/error-mapper?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
---

![Example code](./assets/intro-code.png)

# Community

Join our [discord server](https://discord.gg/G5tSBYbpej)

# Installation

```shell
npm install @pallad/error-mapper
```

# Problem

// TODO

# Solution

Have a set of rules that defines how certain error should be represented.
`error-mapper` helps with that by providing options to handle unknown errors, hiding error message for them (depending
on environment) or displaying stack for development environments.

# Usage and how it works

Simple example

```typescript
const errorMapper = ErrorMapperBuilder.fromEnv()
	.registerOutputTransformer((output, error) => { // decorates final output 
		if (error instanceof Error) {
			return {...output, name: error.name}
		}
		return output;
	})
	.registerMapping(error => { // decides how error should be represented
		if (error instanceof ValidationError) {
			return {
				message: 'Invalid data',
				violations: error.getViolations(),
				statusCode: 400
			}
		}
	})
	.get()


app.use((err, req, res, next) => {
	const {statusCode, ...rest} = errorMapper(err);
	res.status(statusCode ?? 500)
		.json(rest)
})
```

`ErrorMapping` is a function that receives and error and decides whether can handle it by returning desired output.

For example you might want to return validation errors or extra details about `NotFound` error, to the output.

Example:

```typescript
ErrorMapperBuilder.fromEnv()
	.registerMapping(error => {
		if (error instanceof ValidationError) {
			return {
				message: 'Invalid data',
				violations: error.getViolations() // extract validation errors like "name is too long"
			}
		}
	})
	.get()
```

`OutputFormatter` is a function that receives output from a mapper (or default output if no mapper registered) and
transforms it.
This is a good opportunity to decorate output regardless of mappers.

For example you might want to populate `name` of the error.

```typescript
ErrorMapperBuilder.fromEnv()
	.registerOutputTransformer((output, error) => {
		if (error instanceof Error) {
			return {...output, name: error.name}
		}
		return output;
	})
	.get()
```

Whenever final mapper gets called, error mappers are invoked in registration order until the one that is able to handle
the error returns an output. Output then gets formatted by registered output transformers and returned.

`error-mapper` has no idea what to do with created output and you are responsible to do whatever is needed to properly
represent the situation.

```typescript
app.use((err, req, res, next) => {
	const {statusCode, ...rest} = errorMapper(err);
	res.status(statusCode ?? 500) // use statusCode
		.json(rest) // and display the rest
})
```

## Showing error stack

`stack` is returned only if option `showStackTrace` is set - default `false`.

When `ErrorMapperBuilder.fromEnv` is used then it is set to true for `development` and `test` environment (determined
by [app-env](https://github.com/pallad-ts/app-env)).

```typescript 
import {ErrorMapperBuilder} from '@pallad/error-mapper';

const errorMapper = new ErrorMapperBuilder()
	.setOptions({showStackTrace: true})
	.get()

const result = errorMapper(new Error('test'))
/**
 * {stack: 'Error: test\n    at REPL6:1:1\n    at Script.runInThisContext (node:vm:129:12)'}
 */
```

## Showing unknown errors

By default unknown error (the one that has no mapper) is displayed only for `development` and `test` environment (
determined
by [app-env](https://github.com/pallad-ts/app-env)).

Unknown error message (the one that has no mapper) is returned only if option `showUnknownError` is set -
default `false`.

When `ErrorMapperBuilder.fromEnv` is used then it is set to true for `development` and `test` environment (determined
by [app-env](https://github.com/pallad-ts/app-env)).

If set to `false` then message `"Internal server error. Please try again later."` is returned instead of original error
message.

```typescript 
import {ErrorMapperBuilder} from '@pallad/error-mapper';

const errorMapper = new ErrorMapperBuilder()
	.setOptions({showUnknownError: true})
	.get()

errorMapper(new Error('Test error message'))
/**
 * {message: "Test error message"}
 */

const errorMapper2 = new ErrorMapperBuilder()
	.setOptions({showUnknownError: false})
	.get()

errorMapper2(new Error('Test error message'))
/**
 * {message: "Internal server error. Please try again later."}
 */
```

## Callback on unknown errors

If none or registered mapping is able to handle the error you can optionally listen to them.
Listener has no effect on produced output.

```typescript
const mapper = ErrorMapperBuilder()
	.onUnknownError(error => {
        console.error('Fatal error we do not know how to handle', error);
	})
	.get()
```

# Real life examples

## Mapping from Zod error

// TODO

## Mapping authentication error

// TODO

## Mapping Not Found error

// TODO