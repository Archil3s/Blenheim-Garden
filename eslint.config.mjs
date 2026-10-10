import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".open-next/**", "node_modules/**", "public/models/tomato/vendor/**", "playwright-report/**", "visual-artifacts/**", "test-results/**"]),
]);

export default eslintConfig;
