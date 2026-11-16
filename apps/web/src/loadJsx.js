// Loads a .jsx file under plain `node --test`, as Ledger's own component tests do:
// bundled with esbuild (React stays external) and run as a module. Tests only.
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

export async function loadJsx(url) {
  const file = fileURLToPath(url);
  const result = await build({ entryPoints: [file], bundle: true, platform: "node", format: "cjs", external: ["react", "react-dom"], write: false, logLevel: "silent" });
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(file);
  mod.require = createRequire(file);
  mod._compile(result.outputFiles[0].text, file);
  return mod.exports;
}
