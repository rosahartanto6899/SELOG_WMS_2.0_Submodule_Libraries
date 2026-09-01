/**
 * Convert a snake_case string to camelCase
 * @param str - The snake_case string to convert
 * @returns The camelCase string
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys of an object from snake_case to camelCase
 * @param obj - The object with snake_case keys
 * @returns New object with camelCase keys
 */
export function convertKeysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item)) as any;
  }

  // Handle objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      const value = obj[key];

      // Recursively convert nested objects
      result[camelKey] =
        value !== null && typeof value === 'object'
          ? convertKeysToCamelCase(value)
          : value;

      return result;
    }, {} as any);
  }

  // Return primitive values as-is
  return obj;
}

/*
 * Convert numeric currency value (e.g, 100000) to string with every three digits separated by a dot (e.g, "100.000")
 */
export function convertCurrencyToString(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
