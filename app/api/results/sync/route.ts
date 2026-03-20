import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncNcaaResults } from "@/lib/result-sync/sync-service";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const result = await syncNcaaResults();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
