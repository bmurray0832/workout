import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const status: Record<string, unknown> = {
    ok: false,
    database_url: process.env.DATABASE_URL ?? "NOT SET",
    anthropic_key: process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.slice(0, 10)}...)` : "NOT SET",
    node_env: process.env.NODE_ENV,
  };

  try {
    await db.$queryRaw`SELECT 1`;
    status.db = "connected";
    const profile = await db.userProfile.findUnique({ where: { id: 1 } });
    status.profile = profile ? `found (${profile.name})` : "not found — complete onboarding";
    status.ok = true;
  } catch (err) {
    status.db = `error: ${String(err)}`;
  }

  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}
