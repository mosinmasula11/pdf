/**
 * In-browser JSON to Type & Schema generation engine.
 * Supports TypeScript interfaces, Zod validation schemas,
 * Python Pydantic models, and Go structs.
 */

export type GenerationTarget = "typescript" | "zod" | "pydantic" | "go";

export interface GeneratorOptions {
  rootName: string;
  target: GenerationTarget;
  useTypeAlias?: boolean; // type X = ... instead of interface X { ... }
  exportPrefix?: boolean; // export interface vs interface
  optionalFields?: boolean; // make all fields optional
  readonlyFields?: boolean; // readonly id: number
}

function sanitizeIdentifier(name: string): string {
  // convert to valid identifier PascalCase
  const cleaned = name
    .replace(/[^a-zA-Z0-9_]/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return cleaned || "Item";
}

function safeKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return JSON.stringify(key);
}

function toGoFieldName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, " ")
    .trim()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("") || "Field";
}

// -------------------------------------------------------------
// 1. TypeScript Interface / Type Generator
// -------------------------------------------------------------
export function generateTypeScript(json: unknown, options: GeneratorOptions): string {
  const interfaces: Map<string, string> = new Map();
  const rootName = sanitizeIdentifier(options.rootName || "Root");

  function processValue(val: unknown, typeName: string): string {
    if (val === null) return "null";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";

    if (Array.isArray(val)) {
      if (val.length === 0) return "unknown[]";

      // If array of objects, merge their keys
      const objectItems = val.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item));
      if (objectItems.length > 0) {
        const singularName = typeName.endsWith("s") ? typeName.slice(0, -1) : `${typeName}Item`;
        const mergedObj: Record<string, unknown> = {};
        for (const item of objectItems) {
          Object.assign(mergedObj, item);
        }
        processValue(mergedObj, singularName);
        return `${singularName}[]`;
      }

      // Array of primitives
      const types = Array.from(new Set(val.map((item) => processValue(item, typeName))));
      return types.length === 1 ? `${types[0]}[]` : `(${types.join(" | ")})[]`;
    }

    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      const fields: string[] = [];

      for (const [k, v] of entries) {
        const childTypeName = sanitizeIdentifier(`${typeName}_${k}`);
        const fieldType = processValue(v, childTypeName);
        const opt = options.optionalFields || v === null ? "?" : "";
        const ro = options.readonlyFields ? "readonly " : "";
        fields.push(`  ${ro}${safeKey(k)}${opt}: ${fieldType};`);
      }

      const prefix = options.exportPrefix !== false ? "export " : "";
      const body = fields.length ? `{\n${fields.join("\n")}\n}` : "Record<string, unknown>";

      if (options.useTypeAlias) {
        interfaces.set(typeName, `${prefix}type ${typeName} = ${body};`);
      } else {
        interfaces.set(typeName, `${prefix}interface ${typeName} ${body}`);
      }

      return typeName;
    }

    return "unknown";
  }

  processValue(json, rootName);

  return Array.from(interfaces.values()).join("\n\n");
}

// -------------------------------------------------------------
// 2. Zod Schema Generator
// -------------------------------------------------------------
export function generateZod(json: unknown, options: GeneratorOptions): string {
  const schemas: Map<string, string> = new Map();
  const rootName = sanitizeIdentifier(options.rootName || "Root");

  function processValue(val: unknown, schemaName: string): string {
    if (val === null) return "z.null()";
    if (typeof val === "string") return "z.string()";
    if (typeof val === "number") return "z.number()";
    if (typeof val === "boolean") return "z.boolean()";

    if (Array.isArray(val)) {
      if (val.length === 0) return "z.array(z.unknown())";

      const objectItems = val.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item));
      if (objectItems.length > 0) {
        const singularName = schemaName.endsWith("s") ? schemaName.slice(0, -1) : `${schemaName}Item`;
        const mergedObj: Record<string, unknown> = {};
        for (const item of objectItems) {
          Object.assign(mergedObj, item);
        }
        processValue(mergedObj, singularName);
        return `z.array(${singularName}Schema)`;
      }

      const subType = processValue(val[0], schemaName);
      return `z.array(${subType})`;
    }

    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      const fields: string[] = [];

      for (const [k, v] of entries) {
        const childSchemaName = sanitizeIdentifier(`${schemaName}_${k}`);
        let zodType = processValue(v, childSchemaName);
        if (options.optionalFields || v === null) {
          zodType += ".optional()";
        }
        fields.push(`  ${safeKey(k)}: ${zodType},`);
      }

      const schemaCode = fields.length
        ? `export const ${schemaName}Schema = z.object({\n${fields.join("\n")}\n});`
        : `export const ${schemaName}Schema = z.record(z.string(), z.unknown());`;

      const typeCode = `export type ${schemaName} = z.infer<typeof ${schemaName}Schema>;`;

      schemas.set(schemaName, `${schemaCode}\n${typeCode}`);
      return `${schemaName}Schema`;
    }

    return "z.unknown()";
  }

  processValue(json, rootName);

  const header = `import { z } from "zod";\n\n`;
  return header + Array.from(schemas.values()).join("\n\n");
}

// -------------------------------------------------------------
// 3. Python Pydantic BaseModel Generator
// -------------------------------------------------------------
export function generatePydantic(json: unknown, options: GeneratorOptions): string {
  const models: Map<string, string> = new Map();
  const rootName = sanitizeIdentifier(options.rootName || "Root");

  function processValue(val: unknown, modelName: string): string {
    if (val === null) return "Optional[Any]";
    if (typeof val === "string") return "str";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
    if (typeof val === "boolean") return "bool";

    if (Array.isArray(val)) {
      if (val.length === 0) return "List[Any]";
      const objectItems = val.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item));
      if (objectItems.length > 0) {
        const singularName = modelName.endsWith("s") ? modelName.slice(0, -1) : `${modelName}Item`;
        const mergedObj: Record<string, unknown> = {};
        for (const item of objectItems) {
          Object.assign(mergedObj, item);
        }
        processValue(mergedObj, singularName);
        return `List[${singularName}]`;
      }
      return `List[${processValue(val[0], modelName)}]`;
    }

    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      const fields: string[] = [];

      for (const [k, v] of entries) {
        const childModelName = sanitizeIdentifier(`${modelName}_${k}`);
        let pyType = processValue(v, childModelName);
        const pyKey = k.replace(/[^a-zA-Z0-9_]/g, "_");
        if (options.optionalFields || v === null) {
          pyType = `Optional[${pyType}] = None`;
        }
        fields.push(`    ${pyKey}: ${pyType}`);
      }

      const body = fields.length ? fields.join("\n") : "    pass";
      models.set(modelName, `class ${modelName}(BaseModel):\n${body}`);
      return modelName;
    }

    return "Any";
  }

  processValue(json, rootName);

  const header = `from typing import List, Optional, Any\nfrom pydantic import BaseModel\n\n`;
  return header + Array.from(models.values()).join("\n\n");
}

// -------------------------------------------------------------
// 4. Go Struct Generator
// -------------------------------------------------------------
export function generateGo(json: unknown, options: GeneratorOptions): string {
  const structs: Map<string, string> = new Map();
  const rootName = sanitizeIdentifier(options.rootName || "Root");

  function processValue(val: unknown, structName: string): string {
    if (val === null) return "interface{}";
    if (typeof val === "string") return "string";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float64";
    if (typeof val === "boolean") return "bool";

    if (Array.isArray(val)) {
      if (val.length === 0) return "[]interface{}";
      const objectItems = val.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item));
      if (objectItems.length > 0) {
        const singularName = structName.endsWith("s") ? structName.slice(0, -1) : `${structName}Item`;
        const mergedObj: Record<string, unknown> = {};
        for (const item of objectItems) {
          Object.assign(mergedObj, item);
        }
        processValue(mergedObj, singularName);
        return `[]${singularName}`;
      }
      return `[]${processValue(val[0], structName)}`;
    }

    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      const fields: string[] = [];

      for (const [k, v] of entries) {
        const fieldName = toGoFieldName(k);
        const childStructName = sanitizeIdentifier(`${structName}_${k}`);
        const goType = processValue(v, childStructName);
        fields.push(`\t${fieldName} ${goType} \`json:"${k}"\``);
      }

      structs.set(structName, `type ${structName} struct {\n${fields.join("\n")}\n}`);
      return structName;
    }

    return "interface{}";
  }

  processValue(json, rootName);

  return Array.from(structs.values()).join("\n\n");
}

