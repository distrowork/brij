import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
const ajv = new Ajv()

export interface ValidationResult {
  valid: boolean
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined
}

export class JSONSchema {
  private _schema: any

  private _validate: ValidateFunction

  get schema() {
    return JSON.parse(JSON.stringify(this._schema))
  }

  constructor(schema: any) {
    this._schema = schema
    this._validate = ajv.compile(schema)
  }

  public validate(o: any): ValidationResult {
    const valid = this._validate(o)

    return {
      valid,
      errors: this._validate.errors
    }
  }
}