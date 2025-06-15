# MCP Performance Test

A powerful TypeScript library for performance testing **Model Context Protocol (MCP)** servers with concurrent testing, load testing, and comprehensive metrics analysis.

## 🚀 Installation

```bash
npm install mcp-performance-test
```

## 📖 What is this?

This library helps you performance test MCP servers by simulating multiple virtual clients that can:
- **Initialize** MCP connections
- **List tools** available on the server
- **Measure latency** and throughput
- **Generate detailed reports** with percentiles and statistics
- **Support different transport modes** (SSE and Batch)

Perfect for developers building MCP servers who need to ensure their implementation can handle concurrent connections and high load scenarios.

## 🎯 Quick Start

### Basic Concurrent Test

```typescript
import { createSseTestRunner } from 'mcp-performance-test';

const testMyCPServer = async () => {
  // Create a test runner for SSE transport
  const testRunner = createSseTestRunner('https://your-mcp-server.com');
  
  // Run a concurrent test with 10 simultaneous clients
  const result = await testRunner.runConcurrentTest({
    concurrency: 10,
    rampUpTime: 5 // gradually increase load over 5 seconds
  });
  
  console.log(`Throughput: ${result.metrics.throughput.toFixed(2)} ops/sec`);
  console.log(`P95 Latency: ${result.metrics.percentiles.p95.toFixed(2)}ms`);
};

testMyCPServer();
```

### Load Test (Duration-based)

```typescript
import { createSseTestRunner } from 'mcp-performance-test';

const loadTest = async () => {
  const testRunner = createSseTestRunner('https://your-mcp-server.com');
  
  // Run sustained load for 30 seconds
  const result = await testRunner.runLoadTest({
    concurrency: 5,
    duration: 30 // run for 30 seconds
  });
  
  console.log('Load test completed!');
  console.log(`Success Rate: ${(100 - result.metrics.errorRate).toFixed(2)}%`);
};
```

## 🔧 Transport Modes

### SSE (Server-Sent Events) Transport

```typescript
import { createSseTestRunner } from 'mcp-performance-test';

const sseRunner = createSseTestRunner('https://your-mcp-server.com');
```

### Batch Transport

```typescript
import { createBatchTestRunner } from 'mcp-performance-test';

const batchRunner = createBatchTestRunner('https://your-mcp-server.com');
```

### Custom Configuration

```typescript
import { TestRunner } from 'mcp-performance-test';

const customRunner = new TestRunner({
  baseUrl: 'https://your-mcp-server.com',
  responseMode: 'sse', // or 'batch'
  logLevel: 'info',     // 'none' | 'error' | 'warn' | 'info' | 'debug'
  enableColorOutput: true,
  logger: myCustomLogger // optional custom logger
});
```

## 📊 Advanced Usage

### Export Results

```typescript
// Export as JSON
const jsonReport = testRunner.exportResults(result, 'json');
console.log(jsonReport);

// Export as CSV
const csvReport = testRunner.exportResults(result, 'csv');
console.log(csvReport);
```

### Custom Logging

```typescript
import { TestRunner } from 'mcp-performance-test';

const testRunner = new TestRunner({
  baseUrl: 'https://your-mcp-server.com',
  responseMode: 'sse',
  logLevel: 'debug', // See detailed logs
  enableColorOutput: false, // Disable colors for CI environments
  logger: {
    error: (msg) => myLogger.error(msg),
    warn: (msg) => myLogger.warn(msg),
    info: (msg) => myLogger.info(msg),
    debug: (msg) => myLogger.debug(msg)
  }
});
```

### React Integration Example

```typescript
import { useState } from 'react';
import { createSseTestRunner, TestResult } from 'mcp-performance-test';

const PerformanceTester = () => {
  const [results, setResults] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const runner = createSseTestRunner('https://your-mcp-server.com');
      const result = await runner.runConcurrentTest({ concurrency: 5 });
      setResults(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <button onClick={runTest} disabled={testing}>
        {testing ? 'Testing...' : 'Run Performance Test'}
      </button>
      
      {results && (
        <div>
          <h3>Results</h3>
          <p>Throughput: {results.metrics.throughput.toFixed(2)} ops/sec</p>
          <p>P95 Latency: {results.metrics.percentiles.p95.toFixed(2)}ms</p>
          <p>Success Rate: {(100 - results.metrics.errorRate).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};
```

## 📈 Metrics Explained

The library provides comprehensive performance metrics:

- **Throughput**: Operations per second
- **Latency Percentiles**: P50, P90, P95, P99 response times
- **Success Rate**: Percentage of successful operations
- **Error Rate**: Percentage of failed operations
- **Statistics**: Min, max, mean, median, standard deviation

## 🛠️ Use Cases

- **CI/CD Integration**: Automated performance regression testing
- **Development**: Quick performance checks during MCP server development
- **Production Monitoring**: Validate server performance before deployment
- **Capacity Planning**: Determine optimal server configurations
- **SLA Validation**: Ensure your MCP server meets performance requirements


## 🤝 Contributing

Issues and pull requests are welcome! Please feel free to contribute to make this library even better.

## 📄 License

MIT 
