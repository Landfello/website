const STORAGE_KEY = "landfello_saved_properties";

export function getSavedPropertyIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function toggleSavedPropertyId(id: string): string[] {
  if (!id) return getSavedPropertyIds();
  const prev = getSavedPropertyIds();
  const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isPropertySaved(id: string): boolean {
  if (!id) return false;
  return getSavedPropertyIds().includes(id);
}
