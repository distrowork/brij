export class RemoveAdditionalPropsError extends Error {
  constructor(message: string, public validationErrors: any) {
    super(message)
  }
}