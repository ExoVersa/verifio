export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function dirigeantSlug(nom: string, prenoms?: string): string {
  const full = prenoms ? `${prenoms} ${nom}` : nom
  return toSlug(full)
}

export function slugToQuery(slug: string): string {
  // Convert kebab slug back to space-separated query for API
  return slug.replace(/-/g, ' ')
}
