import {PAYMENT_FAILURE_REASON_MAX_LENGTH} from '@/common/validation/validation-limits';
import {IsOptional, IsString, MaxLength} from 'class-validator';

export class FailPaymentDto
{
	@IsOptional() @IsString() @MaxLength( PAYMENT_FAILURE_REASON_MAX_LENGTH ) reason?: string;
}