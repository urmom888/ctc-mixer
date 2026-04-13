import { ethers } from "ethers";
import { getProvider } from "./provider";
import { getConfig } from "./config";
import MixerABI from "../contracts/abi/Mixer.json";
export async function getDeposits(contractAddr) {
    const config = getConfig();
    // Strategy 1: Subgraph
    if (config.subgraphUrl) {
        try {
            return await fromSubgraph(config.subgraphUrl, contractAddr);
        }
        catch { }
    }
    // Strategy 2: Cached snapshot + RPC delta
    try {
        return await fromSnapshot(contractAddr);
    }
    catch { }
    // Strategy 3: Full RPC scan
    return await fromRPC(contractAddr);
}
async function fromSubgraph(url, addr) {
    const query = `{
    deposits(where:{contract:"${addr.toLowerCase()}"},orderBy:leafIndex,first:1000){
      commitment leafIndex timestamp blockNumber
    }
  }`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });
    const { data } = await res.json();
    return data.deposits.map((d) => ({
        commitment: BigInt(d.commitment),
        leafIndex: Number(d.leafIndex),
        timestamp: Number(d.timestamp),
        blockNumber: Number(d.blockNumber),
    }));
}
async function fromSnapshot(contractAddr) {
    const snapRes = await fetch("./data/events-snapshot.json");
    if (!snapRes.ok)
        throw new Error("No snapshot");
    const snap = await snapRes.json();
    const provider = getProvider();
    const mixer = new ethers.Contract(contractAddr, MixerABI, provider);
    const newEvents = await mixer.queryFilter(mixer.filters.Deposit(), snap.lastBlock + 1, "latest");
    const delta = newEvents.map((e) => ({
        commitment: BigInt(e.args.commitment),
        leafIndex: Number(e.args.leafIndex),
        timestamp: Number(e.args.timestamp),
        blockNumber: e.blockNumber,
    }));
    const base = snap.events.map((e) => ({
        ...e,
        commitment: BigInt(e.commitment),
    }));
    return [...base, ...delta];
}
async function fromRPC(contractAddr) {
    const config = getConfig();
    const provider = getProvider();
    const mixer = new ethers.Contract(contractAddr, MixerABI, provider);
    const fromBlock = config.deployBlock || 0;
    const events = await mixer.queryFilter(mixer.filters.Deposit(), fromBlock, "latest");
    return events.map((e) => ({
        commitment: BigInt(e.args.commitment),
        leafIndex: Number(e.args.leafIndex),
        timestamp: Number(e.args.timestamp),
        blockNumber: e.blockNumber,
    }));
}
