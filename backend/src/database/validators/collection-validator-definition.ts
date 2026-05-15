export type MongoCollectionValidator = Record< string, unknown >;

export interface CollectionValidatorDefinition {
	collectionName: string;
	validator: MongoCollectionValidator;
}