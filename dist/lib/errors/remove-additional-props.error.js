"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAdditionalPropsError = void 0;
/**
 * Thrown when unable to complete removing disallowed properties from an object,
 * as specified by a JSON schema.
 * The object did not validate with the schema, apart from including additional
 * properties.
 */
class RemoveAdditionalPropsError extends Error {
    validationErrors;
    schema;
    constructor(validationErrors, schema) {
        super('Recieved invalid object when removing additional properties');
        this.validationErrors = validationErrors;
        this.schema = schema;
    }
}
exports.RemoveAdditionalPropsError = RemoveAdditionalPropsError;
//# sourceMappingURL=remove-additional-props.error.js.map