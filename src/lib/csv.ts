// Minimal CSV parser: handles quoted fields (with escaped "" inside quotes)
// and commas within quotes. Good enough for structured admin-uploaded data;
// not a general-purpose CSV library.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++ }
      else if (char === '"') { inQuotes = false }
      else { field += char }
    } else {
      if (char === '"') inQuotes = true
      else if (char === ',') pushField()
      else if (char === '\n') { if (field !== '' || row.length > 0) pushRow() }
      else if (char === '\r') { /* skip */ }
      else field += char
    }
  }
  if (field !== '' || row.length > 0) pushRow()

  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function generateTempPassword(): string {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)
}
