/**
 * Thrown when unable to complete removing disallowed properties from an object,
 * as specified by a JSON schema.
 * The object did not validate with the schema, apart from including additional
 * properties.
 */
export declare class RemoveAdditionalPropsError extends Error {
    validationErrors: any;
    schema: any;
    constructor(validationErrors: any, schema: any);
}
//# sourceMappingURL=remove-additional-props.error.d.ts.map