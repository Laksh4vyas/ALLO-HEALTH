import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🌱 Starting seed...");

  // Clean up existing data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.idempotencyKey.deleteMany();

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: "Mumbai Warehouse",
        location: "Mumbai, Maharashtra",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "Delhi Warehouse",
        location: "New Delhi, Delhi",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "Bangalore Warehouse",
        location: "Bangalore, Karnataka",
      },
    }),
  ]);

  const [mumbai, delhi, bangalore] = warehouses;
  console.log(`✅ Created ${warehouses.length} warehouses`);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "MacBook Pro 16\"",
        description:
          "Apple's most powerful laptop with M3 Pro chip, stunning Liquid Retina XDR display, and all-day battery life.",
        imageUrl:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "iPhone 15 Pro",
        description:
          "Titanium design with A17 Pro chip, 48MP camera system, and Action Button for ultimate control.",
        imageUrl:
          "https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "AirPods Pro 2nd Gen",
        description:
          "Active Noise Cancellation, Transparency mode, Adaptive Audio, and Personalized Spatial Audio.",
        imageUrl:
          "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "PlayStation 5",
        description:
          "Next-gen gaming console with ultra-high speed SSD, ray tracing, 4K gaming, and DualSense controller.",
        imageUrl:
          "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "Logitech MX Master 3S",
        description:
          "Advanced wireless mouse with 8K DPI sensor, ultra-fast MagSpeed scrolling, and Quiet Click technology.",
        imageUrl:
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "Samsung 4K OLED TV 55\"",
        description:
          "OLED display with infinite contrast, Quantum HDR, and Neural Quantum Processor 4K for exceptional picture quality.",
        imageUrl:
          "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "Sony WH-1000XM5",
        description:
          "Industry-leading noise cancelling headphones with 30-hour battery, multipoint connection, and crystal clear calls.",
        imageUrl:
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
      },
    }),
    prisma.product.create({
      data: {
        name: "iPad Pro 12.9\"",
        description:
          "M2 chip, ProMotion XDR display with Liquid Retina, Thunderbolt port, and Center Stage camera.",
        imageUrl:
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create inventory for each product across warehouses
  const inventoryData = [
    // MacBook Pro
    { productId: products[0].id, warehouseId: mumbai.id, total: 15, reserved: 2 },
    { productId: products[0].id, warehouseId: delhi.id, total: 8, reserved: 1 },
    { productId: products[0].id, warehouseId: bangalore.id, total: 12, reserved: 0 },
    // iPhone 15 Pro
    { productId: products[1].id, warehouseId: mumbai.id, total: 50, reserved: 5 },
    { productId: products[1].id, warehouseId: delhi.id, total: 35, reserved: 3 },
    { productId: products[1].id, warehouseId: bangalore.id, total: 40, reserved: 4 },
    // AirPods Pro
    { productId: products[2].id, warehouseId: mumbai.id, total: 80, reserved: 10 },
    { productId: products[2].id, warehouseId: delhi.id, total: 60, reserved: 5 },
    { productId: products[2].id, warehouseId: bangalore.id, total: 70, reserved: 8 },
    // PlayStation 5
    { productId: products[3].id, warehouseId: mumbai.id, total: 5, reserved: 1 },
    { productId: products[3].id, warehouseId: delhi.id, total: 3, reserved: 0 },
    { productId: products[3].id, warehouseId: bangalore.id, total: 4, reserved: 1 },
    // Logitech MX Master
    { productId: products[4].id, warehouseId: mumbai.id, total: 25, reserved: 2 },
    { productId: products[4].id, warehouseId: delhi.id, total: 20, reserved: 3 },
    { productId: products[4].id, warehouseId: bangalore.id, total: 30, reserved: 1 },
    // Samsung OLED TV
    { productId: products[5].id, warehouseId: mumbai.id, total: 10, reserved: 2 },
    { productId: products[5].id, warehouseId: delhi.id, total: 8, reserved: 1 },
    { productId: products[5].id, warehouseId: bangalore.id, total: 6, reserved: 0 },
    // Sony Headphones
    { productId: products[6].id, warehouseId: mumbai.id, total: 40, reserved: 4 },
    { productId: products[6].id, warehouseId: delhi.id, total: 35, reserved: 2 },
    { productId: products[6].id, warehouseId: bangalore.id, total: 45, reserved: 6 },
    // iPad Pro
    { productId: products[7].id, warehouseId: mumbai.id, total: 20, reserved: 3 },
    { productId: products[7].id, warehouseId: delhi.id, total: 15, reserved: 1 },
    { productId: products[7].id, warehouseId: bangalore.id, total: 18, reserved: 2 },
  ];

  await prisma.inventory.createMany({
    data: inventoryData.map((inv) => ({
      productId: inv.productId,
      warehouseId: inv.warehouseId,
      totalQuantity: inv.total,
      reservedQuantity: inv.reserved,
    })),
  });

  console.log(`✅ Created ${inventoryData.length} inventory records`);
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
