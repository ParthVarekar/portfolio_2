export type CoreState = "idle" | "loading" | "ready" | "generating" | "demo";

export function Core({ state = "idle" }: { state?: CoreState }) {
  return <div className="core-orb" data-state={state} data-loop aria-hidden="true" />;
}
