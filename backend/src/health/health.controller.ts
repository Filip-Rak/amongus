import {Controller, Get} from '@nestjs/common';

import {DatabaseService} from '../database/database.service';

@Controller( 'health' ) export class HealthController
{
	constructor( private readonly databaseService: DatabaseService ) {}

	@Get() getHealth()
	{
		return {
			status : 'ok',
			timestamp : new Date().toISOString(),
		};
	}

	@Get( 'db' ) async getDatabaseHealth()
	{
		const isConnected = await this.databaseService.ping();

		return {
			database : isConnected ? 'connected' : 'disconnected',
			timestamp : new Date().toISOString(),
		};
	}
}