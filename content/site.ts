export const site = {
  name: "Parth Varekar",
  shortName: "Parth",
  role: "AI systems builder",
  location: "Mumbai, India",
  timezone: "Asia/Kolkata",
  email: "parthvarekar27@gmail.com",
  phone: "+91 7400082627",
  url: "https://parthvarekar.in",
  description:
    "Parth Varekar builds local-first AI systems: offline procedure monitors, zero-cloud dictation, biodiversity intelligence and browser labs. This portfolio runs a real 0.5B language model inside your browser.",
  github: "https://github.com/ParthVarekar",
  linkedin: "https://www.linkedin.com/in/parth-varekar-601432344",
  nav: [
    { label: "Work", href: "/work" },
    { label: "Machine", href: "/machine" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  chapters: [
    { number: "01", title: "H.A.L.O", href: "/work/halo" },
    { number: "02", title: "Susurrus", href: "/work/susurrus" },
    { number: "03", title: "Chumps Lab", href: "/work/chumps-lab" },
    { number: "04", title: "BioRadar", href: "/work/bioradar" },
    { number: "05", title: "COSTA", href: "/work/costa" },
    { number: "06", title: "RoboForge", href: "/work/roboforge" },
    { number: "07", title: "Client work", href: "/work/client-work" },
  ],
} as const;

export const machineFacts = {
  model: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  download: "~265 MB",
  vram: "~945 MB",
  context: "4,096 tokens",
  runtime: "WebLLM · WebGPU · Web Worker",
  licence: "Apache 2.0",
} as const;
