const MODULE_REFERENCE = Symbol.for('react.module.reference')

export function createModuleReference(resourcePath: string): any {
  return {
    $$typeof: MODULE_REFERENCE,
    filepath: resourcePath,
  }
}
