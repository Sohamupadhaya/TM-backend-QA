import { PrismaClient } from '@prisma/client'
import bcrypt from "bcrypt";

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("password", 10);
    await prisma.superAdmin.create({
      data: {
        email: 'superadmin@gmail.com',
        name: 'Super Admin',
        password: hashedPassword
      },
    });
  }
  
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
  