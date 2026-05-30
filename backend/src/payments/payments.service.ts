import {isMongoDocumentValidationError} from '@/common/mongo/mongo-errors';
import {getMongoValidationMessages} from '@/common/mongo/mongo-validation-error';
import {omitUndefined} from '@/common/utils/object.utils';
import {DatabaseService} from '@/database/database.service';
import {OrdersRepository} from '@/orders/orders.repository';
import {UserRole} from '@/users/types/user-role.enum';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {ObjectId} from 'mongodb';

import {FailPaymentDto} from './dto/fail-payment.dto';
import {PaymentResponseDto} from './dto/payment-response.dto';
import {PaymentsRepository} from './payments.repository';
import {PaymentRecord} from './types/payment-document.type';
import {PaymentStatus} from './types/payment-status.enum';

@Injectable() export class PaymentsService
{
	constructor(
	    private readonly databaseService: DatabaseService,
	    private readonly paymentsRepository: PaymentsRepository,
	    private readonly ordersRepository: OrdersRepository,
	)
	{}

	async mockSuccess(
	    paymentId: ObjectId,
	    requestUser: { id: ObjectId; role : UserRole },
	    ): Promise< PaymentResponseDto >
	{
		return this.withPaymentWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const payment = await this.getPaymentOrThrow( paymentId, {
				    session,
			    } );

			    this.assertPaymentAccess( payment, requestUser );

			    if ( payment.status !== PaymentStatus.Pending )
			    {
				    throw new ConflictException( 'Payment is not pending' );
			    }

			    const updatedPayment = await this.paymentsRepository.markPaid(
			        paymentId,
			        {
				        session,
			        },
			    );

			    if ( !updatedPayment )
			    {
				    throw new ConflictException( 'Payment could not be marked as paid' );
			    }

			    const updatedOrder = await this.ordersRepository.markPaid(
			        payment.orderId,
			        {
				        session,
			        },
			    );

			    if ( !updatedOrder )
			    {
				    throw new ConflictException( 'Order could not be marked as paid' );
			    }

			    return this.toResponseDto( updatedPayment );
		    } ),
		);
	}

	async mockFailure(
	    paymentId: ObjectId,
	    requestUser: { id: ObjectId; role : UserRole },
	    dto: FailPaymentDto,
	    ): Promise< PaymentResponseDto >
	{
		return this.withPaymentWriteErrorHandling(
		    async () => this.databaseService.withTransaction( async ( session ) => {
			    const payment = await this.getPaymentOrThrow( paymentId, {
				    session,
			    } );

			    this.assertPaymentAccess( payment, requestUser );

			    if ( payment.status !== PaymentStatus.Pending )
			    {
				    throw new ConflictException( 'Payment is not pending' );
			    }

			    const reason = dto.reason?.trim() || 'Mock payment failed';

			    const updatedPayment = await this.paymentsRepository.markFailed(
			        paymentId,
			        reason,
			        {
				        session,
			        },
			    );

			    if ( !updatedPayment )
			    {
				    throw new ConflictException( 'Payment could not be marked as failed' );
			    }

			    const updatedOrder = await this.ordersRepository.markPaymentFailed(
			        payment.orderId,
			        {
				        session,
			        },
			    );

			    if ( !updatedOrder )
			    {
				    throw new ConflictException( 'Order could not be marked as payment failed' );
			    }

			    return this.toResponseDto( updatedPayment );
		    } ),
		);
	}

	private async getPaymentOrThrow(
	    paymentId: ObjectId,
	    options?: { session?: import( 'mongodb' ).ClientSession },
	    ): Promise< PaymentRecord >
	{
		const payment = await this.paymentsRepository.findById( paymentId, options );

		if ( !payment )
		{
			throw new NotFoundException( 'Payment not found' );
		}

		return payment;
	}

	private assertPaymentAccess(
	    payment: PaymentRecord,
	    requestUser: { id: ObjectId; role : UserRole },
	    ): void
	{
		if ( requestUser.role === UserRole.Admin )
		{
			return;
		}

		if ( payment.userId.equals( requestUser.id ) )
		{
			return;
		}

		throw new ForbiddenException( 'You cannot access this payment' );
	}

	private async withPaymentWriteErrorHandling< T >(
	    operation: () => Promise< T >,
	    ): Promise< T >
	{
		try
		{
			return await operation();
		}
		catch ( error )
		{
			if ( isMongoDocumentValidationError( error ) )
			{
				throw new BadRequestException( {
					message : 'Payment failed database validation',
					validationErrors : getMongoValidationMessages( error ),
				} );
			}

			throw error;
		}
	}

	private toResponseDto( payment: PaymentRecord ): PaymentResponseDto
	{
		return omitUndefined( {
			       id : payment._id.toHexString(),
			       orderId : payment.orderId.toHexString(),
			       userId : payment.userId.toHexString(),
			       provider : payment.provider,
			       status : payment.status,
			       amount : payment.amount,
			       currency : payment.currency,
			       mockTransactionId : payment.mockTransactionId,
			       failureReason : payment.failureReason,
			       createdAt : payment.createdAt.toISOString(),
			       updatedAt : payment.updatedAt.toISOString(),
			       paidAt : payment.paidAt?.toISOString(),
			       failedAt : payment.failedAt?.toISOString(),
		       } ) as PaymentResponseDto;
	}
}