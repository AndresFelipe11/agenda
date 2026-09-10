export type CustomFieldType = "text" | "select";

export type CustomField = {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
};

export type TemplateService = {
  name: string;
  description: string;
  durationMin: number;
  priceAmount: number | null;
  bookingMode: "appointment" | "session";
  capacity: number;
  customFields: CustomField[];
};

export type IndustryTemplate = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  services: TemplateService[];
};

const petFields: CustomField[] = [
  {
    id: "pet_name",
    label: "Nombre de la mascota",
    type: "text",
    required: true,
  },
  {
    id: "species",
    label: "Especie",
    type: "select",
    required: true,
    options: ["Perro", "Gato", "Otro"],
  },
];

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "barber",
    name: "Barbería",
    tagline: "Citas 1:1 con cada profesional",
    description:
      "Cortes y afeitados con duración fija. El cliente elige barbero y horario.",
    services: [
      {
        name: "Corte clásico",
        description: "Fade, raya o crop de diario.",
        durationMin: 30,
        priceAmount: 20000,
        bookingMode: "appointment",
        capacity: 1,
        customFields: [],
      },
      {
        name: "Corte VIP",
        description: "Diseño, más rayas o un corte más trabajado.",
        durationMin: 45,
        priceAmount: 35000,
        bookingMode: "appointment",
        capacity: 1,
        customFields: [],
      },
      {
        name: "Barba",
        description: "Perfilado y arreglo de barba.",
        durationMin: 20,
        priceAmount: 15000,
        bookingMode: "appointment",
        capacity: 1,
        customFields: [],
      },
    ],
  },
  {
    id: "vet",
    name: "Veterinaria",
    tagline: "Consultas con datos de la mascota",
    description:
      "Citas clínicas con campos extra: nombre y especie de la mascota.",
    services: [
      {
        name: "Consulta general",
        description: "Revisión clínica de rutina.",
        durationMin: 30,
        priceAmount: 60000,
        bookingMode: "appointment",
        capacity: 1,
        customFields: petFields,
      },
      {
        name: "Vacunación",
        description: "Aplicación de vacunas según el esquema.",
        durationMin: 20,
        priceAmount: 40000,
        bookingMode: "appointment",
        capacity: 1,
        customFields: petFields,
      },
    ],
  },
  {
    id: "crafts",
    name: "Clases y talleres",
    tagline: "Sesiones con cupo limitado",
    description:
      "Publica fechas con plazas. Ideal para manualidades, yoga o talleres.",
    services: [
      {
        name: "Taller de manualidades",
        description: "Clase grupal con materiales básicos incluidos.",
        durationMin: 120,
        priceAmount: 45000,
        bookingMode: "session",
        capacity: 8,
        customFields: [
          {
            id: "level",
            label: "Nivel",
            type: "select",
            required: true,
            options: ["Principiante", "Intermedio", "Avanzado"],
          },
        ],
      },
    ],
  },
];

export function getTemplate(id: string) {
  return INDUSTRY_TEMPLATES.find((template) => template.id === id) ?? INDUSTRY_TEMPLATES[0];
}

export const TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Guayaquil",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Costa_Rica",
  "America/Panama",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "UTC",
];
