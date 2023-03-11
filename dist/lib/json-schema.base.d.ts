import { ErrorObject } from 'ajv';
/**
 * WARNING: Be mindful updating the interface of this file.
 *
 * This file is is used as the base JSON schema validator class for
 * validators generated from OAS schemas
 */
export declare const ajv: import("ajv/dist/core").default;
export declare const ajvRemoveAdditional: import("ajv/dist/core").default;
export interface ValidationResult {
    valid: boolean;
    errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined;
}
export declare class JSONSchema {
    private _schema;
    private _validate;
    private _removeAdditional;
    get ajv(): import("ajv/dist/core").default;
    get schema(): any;
    constructor(schema: any);
    validate(o: any): ValidationResult;
    removeAdditional<T>(o: T): T;
}
//# sourceMappingURL=json-schema.base.d.ts.map