// Adds 8 products to the "Laptop Accessories" and "Mobile Accessories" categories.
//
// Standalone: does NOT import your Product model, so there is no path to fix.
// Safe to re-run: products are matched by slug and only inserted if missing.
// Existing products are never modified. Your .env is only read, never changed.
//
// Place at:  server/scripts/addAccessoryProducts.v2.mjs
// Run from:  server/
//   Preview only : node scripts/addAccessoryProducts.v2.mjs --dry
//   Really add   : node scripts/addAccessoryProducts.v2.mjs
//
// Optional: if your collection is not called "products":
//   PRODUCTS_COLLECTION=items node scripts/addAccessoryProducts.v2.mjs

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

const DRY = process.argv.includes('--dry');

const pct = (price, compare) => Math.round(((compare - price) / compare) * 100);

const products = [
  // ---------------------------- Laptop Accessories ----------------------------
  {
    name: 'Nexora Dock Pro 9-in-1',
    slug: 'nexora-dock-pro-9-in-1',
    sku: 'NXR-LA-DOCK9',
    category: 'Laptop Accessories',
    tagline: 'One USB-C cable, nine ports, a clear desk.',
    description:
      'The Dock Pro turns a single USB-C port into HDMI, USB-A, SD card, Ethernet and pass-through charging. The aluminium body spreads heat so it stays cool through long video calls and heavy transfers.',
    highlights: ['4K HDMI output', '100W power delivery pass-through', 'Gigabit Ethernet', 'SD and microSD readers'],
    specs: { Ports: '9', Video: 'HDMI 4K @ 30Hz', 'Power delivery': 'Up to 100W', Material: 'Aluminium', Warranty: '2 years' },
    price: 4999, compareAtPrice: 5999, stock: 40, colorway: '#5B6470',
  },
  {
    name: 'Nexora Aero Laptop Stand',
    slug: 'nexora-aero-laptop-stand',
    sku: 'NXR-LA-STAND',
    category: 'Laptop Accessories',
    tagline: 'Raise your screen to eye level, fold it flat to carry.',
    description:
      'A foldable aluminium stand with six height positions and silicone grips. It improves posture, lets air flow under your laptop and packs down thin enough for a backpack.',
    highlights: ['6 height positions', 'Folds flat', 'Anti-slip silicone pads', 'Fits 10 to 17 inch laptops'],
    specs: { Material: 'Aluminium alloy', 'Height range': '6 positions', Compatibility: '10 to 17 inch', Weight: '280 g', Warranty: '2 years' },
    price: 2499, compareAtPrice: 2999, stock: 65, colorway: '#8A94A6',
  },
  {
    name: 'Nexora Vault 1TB Portable SSD',
    slug: 'nexora-vault-1tb-portable-ssd',
    sku: 'NXR-LA-SSD1T',
    category: 'Laptop Accessories',
    tagline: 'Pocket-sized storage that moves big files fast.',
    description:
      'The Vault is a shock-resistant portable SSD with USB 3.2 speeds, so large project folders and backups finish in moments. It works with laptops, tablets and phones over USB-C.',
    highlights: ['1TB capacity', 'USB 3.2 Gen 2', 'Shock resistant', 'Includes USB-C and USB-A cables'],
    specs: { Capacity: '1 TB', Interface: 'USB 3.2 Gen 2', 'Read speed': 'Up to 1000 MB/s', Weight: '55 g', Warranty: '2 years' },
    price: 8999, compareAtPrice: 10999, stock: 30, colorway: '#1F4FD8',
  },
  {
    name: 'Nexora Slate Laptop Sleeve 14"',
    slug: 'nexora-slate-laptop-sleeve-14',
    sku: 'NXR-LA-SLV14',
    category: 'Laptop Accessories',
    tagline: 'Slim, padded protection for a 14 inch laptop.',
    description:
      'A water-resistant sleeve with a soft microfibre lining and padded edges. A front pocket holds your charger and cables, and the slim profile slides easily into any bag.',
    highlights: ['Water-resistant outer', 'Soft microfibre lining', 'Front accessory pocket', 'Fits 13 to 14 inch laptops'],
    specs: { Size: '14 inch', Exterior: 'Water-resistant fabric', Lining: 'Microfibre', Weight: '210 g', Warranty: '1 year' },
    price: 1799, compareAtPrice: 2199, stock: 80, colorway: '#2B2F36',
  },

  // ---------------------------- Mobile Accessories ----------------------------
  {
    name: 'Nexora Charge 65W GaN Charger',
    slug: 'nexora-charge-65w-gan-charger',
    sku: 'NXR-MA-GAN65',
    category: 'Mobile Accessories',
    tagline: 'One small charger for your phone and your laptop.',
    description:
      'A compact GaN charger with two USB-C ports and one USB-A. It delivers up to 65W to a laptop or splits power across devices, and it runs cool in a much smaller body than older chargers.',
    highlights: ['65W total output', '2 USB-C and 1 USB-A ports', 'GaN technology, compact size', 'Over-heat and short-circuit protection'],
    specs: { Output: '65W', Ports: '2x USB-C, 1x USB-A', Technology: 'GaN', Protection: 'Over-heat, over-current', Warranty: '2 years' },
    price: 2299, compareAtPrice: 2799, stock: 90, colorway: '#0F766E',
  },
  {
    name: 'Nexora Link USB-C Braided Cable 1m',
    slug: 'nexora-link-usb-c-braided-cable-1m',
    sku: 'NXR-MA-CBL1M',
    category: 'Mobile Accessories',
    tagline: 'A tough braided cable that handles fast charging.',
    description:
      'A 1 metre USB-C to USB-C cable with a reinforced braided jacket and strain relief at both ends. It supports up to 60W charging and fast data transfer.',
    highlights: ['Up to 60W charging', 'Braided, tangle-resistant jacket', 'Reinforced connector ends', '1 metre length'],
    specs: { Length: '1 m', Connectors: 'USB-C to USB-C', Charging: 'Up to 60W', 'Data speed': 'USB 2.0 (480 Mbps)', Warranty: '1 year' },
    price: 799, compareAtPrice: 999, stock: 150, colorway: '#B45309',
  },
  {
    name: 'Nexora Grip Magnetic Car Mount',
    slug: 'nexora-grip-magnetic-car-mount',
    sku: 'NXR-MA-MOUNT',
    category: 'Mobile Accessories',
    tagline: 'Your phone at a glance, held firmly on every road.',
    description:
      'A compact vent-clip mount with a strong magnetic head. Attach the included metal plate to your phone or case, and it snaps into place and rotates for portrait or landscape.',
    highlights: ['Strong magnetic hold', '360 degree rotation', 'Fits most air vents', 'Includes 2 metal plates'],
    specs: { Mounting: 'Air vent clip', Rotation: '360 degrees', Included: '2 metal plates', Weight: '70 g', Warranty: '1 year' },
    price: 1299, compareAtPrice: 1599, stock: 70, colorway: '#374151',
  },
  {
    name: 'Nexora Reserve 20000mAh Power Bank',
    slug: 'nexora-reserve-20000mah-power-bank',
    sku: 'NXR-MA-PB20K',
    category: 'Mobile Accessories',
    tagline: 'Days of battery for your phone, in one slim block.',
    description:
      'A 20000mAh power bank with 22.5W fast charging and a digital display showing the exact charge left. Two outputs charge a phone and earbuds at once, and it can be charged in about six hours.',
    highlights: ['20000mAh capacity', '22.5W fast charging', 'Digital charge display', 'Charges 2 devices at once'],
    specs: { Capacity: '20000 mAh', Output: '22.5W max', Ports: 'USB-C and USB-A', Display: 'Digital percentage', Warranty: '1 year' },
    price: 2999, compareAtPrice: 3499, stock: 55, colorway: '#7C3AED',
  },
].map((p) => ({
  ...p,
  discountPercent: pct(p.price, p.compareAtPrice),
  stockStatus: p.stock <= 10 ? 'low_stock' : 'in_stock',
  rating: 0,
  reviewCount: 0,
  // Fields your existing products have (found by the dry run):
  brand: 'Nexora',
  cost: Math.round(p.price * 0.6),
  lowStockThreshold: 10,
  images: [],
  tags: p.category.startsWith('Laptop') ? ['laptop', 'desk', 'work'] : ['mobile', 'charging', 'travel'],
  unitsSold: 0,
  isFeatured: false,
  isActive: true, // the shop most likely hides products where this is not true
}));

function findMongoUri() {
  const names = ['MONGODB_URI', 'MONGO_URI', 'MONGO_URL', 'MONGODB_URL', 'DATABASE_URL', 'DB_URI', 'DB_URL'];
  for (const n of names) if (process.env[n]) return process.env[n];
  // Fall back to any variable whose value looks like a MongoDB URL.
  const found = Object.values(process.env).find((v) => /^mongodb(\+srv)?:\/\//.test(v || ''));
  return found || undefined;
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
  console.log(`Connected to database "${db.databaseName}"${DRY ? '  (DRY RUN: nothing will be written)' : ''}\n`);

  // Find the products collection.
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  const collName =
    process.env.PRODUCTS_COLLECTION ||
    (names.includes('products') ? 'products' : names.find((n) => /product/i.test(n) && !/review|categor/i.test(n)));
  if (!collName) {
    throw new Error(`Could not find a products collection. Collections here: ${names.join(', ') || '(none)'}. Set PRODUCTS_COLLECTION=<name> and run again.`);
  }
  const col = db.collection(collName);
  console.log(`Using collection "${collName}" (${await col.countDocuments()} existing products)`);

  // Compare with an existing product so we can warn about fields we don't fill.
  const sample = await col.findOne({});
  if (sample) {
    const ours = new Set(Object.keys(products[0]).concat(['createdAt', 'updatedAt']));
    const missing = Object.keys(sample).filter((k) => !['_id', '__v'].includes(k) && !ours.has(k));
    if (missing.length) {
      console.log(`\nHeads up: your existing products also have these fields, which this script does not set:\n  ${missing.join(', ')}`);
      console.log('If the new products look wrong in the shop (e.g. missing image), send me one existing product document.\n');
    }
  }

  if (sample) {
    console.log(`Existing product "images" looks like: ${JSON.stringify(sample.images)?.slice(0, 200)}`);
  }

  // discountPercent / stockStatus may be computed by your model, not stored.
  // Only store them if your existing products store them too.
  const drop = sample ? ['discountPercent', 'stockStatus'].filter((k) => !(k in sample)) : [];

  let added = 0;
  let existed = 0;
  let clashed = 0;
  const now = new Date();

  for (const p of products) {
    const bySlug = await col.findOne({ slug: p.slug }, { projection: { _id: 1 } });
    if (bySlug) { existed += 1; console.log(`  = exists   ${p.name}`); continue; }

    const bySku = await col.findOne({ sku: p.sku }, { projection: { _id: 1 } });
    if (bySku) { clashed += 1; console.log(`  ! SKU used ${p.name} (${p.sku}) - skipped`); continue; }

    if (!DRY) {
      const doc = { ...p, createdAt: now, updatedAt: now };
      drop.forEach((k) => delete doc[k]);
      await col.insertOne(doc);
    }
    added += 1;
    console.log(`  + ${DRY ? 'would add' : 'added   '} ${p.name}`);
  }

  console.log(`\n${DRY ? 'Dry run' : 'Done'}. ${DRY ? 'Would add' : 'Added'} ${added}, already present ${existed}, SKU clashes ${clashed}.`);

  if (!DRY) {
    const counts = await col
      .aggregate([{ $match: { category: { $in: ['Laptop Accessories', 'Mobile Accessories'] } } }, { $group: { _id: '$category', n: { $sum: 1 } } }])
      .toArray();
    console.log('Products now in these categories:', counts.map((c) => `${c._id}: ${c.n}`).join(' | ') || 'none');
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('\nFailed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});