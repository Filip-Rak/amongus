export function omitUndefined< T extends object >( object: T ): Partial< T >
{
	return Object.fromEntries(
	           Object.entries( object ).filter( ( [, value ] ) => value !== undefined ),
	           ) as Partial< T >;
}