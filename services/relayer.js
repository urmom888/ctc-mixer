export async function checkRelayerStatus(endpoint) {
    const res = await fetch(`${endpoint.url}/status`, {
        signal: AbortSignal.timeout(5000),
    });
    return await res.json();
}
export async function getRelayerAddress(endpoint) {
    const status = await checkRelayerStatus(endpoint);
    return status.relayerAddress;
}
export async function submitToRelayer(endpoint, request) {
    try {
        const res = await fetch(`${endpoint.url}/relay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });
        const data = await res.json();
        if (!res.ok)
            return { success: false, error: data.error };
        return { success: true, txHash: data.txHash };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
}
export async function pollTxStatus(endpoint, txHash, intervalMs = 3000, maxAttempts = 120) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(`${endpoint.url}/job/${txHash}`);
            if (res.ok) {
                const job = await res.json();
                if (job.status === "confirmed")
                    return { status: "confirmed", confirmed: true };
                if (job.status === "failed")
                    return { status: "failed", confirmed: false };
            }
        }
        catch { }
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    return { status: "timeout", confirmed: false };
}
export async function isRelayerAvailable(endpoint) {
    try {
        const s = await checkRelayerStatus(endpoint);
        return s.available;
    }
    catch {
        return false;
    }
}
