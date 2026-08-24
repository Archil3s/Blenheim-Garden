import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "webkit-desktop",
      use: { browserName: "webkit", viewport: { width: 1440, height: 900 } },
    },
  ],
});
