import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await db.userProfile.findUnique({ where: { id: 1 } });
  if (!profile) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const profile = await db.userProfile.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return NextResponse.json(profile);
}
