import type { Page } from "@playwright/test";

export async function openInspectorMore(page: Page) {
  const inspector = page.locator(".garden-edit-inspector");
  if (!await inspector.count()) return;
  if (!await inspector.evaluate((n) => (n as HTMLDetailsElement).open)) await inspector.locator(":scope > summary").click();
  const more = inspector.locator(".garden-inspector-more");
  if (await more.count() && !await more.evaluate((n) => (n as HTMLDetailsElement).open)) await more.locator(":scope > summary").click();
}
export async function editorAction(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  if (await button.count() === 1 && await button.isVisible()) { await button.click(); return; }
  const mode = /^(Add bed|Add path|Add fence|Add trellis|Add tree|Add structure)$/.test(name) ? "Build" : /^(Add plant|Add row|Fill patch|Plant brush)$/.test(name) ? "Plant" : /^(Move|Box select)$/.test(name) ? "Select" : null;
  if (mode && await page.locator(".garden-editor-modes").count()) { await page.locator(".garden-editor-modes").getByRole("button", { name: mode, exact: true }).click(); await button.click(); return; }
  if (["Delete selected", "Generate seasonal layout", "Preview plant arrangement", "Focus bed"].includes(name)) { await openInspectorMore(page); await button.click(); return; }
  const menu = page.locator(".garden-tools-menu");
  if (await menu.count()) { if (!await menu.evaluate((n) => (n as HTMLDetailsElement).open)) await menu.locator(":scope > summary").click(); await menu.getByRole("button", { name, exact: true }).click(); return; }
  await button.click();
}
