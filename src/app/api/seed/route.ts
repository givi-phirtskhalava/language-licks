import { runSeed } from "@lib/db/seed";

export async function POST() {
  try {
    const result = await runSeed();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
