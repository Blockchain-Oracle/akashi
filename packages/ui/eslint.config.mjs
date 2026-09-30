import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Numbers every file needs without a name; anything else is a named constant (the user's no-magic-numbers rule).
const ALLOWED_NUMBERS = [-1, 0, 1, 2];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: ALLOWED_NUMBERS,
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      // a component library, not a Next app: there is no pages directory to check links against
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    // constants modules are where the numbers are named
    files: ["src/constants.ts"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
  globalIgnores(["node_modules/**"]),
]);
