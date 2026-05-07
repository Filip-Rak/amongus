import {UserRole} from '../types/user-role.enum';

export interface UserResponseDto {
	id: string;
	email: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
}