import {UserRole} from '@/users/types/user-role.enum';

export interface JwtPayload {
	sub: string;
	email: string;
	role: UserRole;
}

export type JwtUser = JwtPayload

export interface AuthUserResponse {
	id: string;
	email: string;
	role: UserRole;
}

export interface LoginResponse {
	accessToken: string;
	tokenType: 'Bearer';
	user: AuthUserResponse;
}