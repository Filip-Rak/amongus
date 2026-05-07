import {Module} from '@nestjs/common';

import {DatabaseModule} from './database/database.module';
import {DatabaseService} from './database/database.service';
import {HealthModule} from './health/health.module';
import {UsersController} from './users/users.controller';
import {UsersModule} from './users/users.module';

@Module( {
	imports : [ DatabaseModule, HealthModule, UsersModule ],
	controllers : [ UsersController ],
	providers : [ DatabaseService ],
} )
export class AppModule
{}
