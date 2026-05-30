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

function extractMessagesFromRule(
    rule: UnknownRecord,
    path = '',
    ): string[]
{
	const messages: string[] = [];

	const operatorName = asString( rule.operatorName );

	if ( operatorName === 'required' )
	{
		messages.push( ...extractRequiredMessages( rule, path ) );
	}

	if ( operatorName === 'properties' )
	{
		messages.push( ...extractPropertyMessages( rule, path ) );
	}

	if ( operatorName === 'items' )
	{
		messages.push( ...extractItemsMessages( rule, path ) );
	}

	if ( operatorName !== undefined && operatorName !== 'required' && operatorName !== 'properties' &&
	     operatorName !== 'items' )
	{
		messages.push( formatRuleFailure( rule, path, operatorName ) );
	}

	for ( const nestedRule of asRecordArray( rule.schemaRulesNotSatisfied ) )
	{
		messages.push( ...extractMessagesFromRule( nestedRule, path ) );
	}

	return messages;
}

function extractRequiredMessages(
    rule: UnknownRecord,
    path: string,
    ): string[]
{
	if ( !Array.isArray( rule.missingProperties ) )
	{
		return [];
	}

	return rule.missingProperties.filter( ( property ): property is string => typeof property === 'string' )
	    .map( ( property ) => `${joinPath( path, property )} is required` );
}

function extractPropertyMessages(
    rule: UnknownRecord,
    path: string,
    ): string[]
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

		for ( const nestedRule of asRecordArray( propertyRule.propertiesNotSatisfied ) )
		{
			messages.push( ...extractPropertyMessages(
			    {
				    operatorName : 'properties',
				    propertiesNotSatisfied : [ nestedRule ],
			    },
			    propertyPath,
			    ) );
		}

		for ( const nestedRule of asRecordArray( propertyRule.itemsNotSatisfied ) )
		{
			messages.push( ...extractItemsMessages(
			    {
				    operatorName : 'items',
				    itemsNotSatisfied : [ nestedRule ],
			    },
			    propertyPath,
			    ) );
		}

		if ( messages.length === 0 )
		{
			messages.push( `${propertyPath || 'document'} failed validation` );
		}
	}

	return messages;
}

function extractItemsMessages(
    rule: UnknownRecord,
    path: string,
    ): string[]
{
	const messages: string[] = [];

	for ( const itemRule of asRecordArray( rule.itemsNotSatisfied ) )
	{
		const itemIndex = getItemIndex( itemRule );
		const itemPath  = itemIndex === undefined ? `${path}[]` : `${path}[${itemIndex}]`;

		for ( const detail of asRecordArray( itemRule.details ) )
		{
			messages.push( ...extractMessagesFromRule( detail, itemPath ) );
		}

		for ( const nestedRule of asRecordArray( itemRule.schemaRulesNotSatisfied ) )
		{
			messages.push( ...extractMessagesFromRule( nestedRule, itemPath ) );
		}

		for ( const nestedRule of asRecordArray( itemRule.propertiesNotSatisfied ) )
		{
			messages.push( ...extractPropertyMessages(
			    {
				    operatorName : 'properties',
				    propertiesNotSatisfied : [ nestedRule ],
			    },
			    itemPath,
			    ) );
		}

		if ( !Array.isArray( itemRule.details ) && !Array.isArray( itemRule.schemaRulesNotSatisfied ) &&
		     !Array.isArray( itemRule.propertiesNotSatisfied ) )
		{
			messages.push( `${itemPath} failed validation` );
		}
	}

	return messages;
}

function getItemIndex( rule: UnknownRecord ): number|undefined
{
	const index = rule.itemIndex ?? rule.index;

	if ( typeof index === 'number' )
	{
		return index;
	}

	return undefined;
}

function formatRuleFailure(
    rule: UnknownRecord,
    path: string,
    operatorName: string,
    ): string
{
	const reason          = asString( rule.reason );
	const specifiedAs     = rule.specifiedAs;
	const consideredValue = rule.consideredValue;

	return [
		path || 'document',
		`failed "${operatorName}" validation`,
		reason ? `reason: ${reason}` : undefined,
		specifiedAs !== undefined ? `specifiedAs: ${JSON.stringify( specifiedAs )}` : undefined,
		consideredValue !== undefined ? `consideredValue: ${JSON.stringify( consideredValue )}` : undefined,
	].filter( Boolean )
		.join( '; ' );
}

function joinPath( parent: string, child: string ): string
{
	return parent ? `${parent}.${child}` : child;
}