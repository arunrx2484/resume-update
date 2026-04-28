import { request, APIRequestContext, APIResponse } from "playwright";

export class ApiClient {
  private readonly contextPromise: Promise<APIRequestContext>;

  constructor(private readonly baseUrl: string) {
    this.contextPromise = request.newContext({ baseURL: baseUrl });
  }

  async get(endpoint: string): Promise<APIResponse> {
    const context = await this.contextPromise;
    return context.get(endpoint);
  }

  async dispose(): Promise<void> {
    const context = await this.contextPromise;
    await context.dispose();
  }
}
