import {WithId} from 'mongodb';

import {UserRole} from './user-role.enum';
import {UserStatus} from './user-status.enum';

export interface UserDocument {
	email: string;
	passwordHash: string;
	role: UserRole;
	status: UserStatus;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type UserRecord = WithId< UserDocument >;