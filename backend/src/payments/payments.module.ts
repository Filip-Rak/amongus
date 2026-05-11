import {OrdersModule} from '@/orders/orders.module';
import {forwardRef, Module} from '@nestjs/common';

import {PaymentsController} from './payments.controller';
import {PaymentsRepository} from './payments.repository';
import {PaymentsService} from './payments.service';

@Module( {
	imports : [
		forwardRef( () => OrdersModule ),
	],
	controllers : [ PaymentsController ],
	providers : [
		PaymentsService,
		PaymentsRepository,
	],
	exports : [
		PaymentsService,
		PaymentsRepository,
	],
} )
export class PaymentsModule
{}