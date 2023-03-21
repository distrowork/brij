import { randomUUID } from "crypto"
import { RemoveAdditionalPropsError } from "./errors"
import { JSONSchema } from "./json-schema.base"
import { JSONSchema7 } from 'json-schema';

describe('JSONSchema', () => {
  describe('schema', () => {
    it('returns the schema passed in the constructor', () => {
      const s: JSONSchema7 = {
        type: 'object',
        properties: {
          the: { type: 'number' },
          schema: { type: 'number' },
          that: { type: 'boolean' },
          was: { type: 'object' },
          passed: { type: 'number' },
          in: { type: 'number' },
        }
      }

      const jsonSchema = new JSONSchema(s)

      expect(jsonSchema.schema).toEqual(s)

    })

    it('is not allowed to be set', () => {
      const s: JSONSchema7 = {
        type: 'object',
        properties: {
          the: { type: 'number' },
          schema: { type: 'number' },
          that: { type: 'boolean' },
          was: { type: 'object' },
          passed: { type: 'number' },
          in: { type: 'number' },
        }
      }

      const jsonSchema = new JSONSchema(s)

      expect(() => (jsonSchema as any).schema = 7).toThrow('Cannot set property schema')
    })
  })

  describe('validate', () => {
    it('validates anything with empty schema object', () => {
      const jsonSchema = new JSONSchema({})

      expect(jsonSchema.validate(null).valid).toBe(true)
      expect(jsonSchema.validate(undefined).valid).toBe(true)
      expect(jsonSchema.validate({}).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(true)
      expect(jsonSchema.validate([]).valid).toBe(true)
      expect(jsonSchema.validate('hi').valid).toBe(true)
      expect(jsonSchema.validate(true).valid).toBe(true)
      expect(jsonSchema.validate(false).valid).toBe(true)
      expect(jsonSchema.validate(7).valid).toBe(true)
      expect(jsonSchema.validate(new Error()).valid).toBe(true)
    })

    it('validates correctly with an object schema', () => {
      const jsonSchema = new JSONSchema({ type: 'object' })

      expect(jsonSchema.validate(null).valid).toBe(false)
      expect(jsonSchema.validate(undefined).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(true)
      expect(jsonSchema.validate([]).valid).toBe(false)
      expect(jsonSchema.validate('hi').valid).toBe(false)
      expect(jsonSchema.validate(true).valid).toBe(false)
      expect(jsonSchema.validate(false).valid).toBe(false)
      expect(jsonSchema.validate(7).valid).toBe(false)
      expect(jsonSchema.validate(new Error()).valid).toBe(true)
    })

    it('validates correctly with an array schema', () => {
      const jsonSchema = new JSONSchema({ type: 'array' })

      expect(jsonSchema.validate(null).valid).toBe(false)
      expect(jsonSchema.validate(undefined).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(false)
      expect(jsonSchema.validate([]).valid).toBe(true)
      expect(jsonSchema.validate([0]).valid).toBe(true)
      expect(jsonSchema.validate('hi').valid).toBe(false)
      expect(jsonSchema.validate(true).valid).toBe(false)
      expect(jsonSchema.validate(false).valid).toBe(false)
      expect(jsonSchema.validate(7).valid).toBe(false)
      expect(jsonSchema.validate(new Error()).valid).toBe(false)
    })

    it('validates a basic object ', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a', 'b'],
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
          c: { type: 'number' },
        }
      })

      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: '2' }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: '2', c: 3 }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: 2 }).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1, b: 2, c: 3 }).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1, b: 2, c: '3' }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: 2, c: 3, d: 4 }).valid).toBe(false)
    })

    it('validates a basic array', () => {
      const jsonSchema = new JSONSchema({
        type: 'array',
        additionalItems: false,
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          required: [ 'id' ],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      })

      expect(jsonSchema.validate([]).valid).toBe(false)
      expect(jsonSchema.validate([{id: 'a'}]).valid).toBe(false)
      expect(jsonSchema.validate([{id: randomUUID() }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID() }, { id: randomUUID() }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID(), info: 'first' }, { id: randomUUID(), info: 'second' }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID() }, { id: randomUUID() }, { id: randomUUID() }]).valid).toBe(false)
    })

    it('validates uuid formats', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'id' ],
        properties: {
          id: { type: 'string', format: 'uuid' },
        }
      })

      expect(jsonSchema.validate({ id: 'abc' }).valid).toBe(false)
      expect(jsonSchema.validate({ id: 7 }).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ id: randomUUID() }).valid).toBe(true)
    })

    it('validates date-time formats', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'created_at' ],
        properties: {
          created_at: { type: 'string', format: 'date-time' },
        }
      })

      expect(jsonSchema.validate({ created_at: 'tuesday' }).valid).toBe(false)
      expect(jsonSchema.validate({ created_at: new Date().getTime() }).valid).toBe(false)
      expect(jsonSchema.validate({ created_at: new Date().toISOString() }).valid).toBe(true)
    })

    it('includes error information in the output object', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'created_at' ],
        properties: {
          created_at: { type: 'string', format: 'date-time' },
        }
      })

      expect(jsonSchema.validate({ created_at: 'tuesday' }).errors).toEqual([{
        instancePath: '/created_at',
        keyword: 'format',
        message: 'must match format "date-time"',
        params: { format: 'date-time' },
        schemaPath: '#/properties/created_at/format',
      }])

      expect(jsonSchema.validate({ created_at: new Date().getTime() }).errors).toEqual([{
        instancePath: '/created_at',
        keyword: 'type',
        message: 'must be string',
        params: { type: 'string' },
        schemaPath: '#/properties/created_at/type',
      }])
    })
  })

  describe('removeAdditional', () => {
    it('throws RemoveAdditionalPropsError when input is invalid', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a'],
        properties: {
          a: { type: 'number' },
        }
      })

      expect(() => jsonSchema.removeAdditional({})).toThrow(RemoveAdditionalPropsError)
      expect(() => jsonSchema.removeAdditional({ b: 7 })).toThrow(RemoveAdditionalPropsError)
      expect(() => jsonSchema.removeAdditional({ a: 'n' })).toThrow(RemoveAdditionalPropsError)
      expect(() => jsonSchema.removeAdditional({ a: 7 })).not.toThrow(RemoveAdditionalPropsError)
    })

    it('removes disallowed properties when additionalProperties is false', () => {
      const jsonShema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
        }
      })

        expect(jsonShema.removeAdditional({})).toEqual({})
        expect(jsonShema.removeAdditional({ a: 1, b: 7, c: 4 })).toEqual({ a: 1 })
        expect(jsonShema.removeAdditional({ b: 7 })).toEqual({})
        expect(jsonShema.removeAdditional({ a: 7 })).toEqual({ a: 7 })
    })

    it('retains additional properties when additionalProperties is not explicitly true', () => {
      const jsonShema = new JSONSchema({
        type: 'object',
        properties: {
          a: { type: 'number' }
        }
      })

      expect(jsonShema.removeAdditional({})).toEqual({})
      expect(jsonShema.removeAdditional({ b: 7 })).toEqual({ b: 7 })
      expect(jsonShema.removeAdditional({ a: 7, b: 4, c: 3 })).toEqual({ a: 7, b: 4, c: 3 })
      expect(jsonShema.removeAdditional({ a: 7 })).toEqual({ a: 7 })
    })
  })
})