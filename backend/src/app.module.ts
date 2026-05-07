import {Module} from '@nestjs/common';

import {DatabaseModule} from './database/database.module';
import {DatabaseService} from './database/database.service';

@Module( {
	imports : [ DatabaseModule ],
	controllers : [],
	providers : [ DatabaseService ],
} )
export class AppModule
{}
