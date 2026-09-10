"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { DateTime } from "luxon";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTemplate, TIMEZONES } from "@/lib/templates";
import { isReservedSlug, slugify } from "@/lib/slug";

const DEFAULT_HOURS = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  startMin: 9 * 60,
  endMin: 18 * 60,
}));

export type ActionState = {
  error?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw error;
  }
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "America/Bogota");
  const templateId = String(formData.get("template") ?? "barber");
  const slug = slugify(String(formData.get("slug") ?? businessName));

  if (!name || !email || !password || !businessName || !slug) {
    return { error: "Completa todos los campos obligatorios." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!TIMEZONES.includes(timezone)) {
    return { error: "Zona horaria no válida." };
  }
  if (isReservedSlug(slug) || slug.length < 3) {
    return { error: "Ese enlace no está disponible. Prueba otro slug." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return { error: "Ese enlace ya está en uso. Elige otro slug." };
  }

  const template = getTemplate(templateId);
  const passwordHash = await hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const tenant = await tx.tenant.create({
      data: {
        name: businessName,
        slug,
        timezone,
        template: template.id,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "owner",
      },
    });

    const staff = await tx.staff.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        weeklyHours: { create: DEFAULT_HOURS },
      },
    });

    for (const service of template.services) {
      await tx.service.create({
        data: {
          tenantId: tenant.id,
          name: service.name,
          description: service.description,
          durationMin: service.durationMin,
          priceAmount: service.priceAmount,
          bookingMode: service.bookingMode,
          capacity: service.capacity,
          customFields: service.customFields,
          staff: { create: { staffId: staff.id } },
        },
      });
    }

    if (template.id === "barber") {
      const { seedCutStyles } = await import("@/lib/barber/seed-styles");
      await seedCutStyles(tx, tenant.id);
    }

    const sessionService = template.services.find((item) => item.bookingMode === "session");
    if (sessionService) {
      const created = await tx.service.findFirst({
        where: { tenantId: tenant.id, bookingMode: "session" },
      });
      if (created) {
        let start = DateTime.now().setZone(timezone).plus({ days: 1 }).startOf("day");
        while (start.weekday !== 6) {
          start = start.plus({ days: 1 });
        }
        start = start.set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
        await tx.classSession.create({
          data: {
            tenantId: tenant.id,
            serviceId: created.id,
            staffId: staff.id,
            startsAt: start.toUTC().toJSDate(),
            endsAt: start.plus({ minutes: created.durationMin }).toUTC().toJSDate(),
            capacity: created.capacity,
          },
        });
      }
    }
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
