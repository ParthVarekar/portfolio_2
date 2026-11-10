import type { ModelRecord } from "@mlc-ai/web-llm";

/**
 * SmolLM2-135M-Instruct (q4f16_1) via MLC — the smallest real language model
 * that loads in a browser today. ~78 MB total on the wire (72 MB weights,
 * ~6 MB WebGPU library, tokenizer files) and roughly 100 MB of GPU memory.
 * Not part of WebLLM's prebuilt list, so the record is defined here and
 * merged into prebuiltAppConfig at load time. Weights are Apache 2.0,
 * hosted by mlc-ai on Hugging Face.
 */
export const MODEL_ID = "SmolLM2-135M-Instruct-q4f16_1-MLC";

export const BROWSER_MODEL: ModelRecord = {
  model: "https://huggingface.co/mlc-ai/SmolLM2-135M-Instruct-q4f16_1-MLC",
  model_id: MODEL_ID,
  model_lib:
    "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_87/base/SmolLM2-135M-Instruct-q4f16_1_cs1k-webgpu.wasm",
  vram_required_MB: 100,
  low_resource_required: true,
  required_features: ["shader-f16"],
  overrides: {
    context_window_size: 4096,
  },
};
