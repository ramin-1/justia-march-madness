import { NextResponse } from "next/server";
import { syncNcaaResults } from "@/lib/result-sync/sync-service";

export async function POST() {
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
