import * as ss from "simple-statistics";
import chalk from "chalk";
import { PerformanceMetrics, TestResult } from "./types.js";

export interface OperationResult {
  success: boolean;
  latency: number;
  timestamp: number;
  error?: string;
}

class PerformanceAnalyzer {
  private results: OperationResult[] = [];

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

    console.log("\n" + chalk.cyan("═".repeat(60)));
    console.log(
      chalk.cyan.bold(`📊 ${testType.toUpperCase()} PERFORMANCE REPORT`)
    );
    console.log(chalk.cyan("═".repeat(60)));

    console.log(chalk.yellow.bold("\n🔧 Test Configuration:"));
    console.log(`  Concurrency Level: ${chalk.green(config.concurrency)}`);
    if (config.duration)
      console.log(`  Duration: ${chalk.green(config.duration)}s`);
    if (config.iterations)
      console.log(`  Iterations per client: ${chalk.green(config.iterations)}`);
    if (config.rampUpTime)
      console.log(`  Ramp-up time: ${chalk.green(config.rampUpTime)}s`);

    console.log(chalk.yellow.bold("\n📈 Operations Summary:"));
    console.log(`  Total Operations: ${chalk.green(metrics.totalOperations)}`);
    console.log(`  Successful: ${chalk.green(metrics.successfulOperations)}`);
    console.log(
      `  Failed: ${
        metrics.failedOperations > 0
          ? chalk.red(metrics.failedOperations)
          : chalk.green(metrics.failedOperations)
      }`
    );
    console.log(
      `  Success Rate: ${
        metrics.errorRate < 5
          ? chalk.green
          : metrics.errorRate < 20
          ? chalk.yellow
          : chalk.red
      }${(100 - metrics.errorRate).toFixed(2)}%`
    );
    console.log(
      `  Throughput: ${chalk.cyan(metrics.throughput.toFixed(2))} ops/sec`
    );

    console.log(chalk.yellow.bold("\n⚡ Latency Statistics (ms):"));
    console.log(`  Min: ${chalk.green(metrics.statistics.min.toFixed(2))}`);
    console.log(`  Max: ${chalk.red(metrics.statistics.max.toFixed(2))}`);
    console.log(`  Mean: ${chalk.blue(metrics.statistics.mean.toFixed(2))}`);
    console.log(
      `  Median: ${chalk.blue(metrics.statistics.median.toFixed(2))}`
    );
    console.log(
      `  Std Dev: ${chalk.gray(
        metrics.statistics.standardDeviation.toFixed(2)
      )}`
    );

    console.log(chalk.yellow.bold("\n🎯 Latency Percentiles (ms):"));
    console.log(
      `  P50 (median): ${chalk.green(metrics.percentiles.p50.toFixed(2))}`
    );
    console.log(`  P90: ${chalk.yellow(metrics.percentiles.p90.toFixed(2))}`);
    console.log(`  P95: ${chalk.magenta(metrics.percentiles.p95.toFixed(2))}`);
    console.log(`  P99: ${chalk.red(metrics.percentiles.p99.toFixed(2))}`);

    console.log(chalk.cyan("═".repeat(60)) + "\n");
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
