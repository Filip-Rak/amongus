import {WithId} from 'mongodb';

import {UserRole} from './user-role.enum';

export interface UserDocument {
	email: string;
	passwordHash: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
}

export type UserRecord = WithId< UserDocument >;