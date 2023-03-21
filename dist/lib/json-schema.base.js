"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSchema = exports.ajvRemoveAdditional = exports.ajv = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const remove_additional_props_error_1 = require("./errors/remove-additional-props.error");
exports.ajv = (0, ajv_formats_1.default)(new ajv_1.default({
    strictSchema: false
}));
exports.ajvRemoveAdditional = (0, ajv_formats_1.default)(new ajv_1.default({
    strictSchema: false,
    removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
}));
/*
 * Base JSON schema validator class

 * Uses ajv

 * Provides methods for validation and removal of extra properies not allowed in the schema
 */
class JSONSchema {
    _schema;
    _validate;
    _removeAdditional;
    get ajv() {
        return exports.ajv;
    }
    get schema() {
        return JSON.parse(JSON.stringify(this._schema));
    }
    constructor(schema) {
        this._schema = schema;
        this._validate = exports.ajv.compile(schema);
        this._removeAdditional = exports.ajvRemoveAdditional.compile(schema);
    }
    validate(o) {
        const valid = this._validate(o);
        return {
            valid,
            errors: this._validate.errors
        };
    }
    removeAdditional(o) {
        // This mutates the object by removing properties that aren't in the schema
        const valid = this._removeAdditional(o);
        if (!valid) {
            throw new remove_additional_props_error_1.RemoveAdditionalPropsError(this._removeAdditional.errors, this.schema);
        }
        return o;
    }
}
exports.JSONSchema = JSONSchema;
//# sourceMappingURL=json-schema.base.js.map