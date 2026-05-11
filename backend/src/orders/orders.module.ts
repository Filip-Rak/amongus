import {CartsModule} from '@/carts/carts.module';
import {PaymentsModule} from '@/payments/payments.module';
import {ProductsModule} from '@/products/products.module';
import {forwardRef, Module} from '@nestjs/common';

import {OrdersController} from './orders.controller';
import {OrdersRepository} from './orders.repository';
import {OrdersService} from './orders.service';

@Module( {
	imports : [
		CartsModule,
		ProductsModule,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		forwardRef( () => PaymentsModule ),
	],
	controllers : [ OrdersController ],
	providers : [
		OrdersService,
		OrdersRepository,
	],
	exports : [
		OrdersService,
		OrdersRepository,
	],
} )
export class OrdersModule
{}