const react = require("eslint-plugin-react");
module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".expo/**",
      ".jest-cache/**",
      "coverage/**",
    ],
  },
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: Object.fromEntries(
        [
          "require",
          "module",
          "process",
          "console",
          "alert",
          "localStorage",
          "fetch",
          "AbortController",
          "URL",
          "setTimeout",
          "clearTimeout",
          "jest",
          "test",
          "expect",
          "describe",
          "beforeEach",
          "afterEach",
          "global",
        ].map((key) => [key, "readonly"]),
      ),
    },
    plugins: { react },
    rules: {
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
    },
  },
];
