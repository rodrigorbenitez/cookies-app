/**
 * Hosted providers (e.g. Neon) add libpq-only options such as `channel_binding=require`
 * to their connection strings. postgres.js forwards unknown options to the server as
 * settings, which the server rejects, so drop them. `sslmode` is understood and kept.
 */
const LIBPQ_ONLY_PARAMS = ['channel_binding', 'gssencmode', 'sslcompression'];

export function cleanDatabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw; // let postgres.js report the problem
  }
  for (const p of LIBPQ_ONLY_PARAMS) url.searchParams.delete(p);
  return url.toString();
}
