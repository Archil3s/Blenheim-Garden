import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, parent, ...rest);
};
for (const extension of ['.ts', '.tsx']) {
  loadModule.extensions[extension] = (module, filename) => {
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    module._compile(result.outputText, filename);
  };
}
process.chdir(root);
const { buildAuditCatalogue } = loadModule('../lib/garden/audit-catalog-server.ts');
const catalogue = buildAuditCatalogue();
fs.writeFileSync(path.join(root, 'lib/garden/audit-catalogue.generated.json'), JSON.stringify(catalogue, null, 2) + '\n');
console.log(`Saved ${catalogue.entries.length} audit entries and ${catalogue.assets.length} asset references.`);
