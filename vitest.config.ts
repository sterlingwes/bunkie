import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/bunkie/",
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
