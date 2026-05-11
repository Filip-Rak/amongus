import {ClientSession} from 'mongodb';

export interface RepositoryOptions {
	session?: ClientSession;
}