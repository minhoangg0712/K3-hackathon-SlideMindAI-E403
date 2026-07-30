/** Telemetry sink — no-op. */
export async function POST() {
  return new Response(null, { status: 204 });
}
