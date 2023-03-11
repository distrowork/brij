"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAdditionalPropsError = void 0;
class RemoveAdditionalPropsError extends Error {
    validationErrors;
    constructor(message, validationErrors) {
        super(message);
        this.validationErrors = validationErrors;
    }
}
exports.RemoveAdditionalPropsError = RemoveAdditionalPropsError;
//# sourceMappingURL=remove-additional-props.error.js.map