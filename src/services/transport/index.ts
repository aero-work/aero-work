import type { Transport, TransportConfig } from "./types";
import { TauriTransport } from "./tauri";

export type { Transport, TransportConfig, InitializeResponse } from "./types";
export { TauriTransport } from "./tauri";

let transportInstance: Transport | null = null;

export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case "tauri":
      return new TauriTransport();
    case "websocket":
      throw new Error("WebSocket transport not implemented yet");
    default:
      throw new Error(`Unknown transport type: ${config.type}`);
  }
}

export function getTransport(): Transport {
  if (!transportInstance) {
    transportInstance = createTransport({ type: "tauri" });
  }
  return transportInstance;
}

export function setTransport(transport: Transport): void {
  transportInstance = transport;
}
