import {TransformFnParams} from 'class-transformer';

function getTransformValue( params: TransformFnParams ): unknown
{
	return params.value as unknown;
}

export function trimString( params: TransformFnParams ): unknown
{
	const value = getTransformValue( params );

	if ( typeof value !== 'string' )
	{
		return value;
	}

	return value.trim();
}

export function trimLowercaseString( params: TransformFnParams ): unknown
{
	const value = getTransformValue( params );

	if ( typeof value !== 'string' )
	{
		return value;
	}

	return value.trim().toLowerCase();
}