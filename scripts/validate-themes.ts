/**
 * Contrast guard for every registered theme (also runs on `npm run build` via prebuild).
 *   npm run validate:themes
 */
import { listThemes } from "@/themes/config";
import { MIN_CONTRAST } from "@/lib/themeContrast";

// Importing themes/config registers (and validates) every theme; reaching here means all passed.
for (const theme of listThemes()) console.log(`✓ ${theme.id} meets ${MIN_CONTRAST}:1 on all required pairs`);
