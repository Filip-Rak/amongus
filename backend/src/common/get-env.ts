export function getEnv< T >( name: string, parser: ( v: string ) => T ): T
{
	const value = process.env[ name ];
	if ( !value )
	{
		throw new Error( `${name} is not set` );
	}

	return parser( value );
}