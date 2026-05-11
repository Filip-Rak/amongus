import {IsOptional, IsString, MaxLength} from 'class-validator';

export class FailPaymentDto
{
	@IsOptional() @IsString() @MaxLength( 300 ) reason?: string;
}