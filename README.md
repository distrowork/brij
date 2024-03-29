# brij

build responsively in json-schema

## Summary

Generate TypeScript interface and validators from JSON schemas defined in OAS files.

Compatible with Swagger 2.0 and OpenAPI 3.0 Specifications (OAS)

## Install

npm
```sh
npm install brij
```

yarn
```sh
yarn add brij
```

## CLI

```
Usage: brij [options] [command]

Options:
  -V, --version                    output the version number
  -h, --help                       display help for command

Commands:
  dto [options] <string> <string>  Output TypeScript artifacts based on json-schema definitions in OAS files
  help [command]                   display help for command
```

### Command: `dto`

```
Usage: brij dto [options] <string> <string>

Output TypeScript artifacts based on json-schema definitions in OAS files

Arguments:
  string              source directory with OAS files
  string              output directory for generated TypeScript files

Options:
  --schemas <string>  JSON path to the section in the OAS with the JSON schemas, e.g. '#/definitions'
  -h, --help          display help for command
```

#### Example usage of `dto` command
Let's say
- you have an OAS file at `oas/petstore.json`.
  - it should have JSON schemas defined under a certain JSON path, e.g. `#/definitions` or `#/components/schemas`
- you want to generate TypeScript interfaces and a runtime validator for each schema
- you want to output the generated code to the `example/dto` directory

You should run:
```
./index.js dto example/oas example/dto --schemas '\#/definitions'
```
The `example` directory will now look like this:
```sh
├── dto                  # generated files that mirror the structure of the source directory
│   └── petstore
│       ├── ApiResponse.ts
│       ├── Category.ts
│       ├── Order.ts
│       ├── Pet.ts
│       ├── Tag.ts
│       ├── User.ts
│       └── index.ts
└── oas                 # OpenAPI files under this directory are parsed for JSON schemas
    └── petstore.json
```

The `dto` command will:
- look in all subdirectories of the source directory for any json or yaml files
- try to parse each file as Swagger/OpenAPI
- if it is valid OAS, then the properties under the JSON path specified in `--schemas` will each output a DTO file
- generated DTO files contain a TypeScript interface and a JSON schema validator
- generated DTO filenames will match the key of the schema from the OAS file
  - e.g., if the JSON Schema key in the OAS file is `ApiResponse`, then the generated DTO filename will be `ApiResponse.ts`
- the interface and validator instance will both have the same identifier
  - e.g., if the JSON Schema key in the OAS file is `ApiResponse`, then the interface and validator instance will both be named `ApiResponse`

#### Example consumption of the generated DTO

The DTO file generated for each JSON schema looks like this, including an exported interface and validator instance:
```ts
import {JSONSchema} from 'brij'

export interface ApiResponse {
  code?: number
  type?: string
  message?: string
  [k: string]: unknown
}

class ApiResponseSchema extends JSONSchema {
  constructor() {
    super({
      "type": "object",
      "properties": {
        "code": {
          "type": "integer"
        },
        "type": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      }
    })
  }
}

export const ApiResponse = new ApiResponseSchema()
```

You can import the generated DTO into your program and use it like this:
```ts
import { ApiResponse } from '../dto/ApiResponse'

export function test(input: any): ApiResponse|never {
  const {valid, errors} = ApiResponse.validate(input)

  if (!valid) {
    throw new Error(JSON.stringify(errors))
  }

  // Since it is a valid ApiResponse object, we can confidently cast it the expected type
  return input as ApiResponse
}
```

To strip additional properties from an object to ensure it matches the JSON schema definition:
```ts
import { ApiResponse, RemoveAdditionalPropsError } from '../dto/ApiResponse'

export function removeAdditonalProperties(input: ApiResponse): ApiResponse|never {
  try {
    // This mutates (and returns) the input object
    ApiResponse.removeAdditional(input)
  } catch (e: unknown) {
    if (e instanceof RemoveAdditionalPropsError) {
      console.error(`error removing additional props: ${e.message}`)
      console.error(`validation errors: ${JSON.stringify(e.validationErrors)}`)
    }

    throw e
  }

  // Properties not allowed in the JSON schema have been removed
  return input
}
```