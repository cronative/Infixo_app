import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Server-side Node.js Express code (CommonJS, not part of Next.js app router)
    "server/**",
    // Codex backup patches
    "codex-backups/**",
    // One-off CommonJS database diagnostics are not shipped with the application.
    "scratch/**",
  ]),
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // DB query results from mysql2 are typed at runtime — turn off no-explicit-any
      // (TypeScript compiler still catches actual type errors at build time)
      "@typescript-eslint/no-explicit-any": "off",

      // Unused vars: keep off for UI component boilerplate and API handler signatures
      "@typescript-eslint/no-unused-vars": "off",

      // React 19 / Next.js 16 introduces stricter hook rules. State initialization
      // inside useEffect on client mount is standard and safe in this codebase.
      "react-hooks/set-state-in-effect": "off",

      // Apostrophes and quotes in JSX text are safe and standard in English UI copy
      "react/no-unescaped-entities": "off",

      // Hook dependency arrays: intentional manual control for data fetch on mount
      "react-hooks/exhaustive-deps": "off",

      // Rules of hooks must always be strictly followed
      "react-hooks/rules-of-hooks": "error",

      // prefer-const is auto-fixable and safe
      "prefer-const": "error",
    },
  },
]);

export default eslintConfig;
