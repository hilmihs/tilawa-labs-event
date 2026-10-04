import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // .claude/ holds other sessions' worktrees, each with its own node_modules and
    // its own in-progress tests; none of it is this tree's to run.
    exclude: ["**/node_modules/**", ".next/**", "design/**", ".claude/**"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
