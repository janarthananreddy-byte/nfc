import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@nfctag.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash("Admin@123", 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        role: "admin",
        profile: {
          create: {
            firstName: "Admin",
            lastName: "User",
            cyclingType: "Admin",
          },
        },
        nfcTag: {
          create: {},
        },
      },
    });
    console.log(`Created admin user: ${admin.email}`);
    console.log("Password: Admin@123");
  } else {
    console.log("Admin user already exists.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
