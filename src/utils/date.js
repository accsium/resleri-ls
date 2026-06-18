export function fmtDate(d) {
  if (!d) return '—'
  return d.substring(0, 4) + '/' + d.substring(4, 6) + '/' + d.substring(6, 8)
}
