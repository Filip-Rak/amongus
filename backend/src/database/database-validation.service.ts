import {isMongoNamespaceNotFoundError} from '@/common/mongo/mongo-errors';
import {Injectable, Logger, OnModuleInit} from '@nestjs/common';

import {DatabaseService} from './database.service';
import {CollectionValidatorDefinition} from './validators/collection-validator-definition';
import {databaseValidators} from './validators/database-validators';

@Injectable() export class DatabaseValidationService implements OnModuleInit
{
	private readonly logger = new Logger( DatabaseValidationService.name );

	constructor( private readonly databaseService: DatabaseService ) {}

	async onModuleInit(): Promise< void >
	{
		for ( const validatorDefinition of databaseValidators )
		{
			await this.applyCollectionValidator( validatorDefinition );
		}
	}

	private async applyCollectionValidator(
	    definition: CollectionValidatorDefinition,
	    ): Promise< void >
	{
		const db = this.databaseService.getDb();

		try
		{
			await db.command( {
				collMod : definition.collectionName,
				validator : definition.validator,
				validationLevel : 'strict',
				validationAction : 'error',
			} );

			this.logger.log(
			    `Updated validator for collection "${definition.collectionName}"`,
			);
		}
		catch ( error )
		{
			if ( isMongoNamespaceNotFoundError( error ) )
			{
				await db.createCollection( definition.collectionName, {
					validator : definition.validator,
					validationLevel : 'strict',
					validationAction : 'error',
				} );

				this.logger.log(
				    `Created collection "${definition.collectionName}" with validator`,
				);
				return;
			}

			throw error;
		}
	}
}