```markdown
# Weather_app Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you how to contribute to the `Weather_app` JavaScript codebase, focusing on its unique coding conventions, file organization, and development workflows. You'll learn how to structure files, write imports/exports, and follow the project's testing patterns to ensure consistency and maintainability.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `weatherService.js`, `getForecast.test.js`

### Import Style
- Use **relative imports** for referencing modules.
  - Example:
    ```javascript
    import { getWeather } from './weatherService';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```javascript
    // weatherService.js
    export function getWeather(location) { ... }
    ```

### Commit Messages
- Freeform style, typically short (average 8 characters).
  - Example: `add api`, `fix bug`

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new functionality.
**Command:** `/add-feature`

1. Create a new file using camelCase (e.g., `newFeature.js`).
2. Implement the feature and use named exports.
    ```javascript
    export function newFeature() { ... }
    ```
3. Import dependencies using relative paths.
    ```javascript
    import { helper } from './helper';
    ```
4. Write a corresponding test file named `newFeature.test.js`.
5. Commit changes with a concise message.

### Writing and Running Tests
**Trigger:** When verifying code correctness.
**Command:** `/run-tests`

1. Create test files with the `.test.js` suffix (e.g., `weatherService.test.js`).
2. Place test files alongside the modules they test.
3. Use the project's preferred (unknown) testing framework.
4. Run tests using the standard command for your test runner (e.g., `npm test` or `yarn test`).

### Refactoring Code
**Trigger:** When improving or reorganizing existing code.
**Command:** `/refactor`

1. Rename files using camelCase if necessary.
2. Update relative imports to match new file names.
3. Ensure all exports remain named.
4. Update or add tests as needed.
5. Commit with a brief message.

## Testing Patterns

- Test files are named with the `.test.js` pattern.
  - Example: `getForecast.test.js`
- Place tests near the corresponding source files.
- Testing framework is unspecified; use standard JavaScript testing tools (e.g., Jest, Mocha).
- Example test file:
  ```javascript
  import { getWeather } from './weatherService';

  test('returns weather data for a valid location', () => {
    expect(getWeather('London')).toBeDefined();
  });
  ```

## Commands
| Command        | Purpose                                 |
|----------------|-----------------------------------------|
| /add-feature   | Start the workflow for adding a feature |
| /run-tests     | Run all test files                      |
| /refactor      | Begin a code refactor workflow          |
```
