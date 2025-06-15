import TestRunner from "./TestRunner.js";
import { TestRunnerConfig } from "./types.js";

/**
 * Factory function to create a TestRunner instance with optional configuration
 * @param config - Configuration options for the TestRunner
 * @returns A new TestRunner instance
 */
export function createTestRunner(config: TestRunnerConfig): TestRunner {
  return new TestRunner(config);
}

/**
 * Create a TestRunner with default SSE response mode
 * @param baseUrl - The base URL of the MCP server to test
 * @returns A new TestRunner instance configured for SSE mode
 */
export function createSseTestRunner(baseUrl: string): TestRunner {
  return new TestRunner({ baseUrl, responseMode: "sse" });
}

/**
 * Create a TestRunner with batch response mode
 * @param baseUrl - The base URL of the MCP server to test
 * @returns A new TestRunner instance configured for batch mode
 */
export function createBatchTestRunner(baseUrl: string): TestRunner {
  return new TestRunner({ baseUrl, responseMode: "batch" });
}
