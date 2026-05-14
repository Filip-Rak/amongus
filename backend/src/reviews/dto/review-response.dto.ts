export interface ReviewResponseDto {
	id: string;
	productId: string;
	userId: string;
	orderId: string;

	rating: number;
	title?: string;
	comment?: string;

	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export interface PaginatedReviewsResponseDto {
	items: ReviewResponseDto[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}