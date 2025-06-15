import VirtualClient from "./VirtualClient.js";

console.clear();

const runTest = async () => {
  const virtualClient = new VirtualClient("batch");
  await virtualClient.initialize();
  await virtualClient.acknowledgeInitialize();
  await virtualClient.listTools();
};

await runTest();
await runTest();
await runTest();
await runTest();
