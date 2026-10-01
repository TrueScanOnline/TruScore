/** Short non-secret summary of an OFF write response. Credentials are stripped. */
export function summarizeOffWriteResponse(status: number, body: string): string {
  const redacted = body
    .replace(/user_id=[^&\s"'<>]+/gi, 'user_id=redacted')
    .replace(/password=[^&\s"'<>]+/gi, 'password=redacted')
    .replace(/"(?:password|user_id)"\s*:\s*"[^"]*"/gi, '"credential":"redacted"');
  let detail = '';
  try {
    const parsed = JSON.parse(redacted) as { status_verbose?: unknown; error?: unknown; status?: unknown };
    const verbose = parsed.status_verbose ?? parsed.error ?? parsed.status;
    if (verbose != null) detail = String(verbose);
  } catch {
    detail = redacted.replace(/\s+/g, ' ').trim();
  }
  const note = `http_${status}${detail ? `:${detail}` : ''}`;
  return note.slice(0, 180);
}
