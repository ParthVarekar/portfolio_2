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
  /** a question the visitor can send to Wikipedia with one click (Web is off) */
  check?: string;
};

export type MachinePhase = "idle" | "loading" | "ready" | "generating" | "error";
/** "local" runs the model on the GPU; "instant" answers from the notes without it. */
export type MachineMode = "local" | "instant";
