import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 25 * 1024 * 1024) return NextResponse.json({ error: "Manifest exceeds 25 MB" }, { status: 413 });
  let manifest: any;
  try { manifest = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const sha256 = createHash("sha256").update(raw).digest("hex");
  if (!process.env.PINATA_JWT && process.env.VERCEL) {
    return NextResponse.json({ error: "Configure PINATA_JWT in Vercel to persist campaign proofs on IPFS." }, { status: 503 });
  }
  if (process.env.PINATA_JWT) {
    const pinned = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.PINATA_JWT}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pinataContent: manifest }),
    });
    if (!pinned.ok) return NextResponse.json({ error: "IPFS pinning failed" }, { status: 502 });
    const result = await pinned.json();
    return NextResponse.json({ uri: `ipfs://${result.IpfsHash}`, sha256 });
  }
  if (manifest?.chainId !== 968 || !Array.isArray(manifest?.proofs) || typeof manifest?.root !== "string") {
    return NextResponse.json({ error: "Invalid testnet distribution manifest" }, { status: 400 });
  }
  const id = randomUUID();
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const directory = path.join(process.cwd(), "data", "manifests");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${id}.json`), raw, { flag: "wx" });
  return NextResponse.json({ uri: `dropforge://${id}`, sha256 });
}
