export type ResponseMode = "sse" | "batch";

export interface TestRunnerConfig {
  baseUrl: string;
  responseMode: ResponseMode;
}

export interface ConcurrentTestConfig {
  concurrency: number;
  duration?: number; // in seconds, optional
  iterations?: number; // number of operations per client, optional
  rampUpTime?: number; // time to gradually increase load, in seconds
}

export interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalDuration: number; // in milliseconds
  throughput: number; // operations per second
  latencies: number[]; // individual operation latencies in ms
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
  };
  errorRate: number; // percentage
  timestamps: number[]; // start time of each operation
}

export interface TestResult {
  testType: string;
  config: ConcurrentTestConfig;
  metrics: PerformanceMetrics;
  startTime: Date;
  endTime: Date;
}
