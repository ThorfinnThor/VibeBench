export async function readLimitedText(response, maxBytes) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body unavailable.");
  const chunks = [];
  let total = 0;
  let truncated = false;
  try {
    while (total <= maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - total;
      if (value.byteLength > remaining) {
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        total += Math.max(0, remaining);
        truncated = true;
        await reader.cancel("VibeBench response byte limit reached");
        break;
      }
      chunks.push(value);
      total += value.byteLength;
      if (total === maxBytes) {
        const next = await reader.read();
        truncated = !next.done;
        if (truncated) await reader.cancel("VibeBench response byte limit reached");
        break;
      }
    }
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), bytes: bytes.byteLength, truncated };
}
