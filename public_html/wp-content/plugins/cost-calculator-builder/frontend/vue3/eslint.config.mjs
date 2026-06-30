import vue from "eslint-plugin-vue";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

export default [
  {
    ignores: ["node_modules/", "dist/", ".output/", "coverage/"],
    files: ["src/**/*.vue", "src/**/*.ts"], // Ensure Vue & TS files are processed
    languageOptions: {
      parser: vueParser, // Use Vue ESLint parser for .vue files
      parserOptions: {
        parser: {
          ts: tsParser, // Ensure TypeScript inside <script lang="ts">
        },
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
    plugins: {
      vue,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-var": "error",
      eqeqeq: 2,
      "no-console": ["error"],
      "no-debugger": 2,
      "no-prototype-builtins": "off",
      "no-useless-escape": "off",
      "vue/multi-word-component-names": "off",

      // Vue-specific rules
      "vue/html-indent": ["error", 2], // Enforce 2-space indentation in <template>
      "vue/max-attributes-per-line": ["error", { singleline: 3 }],
      "vue/no-unused-vars": "error", // Detect unused variables in Vue templates

      // TypeScript-specific rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
