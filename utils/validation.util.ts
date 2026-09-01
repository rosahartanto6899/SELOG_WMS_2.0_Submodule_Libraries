import { ValidationError } from 'class-validator';

/**
 * Utility class for handling validation errors
 */
export class ValidationUtil {
  /**
   * Format validation errors from class-validator into a human-readable string
   * Handles nested validation errors recursively
   * @param errors Array of ValidationError objects from class-validator
   * @returns Formatted string with all validation error messages
   */
  static formatValidationErrors(errors: ValidationError[]): string {
    const messages: string[] = [];

    const extractErrors = (error: ValidationError, parentPath: string = '') => {
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      // If there are constraint violations at this level
      if (error.constraints) {
        const constraintMessages = Object.values(error.constraints).join(', ');
        messages.push(`${currentPath}: ${constraintMessages}`);
      }

      // Recursively process nested validation errors
      if (error.children && error.children.length > 0) {
        error.children.forEach((child) => extractErrors(child, currentPath));
      }
    };

    errors.forEach((error) => extractErrors(error));
    return messages.join('; ');
  }
}

export default ValidationUtil;
