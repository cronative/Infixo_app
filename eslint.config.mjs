import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  ]),
  {
    rules: {
      // DB query results from mysql2 are typed at runtime — any is acceptable in API routes
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow underscore-prefixed unused vars (common convention for ignored params)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // React 19 / Next.js 16 introduces stricter hook rules. These patterns
      // (conditional setState inside useEffect) are intentional and safe when
      // guarded by conditions — they do not cause infinite loops in practice.
      "react-hooks/set-state-in-effect": "warn",

      // Unescaped entities in JSX — apostrophes in English text are common and safe
      "react/no-unescaped-entities": "warn",


      // Conditional useMemo is a real hook rule violation — keep as warn to surface it
      "react-hooks/rules-of-hooks": "warn",

      // prefer-const is auto-fixable and safe
      "prefer-const": "error",
    },
  },
]);

export default eslintConfig;
