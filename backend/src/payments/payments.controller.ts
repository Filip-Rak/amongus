import type {JwtUser} from '@/auth/auth.types';
import {CurrentUser} from '@/auth/decorators/current-user.decorator';
import {ParseObjectIdPipe} from '@/common/pipes/parse-object-id.pipe';
import {Body, Controller, Param, Post} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {FailPaymentDto} from './dto/fail-payment.dto';
import {PaymentResponseDto} from './dto/payment-response.dto';
import {PaymentsService} from './payments.service';

@Controller( 'payments' ) export class PaymentsController
{
	constructor( private readonly paymentsService: PaymentsService ) {}

	@Post( ':id/mock-success' )
	mockSuccess(
	    @CurrentUser() user: JwtUser,
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    ): Promise< PaymentResponseDto >
	{
		return this.paymentsService.mockSuccess( id, {
			id : new ObjectId( user.sub ),
			role : user.role,
		} );
	}

	@Post( ':id/mock-failure' )
	mockFailure(
	    @CurrentUser() user: JwtUser,
	    @Param( 'id', ParseObjectIdPipe ) id: ObjectId,
	    @Body() dto: FailPaymentDto,
	    ): Promise< PaymentResponseDto >
	{
		return this.paymentsService.mockFailure(
		    id,
		    {
			    id : new ObjectId( user.sub ),
			    role : user.role,
		    },
		    dto,
		);
	}
}