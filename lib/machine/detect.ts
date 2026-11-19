/** "webgpu" can run the model; "instant" answers from the notes without it. */
export type MachineSupport = "checking" | "webgpu" | "instant";

type AdapterWithFeatures = {
  features?: { has: (name: string) => boolean };
};

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<AdapterWithFeatures | null>;
  };
};

export async function detectWebGPU(): Promise<MachineSupport> {
  if (typeof navigator === "undefined") return "instant";
  const gpu = (navigator as NavigatorWithGPU).gpu;
  if (!gpu) return "instant";
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return "instant";
    // The model (Qwen2.5 q4f16_1) is compiled with f16 kernels; without
    // shader-f16 it cannot run, so answer instantly instead of failing
    // halfway through the download.
    const features = adapter.features;
    if (features && !features.has("shader-f16")) return "instant";
    return "webgpu";
  } catch {
    return "instant";
  }
}
