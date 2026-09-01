# SELOG WMS Shared Libraries

A collection of shared TypeScript libraries for SELOG WMS applications, including base classes, exceptions, helpers, interfaces, and middleware functions.

## 📦 Installation

### As a Git Submodule

To use this as a git submodule in your project:

```bash
# Add the submodule to your project
git submodule add https://github.com/developerserasiautoraya/SELOG_WMS_Submodule_Libraries.git shared-libs

# Initialize and update the submodule
git submodule update --init --recursive

# Install the dependencies
cd shared-libs
npm install
npm run build
```

### As a Local Package

If you prefer to use it as a local npm package:

```bash
# In your main project
npm install ./path/to/SELOG_WMS_Submodule_Libraries
```

### Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

```bash
npm install express@^4.18.0 class-transformer@^0.5.0 class-validator@^0.14.0 jsonwebtoken@^9.0.0
npm install -D @types/express@^4.17.21 @types/jsonwebtoken@^9.0.5
```

## 🚀 Usage

### Importing Everything

```typescript
import {
  BaseTransform,
  BodyValidation,
  BadRequestException,
  HTTP_STATUS,
  DateHelper,
  ResponseJson,
} from '@selog/wms-shared-libraries';
```

### Importing Specific Modules

```typescript
// Base classes
import {
  BaseTransform,
  BodyValidation,
} from '@selog/wms-shared-libraries/base';

// Constants
import {
  HTTP_STATUS,
  HTTP_MESSAGE,
} from '@selog/wms-shared-libraries/constants';

// Exceptions
import {
  BadRequestException,
  NotFoundException,
} from '@selog/wms-shared-libraries/exceptions';

// Helpers
import { DateHelper } from '@selog/wms-shared-libraries/helpers';

// Interfaces
import { IEmail, IPubSub } from '@selog/wms-shared-libraries/interfaces';

// Middlewares
import {
  ResponseJson,
  VerifyJWT,
} from '@selog/wms-shared-libraries/middlewares';
```

## 📚 API Reference

### Base Classes

#### BaseTransform

Abstract class for data transformation:

```typescript
class UserTransform extends BaseTransform {
  transform(user: any) {
    return {
      id: user.id,
      name: user.full_name,
      email: user.email_address,
    };
  }
}

// Transform single object
const transformed = UserTransform.object(userData);

// Transform array
const transformedArray = UserTransform.array(usersArray);
```

#### BodyValidation

Express middleware for data validation:

```typescript
import {
  BodyValidation,
  ParamValidation,
  QueryValidation,
} from '@selog/wms-shared-libraries/base';

// Body validation
app.post('/users', BodyValidation(CreateUserDto), (req, res) => {
  // req.body is now validated and transformed
});

// Param validation
app.get('/users/:id', ParamValidation(UserParamDto), (req, res) => {
  // req.params is validated
});

// Query validation
app.get('/users', QueryValidation(UserQueryDto), (req, res) => {
  // req.query is validated
});
```

### Constants

#### HTTP Status

```typescript
import {
  HTTP_STATUS,
  HTTP_MESSAGE,
} from '@selog/wms-shared-libraries/constants';

console.log(HTTP_STATUS.OK); // 200
console.log(HTTP_MESSAGE[200]); // 'OK'
```

### Exception Classes

All exception classes extend the base Error class and include an `httpCode` property:

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@selog/wms-shared-libraries/exceptions';

// Usage
throw new BadRequestException('Invalid input data');
throw new NotFoundException('User not found');
throw new UnprocessableEntityException(
  [{ field: 'email', message: 'Invalid email format' }],
  422
);
```

#### Exception Handler

```typescript
import { HandlerException } from '@selog/wms-shared-libraries/exceptions';

// Use as global error handler in Express
app.use(HandlerException);
```

### Helpers

#### DateHelper

```typescript
import { DateHelper } from '@selog/wms-shared-libraries/helpers';

// Format current date
DateHelper.formatDefault(); // "2025-09-26 14:30:45"

// Format specific date
DateHelper.formatDefault(new Date('2025-01-01')); // "2025-01-01 00:00:00"

// ISO string
DateHelper.toISOString(); // "2025-09-26T14:30:45.123Z"

// Parse date
const date = DateHelper.parseDate('2025-01-01');

// Validate date
DateHelper.isValidDate(new Date()); // true
```

### Interfaces

#### IEmail

```typescript
import { IEmail } from '@selog/wms-shared-libraries/interfaces';

class EmailService implements IEmail {
  async send(data: any, template: any): Promise<any> {
    // Implementation
  }
}
```

#### IPubSub

```typescript
import { IPubSub } from '@selog/wms-shared-libraries/interfaces';

class PubSubService implements IPubSub {
  async publish(topicName: string, body: any): Promise<any> {
    // Implementation
  }

  async subscribe(
    topicName: string,
    subscriptionName: string,
    callback: any
  ): Promise<any> {
    // Implementation
  }

  async dlq(topicName: string, subscriptionName: string): Promise<void> {
    // Implementation
  }
}
```

### Middlewares

#### ResponseJson

Standardizes API responses:

```typescript
import { ResponseJson } from '@selog/wms-shared-libraries/middlewares';

app.use(ResponseJson);

// Your route response will be automatically wrapped:
res.send({ data: userData });
// Becomes: { transactionId: "...", code: "", message: "OK", data: userData }
```

#### VerifyJWT

JWT authentication middleware:

```typescript
import {
  createVerifyJWTMiddleware,
  VerifyJWT,
} from '@selog/wms-shared-libraries/middlewares';

// Simple usage (requires JWT_SECRET environment variable)
app.use(VerifyJWT);

// Advanced usage with custom options
const jwtMiddleware = createVerifyJWTMiddleware({
  secret: 'your-jwt-secret',
  exceptionRoutes: ['/login', '/register'],
  onTokenBlacklisted: async (token) => {
    // Check if token is blacklisted
    return false;
  },
  onGetUserData: async (userId, token) => {
    // Get additional user data
    return { id: userId, role: 'user' };
  },
});

app.use(jwtMiddleware);
```

## 🔧 Development

### Building the Library

```bash
npm run build          # Build the library
npm run build:watch    # Build in watch mode
npm run clean          # Clean build directory
```

### Project Structure

```
├── base/              # Base classes for transformation and validation
├── constants/         # Application constants (HTTP status, endpoints, etc.)
├── exceptions/        # Custom exception classes
├── helpers/           # Utility helper functions
├── interfaces/        # TypeScript interface definitions
├── middlewares/       # Express middleware functions
├── types/             # TypeScript type definitions
├── dist/              # Compiled JavaScript output
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED license - see the package.json file for details.

## 🔗 Submodule Management

### Updating the Submodule

In your main project, to update to the latest version:

```bash
cd shared-libs
git pull origin main
cd ..
git add shared-libs
git commit -m "Update shared libraries"
```

### Removing the Submodule

If you need to remove the submodule:

```bash
git submodule deinit shared-libs
git rm shared-libs
rm -rf .git/modules/shared-libs
```

---

**Author:** Developer Serasi Autoraya  
**Repository:** [SELOG_WMS_Submodule_Libraries](https://github.com/developerserasiautoraya/SELOG_WMS_Submodule_Libraries)

A comprehensive collection of shared libraries for SELOG WMS applications, including base classes, exceptions, helpers, interfaces, and middlewares.

## 📦 What's Included

- **Base Classes**: Abstract classes for data transformation and validation
- **Constants**: Common constants for endpoints, HTTP status codes, RBAC, and more
- **Exception Classes**: Standardized error handling with proper HTTP status codes
- **Helper Functions**: Utilities for date manipulation, pagination, and more
- **Interfaces**: Type definitions for cache, email, pub/sub, and other services
- **Middlewares**: Express.js middlewares for JWT verification, validation, and response formatting

## 🚀 Usage as Git Submodule

### Adding this repository as a submodule

```bash
# Add the submodule to your project
git submodule add https://github.com/developerserasiautoraya/SELOG_WMS_Submodule_Libraries.git shared-libs

# Initialize and update the submodule
git submodule update --init --recursive
```

### Installing dependencies and building

```bash
# Navigate to the submodule directory
cd shared-libs

# Install dependencies
npm install

# Build the library
npm run build
```

### Using the library in your project

#### Option 1: Direct TypeScript imports (recommended for development)

```typescript
// Import everything
import * from '../shared-libs';

// Or import specific modules
import { BaseTransform } from '../shared-libs/base';
import { BadRequestException } from '../shared-libs/exceptions';
import { PaginationHelper } from '../shared-libs/helpers';
```

#### Option 2: Using compiled JavaScript

```typescript
// After building, you can import from dist
import { BaseTransform, BadRequestException } from '../shared-libs/dist';
```

#### Option 3: Installing as local npm package

```bash
# In your main project root
npm install ./shared-libs
```

Then import normally:

```typescript
import {
  BaseTransform,
  BadRequestException,
} from '@selog/wms-shared-libraries';
```

## 📚 Module Documentation

### Base Classes

```typescript
import {
  BaseTransform,
  BodyValidation,
} from '@selog/wms-shared-libraries/base';

// Example usage of BaseTransform
class UserTransform extends BaseTransform {
  transform(user: any) {
    return {
      id: user.id,
      name: user.full_name,
      email: user.email_address,
    };
  }
}

// Transform single object
const transformedUser = UserTransform.object(rawUserData);

// Transform array of objects
const transformedUsers = UserTransform.array(rawUsersData);
```

### Exception Classes

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@selog/wms-shared-libraries/exceptions';

// Usage
throw new BadRequestException('Invalid input data');
throw new UnauthorizedException('Invalid credentials');
throw new NotFoundException('User not found');
```

### Helper Functions

```typescript
import {
  DateHelper,
  PaginationHelper,
} from '@selog/wms-shared-libraries/helpers';

// Date helpers
const formattedDate = DateHelper.format(new Date());

// Pagination helpers
const paginationData = PaginationHelper.paginate(
  totalItems,
  currentPage,
  itemsPerPage
);
```

### Middlewares

```typescript
import {
  verifyJwtMiddleware,
  validateDataMiddleware,
  responseJsonMiddleware,
} from '@selog/wms-shared-libraries/middlewares';

// Use in Express.js
app.use(responseJsonMiddleware);
app.use(verifyJwtMiddleware);
app.post('/api/users', validateDataMiddleware(userSchema), createUser);
```

## 🛠️ Development

### Building the library

```bash
npm run build          # Build once
npm run build:watch    # Build and watch for changes
npm run clean          # Clean build directory
```

### Project Structure

```
├── base/              # Abstract base classes
├── constants/         # Application constants
├── exceptions/        # Custom exception classes
├── helpers/          # Utility functions
├── interfaces/       # TypeScript interfaces
├── middlewares/      # Express.js middlewares
├── utils/            # Cache, logger, locks, outbound pipeline, …
│   └── outbound/     # Outbound HTTP request pipeline
├── dist/             # Compiled JavaScript output
├── index.ts          # Main entry point
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript configuration
```

### Outbound Request Pipeline

Shared outbound HTTP pipeline for internal service-to-service calls. See [utils/outbound/README.md](./utils/outbound/README.md).

```typescript
import { executeOutboundRequest } from '@/shared-libs/utils/outbound';

const data = await executeOutboundRequest({
  serviceName: 'OrderService',
  config: { method: 'GET', url: `${baseUrl}/v1/resource`, headers },
  cache: { key: 'order:resource:id', ttl: 60 },
  fallback: [],
  mapResponse: (res) => res?.data?.data ?? [],
});
```

## 🔄 Updating the Submodule

### In the main project that uses this submodule

```bash
# Update to latest changes
git submodule update --remote shared-libs

# Commit the submodule update
git add shared-libs
git commit -m "Update shared-libs submodule"
```

### Working on the submodule

```bash
# Navigate to submodule directory
cd shared-libs

# Create and checkout a new branch
git checkout -b feature/new-helper

# Make changes, commit them
git add .
git commit -m "Add new helper function"

# Push to the submodule repository
git push origin feature/new-helper

# Go back to main project and update reference
cd ..
git add shared-libs
git commit -m "Update shared-libs to include new helper"
```

## 📋 Best Practices

1. **Version Management**: Always build the library after updating the submodule
2. **Type Safety**: Use TypeScript for full type checking benefits
3. **Modular Imports**: Import only what you need to keep bundle size small
4. **Error Handling**: Use the provided exception classes for consistent error responses
5. **Middleware Order**: Apply middlewares in the correct order (JWT verification before validation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software belonging to SELOG WMS.

---

For questions or support, please contact the development team.
