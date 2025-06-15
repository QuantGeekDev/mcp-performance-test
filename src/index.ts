import { MCP_URL } from "./constants.js";
import TestRunner from "./TestRunner.js";

const testRunner = new TestRunner({ baseUrl: MCP_URL, responseMode: "sse" });

const burstResult = await testRunner.runConcurrentTest({
  concurrency: 10,
});

const jsonResults = testRunner.exportResults(burstResult, "json");
