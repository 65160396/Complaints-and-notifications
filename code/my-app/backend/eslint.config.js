const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "complexity": ["warn", 10]
    }
  }
];