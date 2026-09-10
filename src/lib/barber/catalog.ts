export const HEAD_SHAPES = [
  {
    id: "ovalada",
    name: "Ovalada",
    tip: "Te queda casi todo: fade con raya, burst o mullet. Pide el diseño que quieras a los lados.",
  },
  {
    id: "redonda",
    name: "Redonda",
    tip: "Fade medio o alto para alargar. Una raya atrás de la oreja le da actitud sin recargar.",
  },
  {
    id: "cuadrada",
    name: "Cuadrada",
    tip: "Shape up marcado y fade limpio. El dibujo queda mejor detrás, no en la sien.",
  },
  {
    id: "alargada",
    name: "Alargada",
    tip: "Deja peso arriba y a los lados. Low fade o drop fade; evita el fade altísimo.",
  },
  {
    id: "corazon",
    name: "Corazón",
    tip: "Flequillo o crop adelante. Las rayas van a los lados, no en la frente.",
  },
  {
    id: "diamante",
    name: "Diamante",
    tip: "Textura arriba y fade que no suba demasiado. Una o dos líneas se ven clean.",
  },
] as const;

export type HeadShapeId = (typeof HEAD_SHAPES)[number]["id"];

export function headShapeLabel(id: string) {
  return HEAD_SHAPES.find((shape) => shape.id === id)?.name ?? id;
}

export const CLASSIC_CUT_NAME = "Corte clásico";
export const VIP_CUT_NAME = "Corte VIP";
export const CUT_PRICES = {
  clasico: 20000,
  vip: 35000,
} as const;

export type CutTier = keyof typeof CUT_PRICES;

export const DEFAULT_CUT_STYLES: {
  name: string;
  description: string;
  category: CutTier;
  headShapes: HeadShapeId[];
  imagePath: string;
}[] = [
  {
    name: "Fade con raya",
    description: "El de siempre en Medellín y Manizales: degradado y una raya limpia detrás de la oreja.",
    category: "clasico",
    headShapes: ["ovalada", "redonda", "cuadrada"],
    imagePath: "/samples/fade-raya.png",
  },
  {
    name: "Fade alto con diseño",
    description: "Laterales bien rapados y dos o tres líneas. Para salir de noche.",
    category: "vip",
    headShapes: ["redonda", "corazon"],
    imagePath: "/samples/fade-diseno.png",
  },
  {
    name: "Burst fade",
    description: "El degradado sale de la oreja. Joven, urbano y fácil de combinar con raya.",
    category: "clasico",
    headShapes: ["ovalada", "cuadrada", "diamante"],
    imagePath: "/samples/burst-fade.png",
  },
  {
    name: "Drop fade",
    description: "Baja detrás y deja más pelo arriba. Muy pedido con shape up.",
    category: "clasico",
    headShapes: ["alargada", "ovalada"],
    imagePath: "/samples/drop-fade.png",
  },
  {
    name: "Mid fade street",
    description: "Fade a media altura, textura arriba y línea de contorno marcada.",
    category: "clasico",
    headShapes: ["ovalada", "redonda", "diamante"],
    imagePath: "/samples/mid-fade-street.png",
  },
  {
    name: "Mullet con fade",
    description: "Corto adelante, largo atrás y fade a los lados. El que se ve en la calle.",
    category: "vip",
    headShapes: ["ovalada", "cuadrada"],
    imagePath: "/samples/mullet-fade.png",
  },
  {
    name: "Crop con fade",
    description: "Arriba despelucado, lados limpios. Rápido y de diario.",
    category: "clasico",
    headShapes: ["redonda", "cuadrada", "diamante"],
    imagePath: "/samples/crop-fade.png",
  },
  {
    name: "Taper con líneas",
    description: "Degradado suave en la nuca y rayas en la sien. Clean sin verse de oficina.",
    category: "clasico",
    headShapes: ["ovalada", "alargada"],
    imagePath: "/samples/taper-lineas.png",
  },
  {
    name: "Degradado con dibujo",
    description: "Fade y un diseño simple: rayas, zigzag o tridente. Tú eliges en la silla.",
    category: "vip",
    headShapes: ["ovalada", "redonda"],
    imagePath: "/samples/degradado-dibujo.png",
  },
  {
    name: "Low fade + raya",
    description: "Bajo, prolijo y con una sola línea. El más fácil de mantener.",
    category: "clasico",
    headShapes: ["ovalada", "alargada", "cuadrada"],
    imagePath: "/samples/low-fade-raya.png",
  },
];

export function styleTier(category: string): CutTier {
  return category === "vip" ? "vip" : "clasico";
}

export function styleServiceName(category: string) {
  return styleTier(category) === "vip" ? VIP_CUT_NAME : CLASSIC_CUT_NAME;
}

export const SAMPLE_GALLERY: { imagePath: string; caption: string; styleName: string }[] = [
  { imagePath: "/samples/fade-raya.png", caption: "Fade con raya", styleName: "Fade con raya" },
  { imagePath: "/samples/fade-diseno.png", caption: "Fade con diseño", styleName: "Fade alto con diseño" },
  { imagePath: "/samples/burst-fade.png", caption: "Burst fade", styleName: "Burst fade" },
  { imagePath: "/samples/mullet-fade.png", caption: "Mullet con fade", styleName: "Mullet con fade" },
  { imagePath: "/samples/degradado-dibujo.png", caption: "Degradado con dibujo", styleName: "Degradado con dibujo" },
  { imagePath: "/samples/taper-lineas.png", caption: "Taper con líneas", styleName: "Taper con líneas" },
];
