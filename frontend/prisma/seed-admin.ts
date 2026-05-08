import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import {Role} from "@prisma/client";


async function main() {
  console.log("Iniciando el script de seed...");

  const adminPassword = await hash("Admin123!", 12);
  const supervisorPassword = await hash("Supervisor123!", 12);

  const admin = await prisma.user.findUnique({
    where: { email: "admin@secureframe.com" },
  });

  if (!admin) {
    await prisma.user.create({
      data: {
        email: "admin@secureframe.com",
        username: "admin",
        password: adminPassword,
        role: Role.ADMIN,
      },
    });
    console.log("Usuario Admin creado.");
  } else {
    console.log("El usuario Admin ya existe.");
  }

  const supervisor = await prisma.user.findUnique({
    where: { email: "supervisor@secureframe.com" },
  });

  if (!supervisor) {
    await prisma.user.create({
      data: {
        email: "supervisor@secureframe.com",
        username: "supervisor",
        password: supervisorPassword,
        role: Role.SUPERVISOR,
      },
    });
    console.log("Usuario Supervisor creado.");
  } else {
    console.log("El usuario Supervisor ya existe.");
  }

  console.log("Script de seed finalizado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });