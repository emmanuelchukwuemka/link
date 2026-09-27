import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This rule flags every "fetch on mount into useState" client component,
      // including single synchronous setState calls with no re-render chain
      // (e.g. `useEffect(() => setItems(getCart()), [])`). The dashboards in
      // this app rely on that idiom throughout for authenticated client-side
      // data loading. Revisit if/when those pages move to Server Components.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone maintenance scripts run via plain `node`, not part of the app bundle.
    "prisma/seed.js",
    "prisma/promote-admin.js",
  ]),
]);

export default eslintConfig;
