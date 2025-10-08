import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintJs from "@eslint/js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: projectRoot,
  recommendedConfig: eslintJs.configs.recommended
});

export default compat.config({ extends: ["./.eslintrc.cjs"] });
