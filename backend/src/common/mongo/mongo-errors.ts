import {MongoServerError} from 'mongodb';

export function isMongoDuplicateKeyError(
    error: unknown,
    ): error is MongoServerError
{
	return error instanceof MongoServerError && error.code === 11000;
}

export function isMongoDocumentValidationError(
    error: unknown,
    ): error is MongoServerError
{
	return error instanceof MongoServerError && error.code === 121;
}

export function isMongoNamespaceNotFoundError(
    error: unknown,
    ): error is MongoServerError
{
	return ( error instanceof MongoServerError && error.codeName === 'NamespaceNotFound' );
}