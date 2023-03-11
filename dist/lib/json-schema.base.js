"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSchema = exports.ajvRemoveAdditional = exports.ajv = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const remove_additional_props_error_1 = require("./errors/remove-additional-props.error");
/**
 * WARNING: Be mindful updating the interface of this file.
 *
 * This file is is used as the base JSON schema validator class for
 * validators generated from OAS schemas
 */
exports.ajv = (0, ajv_formats_1.default)(new ajv_1.default({
    strictSchema: false
}));
exports.ajvRemoveAdditional = (0, ajv_formats_1.default)(new ajv_1.default({
    strictSchema: false,
    removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
}));
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
        this._removeAdditional = exports.ajv.compile(schema);
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
            throw new remove_additional_props_error_1.RemoveAdditionalPropsError('Recieved invalid object when removing additional properties', this._removeAdditional.errors);
        }
        return o;
    }
}
exports.JSONSchema = JSONSchema;
//# sourceMappingURL=json-schema.base.js.map