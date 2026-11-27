// The extension's two build plugins (spec AIB-76n extension-popup), kept apart
// from vite.config.js so node --test can drive them.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICON_SIZES, manifest } from "./manifest.config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.resolve(here, "../../packages/design-system/assets/extension");

// Ledger's styles.css opens with a Google Fonts @import. The extension bundles
// its fonts (src/fonts.css), so that line goes: no request leaves for fonts.
const GOOGLE_IMPORT = /@import\s+url\(\s*["']?https:\/\/fonts\.googleapis\.com\/[^)]*\)\s*;?/g;

export function stripGoogleFonts(css) {
  return css.replace(GOOGLE_IMPORT, "");
}

export function bundledFonts() {
  return {
    name: "aibytes-bundled-fonts",
    enforce: "pre",
    transform(code, id) {
      if (id.split("?")[0].endsWith(".css") && GOOGLE_IMPORT.test(code)) {
        GOOGLE_IMPORT.lastIndex = 0;
        return { code: stripGoogleFonts(code), map: null };
      }
    },
  };
}

// manifest.json for the build's mode, and Ledger's icon PNGs beside it.
export function extensionManifest({ mode, version }) {
  return {
    name: "aibytes-extension-manifest",
    async generateBundle() {
      for (const size of ICON_SIZES) {
        this.emitFile({
          type: "asset",
          fileName: `icons/icon-${size}.png`,
          source: await readFile(path.join(ICONS, `icon-${size}.png`)),
        });
      }
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest({ mode, version }), null, 2) + "\n",
      });
    },
  };
}
