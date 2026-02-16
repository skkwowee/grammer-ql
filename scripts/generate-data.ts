/**
 * Generate a synthetic e-commerce orders CSV dataset.
 * Run: npx tsx scripts/generate-data.ts
 */

const PRODUCTS = [
  // Electronics
  { name: "Superstrike 2 Wireless Mouse", category: "Electronics", priceRange: [59.99, 79.99] },
  { name: "Superstrike 2 Mousepad XL", category: "Electronics", priceRange: [24.99, 34.99] },
  { name: "Superstrike 2 USB-C Dongle", category: "Electronics", priceRange: [14.99, 19.99] },
  { name: "MechForce TKL Keyboard", category: "Electronics", priceRange: [89.99, 129.99] },
  { name: "ClearView 27in Monitor", category: "Electronics", priceRange: [249.99, 349.99] },
  { name: "SoundPulse ANC Headphones", category: "Electronics", priceRange: [129.99, 179.99] },
  { name: "QuickCharge 65W USB-C Adapter", category: "Electronics", priceRange: [29.99, 44.99] },
  { name: "StreamDeck Mini Controller", category: "Electronics", priceRange: [49.99, 69.99] },
  { name: "NanoHub 7-Port USB Hub", category: "Electronics", priceRange: [19.99, 29.99] },
  { name: "FlexMount Monitor Arm", category: "Electronics", priceRange: [34.99, 54.99] },
  // Home & Office
  { name: "ErgoRise Standing Desk Mat", category: "Home & Office", priceRange: [39.99, 59.99] },
  { name: "LumiBar LED Desk Lamp", category: "Home & Office", priceRange: [29.99, 49.99] },
  { name: "AirPure Mini Humidifier", category: "Home & Office", priceRange: [19.99, 34.99] },
  { name: "CableBox Organizer", category: "Home & Office", priceRange: [12.99, 22.99] },
  { name: "ThermoMug Smart Warmer", category: "Home & Office", priceRange: [24.99, 39.99] },
  // Apparel
  { name: "CloudStep Running Shoes", category: "Apparel", priceRange: [89.99, 119.99] },
  { name: "DryFit Performance Tee", category: "Apparel", priceRange: [24.99, 34.99] },
  { name: "FlexFit Joggers", category: "Apparel", priceRange: [44.99, 64.99] },
  { name: "AllWeather Zip Hoodie", category: "Apparel", priceRange: [54.99, 79.99] },
  // Accessories
  { name: "TitanGrip Phone Case", category: "Accessories", priceRange: [14.99, 29.99] },
  { name: "PowerBank 20000mAh", category: "Accessories", priceRange: [34.99, 49.99] },
  { name: "SnapLens Webcam Cover 3-Pack", category: "Accessories", priceRange: [4.99, 9.99] },
  { name: "SteelWeave USB-C Cable 6ft", category: "Accessories", priceRange: [9.99, 16.99] },
  { name: "GlideWrist Ergonomic Wrist Rest", category: "Accessories", priceRange: [14.99, 24.99] },
  { name: "PixelClean Screen Wipes 50ct", category: "Accessories", priceRange: [6.99, 11.99] },
];

const CUSTOMER_COUNT = 200;
const ORDER_COUNT = 2000;
const DAYS_RANGE = 90;

// Seeded pseudo-random number generator (mulberry32)
function createRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function main() {
  const rng = createRng(42);

  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const randBetween = (min: number, max: number) => min + rng() * (max - min);
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const now = new Date("2026-02-16T12:00:00Z");
  const msPerDay = 86400000;

  const lines: string[] = [
    "order_id,customer_id,customer_name,product_name,category,quantity,unit_price,amount,order_date",
  ];

  // Generate customer names
  const firstNames = [
    "James", "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia",
    "Mason", "Isabella", "Lucas", "Mia", "Oliver", "Charlotte", "Aiden",
    "Amelia", "Elijah", "Harper", "Logan", "Evelyn", "Alex", "Luna",
    "Daniel", "Chloe", "Jack", "Ella", "Henry", "Grace", "Sebastian", "Lily",
  ];
  const lastNames = [
    "Chen", "Smith", "Garcia", "Kim", "Patel", "Johnson", "Williams", "Brown",
    "Jones", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson",
    "Thomas", "Lee", "Harris", "Clark", "Lewis", "Robinson", "Walker",
    "Hall", "Young", "Allen", "King", "Wright", "Scott", "Green", "Adams",
  ];

  const customers = Array.from({ length: CUSTOMER_COUNT }, (_, i) => ({
    id: `CUST-${String(i + 1).padStart(4, "0")}`,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
  }));

  for (let i = 1; i <= ORDER_COUNT; i++) {
    const customer = pick(customers);
    const product = pick(PRODUCTS);
    const quantity = Math.max(1, Math.floor(rng() * 4 + rng())); // skewed toward 1-2
    const unitPrice = round2(randBetween(product.priceRange[0], product.priceRange[1]));
    const amount = round2(unitPrice * quantity);

    // Skew dates toward recent — more orders in the last 30 days
    const daysAgo = Math.floor(Math.pow(rng(), 1.5) * DAYS_RANGE);
    const hoursOffset = Math.floor(rng() * 24);
    const minutesOffset = Math.floor(rng() * 60);
    const orderDate = new Date(
      now.getTime() - daysAgo * msPerDay - hoursOffset * 3600000 - minutesOffset * 60000
    );
    const dateStr = orderDate.toISOString().replace("T", " ").slice(0, 19);

    // CSV-safe: quote fields that might contain commas
    const productNameSafe = `"${product.name}"`;
    const customerNameSafe = `"${customer.name}"`;

    lines.push(
      `${i},${customer.id},${customerNameSafe},${productNameSafe},${product.category},${quantity},${unitPrice},${amount},${dateStr}`
    );
  }

  const csv = lines.join("\n") + "\n";
  const fs = require("fs");
  const path = require("path");
  const outPath = path.join(__dirname, "..", "data", "orders.csv");
  fs.writeFileSync(outPath, csv);
  console.log(`Generated ${ORDER_COUNT} orders across ${CUSTOMER_COUNT} customers`);
  console.log(`Products: ${PRODUCTS.length} items in ${[...new Set(PRODUCTS.map((p) => p.category))].length} categories`);
  console.log(`Date range: last ${DAYS_RANGE} days (skewed recent)`);
  console.log(`Written to: ${outPath}`);
}

main();
