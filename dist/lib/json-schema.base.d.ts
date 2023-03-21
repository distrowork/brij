import { ErrorObject } from 'ajv';
import { JSONSchema7 } from 'json-schema';
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
    get schema(): JSONSchema7;
    constructor(schema: JSONSchema7);
    validate(o: any): ValidationResult;
    removeAdditional<T>(o: T): T;
}
//# sourceMappingURL=json-schema.base.d.ts.map