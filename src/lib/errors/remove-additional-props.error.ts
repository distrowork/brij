/**
 * Thrown when unable to complete removing disallowed properties from an object,
 * as specified by a JSON schema.
 * The object did not validate with the schema, apart from including additional
 * properties.
 */
export class RemoveAdditionalPropsError extends Error {
  constructor(public validationErrors: any, public schema: any) {
    super('Recieved invalid object when removing additional properties')
  }
}