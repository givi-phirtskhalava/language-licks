import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }

    return Response.json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ user: null }, { status: error.status });
    }
    throw error;
  }
}
