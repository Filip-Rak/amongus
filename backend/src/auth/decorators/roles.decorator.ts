import {UserRole} from '@/users/types/user-role.enum';
import {SetMetadata} from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = ( ...roles: UserRole[] ): MethodDecorator&ClassDecorator => SetMetadata( ROLES_KEY, roles );