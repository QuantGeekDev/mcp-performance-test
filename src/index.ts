import { MCP_URL } from "./constants.js";
import TestRunner from "./TestRunner.js";

const testRunner = new TestRunner({ baseUrl: MCP_URL, responseMode: "batch" });

testRunner.setClientsAmount(10);

await testRunner.runSequentialTest();
