/** Covers fetch AND response decoding, and releases cancellation listeners on every exit. */
export async function withSpeechRequest<T>(
  parent: AbortSignal | undefined,
  timeoutMs: number,
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (parent?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  parent?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, timeoutMs);
  try { return await request(controller.signal); }
  finally { clearTimeout(timer); parent?.removeEventListener('abort', cancel); }
}
