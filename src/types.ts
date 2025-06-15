export type ResponseMode = "sse" | "batch";

export interface TestRunnerConfig {
  baseUrl: string;
  responseMode: ResponseMode;
}
