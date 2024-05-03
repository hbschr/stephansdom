import eslint from "@eslint/js";
import configPrettier from "eslint-config-prettier";
import pluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import typescript from "typescript-eslint";

export default [
  { languageOptions: { sourceType: "module" } },
  eslint.configs.recommended,
  ...typescript.configs.recommended,
  configPrettier,
  pluginPrettierRecommended,
];
