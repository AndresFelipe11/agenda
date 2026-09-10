import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/login");
  }
  return session.user;
}

export async function requireTenant() {
  const user = await requireUser();
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });
  if (!tenant) redirect("/login");
  return { user, tenant };
}
