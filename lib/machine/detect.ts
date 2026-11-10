export type MachineSupport = "checking" | "webgpu" | "demo";

type AdapterWithFeatures = {
  features?: { has: (name: string) => boolean };
};

type NavigatorWithGPU = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<AdapterWithFeatures | null>;
  };
};

export async function detectWebGPU(): Promise<MachineSupport> {
  if (typeof navigator === "undefined") return "demo";
  const gpu = (navigator as NavigatorWithGPU).gpu;
  if (!gpu) return "demo";
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return "demo";
    // The small browser model (SmolLM2 q4f16_1) is compiled with f16 kernels;
    // without shader-f16 it cannot run. Fall back to the demo instead of
    // erroring halfway through an 80 MB download.
    const features = adapter.features;
    if (features && !features.has("shader-f16")) return "demo";
    return "webgpu";
  } catch {
    return "demo";
  }
}
