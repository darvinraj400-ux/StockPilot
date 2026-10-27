export function sanitizeSearchTerm(value: string | string[] | undefined | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[,()%"]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function isUuid(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
