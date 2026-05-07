import {JwtUser} from '@/auth/auth.types';
import {ROLES_KEY} from '@/auth/decorators/roles.decorator';
import {UserRole} from '@/users/types/user-role.enum';
import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';

@Injectable() export class RolesGuard implements CanActivate
{
	constructor( private readonly reflector: Reflector ) {}

	canActivate( context: ExecutionContext ): boolean
	{
		const requiredRoles = this.reflector.getAllAndOverride< UserRole[] >(
		    ROLES_KEY,
		    [ context.getHandler(), context.getClass() ],
		);

		if ( !requiredRoles || requiredRoles.length === 0 )
		{
			return true;
		}

		const request = context.switchToHttp().getRequest< { user?: JwtUser } >();
		const user    = request.user;

		if ( !user )
		{
			throw new ForbiddenException( 'User not found in request' );
		}

		if ( !requiredRoles.includes( user.role ) )
		{
			throw new ForbiddenException( 'Insufficient permissions' );
		}

		return true;
	}
}