export enum OrderStatus {
	PendingPayment = 'pending_payment',
	Paid           = 'paid',
	PaymentFailed  = 'payment_failed',
	Cancelled      = 'cancelled',
	Shipped        = 'shipped',
	Completed      = 'completed',
}