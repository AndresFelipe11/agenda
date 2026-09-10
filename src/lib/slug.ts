export const RESERVED_SLUGS = [
  "login",
  "register",
  "dashboard",
  "api",
  "auth",
  "settings",
  "admin",
  "app",
  "www",
  "static",
  "assets",
];

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.includes(slug);
}
