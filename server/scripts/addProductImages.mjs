// Attaches REAL photos to the 8 accessory products.
//
// HOW IT WORKS
//  1. Paste image links into REMOTE_URLS below (only use images you have the right to use).
//  2. OR save your photos in:  client/public/images/products/
//     Name each file exactly like the product slug, for example:
//        nexora-dock-pro-9-in-1.jpg        (main photo)
//        nexora-dock-pro-9-in-1-2.jpg      (optional 2nd photo)
//     .jpg  .jpeg  .png  .webp  .avif  all work.
//  3. Run from the server/ folder:
//        Preview : node scripts/addProductImages.mjs --dry
//        Apply   : node scripts/addProductImages.mjs
//
// Safe to re-run. It only changes the "images" field of these 8 products.
// Products that have no photo yet are skipped and left as they are.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---- Paste image links here ----
const REMOTE_URLS = {
  'nexora-dock-pro-9-in-1': 'https://images.unsplash.com/photo-1760376789487-994070337c76?auto=format&fit=crop&w=900&q=70',
  'nexora-aero-laptop-stand': 'https://images.unsplash.com/photo-1629317480826-910f729d1709?auto=format&fit=crop&w=900&q=70',
  'nexora-vault-1tb-portable-ssd': 'https://images.unsplash.com/photo-1577538926210-fc6cc624fde2?auto=format&fit=crop&w=900&q=70',
  'nexora-slate-laptop-sleeve-14': 'https://images.unsplash.com/photo-1689757855413-9e366c2011f1?auto=format&fit=crop&w=900&q=70',
  'nexora-charge-65w-gan-charger': 'https://images.unsplash.com/photo-1763161786687-43d0c9babdf0?auto=format&fit=crop&w=900&q=70',
  'nexora-link-usb-c-braided-cable-1m': 'https://images.unsplash.com/photo-1639675960002-2f414c58ed79?auto=format&fit=crop&w=900&q=70',
  'nexora-grip-magnetic-car-mount': 'https://images.unsplash.com/photo-1764347923709-fc48487f2486?auto=format&fit=crop&w=900&q=70',
  'nexora-reserve-20000mah-power-bank': 'https://images.unsplash.com/photo-1745889763764-a13bc5028c4d?auto=format&fit=crop&w=900&q=70',
};

// Products whose current photo is WRONG and should be removed when no correct link is given above.
// (They will show the normal placeholder icon instead of a wrong picture.) Empty = nothing to remove.
const CLEAR_WRONG_PHOTO = [];
// --------------------------------

const SLUGS = [
  ['nexora-dock-pro-9-in-1', 'Nexora Dock Pro 9-in-1'],
  ['nexora-aero-laptop-stand', 'Nexora Aero Laptop Stand'],
  ['nexora-vault-1tb-portable-ssd', 'Nexora Vault 1TB Portable SSD'],
  ['nexora-slate-laptop-sleeve-14', 'Nexora Slate Laptop Sleeve 14"'],
  ['nexora-charge-65w-gan-charger', 'Nexora Charge 65W GaN Charger'],
  ['nexora-link-usb-c-braided-cable-1m', 'Nexora Link USB-C Braided Cable 1m'],
  ['nexora-grip-magnetic-car-mount', 'Nexora Grip Magnetic Car Mount'],
  ['nexora-reserve-20000mah-power-bank', 'Nexora Reserve 20000mAh Power Bank'],
];

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const PHOTO_DIR = fileURLToPath(new URL('../../client/public/images/products/', import.meta.url));
const DRY = process.argv.includes('--dry');

// Load .env (dotenv if installed, otherwise Node's built-in loader).
try { await import('dotenv/config'); } catch { try { process.loadEnvFile?.(); } catch { /* no .env file */ } }

let mongoose;
try {
  ({ default: mongoose } = await import('mongoose'));
} catch {
  console.error('Could not load "mongoose". Run this command from the server/ folder (where package.json is).');
  console.error('If it still fails, run "npm install" inside server/ first.');
  process.exit(1);
}

function findMongoUri() {
  const names = ['MONGODB_URI', 'MONGO_URI', 'MONGO_URL', 'MONGODB_URL', 'DATABASE_URL', 'DB_URI', 'DB_URL'];
  for (const n of names) if (process.env[n]) return process.env[n];
  const found = Object.values(process.env).find((v) => /^mongodb(\+srv)?:\/\//.test(v || ''));
  return found || undefined;
}

// Returns the list of image URLs for one product: pasted link first, otherwise local files.
function collectImages(slug) {
  if (REMOTE_URLS[slug]) return [REMOTE_URLS[slug]];
  if (!fs.existsSync(PHOTO_DIR)) return [];
  const found = [];
  for (const suffix of ['', '-2', '-3', '-4']) {
    const ext = EXTENSIONS.find((e) => fs.existsSync(PHOTO_DIR + slug + suffix + e));
    if (ext) found.push(`/images/products/${slug}${suffix}${ext}`);
  }
  return found;
}

// Store images in the same shape your existing products use (plain strings or objects).
function makeEntryBuilder(sampleImages) {
  const first = Array.isArray(sampleImages) ? sampleImages[0] : undefined;
  if (first && typeof first === 'object') {
    const urlKey = ['url', 'src', 'secure_url', 'path', 'image'].find((k) => k in first) || 'url';
    return (url, name, index) => {
      const entry = { [urlKey]: url };
      if ('alt' in first) entry.alt = name;
      if ('isPrimary' in first) entry.isPrimary = index === 0;
      return entry;
    };
  }
  return (url) => url;
}

async function run() {
  const uri = findMongoUri();
  if (!uri) {
    throw new Error(
      'No MongoDB connection string found. Run this from the server/ folder and make sure server/.env has your MongoDB URL (it starts with mongodb:// or mongodb+srv://).'
    );
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (e) {
    throw new Error(`Could not connect to MongoDB (${e.message}). Check that MongoDB is running, or that your Atlas IP address is allowed.`);
  }
  const db = mongoose.connection.db;
  console.log(`Connected to database "${db.databaseName}"${DRY ? '  (DRY RUN: nothing will be written)' : ''}`);
  console.log(`Looking for photos in: ${PHOTO_DIR}\n`);

  const names = (await db.listCollections().toArray()).map((c) => c.name);
  const collName =
    process.env.PRODUCTS_COLLECTION ||
    (names.includes('products') ? 'products' : names.find((n) => /product/i.test(n) && !/review|categor/i.test(n)));
  if (!collName) {
    throw new Error(`Could not find a products collection. Collections here: ${names.join(', ') || '(none)'}. Set PRODUCTS_COLLECTION=<name> and run again.`);
  }
  const col = db.collection(collName);

  // Use the same "images" shape as products that already have photos.
  const withImages = await col.findOne({ 'images.0': { $exists: true } });
  const build = makeEntryBuilder(withImages?.images);
  console.log(`Your existing "images" format: ${withImages ? JSON.stringify(withImages.images).slice(0, 160) : '(no product has images yet, using plain links)'}\n`);

  let updated = 0;
  let waiting = 0;
  let cleared = 0;
  let missing = 0;

  for (const [slug, name] of SLUGS) {
    const product = await col.findOne({ slug }, { projection: { _id: 1 } });
    if (!product) { missing += 1; console.log(`  ! not in database   ${name} (run addAccessoryProducts first)`); continue; }

    const urls = collectImages(slug);
    if (urls.length === 0) {
      if (CLEAR_WRONG_PHOTO.includes(slug)) {
        if (!DRY) await col.updateOne({ _id: product._id }, { $set: { images: [], updatedAt: new Date() } });
        cleared += 1;
        console.log(`  x ${DRY ? 'would remove' : 'removed    '}      wrong photo of ${name}`);
      } else {
        waiting += 1;
        console.log(`  - no photo yet      ${name}  (expected: ${slug}.jpg)`);
      }
      continue;
    }

    if (!DRY) {
      await col.updateOne({ _id: product._id }, { $set: { images: urls.map((u, i) => build(u, name, i)), updatedAt: new Date() } });
    }
    updated += 1;
    console.log(`  + ${DRY ? 'would set' : 'set      '}         ${name}  ->  ${urls.join(', ')}`);
  }

  console.log(`\n${DRY ? 'Dry run' : 'Done'}. ${DRY ? 'Would update' : 'Updated'} ${updated}, waiting for a photo ${waiting}, wrong photos removed ${cleared}, not in database ${missing}.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('\nFailed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});