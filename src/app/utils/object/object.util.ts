// Object utilities

/**
 * @usage .filter(typedNullCheck)
 * @returns true if obj is not null or undefined
 */
export function typedNullCheck<T>(obj: T): obj is NonNullable<T> {
  return obj != null;
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
