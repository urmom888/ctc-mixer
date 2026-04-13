import * as snarkjs from "snarkjs";
self.onmessage = async (e) => {
    const { input, wasmBuffer, zkeyBuffer } = e.data;
    try {
        post({ type: "progress", message: "Generating witness...", percent: 20 });
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, new Uint8Array(wasmBuffer), new Uint8Array(zkeyBuffer));
        post({ type: "progress", message: "Exporting calldata...", percent: 90 });
        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
        post({ type: "result", proof, publicSignals, calldata });
    }
    catch (err) {
        post({ type: "error", message: err.message });
    }
};
function post(msg) {
    self.postMessage(msg);
}
