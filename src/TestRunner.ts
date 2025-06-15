import chalk from "chalk";
import { ResponseMode, TestRunnerConfig } from "./types.js";
import VirtualClient from "./VirtualClient.js";

class TestRunner {
  private clients: VirtualClient[];
  private baseUrl: string;
  private responseMode: ResponseMode;

  constructor(config: TestRunnerConfig) {
    this.baseUrl = config.baseUrl;
    this.responseMode = config.responseMode;
    this.clients = [];
  }
  private async _addClient() {
    this.clients.push(new VirtualClient(this.baseUrl, this.responseMode));
  }

  public setClientsAmount(amount: number) {
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
}

export default TestRunner;
