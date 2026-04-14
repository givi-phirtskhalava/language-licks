import type { NextRequest } from "next/server";
import { db } from "@lib/db";
import { users } from "@lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@lib/auth";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const [user] = await db
      .select({ dailyTarget: users.dailyTarget })
      .from(users)
      .where(eq(users.id, userId));

    return Response.json({ dailyTarget: user?.dailyTarget ?? 1 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { dailyTarget } = body;

    if (typeof dailyTarget !== "number" || dailyTarget < 1 || dailyTarget > 50) {
      return Response.json(
        { error: "dailyTarget must be a number between 1 and 50" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({ dailyTarget })
      .where(eq(users.id, userId));

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
