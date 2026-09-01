import { NextFunction, Request, Response } from 'express';

// Simple HTML tag pattern - looks for basic HTML structure
const htmlTagPattern = /<[a-z][^>]{0,200}>/i;

// SQL injection keywords to check for
const sqlKeywords = [
  'drop table',
  'delete from',
  'truncate table',
  'alter table',
  'union select',
  'insert into',
  'update set',
  'select *',
  'select * from',
  '-- ',
  '/*',
  '*/',
  'exec(',
  'execute(',
  'sp_',
  'xp_',
];

const checkStringPatterns = (value: string): boolean => {
  // Only log in development mode to avoid production log noise
  if (process.env.NODE_ENV === 'development') {
    console.log('Validating value:', value);
  }

  // Check for HTML tags
  if (htmlTagPattern.test(value)) {
    return true;
  }

  // Check for SQL injection patterns using simple string contains
  const lowerValue = value.toLowerCase().replace(/\s+/g, ' ');
  for (const keyword of sqlKeywords) {
    if (lowerValue.includes(keyword)) {
      return true;
    }
  }

  return false;
};

const HTML_ALLOWED_FIELDS = ['voiceDetail'];

// Helper function to check object fields
const validateObjectFields = (obj: Record<string, any>): boolean => {
  const checkValues = (obj: Record<string, any>): boolean => {
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          if (checkValues(value)) {
            return true;
          }
        } else if (
          typeof value === 'string' &&
          !HTML_ALLOWED_FIELDS.includes(key) &&
          checkStringPatterns(value)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  return checkValues(obj);
};

/**
 * Transform object with bracket notation arrays to proper arrays
 * Converts: shipmentType[]=value to shipmentType: [value]
 */
const transformArrayParams = (obj: any): any => {
  const transformed: any = {};

  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      // Check if key ends with []
      if (key.endsWith('[]')) {
        // Remove [] from key name
        const cleanKey = key.slice(0, -2);
        const value = obj[key];
        
        // Ensure value is an array
        transformed[cleanKey] = Array.isArray(value) ? value : [value];
      } else {
        // Keep original key-value pair
        transformed[key] = obj[key];
      }
    }
  }

  return transformed;
};

export function validateDataMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Transform array parameters first
    if (req.query) {
      req.query = transformArrayParams(req.query);
    }

    if (req.body && typeof req.body === 'object') {
      req.body = transformArrayParams(req.body);
    }

    // Then validate the data
    const invalidData =
      validateObjectFields(req.body) ||
      validateObjectFields(req.query) ||
      validateObjectFields(req.params);

    if (invalidData) {
      const errorDetails =
        process.env.NODE_ENV === 'development'
          ? ` Request method: ${req.method}, path: ${req.path}`
          : '';

      res.status(400).json({
        error:
          "Your input includes characters or patterns we can't accept (such as HTML tags or SQL injection patterns). Please enter valid text instead." +
          errorDetails,
      });
    } else {
      next();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Validation middleware error:', error);
    }

    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
}
