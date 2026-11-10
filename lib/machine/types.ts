export type ChatRole = "user" | "assistant";

export type Source = {
  label: string;
  url: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  sources?: Source[];
  error?: boolean;
};

export type MachinePhase = "idle" | "loading" | "ready" | "generating" | "error";
export type MachineMode = "local" | "demo";
