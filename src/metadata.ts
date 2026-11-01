export async function storeManifest(manifest: unknown): Promise<string> {
  const response = await fetch("/api/manifests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(manifest) });
  if (!response.ok) throw new Error(await response.text());
  const { uri } = await response.json();
  return uri as string;
}

export async function loadManifest(uri: string): Promise<any> {
  if (uri.startsWith("dropforge://")) {
    const response = await fetch(`/api/manifests/${encodeURIComponent(uri.slice(11))}`);
    if (!response.ok) throw new Error("Campaign manifest is unavailable from this server.");
    return response.json();
  }
  if (uri.startsWith("ipfs://")) uri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Unable to fetch campaign distribution manifest.");
  return response.json();
}