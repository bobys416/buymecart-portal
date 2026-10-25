import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(new URL("./node_modules/react-dom", import.meta.url)),
      "react-native": fileURLToPath(new URL("./tests/react-native-mock.tsx", import.meta.url)),
      "@buymecart/shared-types": fileURLToPath(new URL("./packages/shared-types/index.ts", import.meta.url)),
      "@buymecart/business-logic": fileURLToPath(new URL("./packages/business-logic/index.ts", import.meta.url)),
      "@buymecart/design-tokens": fileURLToPath(new URL("./packages/design-tokens/index.ts", import.meta.url)),
      "@buymecart/validation": fileURLToPath(new URL("./packages/validation/index.ts", import.meta.url)),
      "@buymecart/api-client": fileURLToPath(new URL("./packages/api-client/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 20000,
  },
});
