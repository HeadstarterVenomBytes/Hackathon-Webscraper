import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";


export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"], // Target JS and TS files
    languageOptions: {
      globals: {
        ...globals.node, // Enable Node.js globals
        ...globals.browser, // Enable browser-specific globals like 'document' and 'window'
      },
      parser: tsParser, // Set TypeScript parser
      ecmaVersion: 2020, // Support ECMAScript 2020 features
      sourceType: "module", // Enable ES module support
    },
    plugins: {
      "@typescript-eslint": tseslint, // Add TypeScript plugin
    },
    rules: {
      // ESLint recommended and TypeScript rules
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      // Custom rules
      "no-console": "off", // Allow console statements in Node.js
      "@typescript-eslint/no-explicit-any": "warn", // Warn against using 'any'
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }, // Ignore unused variables starting with '_'
      ],
      "node/no-unsupported-features/es-syntax": "off", // Disable warnings for ES module syntax
      "node/no-missing-import": "off", // Disable missing import warnings in TS
    },
  },
];
