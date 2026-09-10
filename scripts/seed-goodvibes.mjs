import { PrismaClient } from "@prisma/client";
import { seedBarberServices } from "../src/lib/barber/seed-services.ts";
import { seedCutStyles } from "../src/lib/barber/seed-styles.ts";

const HOURS = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  startMin: 9 * 60,
  endMin: 18 * 60,
}));

const prisma = new PrismaClient();

const tenant = await prisma.tenant.upsert({
  where: { slug: "barberstudio-goodvibes" },
  update: { name: "Barberstudio Goodvibes", whatsapp: "3215688265" },
  create: {
    name: "Barberstudio Goodvibes",
    slug: "barberstudio-goodvibes",
    timezone: "America/Bogota",
    template: "barber",
    whatsapp: "3215688265",
  },
});

const staff =
  (await prisma.staff.findFirst({ where: { tenantId: tenant.id } })) ??
  (await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      name: "Jhonatnan Tamayo",
      weeklyHours: { create: HOURS },
    },
  }));

if (staff.name !== "Jhonatnan Tamayo") {
  await prisma.staff.update({
    where: { id: staff.id },
    data: { name: "Jhonatnan Tamayo" },
  });
}

await seedBarberServices(prisma, tenant.id);
await seedCutStyles(prisma, tenant.id);

console.log("Listo:", tenant.name, "/", staff.name);
await prisma.$disconnect();
