import chalk from "chalk";
import {
  ResponseMode,
  TestRunnerConfig,
  ConcurrentTestConfig,
  TestResult,
} from "./types.js";
import VirtualClient from "./VirtualClient.js";
import PerformanceAnalyzer, { OperationResult } from "./PerformanceAnalyzer.js";

class TestRunner {
  private clients: VirtualClient[];
  private baseUrl: string;
  private responseMode: ResponseMode;
  private performanceAnalyzer: PerformanceAnalyzer;

  constructor(config: TestRunnerConfig) {
    this.baseUrl = config.baseUrl;
    this.responseMode = config.responseMode;
    this.clients = [];
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  private async _addClient() {
    this.clients.push(new VirtualClient(this.baseUrl, this.responseMode));
  }

  public setClientsAmount(amount: number) {
    this.clients = [];
    for (let index = 0; index < amount; index++) {
      this._addClient();
    }
    console.log(chalk.yellow(`Total clients: ${this.clients.length}`));
  }

  async runInitializationTest() {
    const virtualClient = this.clients[0];
    await virtualClient.initialize();
    await virtualClient.acknowledgeInitialize();
    await virtualClient.listTools();
  }

  async runSequentialTest() {
    for (const client of this.clients) {
      await client.initialize();
      await client.acknowledgeInitialize();
      await client.listTools();
    }
  }

  private async executeClientWorkflow(
    client: VirtualClient
  ): Promise<OperationResult[]> {
    const results: OperationResult[] = [];

    try {
      const initStart = Date.now();
      await client.initialize();
      results.push({
        success: true,
        latency: Date.now() - initStart,
        timestamp: initStart,
      });

      const ackStart = Date.now();
      await client.acknowledgeInitialize();
      results.push({
        success: true,
        latency: Date.now() - ackStart,
        timestamp: ackStart,
      });

      const listStart = Date.now();
      await client.listTools();
      results.push({
        success: true,
        latency: Date.now() - listStart,
        timestamp: listStart,
      });
    } catch (error) {
      results.push({
        success: false,
        latency: 0,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return results;
  }

  async runConcurrentTest(config: ConcurrentTestConfig): Promise<TestResult> {
    console.log(chalk.cyan.bold(`\n🚀 Starting Concurrent Test`));
    console.log(chalk.yellow(`Concurrency: ${config.concurrency}`));
    if (config.duration)
      console.log(chalk.yellow(`Duration: ${config.duration}s`));
    if (config.iterations)
      console.log(chalk.yellow(`Iterations per client: ${config.iterations}`));
    if (config.rampUpTime)
      console.log(chalk.yellow(`Ramp-up time: ${config.rampUpTime}s`));

    if (this.clients.length < config.concurrency) {
      this.setClientsAmount(config.concurrency);
    }

    this.performanceAnalyzer.reset();
    const startTime = new Date();
    const testStartTime = Date.now();

    let clientPromises: Promise<OperationResult[]>[];

    if (config.rampUpTime && config.rampUpTime > 0) {
      clientPromises = await this.executeRampUpTest(config);
    } else {
      clientPromises = this.clients
        .slice(0, config.concurrency)
        .map((client) => this.executeClientWorkflow(client));
    }

    console.log(
      chalk.blue(`⏳ Executing ${config.concurrency} concurrent operations...`)
    );
    const allResults = await Promise.allSettled(clientPromises);

    allResults.forEach((result) => {
      if (result.status === "fulfilled") {
        this.performanceAnalyzer.addResults(result.value);
      } else {
        this.performanceAnalyzer.addResult({
          success: false,
          latency: 0,
          timestamp: Date.now(),
          error: result.reason?.message || "Unknown error",
        });
      }
    });

    const endTime = new Date();
    const totalDuration = Date.now() - testStartTime;
    const metrics = this.performanceAnalyzer.calculateMetrics(totalDuration);

    const testResult: TestResult = {
      testType: "concurrent",
      config,
      metrics,
      startTime,
      endTime,
    };

    this.performanceAnalyzer.generateReport(testResult);
    return testResult;
  }

  private async executeRampUpTest(
    config: ConcurrentTestConfig
  ): Promise<Promise<OperationResult[]>[]> {
    const clientPromises: Promise<OperationResult[]>[] = [];
    const rampUpInterval = (config.rampUpTime! * 1000) / config.concurrency;

    console.log(
      chalk.blue(
        `📈 Ramping up ${config.concurrency} clients over ${config.rampUpTime}s...`
      )
    );

    for (let i = 0; i < config.concurrency; i++) {
      const client = this.clients[i];

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, rampUpInterval));
      }

      const clientPromise = this.executeClientWorkflow(client);
      clientPromises.push(clientPromise);

      console.log(
        chalk.gray(`  Client ${i + 1}/${config.concurrency} started`)
      );
    }

    return clientPromises;
  }

  async runLoadTest(config: ConcurrentTestConfig): Promise<TestResult> {
    if (!config.duration) {
      throw new Error("Duration must be specified for load tests");
    }

    console.log(chalk.cyan.bold(`\n🔥 Starting Load Test`));
    console.log(chalk.yellow(`Duration: ${config.duration}s`));
    console.log(chalk.yellow(`Concurrency: ${config.concurrency}`));

    if (this.clients.length < config.concurrency) {
      this.setClientsAmount(config.concurrency);
    }

    this.performanceAnalyzer.reset();
    const startTime = new Date();
    const testStartTime = Date.now();
    const endTime = testStartTime + config.duration * 1000;

    const clientPromises: Promise<void>[] = [];

    for (let i = 0; i < config.concurrency; i++) {
      const client = this.clients[i];
      const clientPromise = this.runClientForDuration(client, endTime);
      clientPromises.push(clientPromise);
    }

    console.log(
      chalk.blue(
        `⏳ Running ${config.concurrency} clients for ${config.duration}s...`
      )
    );

    await Promise.allSettled(clientPromises);

    const totalDuration = Date.now() - testStartTime;
    const metrics = this.performanceAnalyzer.calculateMetrics(totalDuration);

    const testResult: TestResult = {
      testType: "load",
      config,
      metrics,
      startTime,
      endTime: new Date(),
    };

    this.performanceAnalyzer.generateReport(testResult);
    return testResult;
  }

  private async runClientForDuration(
    client: VirtualClient,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime) {
      const results = await this.executeClientWorkflow(client);
      this.performanceAnalyzer.addResults(results);

      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  exportResults(
    testResult: TestResult,
    format: "json" | "csv" = "json"
  ): string {
    if (format === "csv") {
      return this.performanceAnalyzer.exportToCsv(testResult);
    }
    return this.performanceAnalyzer.exportToJson(testResult);
  }
}

export default TestRunner;
