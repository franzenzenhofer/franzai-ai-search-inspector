module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "max-lines": ["error", { "max": 75 }],
    "max-lines-per-function": ["error", { "max": 15 }],
    "complexity": ["error", 10],
    "max-depth": ["error", 3]
  },
  overrides: [
    {
      files: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      rules: {
        "max-lines": "off",
        "max-lines-per-function": "off"
      }
    }
  ],
  ignorePatterns: ["dist/**", "*.config.ts"]
};
