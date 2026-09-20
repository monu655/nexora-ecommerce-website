import { readdirSync, chmodSync, statSync } from 'node:fs';
import { join } from 'node:path';

const binDir = join(process.cwd(), 'node_modules', '.bin');

try {
  for (const name of readdirSync(binDir)) {
    const path = join(binDir, name);
    try {
      if (statSync(path).isFile()) chmodSync(path, 0o755);
    } catch {
      // skip broken entries
    }
  }
} catch {
  // node_modules/.bin doesn't exist yet
}