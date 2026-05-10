import {UserRole} from '@/users/types/user-role.enum';
import {UserStatus} from '@/users/types/user-status.enum';

export interface UserResponseDto {
	id: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}