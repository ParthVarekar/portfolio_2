export type ResumeProject = {
  name: string;
  href?: string;
  role: string;
  stack: string[];
  bullets: string[];
};

export type Resume = {
  name: string;
  role: string;
  location: string;
  phone: string;
  email: string;
  links: { label: string; href: string }[];
  summary: string[];
  highlights: { label: string; text: string }[];
  skills: { label: string; items: string[] }[];
  projects: ResumeProject[];
  experience: { role: string; org: string; place: string; dates: string; bullets: string[] }[];
  education: { degree: string; school: string; meta: string[] };
  certifications: { label: string; detail: string }[];
};

export const resume: Resume = {
  name: "Parth Varekar",
  role: "AI Engineer · Full-Stack Developer · Computer Engineering Student",
  location: "Mumbai, India",
  phone: "+91 7400082627",
  email: "parthvarekar27@gmail.com",
  links: [
    { label: "github.com/ParthVarekar", href: "https://github.com/ParthVarekar" },
    {
      label: "linkedin.com/in/parth-varekar-601432344",
      href: "https://www.linkedin.com/in/parth-varekar-601432344",
    },
    { label: "parthvarekar.in", href: "https://parthvarekar.in" },
  ],
  summary: [
    "Computer Engineering student (expected 2028) building AI and full-stack systems in Python, TypeScript and React.",
    "Experience across computer vision, speech/LLM systems, offline AI, collaborative interfaces and data analytics. Focused on practical deployment, testing and measurable results.",
  ],
  highlights: [
    {
      label: "Offline AI",
      text: "Built a local Windows voice-input workflow with Qwen3-ASR + llama.cpp, including formatting and text rewriting.",
    },
    {
      label: "Computer Vision",
      text: "Built real-time video analysis and optical tracking with YOLO11, OpenCV and Kalman filtering.",
    },
    {
      label: "Full-Stack",
      text: "Built React/Next.js apps and a collaborative design editor using Yjs/CRDT state.",
    },
    {
      label: "Analytics",
      text: "Processed 50,000+ records with SQL and delivered five Power BI dashboards during internship.",
    },
  ],
  skills: [
    {
      label: "Languages",
      items: ["Python", "TypeScript", "JavaScript", "Java", "SQL", "C++"],
    },
    {
      label: "AI / ML",
      items: [
        "Computer vision (YOLO11, OpenCV, Qwen3-VL)",
        "Speech recognition (Qwen3-ASR)",
        "Local LLMs (llama.cpp)",
        "RAG, multi-agent pipelines",
        "PyTorch, ChromaDB, FAISS, Gemini API",
        "Kalman filtering",
      ],
    },
    {
      label: "Backend & Data",
      items: [
        "FastAPI, Flask, Node.js, REST APIs",
        "PostgreSQL, MySQL, SQLite, Prisma, Firebase",
        "QIIME 2, Power BI",
      ],
    },
    {
      label: "Frontend & Tools",
      items: [
        "React, Next.js, Tailwind CSS, Vite, Konva",
        "Yjs, PySide6, Chrome Extensions (MV3)",
        "Docker, Git, GitHub Actions, Linux, Arduino",
      ],
    },
  ],
  projects: [
    {
      name: "H.A.L.O",
      href: "https://github.com/ParthVarekar/H.A.L.O",
      role: "Python, PyTorch, YOLO11, Qwen3-VL, React (SIH26174)",
      stack: ["Python", "PyTorch", "YOLO11", "Qwen3-VL", "React"],
      bullets: [
        "Built an offline on-board AI that watches a science procedure on video, recognizes each step and speaks an alert the moment one is skipped or out of order; runs in real time (25 fps) on a single laptop GPU with no network.",
        "Trained YOLO11 on real ISS footage (held-out mAP50 0.79): followed all 8 steps of the MELFI freezer procedure in order with 0 false alerts and caught a removed step 1.5 s in. Added a signed, hash-chained event log, a 1 KB downlink report, UDP video streaming and a React dashboard; 276 tests.",
      ],
    },
    {
      name: "COSTA",
      href: "https://github.com/ishwar-prog/COSTA",
      role: "Optical Tracking & Alignment | Python, OpenCV, PySide6 (SIH26169)",
      stack: ["Python", "OpenCV", "PySide6"],
      bullets: [
        "Built an AI tracker for free-space optical links that identifies a partner terminal’s beacon by its blink signature (FFT + naive-Bayes) instead of brightness, then holds it with a Kalman filter and a 60 Hz gimbal controller; needs no training data.",
        "Met all six SIH targets in 28 of 28 validation cases (acquisition 0.83–1.60 s vs 2 s limit, tracking error under 3.3 px vs 10 px limit); drives a real Arduino pan/tilt head.",
      ],
    },
    {
      name: "BioRadar",
      href: "https://github.com/omtawde09/BioRadar",
      role: "Python, QIIME 2, Docker, React (SIH25042, team project)",
      stack: ["Python", "QIIME 2", "Docker", "React"],
      bullets: [
        "Helped build an eDNA biodiversity platform for Indian waters that turns sequencing reads into a species list, invasive-species risk, spread forecast and bilingual (English/Hindi) dashboard, with a SHA-256 Merkle ledger for tamper-evident results.",
        "Validated at 100% recall with zero false positives (80 of 80 detections) on a mock community, which also exposed a mislabelled public NCBI record.",
      ],
    },
    {
      name: "Chumps Lab Studio",
      href: "https://github.com/ParthVarekar/chumps-lab-studio",
      role: "TypeScript, React, Python, Remotion, FFmpeg",
      stack: ["TypeScript", "React", "Remotion", "FFmpeg"],
      bullets: [
        "Built an AI video editor for screen-recording tutorials that analyzes speech, OCR and screen motion to automatically add zooms, captions, labels, graphics and sound effects.",
        "Added a timeline editor with draw-to-place effects, animated elements and an AI assistant that proposes editable changes; supports local model inference and Remotion-based rendering.",
      ],
    },
    {
      name: "RoboForge",
      href: "https://github.com/college-hack24-nov26/hack-odyssey",
      role: "Python, MuJoCo, Webots, ESP32, OpenCV",
      stack: ["Python", "MuJoCo", "Webots", "ESP32"],
      bullets: [
        "Built a chat-first engineering platform that turns machine requirements into part lists, 3D simulations and stress tests, then compares a physical rover with its simulated twin.",
        "Developed a rover calibration workflow using ESP32 firmware and gyroscope measurements to diagnose motor imbalance, calculate corrections and re-measure; 900+ automated tests.",
      ],
    },
  ],
  experience: [
    {
      role: "Data Analytics Intern",
      org: "Imarticus Learning",
      place: "Mumbai, India",
      dates: "Feb 2026 – Mar 2026",
      bullets: [
        "Wrote SQL queries to extract and transform 50,000+ records for analysis.",
        "Delivered five interactive Power BI dashboards that cut weekly reporting time by 15%.",
      ],
    },
  ],
  education: {
    degree: "Bachelor of Engineering in Computer Engineering",
    school: "Excelsior KC College of Engineering, Thane",
    meta: [
      "CGPA 8.31/10",
      "University of Mumbai",
      "Expected 2028",
      "Admitted via MHT-CET",
    ],
  },
  certifications: [
    {
      label: "Full-Stack Java Development",
      detail: "EduSkills · A+ grade",
    },
  ],
};
