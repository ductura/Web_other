import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  // Playwright fixtures zovu `use(...)`, što pravilo za React kuke pogrešno čita kao kuku.
  { files: ["tests/e2e/**"], rules: { "react-hooks/rules-of-hooks": "off" } },
  { ignores: [".next/**", "node_modules/**", "test-results/**", "playwright-report/**", "next-env.d.ts"] },
];

export default config;
