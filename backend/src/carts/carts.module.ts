import {ProductsModule} from '@/products/products.module';
import {Module} from '@nestjs/common';

import {CartsController} from './carts.controller';
import {CartsRepository} from './carts.repository';
import {CartsService} from './carts.service';

@Module( {
	imports : [ ProductsModule ],
	controllers : [ CartsController ],
	providers : [
		CartsService,
		CartsRepository,
	],
	exports : [
		CartsService,
		CartsRepository,
	],
} )
export class CartsModule
{}