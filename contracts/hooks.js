import { useState, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { getSigner } from "../services/wallet";
import { getConfig } from "../services/config";
import { loadCircuit } from "../services/circuit-loader";
import { getDeposits } from "../services/events";
import { initPoseidon } from "../core/poseidon";
import { createDeposit } from "../core/deposit";
import { buildWithdrawInput } from "../core/withdraw";
import { MerkleTree } from "../core/merkle";
import { parseNote } from "../core/note";
import { saveNote, updateNoteStatus } from "../store/noteStore";
import MixerABI from "./abi/Mixer.json";
export function useDeposit() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const deposit = useCallback(async (amount) => {
        setLoading(true);
        setError(null);
        try {
            const config = getConfig();
            const contractAddr = config.contracts[amount];
            if (!contractAddr)
                throw new Error(`No contract for amount ${amount}`);
            await initPoseidon();
            const dep = createDeposit(amount, config.chainId);
            const signer = await getSigner();
            const mixer = new ethers.Contract(contractAddr, MixerABI, signer);
            const tx = await mixer.deposit(dep.commitment, {
                value: ethers.parseEther(amount),
            });
            await saveNote({
                id: dep.commitment.toString(16),
                note: dep.note,
                amount,
                chainId: config.chainId,
                contract: contractAddr,
                timestamp: Date.now(),
                status: "pending",
            });
            const receipt = await tx.wait();
            await updateNoteStatus(dep.commitment.toString(16), "deposited", receipt.hash);
            setLoading(false);
            return { note: dep.note, txHash: receipt.hash };
        }
        catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    }, []);
    return { deposit, loading, error };
}
export function useProver() {
    const workerRef = useRef(null);
    const [status, setStatus] = useState("");
    const [progress, setProgress] = useState(0);
    const prove = useCallback(async (input) => {
        setStatus("Loading circuit files...");
        setProgress(0);
        const [wasmBuf, zkeyBuf] = await Promise.all([
            loadCircuit("withdraw.wasm", (p) => setProgress(p * 0.3)),
            loadCircuit("withdraw_final.zkey", (p) => setProgress(30 + p * 0.3)),
        ]);
        setStatus("Generating proof...");
        setProgress(60);
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL("../workers/prove.worker.ts", import.meta.url), { type: "module" });
            workerRef.current = worker;
            worker.onmessage = (e) => {
                const msg = e.data;
                if (msg.type === "progress") {
                    setStatus(msg.message);
                    setProgress(60 + (msg.percent || 0) * 0.4);
                }
                else if (msg.type === "result") {
                    setProgress(100);
                    setStatus("Done");
                    worker.terminate();
                    resolve(msg);
                }
                else if (msg.type === "error") {
                    worker.terminate();
                    reject(new Error(msg.message));
                }
            };
            worker.postMessage({ input, wasmBuffer: wasmBuf, zkeyBuffer: zkeyBuf });
        });
    }, []);
    const cancel = useCallback(() => {
        workerRef.current?.terminate();
        setStatus("Cancelled");
        setProgress(0);
    }, []);
    return { prove, cancel, status, progress };
}
export function useWithdraw() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const prover = useProver();
    const withdraw = useCallback(async (noteStr, recipientAddr, useRelayer, relayerEndpoint) => {
        setLoading(true);
        setError(null);
        try {
            const config = getConfig();
            const note = parseNote(noteStr);
            const contractAddr = config.contracts[note.amount];
            if (!contractAddr)
                throw new Error(`No contract for ${note.amount}`);
            await initPoseidon();
            // Fetch events and rebuild Merkle tree
            const events = await getDeposits(contractAddr);
            const commitments = events.map((e) => e.commitment);
            const tree = MerkleTree.fromCommitments(commitments, config.merkleTreeHeight);
            // Get relayer address
            let relayerAddr = "0x0000000000000000000000000000000000000000";
            let fee = 0n;
            if (useRelayer && relayerEndpoint) {
                const statusRes = await fetch(`${relayerEndpoint.url}/status`);
                const relayerStatus = await statusRes.json();
                relayerAddr = relayerStatus.relayerAddress;
                const feeInfo = relayerStatus.fees[note.amount];
                if (feeInfo)
                    fee = BigInt(feeInfo.fee);
            }
            // Build proof input
            const input = buildWithdrawInput(noteStr, tree, recipientAddr, relayerAddr, fee);
            // Generate ZK proof
            const { proof, publicSignals, calldata } = await prover.prove(input);
            if (useRelayer && relayerEndpoint) {
                // Submit via relayer
                const res = await fetch(`${relayerEndpoint.url}/relay`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        proof,
                        publicSignals,
                        args: {
                            root: input.root,
                            nullifierHash: input.nullifierHash,
                            recipient: recipientAddr,
                            relayer: relayerAddr,
                            fee: fee.toString(),
                            refund: "0",
                        },
                        contract: contractAddr,
                    }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error);
                setLoading(false);
                return { txHash: data.txHash, method: "relayer" };
            }
            else {
                // Direct withdraw
                const signer = await getSigner();
                const mixer = new ethers.Contract(contractAddr, MixerABI, signer);
                // Parse calldata for contract call
                const proofBytes = encodeProofBytes(proof);
                const tx = await mixer.withdraw(proofBytes, input.root, input.nullifierHash, recipientAddr, relayerAddr, fee, 0);
                const receipt = await tx.wait();
                setLoading(false);
                return { txHash: receipt.hash, method: "direct" };
            }
        }
        catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    }, [prover]);
    return {
        withdraw,
        loading,
        error,
        proofStatus: prover.status,
        proofProgress: prover.progress,
        cancelProof: prover.cancel,
    };
}
function encodeProofBytes(proof) {
    return ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"], [
        proof.pi_a[0], proof.pi_a[1],
        proof.pi_b[0][1], proof.pi_b[0][0],
        proof.pi_b[1][1], proof.pi_b[1][0],
        proof.pi_c[0], proof.pi_c[1],
    ]);
}
