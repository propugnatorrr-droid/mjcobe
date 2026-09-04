/**
 * Serializes a JSON-LD structured-data object for embedding in a
 * `<script type="application/ld+json">` tag. `JSON.stringify` alone
 * doesn't escape `</script>` sequences, which could otherwise break out
 * of the script tag if a title/description ever contained one — the
 * content embedded via this helper is currently always admin-authored/
 * trusted, but escaping costs nothing and removes the question entirely.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
