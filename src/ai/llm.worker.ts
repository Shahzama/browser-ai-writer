import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// All model work (download, GPU setup, token generation) happens in this worker,
// so typing and scrolling stay smooth while the model is busy.
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (message: MessageEvent) => {
  handler.onmessage(message);
};
