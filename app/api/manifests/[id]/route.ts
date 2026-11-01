import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid manifest id" }, { status: 400 });
  try {
    const data = await readFile(path.join(process.cwd(), "data", "manifests", `${id}.json`), "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: "Manifest not found" }, { status: 404 });
  }
}