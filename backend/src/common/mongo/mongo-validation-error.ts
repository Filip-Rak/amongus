import {MongoServerError} from 'mongodb';

type UnknownRecord = Record< string, unknown >;

function isRecord( value: unknown ): value is UnknownRecord
{
	return typeof value === 'object' && value !== null;
}

function asString( value: unknown ): string|undefined
{
	return typeof value === 'string' ? value : undefined;
}

function asRecordArray( value: unknown ): UnknownRecord[]
{
	if ( !Array.isArray( value ) )
	{
		return [];
	}

	return value.filter( isRecord );
}

function getErrInfo( error: MongoServerError ): UnknownRecord|undefined
{
	if ( isRecord( error.errInfo ) )
	{
		return error.errInfo;
	}

	const errorResponse = isRecord( error.errorResponse ) ? error.errorResponse : undefined;

	if ( errorResponse && isRecord( errorResponse.errInfo ) )
	{
		return errorResponse.errInfo;
	}

	return undefined;
}

export function getMongoValidationMessages( error: MongoServerError ): string[]
{
	const errInfo = getErrInfo( error );

	if ( !errInfo )
	{
		return [ 'Document failed database validation' ];
	}

	const details = isRecord( errInfo.details ) ? errInfo.details : undefined;

	if ( !details )
	{
		return [ 'Document failed database validation' ];
	}

	const messages = extractMessagesFromRule( details );

	return messages.length > 0 ? messages : [ 'Document failed database validation' ];
}

function extractMessagesFromRule( rule: UnknownRecord, path = '' ): string[]
{
	const messages: string[] = [];
	const operatorName       = asString( rule.operatorName );

	if ( operatorName === 'required' )
	{
		messages.push( ...extractRequiredMessages( rule, path ) );
	}

	if ( operatorName === 'properties' )
	{
		messages.push( ...extractPropertyMessages( rule, path ) );
	}

	if ( operatorName !== undefined && operatorName !== 'required' && operatorName !== 'properties' )
	{
		const reason          = asString( rule.reason );
		const specifiedAs     = rule.specifiedAs;
		const consideredValue = rule.consideredValue;

		messages.push(
		    [
			    path || 'document',
			    `failed "${operatorName}" validation`,
				reason ? `reason: ${reason}` : undefined,
				specifiedAs !== undefined ? `specifiedAs: ${JSON.stringify( specifiedAs )}` : undefined,
				consideredValue !== undefined ? `consideredValue: ${JSON.stringify( consideredValue )}` : undefined,
			].filter( Boolean )
				.join( '; ' ),
		);
	}

	for ( const nestedRule of asRecordArray( rule.schemaRulesNotSatisfied ) )
	{
		messages.push( ...extractMessagesFromRule( nestedRule, path ) );
	}

	return messages;
}

function extractRequiredMessages( rule: UnknownRecord, path: string ): string[]
{
	if ( !Array.isArray( rule.missingProperties ) )
	{
		return [];
	}

	return rule.missingProperties.filter( ( property ): property is string => typeof property === 'string' )
	    .map( ( property ) => `${joinPath( path, property )} is required` );
}

function extractPropertyMessages( rule: UnknownRecord, path: string ): string[]
{
	const messages: string[] = [];

	for ( const propertyRule of asRecordArray( rule.propertiesNotSatisfied ) )
	{
		const propertyName = asString( propertyRule.propertyName );
		const propertyPath = propertyName ? joinPath( path, propertyName ) : path;

		for ( const detail of asRecordArray( propertyRule.details ) )
		{
			messages.push( ...extractMessagesFromRule( detail, propertyPath ) );
		}

		for ( const nestedRule of asRecordArray( propertyRule.schemaRulesNotSatisfied ) )
		{
			messages.push( ...extractMessagesFromRule( nestedRule, propertyPath ) );
		}

		if ( !Array.isArray( propertyRule.details ) && !Array.isArray( propertyRule.schemaRulesNotSatisfied ) )
		{
			messages.push( `${propertyPath || 'document'} failed validation` );
		}
	}

	return messages;
}

function joinPath( parent: string, child: string ): string
{
	return parent ? `${parent}.${child}` : child;
}