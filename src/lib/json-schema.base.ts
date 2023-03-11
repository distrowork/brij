import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { RemoveAdditionalPropsError } from './errors/remove-additional-props.error'

/**
 * WARNING: Be mindful updating the interface of this file.
 *
 * This file is is used as the base JSON schema validator class for
 * validators generated from OAS schemas
 */

export const ajv = addFormats(new Ajv({
  strictSchema: false
}))

export const ajvRemoveAdditional = addFormats(new Ajv({
  strictSchema: false,
  removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
}))

export interface ValidationResult {
  valid: boolean
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined
}

export class JSONSchema {
  private _schema: any

  private _validate: ValidateFunction

  private _removeAdditional: ValidateFunction

  get ajv() {
    return ajv
  }

  get schema() {
    return JSON.parse(JSON.stringify(this._schema))
  }

  constructor(schema: any) {
    this._schema = schema
    this._validate = ajv.compile(schema)
    this._removeAdditional = ajv.compile(schema)
  }

  validate(o: any): ValidationResult {
    const valid = this._validate(o)

    return {
      valid,
      errors: this._validate.errors
    }
  }

  removeAdditional<T>(o: T): T {
    // This mutates the object by removing properties that aren't in the schema
    const valid = this._removeAdditional(o)

    if (!valid) {
      throw new RemoveAdditionalPropsError(
        'Recieved invalid object when removing additional properties',
        this._removeAdditional.errors
      )
    }

    return o
  }
}
