import axios, { AxiosInstance } from "axios";
import { ResponseMode } from "./types.js";
import { ConfigurableLogger, defaultLogger } from "./logger.js";

class VirtualClient {
  public axios_instance: AxiosInstance;
  private message_id: number = 1;
  private responseMode: ResponseMode;
  private logger: ConfigurableLogger;

  constructor(
    baseUrl: string,
    responseMode: ResponseMode = "sse",
    logger: ConfigurableLogger = defaultLogger
  ) {
    this.responseMode = responseMode;
    this.logger = logger;

    const headers = { Accept: "text/event-stream, application/json" };

    this.axios_instance = axios.create({
      baseURL: baseUrl,
      headers,
    });
  }

  setResponseMode(mode: ResponseMode) {
    this.responseMode = mode;
    const headers =
      this.responseMode === "sse"
        ? { Accept: "text/event-stream, application/json" }
        : { Accept: "application/json" };

    this.axios_instance.defaults.headers.Accept = headers.Accept;
    this.logger.info(`Response mode set to: ${mode}`);
  }

  async initialize() {
    this.logger.debug(`Initializing...`);
    const initializeMessage = {
      jsonrpc: "2.0",
      id: this.message_id++,
      method: "initialize",
      params: {
        protocolVersion: "2025-26-03",
        capabilities: {
          roots: {
            listChanged: true,
          },
          sampling: {},
        },
        clientInfo: {
          name: "VirtualClient",
          version: "0.0.1",
        },
      },
    };
    const response = await this.axios_instance.post("/mcp", initializeMessage);
    const mcpSessionId = response.headers["mcp-session-id"];

    this.axios_instance.defaults.headers.common["mcp-session-id"] =
      mcpSessionId;

    return response.data;
  }

  async acknowledgeInitialize() {
    const acknowledgeMessage = {
      jsonrpc: "2.0",
      method: "notifications/initialize",
    };
    const response = await this.axios_instance.post("/mcp", acknowledgeMessage);
    this.logger.debug(
      `Acknowledged initialize. |  mcp-session-id: ${this.axios_instance.defaults.headers.common["mcp-session-id"]}`
    );
    return response.data;
  }

  async listTools() {
    const listToolsMessage = {
      id: this.message_id++,
      jsonrpc: "2.0",
      method: "tools/list",
    };

    const response = await this.axios_instance.post("/mcp", listToolsMessage);

    let jsonData;

    if (this.responseMode === "sse") {
      const sseData = response.data;
      const dataMatch = sseData.match(/data: (.+)/);

      if (dataMatch) {
        jsonData = JSON.parse(dataMatch[1]);
      } else {
        this.logger.error(`Could not parse SSE tools response`);
        return response.data;
      }
    } else {
      jsonData = response.data;
    }

    const tools = jsonData.result?.tools || [];
    this.logger.debug(`Available tools (${this.responseMode} mode):`, tools);
    return jsonData;
  }
}

export default VirtualClient;
