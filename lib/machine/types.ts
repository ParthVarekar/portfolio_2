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
/** "local" runs the model on the GPU; "instant" answers from the notes without it. */
export type MachineMode = "local" | "instant";
