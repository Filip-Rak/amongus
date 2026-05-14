import {OrdersModule} from '@/orders/orders.module';
import {ProductsModule} from '@/products/products.module';
import {Module} from '@nestjs/common';

import {ReviewsController} from './reviews.controller';
import {ReviewsRepository} from './reviews.repository';
import {ReviewsService} from './reviews.service';

@Module( {
	imports : [
		ProductsModule,
		OrdersModule,
	],
	controllers : [ ReviewsController ],
	providers : [
		ReviewsService,
		ReviewsRepository,
	],
	exports : [
		ReviewsService,
		ReviewsRepository,
	],
} )
export class ReviewsModule
{}