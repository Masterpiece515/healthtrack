export async function register() {
  const { initDb } = await import('@/lib/db');
  await initDb();
}
