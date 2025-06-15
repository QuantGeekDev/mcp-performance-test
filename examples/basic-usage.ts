import {
  createSseTestRunner,
  createBatchTestRunner,
  TestRunner,
} from "../src/index.js";

async function basicUsageExample() {
  // Create a test runner for SSE mode
  const sseTestRunner = createSseTestRunner("https://your-mcp-server.com");

  // Or create one for batch mode
  const batchTestRunner = createBatchTestRunner("https://your-mcp-server.com");

  // Or create with custom configuration
  const customTestRunner = new TestRunner({
    baseUrl: "https://your-mcp-server.com",
    responseMode: "sse",
    logLevel: "info",
    enableColorOutput: true,
  });

  // Run concurrent test
  const concurrentResult = await sseTestRunner.runConcurrentTest({
    concurrency: 10,
    rampUpTime: 5, // gradually ramp up over 5 seconds
  });

  // Run load test
  const loadResult = await sseTestRunner.runLoadTest({
    concurrency: 5,
    duration: 30, // run for 30 seconds
  });

  // Export results
  const jsonReport = sseTestRunner.exportResults(concurrentResult, "json");
  const csvReport = sseTestRunner.exportResults(loadResult, "csv");

  console.log("Test completed!");
  console.log(
    "Concurrent test throughput:",
    concurrentResult.metrics.throughput
  );
  console.log("Load test throughput:", loadResult.metrics.throughput);
}

basicUsageExample().catch(console.error);
