/**
 * Qwen2.5-0.5B-Instruct (q4f16_1) via MLC — the in-browser model.
 * Chosen 2026-11-17 after SmolLM2-135M failed at even simple questions:
 * 0.5B parameters instruct-tuned, Apache 2.0 weights hosted by mlc-ai on
 * Hugging Face. ~265 MB on the wire (config, tokenizer, 8 param shards),
 * ~945 MB GPU memory per web-llm's prebuilt record, 4,096-token context
 * by default. This model ships inside web-llm's prebuiltAppConfig, so no
 * custom ModelRecord is needed — the engine passes the prebuilt id.
 */
export const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

/** One-time download size, shown in the UI. */
export const MODEL_DOWNLOAD = "~265 MB";
/** GPU memory web-llm reports for the prebuilt record. */
export const MODEL_VRAM = "~945 MB";
