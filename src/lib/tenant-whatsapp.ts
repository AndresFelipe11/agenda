import { prisma } from "@/lib/prisma";

export async function getTenantWhatsApp(tenantId: string) {
  const rows = await prisma.$queryRaw<Array<{ whatsapp: string | null }>>`
    SELECT whatsapp FROM "Tenant" WHERE id = ${tenantId}
  `;
  return rows[0]?.whatsapp ?? null;
}

export async function setTenantWhatsApp(tenantId: string, whatsapp: string | null) {
  await prisma.$executeRaw`
    UPDATE "Tenant" SET whatsapp = ${whatsapp} WHERE id = ${tenantId}
  `;
}
