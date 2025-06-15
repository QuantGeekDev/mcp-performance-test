import * as ss from "simple-statistics";
import { PerformanceMetrics, TestResult } from "./types.js";
import { ConfigurableLogger, defaultLogger } from "./logger.js";

export interface OperationResult {
  success: boolean;
  latency: number;
  timestamp: number;
  error?: string;
}

class PerformanceAnalyzer {
  private results: OperationResult[] = [];
  private logger: ConfigurableLogger;

  constructor(logger: ConfigurableLogger = defaultLogger) {
    this.logger = logger;
  }

  addResult(result: OperationResult) {
    this.results.push(result);
  }

  addResults(results: OperationResult[]) {
    this.results.push(...results);
  }

  calculateMetrics(testDuration: number): PerformanceMetrics {
    const successfulResults = this.results.filter((r) => r.success);
    const failedResults = this.results.filter((r) => !r.success);
    const latencies = successfulResults.map((r) => r.latency);

    if (latencies.length === 0) {
      return {
        totalOperations: this.results.length,
        successfulOperations: 0,
        failedOperations: failedResults.length,
        totalDuration: testDuration,
        throughput: 0,
        latencies: [],
        percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
        statistics: {
          min: 0,
          max: 0,
          mean: 0,
          median: 0,
          standardDeviation: 0,
        },
        errorRate: 100,
        timestamps: this.results.map((r) => r.timestamp),
      };
    }

    const sortedLatencies = [...latencies].sort((a, b) => a - b);

    return {
      totalOperations: this.results.length,
      successfulOperations: successfulResults.length,
      failedOperations: failedResults.length,
      totalDuration: testDuration,
      throughput: (successfulResults.length / testDuration) * 1000, // ops/second
      latencies: latencies,
      percentiles: {
        p50: ss.quantile(sortedLatencies, 0.5),
        p90: ss.quantile(sortedLatencies, 0.9),
        p95: ss.quantile(sortedLatencies, 0.95),
        p99: ss.quantile(sortedLatencies, 0.99),
      },
      statistics: {
        min: ss.min(latencies),
        max: ss.max(latencies),
        mean: ss.mean(latencies),
        median: ss.median(latencies),
        standardDeviation: ss.standardDeviation(latencies),
      },
      errorRate: (failedResults.length / this.results.length) * 100,
      timestamps: this.results.map((r) => r.timestamp),
    };
  }

  generateReport(testResult: TestResult): void {
    const { metrics, config, testType } = testResult;

    this.logger.info("\n" + "═".repeat(60));
    this.logger.info(`📊 ${testType.toUpperCase()} PERFORMANCE REPORT`);
    this.logger.info("═".repeat(60));

    this.logger.info("\n🔧 Test Configuration:");
    this.logger.info(`  Concurrency Level: ${config.concurrency}`);
    if (config.duration) this.logger.info(`  Duration: ${config.duration}s`);
    if (config.iterations)
      this.logger.info(`  Iterations per client: ${config.iterations}`);
    if (config.rampUpTime)
      this.logger.info(`  Ramp-up time: ${config.rampUpTime}s`);

    this.logger.info("\n📈 Operations Summary:");
    this.logger.info(`  Total Operations: ${metrics.totalOperations}`);
    this.logger.info(`  Successful: ${metrics.successfulOperations}`);
    this.logger.info(`  Failed: ${metrics.failedOperations}`);
    this.logger.info(
      `  Success Rate: ${(100 - metrics.errorRate).toFixed(2)}%`
    );
    this.logger.info(`  Throughput: ${metrics.throughput.toFixed(2)} ops/sec`);

    this.logger.info("\n⚡ Latency Statistics (ms):");
    this.logger.info(`  Min: ${metrics.statistics.min.toFixed(2)}`);
    this.logger.info(`  Max: ${metrics.statistics.max.toFixed(2)}`);
    this.logger.info(`  Mean: ${metrics.statistics.mean.toFixed(2)}`);
    this.logger.info(`  Median: ${metrics.statistics.median.toFixed(2)}`);
    this.logger.info(
      `  Std Dev: ${metrics.statistics.standardDeviation.toFixed(2)}`
    );

    this.logger.info("\n🎯 Latency Percentiles (ms):");
    this.logger.info(`  P50 (median): ${metrics.percentiles.p50.toFixed(2)}`);
    this.logger.info(`  P90: ${metrics.percentiles.p90.toFixed(2)}`);
    this.logger.info(`  P95: ${metrics.percentiles.p95.toFixed(2)}`);
    this.logger.info(`  P99: ${metrics.percentiles.p99.toFixed(2)}`);

    this.logger.info("═".repeat(60) + "\n");
  }

  reset() {
    this.results = [];
  }

  exportToJson(testResult: TestResult): string {
    return JSON.stringify(testResult, null, 2);
  }

  exportToCsv(testResult: TestResult): string {
    const { metrics, config, testType, startTime, endTime } = testResult;

    let csv = "# Test Metadata\n";
    csv += `Test Type,${testType}\n`;
    csv += `Concurrency,${config.concurrency}\n`;
    if (config.duration) csv += `Duration,${config.duration}\n`;
    if (config.rampUpTime) csv += `Ramp Up Time,${config.rampUpTime}\n`;
    csv += `Start Time,${startTime.toISOString()}\n`;
    csv += `End Time,${endTime.toISOString()}\n`;
    csv += `Total Operations,${metrics.totalOperations}\n`;
    csv += `Successful Operations,${metrics.successfulOperations}\n`;
    csv += `Failed Operations,${metrics.failedOperations}\n`;
    csv += `Throughput (ops/sec),${metrics.throughput.toFixed(2)}\n`;
    csv += `Error Rate (%),${metrics.errorRate.toFixed(2)}\n`;
    csv += `P50 Latency (ms),${metrics.percentiles.p50.toFixed(2)}\n`;
    csv += `P90 Latency (ms),${metrics.percentiles.p90.toFixed(2)}\n`;
    csv += `P95 Latency (ms),${metrics.percentiles.p95.toFixed(2)}\n`;
    csv += `P99 Latency (ms),${metrics.percentiles.p99.toFixed(2)}\n`;
    csv += `Mean Latency (ms),${metrics.statistics.mean.toFixed(2)}\n`;
    csv += `Min Latency (ms),${metrics.statistics.min.toFixed(2)}\n`;
    csv += `Max Latency (ms),${metrics.statistics.max.toFixed(2)}\n`;
    csv += `Std Dev Latency (ms),${metrics.statistics.standardDeviation.toFixed(
      2
    )}\n`;

    csv += "\n# Raw Operation Data\n";
    csv += "timestamp,latency,success,error\n";
    const rows = this.results
      .map((r) => `${r.timestamp},${r.latency},${r.success},${r.error || ""}`)
      .join("\n");

    return csv + rows;
  }
}

export default PerformanceAnalyzer;
