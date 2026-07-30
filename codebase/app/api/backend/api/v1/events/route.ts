/** Analytics sink — bản gốc nhận và bỏ qua, ở đây no-op. */
export async function POST() {
  return new Response(null, { status: 204 });
}
