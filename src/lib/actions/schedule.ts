"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { parseTimeToMinutes } from "@/lib/utils";

export async function saveWeeklySchedule(formData: FormData) {
  const { tenant } = await requireTenant();
  const staffId = String(formData.get("staffId") ?? "");
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: tenant.id },
  });
  if (!staff) throw new Error("Profesional no encontrado.");

  const blocks: { weekday: number; startMin: number; endMin: number }[] = [];
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const enabled = formData.get(`enabled_${weekday}`) === "on";
    if (!enabled) continue;
    const startMin = parseTimeToMinutes(String(formData.get(`start_${weekday}`) ?? "09:00"));
    const endMin = parseTimeToMinutes(String(formData.get(`end_${weekday}`) ?? "18:00"));
    if (endMin <= startMin) continue;
    blocks.push({ weekday, startMin, endMin });
  }

  await prisma.$transaction([
    prisma.weeklyAvailability.deleteMany({ where: { staffId } }),
    ...blocks.map((block) =>
      prisma.weeklyAvailability.create({
        data: { staffId, ...block },
      }),
    ),
  ]);

  revalidatePath("/dashboard/horario");
}
