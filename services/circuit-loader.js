const CACHE_NAME = "mixer-circuits-v1";
export async function loadCircuit(filename, onProgress) {
    const cache = await caches.open(CACHE_NAME);
    const url = `./circuits/${filename}`;
    const cached = await cache.match(url);
    if (cached) {
        return await cached.arrayBuffer();
    }
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Failed to load ${filename}`);
    const total = parseInt(res.headers.get("content-length") || "0");
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        loaded += value.length;
        onProgress?.(total > 0 ? (loaded / total) * 100 : -1);
    }
    const totalLen = chunks.reduce((a, c) => a + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    const cacheRes = new Response(result.buffer, {
        headers: { "Content-Type": "application/octet-stream" },
    });
    await cache.put(url, cacheRes);
    return result.buffer;
}
export async function preloadCircuits() {
    loadCircuit("withdraw.wasm").catch(() => { });
    loadCircuit("withdraw_final.zkey").catch(() => { });
}
export async function clearCircuitCache() {
    await caches.delete(CACHE_NAME);
}
