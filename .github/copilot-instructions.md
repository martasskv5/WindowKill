# Coding Guidelines

## Introduction

This is Vanilla JS Tauri v2 project. We use HTML, CSS, and JavaScript and ONLY if its necessary Rust (if not possible via JS). We use ESLint to enforce coding standards. Use of any other JavaScript libraries or frameworks is not prohibited unless it is necessary (Tauri framework doesn't count for this). The JS part of project is split into multiple files (eg. `main.js`, `classes.js`, `functions.js`, etc.). The `main.js` file is the entry point of the application. Don't forget to update export and import statements when adding new functions.

## Indentation

We use tabs, not spaces.

## Naming Conventions

-   Use PascalCase for `type` names
-   Use PascalCase for `enum` values
-   Use camelCase for `function` and `method` names
-   Use camelCase for `property` names and `local variables`
-   Use whole words in names when possible

## Types

-   Do not export `types` or `functions` unless you need to share it across multiple components
-   Do not introduce new `types` or `values` to the global namespace

## Comments

-   When there are comments for `functions`, `interfaces`, `enums`, and `classes` use JSDoc style comments with tags
-   For commenting blocks of code write a comment above the block
-   For commenting single lines of code write a comment at the end of the line

## Strings

-   Use "double quotes" for strings shown to the user that need to be externalized (localized)
-   Use 'single quotes' otherwise
-   All strings visible to the user need to be externalized

## Style

-   Use arrow functions `=>` over anonymous function expressions
-   Only surround arrow function parameters when necessary. For example, `(x) => x + x` is wrong but the following are correct:

```javascript
x => x + x
(x, y) => x + y
<T>(x: T, y: T) => x === y
```

-   If possible, make loop and conditional bodies one line without braces otherwise always surround with curly braces
-   Simple if else statements should be on one line
-   Try to keep line length under 120 characters
-   Open curly braces always go on the same line as whatever necessitates them
-   Parenthesized constructs should have no surrounding whitespace. A single space follows commas, colons, and semicolons in those constructs. For example:

```javascript
for (let i = 0, n = str.length; i < 10; i++) {
    if (x < 10) foo();
    alert(lemons ? "please give me a lemonade" : "then give me a beer");
}

function f(x: number, y: string): void {}
```

## Output

-   Do NOT output whole file content unless requested
-   Do NOT use console.log() unless necessary for debugging
-   When changing existing functions, make sure to update the JSDoc comments and make the codeblock ready for copy-pasting
-   When adding new functions, make sure to add JSDoc comments and make the codeblock ready for copy-pasting
-   When editing multiple functions, split them into multiple codeblocks ready for copy-pasting
-   When feature would be better to be implemented in Rust, make a note about it in the comments
-   When you assume that user is going to build project, remind them to update version in the `tauri.conf.json` file
