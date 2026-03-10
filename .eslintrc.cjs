/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  extends: ["standard-with-typescript"],
  settings: {
    "import/resolver": {
      typescript: {
        project: [
          "./tsconfig.json",
          "./apps/*/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./packages/platform/*/tsconfig.json",
        ],
        noWarnOnMultipleProjects: true,
      },
    },
  },
  ignorePatterns: ["**/dist/**", "**/node_modules/**", "*.config.ts"],
  rules: {
    "@typescript-eslint/quotes": ["error", "double"],
    "@typescript-eslint/semi": ["error", "always"],
    "@typescript-eslint/comma-dangle": ["error", "always-multiline"],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
      },
    ],
    "@typescript-eslint/method-signature-style": "off",
    "@typescript-eslint/space-before-function-paren": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/promise-function-async": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../**/packages/**", "../**/apps/**"],
            message:
              "Usa aliases `@finanzas/*` para imports entre paquetes/apps. Deja rutas relativas solo dentro del mismo paquete.",
          },
        ],
      },
    ],
  },
};
