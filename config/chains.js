let cached = null;
export async function loadConfig() {
    if (cached)
        return cached;
    const res = await fetch("./config.json");
    cached = await res.json();
    return cached;
}
export function getConfig() {
    if (!cached)
        throw new Error("call loadConfig() first");
    return cached;
}
