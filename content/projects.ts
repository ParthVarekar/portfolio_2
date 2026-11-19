export type ProjectStatus = "Complete" | "In progress" | "Archived" | "Client";
export type ProjectAccent = "blue" | "lime" | "mint" | "violet" | "sky" | "amber" | "ink";
export type ProjectCategory = "local-ai" | "space" | "bio" | "optics" | "robotics" | "client";

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type ProjectSection = {
  number: string;
  title: string;
  paragraphs: string[];
  quote?: string;
  bullets?: string[];
};

export type Evidence = {
  value: string;
  label: string;
};

export type ClientTile = {
  name: string;
  line: string;
  description: string;
  url: string;
  image: string;
  alt: string;
  tags: string[];
};

export type Project = {
  slug: string;
  chapter: string;
  title: string;
  subtitle: string;
  kicker: string;
  status: ProjectStatus;
  category: ProjectCategory;
  accent: ProjectAccent;
  year: string;
  role: string;
  team?: string;
  stack: string[];
  metric: string;
  metricLabel: string;
  repo?: string;
  live?: string;
  summary: string;
  problem: string;
  decision: string;
  learned: string;
  evidence: Evidence[];
  sections: ProjectSection[];
  images: ProjectImage[];
  clients?: ClientTile[];
  next?: string;
};

export const projects: Project[] = [
  {
    slug: "halo",
    chapter: "01",
    title: "H.A.L.O",
    subtitle: "A ground controller for the station.",
    kicker: "On-board procedure intelligence",
    status: "Complete",
    category: "space",
    accent: "blue",
    year: "2026",
    role: "Design, machine learning, systems",
    team: "SIH26174",
    stack: ["Python", "YOLO11", "Qwen3-VL", "PyTorch", "React"],
    metric: "276",
    metricLabel: "tests passing",
    repo: "https://github.com/ParthVarekar/H.A.L.O",
    summary:
      "An on-board AI that watches a science procedure in orbit and speaks up the moment a step is missed or out of order. It runs fully offline on one laptop GPU.",
    problem:
      "A skipped step in orbit can cost a sample that took months to prepare. The procedure exists as a PDF. The crew is busy. The downlink is narrow.",
    decision:
      "Model the procedure as a deterministic state machine over visual evidence, not as a single video classifier.",
    learned:
      "A procedure is a state machine, not a video. Once I modelled it that way, every alert became explainable.",
    evidence: [
      { value: "276", label: "tests passing" },
      { value: "8/8", label: "verification checks" },
      { value: "0.79", label: "mAP50 on real ISS footage" },
      { value: "0", label: "false alerts in the run" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "A science procedure on the station is a sequence of small physical actions: open a tray, pipette a sample, seal it, place it back in the freezer. Miss one, or do them out of order, and the experiment can be ruined. The crew is highly trained, but they are also tired, interrupted and working in a loud environment.",
          "The obvious approach is to train a video model to recognise the whole procedure. That gives you a black box with a confidence score. It cannot tell a controller which step was skipped, why the alert fired, or what evidence it saw. In orbit, an unexplainable alert is almost as bad as no alert at all.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "I treated the procedure as a state machine. Each step has a visual precondition and a visual completion signal. A detector finds the objects; a vision-language model answers narrow questions about what is visible; a deterministic layer decides whether the current step is complete, pending or out of order.",
          "That separation matters. The models are allowed to be uncertain. The state machine owns the logic, so the system can explain itself: this is the step I expected, this is the evidence I saw, this is why I spoke.",
        ],
        quote:
          "The models can be uncertain. The procedure cannot. Separating the two is what made the system trustworthy.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The perception layer is a YOLO11 detector trained on real ISS footage, paired with Qwen3-VL for plain-English questions about a frame. A sliding window keeps the last few seconds of evidence so a single ambiguous frame does not trigger an alert.",
          "Everything runs locally on one laptop GPU. The on-board side writes a hash-chained log and sends a signed report of roughly one kilobyte over the downlink. A React dashboard lets a ground controller replay the procedure, inspect the evidence and see exactly where the state machine diverged.",
        ],
        bullets: [
          "YOLO11 detector trained on real ISS footage, mAP50 0.79",
          "Qwen3-VL answers nine visual questions in about 0.6 seconds",
          "Sliding-window evidence with a deterministic procedure state machine",
          "Hash-chained log and a signed ~1 KB downlink report",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The system passed 8 of 8 verification checks and 276 automated tests. In the recorded procedure it tracked 8 of 8 steps in the correct order with zero false alerts. The dashboard can replay the run frame by frame, with the detector boxes and the state transition that followed.",
          "The important result is not the mAP score. It is that the system stayed quiet when it should have, and spoke with a reason when it should have. That is the behaviour a crew would actually have to trust.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "I learned to stop asking a model to be the system. A model is a sensor. The system is the contract around it: what counts as evidence, what counts as done, and what happens when the evidence is ambiguous.",
          "That pattern now runs through everything I build. Keep the intelligence narrow, keep the logic inspectable, and make the machine say why.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/halo-dashboard.jpg",
        alt: "H.A.L.O dashboard showing a live procedure view with detected objects and a step timeline.",
        caption: "The ground dashboard: live procedure state, detector evidence and the event log.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/halo-architecture.png",
        alt: "H.A.L.O system architecture diagram showing perception, procedure state machine, logging and dashboard layers.",
        caption: "Perception feeds a deterministic state machine; the state machine owns the alert.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/halo-model-answers.png",
        alt: "H.A.L.O vision-language answers panel showing plain-English responses about procedure frames.",
        caption: "Qwen3-VL answers narrow visual questions; the state machine decides what they mean.",
        width: 1600,
        height: 900,
      },
    ],
    next: "susurrus",
  },
  {
    slug: "susurrus",
    chapter: "02",
    title: "Susurrus",
    subtitle: "Your voice never leaves the machine.",
    kicker: "Zero-cloud dictation for Windows",
    status: "Complete",
    category: "local-ai",
    accent: "violet",
    year: "2026",
    role: "Design, engineering",
    stack: ["Python", "Qwen3-ASR", "Gemma", "llama.cpp", "Win32"],
    metric: "77/77",
    metricLabel: "tests passing",
    repo: "https://github.com/ParthVarekar/Susurrus",
    live: "https://susurrus-xi.vercel.app",
    summary:
      "Offline push-to-talk dictation for Windows. Hold a key, speak, let go. Clean, formatted text lands in whatever app you are in. No cloud, no subscription.",
    problem:
      "Cloud dictation sends your audio to someone else's computer and charges you monthly. Raw speech recognition also produces a transcript, not writing: no punctuation, no casing, no cleanup.",
    decision:
      "Split hearing and editing into two local models, then paste the result with the native Windows input API.",
    learned:
      "The second model is what makes it feel like writing instead of transcription.",
    evidence: [
      { value: "77/77", label: "tests across eight modules" },
      { value: "0", label: "cloud calls" },
      { value: "~1.2 GB", label: "on disk" },
      { value: "~2.5 GB", label: "RAM while running" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "Dictation is one of the few places where cloud AI still feels normal. You hold a key, speak, and a transcript appears. The convenience hides a simple trade: your voice goes to a server, the service costs money every month, and the text is only as private as the vendor's policy.",
          "The local alternatives usually stop at transcription. You get a wall of lowercase words with no punctuation. That is not how anyone writes, so you spend the time you saved fixing the output.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "I split the problem in two. One model hears. Qwen3-ASR turns the microphone buffer into raw text. A second model edits. Gemma, running on llama.cpp, restores punctuation, casing and paragraph breaks, and can rewrite a selection when you use command mode.",
          "The text is inserted with the Win32 SendInput API, so it lands in whatever app has focus: an editor, a browser, a chat window. No clipboard hijack, no browser extension, no account.",
        ],
        quote:
          "Hearing is a model problem. Writing is an editing problem. Trying to solve both with one model is why most local dictation feels raw.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The app is a small Windows tray application with a push-to-talk hotkey and a short recording buffer. Audio never leaves the process. The two models are loaded locally and released when idle so the machine is not held hostage between sessions.",
          "Command mode takes the current selection, sends it through the editor model with an instruction, and replaces it in place. That turns dictation into a small writing instrument rather than a microphone.",
        ],
        bullets: [
          "Qwen3-ASR for speech, Gemma on llama.cpp for cleanup",
          "Push-to-talk with a native Windows hotkey",
          "Text inserted through Win32 SendInput, not the clipboard",
          "Command mode rewrites the current selection in place",
          "Runs on Windows 10 and 11 with no network connection",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The project has 77 passing tests across eight modules, covering audio capture, model lifecycle, text cleanup, command mode and insertion. It uses about 1.2 GB of disk and about 2.5 GB of RAM while running. There are zero cloud calls in the application.",
          "The landing page is live. The application is MIT licensed and the models run entirely on the user's machine.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "The quality of a local AI product is often decided by the second model. The first model gets the words; the second makes them usable. That insight changed how I scope small-model systems: give each model a narrow job, then put a clean contract between them.",
          "It also taught me that privacy is a product feature, not a settings toggle. If the audio never leaves the machine, the promise is architectural, not a policy.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/susurrus-live.jpg",
        alt: "Susurrus, running locally on Windows.",
        caption: "Susurrus, running for real: two local models, one hears and one edits.",
        width: 1440,
        height: 900,
      },
      {
        src: "/images/work/susurrus-dictation.jpg",
        alt: "Susurrus dictation view.",
        caption: "Push-to-talk: hold the key, speak, release.",
        width: 900,
        height: 682,
      },
      {
        src: "/images/work/susurrus-context.jpg",
        alt: "Susurrus command mode view.",
        caption: "Command mode rewrites the current selection in place.",
        width: 900,
        height: 616,
      },
    ],
    next: "chumps-lab",
  },
  {
    slug: "chumps-lab",
    chapter: "03",
    title: "Chumps Lab Studio",
    subtitle: "An editor that edits with you.",
    kicker: "AI video editing for tutorials",
    status: "In progress",
    category: "local-ai",
    accent: "amber",
    year: "2026",
    role: "Design, engineering",
    stack: ["TypeScript", "React", "Remotion", "Python", "Local models"],
    metric: "26/26",
    metricLabel: "browser end-to-end checks",
    repo: "https://github.com/ParthVarekar/chumps-lab-studio",
    summary:
      "An AI video editor for screen-recording tutorials. It turns a raw recording into an edited video, then hands you a real editor and an assistant to change any of it.",
    problem:
      "Tutorial editing is repetitive: cut the pauses, zoom into the click, add a label, add a caption, add a sound. AI editors promise to do it for you, then hide every decision behind a black box.",
    decision:
      "The AI writes a typed Edit Decision Document, never code. Every AI change is a draft you can apply or discard.",
    learned:
      "The interface between AI and editor has to be inspectable. A typed document is that interface.",
    evidence: [
      { value: "26/26", label: "browser e2e checks" },
      { value: "EDD", label: "typed edit document" },
      { value: "−14", label: "LUFS render target" },
      { value: "Local", label: "models, no upload" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "A screen-recording tutorial is mostly repetition. The interesting part is the explanation; the rest is housekeeping: trim the dead air, push in on the click, label the menu, caption the sentence, add a transition. Doing it by hand takes hours and is easy to get wrong.",
          "The first generation of AI editors responded by taking over. You upload the footage, wait, and get a finished video you did not ask for. If a cut is wrong, you cannot see why, and you cannot fix the part you disagree with. That is not editing. It is a slot machine.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "I made the AI write a document instead of a video. The Edit Decision Document is a typed plan: clips, trims, zooms, labels, captions, sound effects and graphic elements, each with a time range and a reason. The renderer turns the document into video with Remotion.",
          "Because the document is typed, the editor can validate it, diff it and apply it. Every AI change arrives as a draft. You can accept a zoom and reject the caption. Edits you lock survive the next planning pass.",
        ],
        quote:
          "The AI should propose an edit, not perform one. A typed document makes that difference visible.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The editor is a React application with a Remotion timeline renderer. The assistant runs locally and produces the EDD. A Python service handles the heavier media analysis. The render path targets −14 LUFS, so the output is ready for the platforms people actually publish to.",
          "Animated graphic elements are generated from a safe spec rather than arbitrary code. That keeps the assistant inside a small, reviewable vocabulary and keeps the render deterministic.",
        ],
        bullets: [
          "Typed Edit Decision Document as the contract between AI and editor",
          "Remotion renderer with a real timeline and preview",
          "Local assistant that proposes edits as drafts",
          "Locked edits survive re-planning",
          "26 of 26 browser end-to-end checks passing",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The project has 26 passing browser end-to-end checks. The typed command layer, the draft/apply flow and the render pipeline are all exercised. The editor is usable today; the assistant is still being widened to more tutorial patterns.",
          "It is deliberately marked in progress. The hard part is not making a demo that edits one recording. It is making a system that stays predictable when the recording changes.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "The most useful thing I built is not the model integration. It is the document schema. Once the AI had a typed surface to write to, every other part of the system became easier: validation, undo, diffing, tests and the UI.",
          "That is the same lesson as H.A.L.O, in a different medium. Put the intelligence behind a contract you can inspect.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/chumps-editor.jpg",
        alt: "Chumps Lab Studio editor showing a video preview and a timeline of clips.",
        caption: "A real editor, not a render button.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/chumps-assistant.jpg",
        alt: "Chumps Lab Studio assistant panel proposing an edit as a draft.",
        caption: "The assistant proposes; the document records; you decide.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/chumps-effects.jpg",
        alt: "Chumps Lab Studio effects panel with labels, captions and animated graphic options.",
        caption: "Effects are generated from a safe, reviewable spec.",
        width: 1600,
        height: 900,
      },
    ],
    next: "bioradar",
  },
  {
    slug: "bioradar",
    chapter: "04",
    title: "BioRadar",
    subtitle: "From one litre of water.",
    kicker: "Biodiversity intelligence for Indian waters",
    status: "Complete",
    category: "bio",
    accent: "mint",
    year: "2026",
    role: "Team project · data, product, frontend",
    team: "Team SIH25042 · Ministry of Earth Sciences",
    stack: ["Python", "QIIME 2", "React", "Docker", "Merkle ledger"],
    metric: "80/80",
    metricLabel: "detections, zero false positives",
    repo: "https://github.com/omtawde09/BioRadar",
    summary:
      "Turns raw eDNA reads into a species list, an invasion forecast and a tamper-evident record, in English or Hindi. From one litre of water to a decision.",
    problem:
      "A water sample produces millions of short reads. A decision-maker needs a species list, a risk signal and a record they can trust, not a FASTA file.",
    decision:
      "Freeze the data contract, curate an India-specific COI reference, and make every result traceable through a Merkle ledger.",
    learned:
      "The hard part is not the pipeline. It is making the result trustworthy enough to act on.",
    evidence: [
      { value: "80/80", label: "detections at exact read counts" },
      { value: "0", label: "false positives" },
      { value: "76", label: "tests passing" },
      { value: "33,611", label: "sequences · 8,020 species" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "Environmental DNA lets you sample a river by filling a bottle. The lab does the rest: filter, amplify, sequence. The output is a pile of short reads and a bioinformatics pipeline that assumes you have a week and a PhD.",
          "A water authority does not need a pile of reads. It needs to know which species are present, which ones do not belong, and whether the result can be defended six months later. The gap between those two things is where most eDNA projects stop.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "We froze a data contract first. Every stage of the pipeline writes to the same schema, so the dashboard, the report and the tests all speak the same language. Then we curated a COI reference for Indian waters rather than relying on a global database that is unevenly sampled.",
          "Every result is written into a Merkle ledger. Change a record and the root changes. That gives a non-specialist a way to check integrity without trusting the person who produced the file.",
        ],
        quote:
          "A biodiversity result is only useful if someone can defend it later. The ledger is what makes that possible.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The pipeline uses QIIME 2 with DADA2 and vsearch, wrapped in Docker so the analysis is reproducible. A React dashboard presents the species list, the invasion-risk view and the evidence behind each call. Fourteen intelligence engines turn the output into readable signals rather than raw tables.",
          "The interface works in English and Hindi. The record is tamper-evident, and the whole run is packaged so a reviewer can follow a species from a read count to a claim.",
        ],
        bullets: [
          "QIIME 2 / DADA2 / vsearch pipeline in Docker",
          "India-curated COI reference with 8,020 species",
          "Merkle ledger for a tamper-evident result",
          "Fourteen intelligence engines, English and Hindi interface",
          "76 tests, including a mislabelled NCBI record caught by the checks",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The system detected 80 of 80 planted species at their exact read counts with zero false positives. It passed 76 tests. The reference covers 33,611 sequences across 8,020 species.",
          "During development the validation caught a mislabelled record in NCBI. That is the kind of error that quietly propagates through a biodiversity study, and exactly the kind of thing the ledger and the checks were built to expose.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "The science was the easy part to admire and the hard part to make legible. The real work was designing the contract between the pipeline and the person who has to make a decision with it.",
          "I also learned that trust is a feature you build, not a sentence you add to the report. The ledger, the frozen schema and the visible evidence all do the same job: they let someone check the machine without having to believe it.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/bioradar-estuary.jpg",
        alt: "Indian water body feeding the BioRadar pipeline.",
        caption: "The waters BioRadar is built for: one litre of water to a decision.",
        width: 1280,
        height: 719,
      },
      {
        src: "/images/work/bioradar-mandovi.jpg",
        alt: "Mandovi river reference image for the BioRadar pipeline.",
        caption: "Reference landscape from the Indian-water catalogue.",
        width: 1280,
        height: 640,
      },
      {
        src: "/images/work/bioradar-kolleru.jpg",
        alt: "Kolleru lake, a reference site for BioRadar.",
        caption: "Kolleru lake: one of the reference sites behind the pipeline.",
        width: 1280,
        height: 593,
      },
    ],
    next: "costa",
  },
  {
    slug: "costa",
    chapter: "05",
    title: "COSTA",
    subtitle: "It finds the beacon by how it blinks.",
    kicker: "Optical acquisition and tracking",
    status: "Complete",
    category: "optics",
    accent: "sky",
    year: "2026",
    role: "Team project · perception, tracking, interface",
    team: "Team SIH26169",
    stack: ["Python", "PySide6", "OpenCV", "NumPy", "Kalman filter"],
    metric: "28/28",
    metricLabel: "validation cases passing",
    repo: "https://github.com/ishwar-prog/COSTA",
    summary:
      "Coarse pointing, acquisition and tracking for a free-space optical link. It finds the partner terminal's beacon among stars, street lights and decoys by how it blinks, not how bright it is.",
    problem:
      "A laser link needs the beacon centred before data can flow. The sky is full of brighter lights, and the partner terminal does not control the sky.",
    decision:
      "Identify the beacon by its blink signature in the Fourier domain, then hold it with geometry and a Kalman tracker. No training data.",
    learned:
      "Brightness is the one thing the partner does not control. Rhythm is.",
    evidence: [
      { value: "28/28", label: "cases across six targets" },
      { value: "0.83–1.60 s", label: "acquisition time" },
      { value: "94–100%", label: "lock on real footage" },
      { value: "30 / 60 Hz", label: "vision / control loop" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "A free-space optical link is two terminals trying to hold a laser on each other. Before data can flow, the receiving terminal has to find the partner's beacon, centre it on a sensor, and keep it there while the mount moves and the air shimmers.",
          "The hard part is not finding a bright spot. It is finding the right bright spot. The frame also contains stars, street lights, reflections and deliberate decoys. The partner terminal cannot make its beacon the brightest thing in the sky, but it can make it blink in a pattern.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "We identify the beacon by its blink signature. A window of frames is transformed into the frequency domain; the modulation frequency and duty cycle become a fingerprint that survives brightness changes, motion blur and background clutter.",
          "Once the candidate is identified, geometry gives a coarse pointing estimate and a Kalman filter holds the track. The controller drives a pan/tilt gimbal at 60 Hz while vision runs at 30 Hz. There is no training dataset and no deep model in the loop.",
        ],
        quote:
          "Brightness is the one thing the partner does not control. Rhythm is. So we made rhythm the identity.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The application is a PySide6 desktop tool with a live camera view, a beacon-identity panel, an acquisition state machine and a tracking view. OpenCV handles capture and geometry; NumPy handles the Fourier analysis; the Kalman filter smooths the track between vision frames.",
          "The system has a deliberate acquisition sequence: scan, detect candidates, score blink signatures, lock the best candidate, hand over to the tracker. Every state is visible in the interface, so an operator can see why the system chose a target.",
        ],
        bullets: [
          "Blink-signature identification in the Fourier domain",
          "Geometry-based coarse pointing and a Kalman tracker",
          "30 Hz vision, 60 Hz control, pan/tilt gimbal",
          "No training data and no deep-learning dependency",
          "Live acquisition and tracking interface in PySide6",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "All 28 validation cases pass across six targets. Acquisition takes between 0.83 and 1.60 seconds, with a pointing error between 0.02 and 3.28 pixels. On real footage the system holds lock between 94% and 100% of the run.",
          "The results matter because they come from the difficult cases: moving backgrounds, decoys, variable exposure and real camera noise. The system was built to be tested against those conditions, not a clean synthetic frame.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "I learned to look for the invariant that the other side controls. In a noisy environment, brightness, colour and position all drift. A deliberate modulation pattern is a signal the partner owns.",
          "The second lesson was about interfaces. An operator will not trust an acquisition system that jumps to a lock without showing its reasoning. Making the candidate scores visible was as important as making the tracker accurate.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/costa-live.jpg",
        alt: "COSTA live tracking view showing a camera feed with a beacon lock and tracking overlay.",
        caption: "Live tracking: the beacon is identified by its blink signature, then held by the tracker.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/costa-analytics.jpg",
        alt: "COSTA analytics view showing acquisition time and pointing error across validation cases.",
        caption: "Validation across 28 cases and six targets.",
        width: 1600,
        height: 900,
      },
      {
        src: "/images/work/costa-architecture.png",
        alt: "COSTA architecture diagram showing camera, beacon identification, tracking and gimbal control.",
        caption: "Vision at 30 Hz, control at 60 Hz, with the tracker between them.",
        width: 1600,
        height: 900,
      },
    ],
    next: "roboforge",
  },
  {
    slug: "roboforge",
    chapter: "06",
    title: "RoboForge",
    subtitle: "Tell it, simulate it, test it against reality.",
    kicker: "A chat-first machine builder",
    status: "Archived",
    category: "robotics",
    accent: "ink",
    year: "2026",
    role: "Team project · systems, simulation, firmware",
    team: "Team Odyssey",
    stack: ["Python", "MuJoCo", "Webots", "ESP32", "RF-DETR"],
    metric: "900+",
    metricLabel: "tests without hardware",
    repo: "https://github.com/college-hack24-nov26/hack-odyssey",
    summary:
      "A chat-first machine builder: describe a rover, it designs it, simulates it, then checks the real one against the simulation and diagnoses the gap.",
    problem:
      "Simulation never matches the real machine. Motors differ, sensors drift, and the gap is usually discovered after something breaks.",
    decision:
      "Measure the reality gap with gyro data and treat it as information, not failure. Every result says what was not tested.",
    learned:
      "The gap between simulation and reality is data, not a failure.",
    evidence: [
      { value: "900+", label: "tests without Webots or hardware" },
      { value: "92%", label: "RF-DETR precision" },
      { value: "16/16", label: "planted defects found" },
      { value: "2", label: "simulators: MuJoCo + Webots" },
    ],
    sections: [
      {
        number: "01",
        title: "The problem",
        paragraphs: [
          "Building a robot is a chain of guesses. You choose motors, a chassis, a sensor package, then you simulate it and hope the real machine behaves the same way. It usually does not. The left motor is a few percent weaker, the gyro has a bias, the floor is not the floor in the simulator.",
          "Most toolchains treat that gap as a failure of the simulation. We treated it as the most useful measurement in the project.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "RoboForge is chat-first. You describe the machine you want; it produces a design, runs it in MuJoCo or Webots, and then compares the simulated behaviour with the real rover's gyro data. The difference becomes a trim, a calibration or a diagnosis.",
          "A deterministic router handles known jobs. The language model is used only for new jobs, where a plan actually needs to be invented. Every result carries a clear statement of what was not tested, so the system never pretends to more confidence than it has.",
        ],
        quote:
          "A simulation is a hypothesis. The real machine is the experiment. The gap is the result.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "The stack includes MuJoCo and Webots for simulation, an ESP32 and ESP32-CAM for the rover, and RF-DETR for vision. The test suite runs without Webots or hardware, which is why it can reach 900+ checks in ordinary CI.",
          "The rover loop is: plan, simulate, run the real machine, measure, trim, repeat. The interface shows the plan, the simulated trace, the measured trace and the diagnosis side by side.",
        ],
        bullets: [
          "MuJoCo and Webots simulation backends",
          "ESP32 firmware with an ESP32-CAM vision module",
          "RF-DETR at 92% precision and 85% recall",
          "Reality-gap engine driven by gyro measurements",
          "16 of 16 planted defects detected in the test rig",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The project has more than 900 tests that run without Webots or hardware. RF-DETR reaches 92% precision and 85% recall. The reality-gap engine found all 16 planted defects in the test rig.",
          "The repository is archived after the hackathon, and the README is honest about the last mile: first contact with the real rover is still pending. That honesty is part of the design.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "I learned to design for the gap instead of pretending it away. A system that can say 'this part is simulated, this part is measured, this part is unknown' is more useful than one that reports a single confident number.",
          "That is now a rule for me: every result should carry its own boundary.",
        ],
      },
    ],
    images: [
      {
        src: "/images/work/roboforge-banner.png",
        alt: "RoboForge banner showing the rover, the simulation and the reality-gap loop.",
        caption: "Describe a machine, simulate it, measure the gap against reality.",
        width: 1600,
        height: 440,
      },
    ],
    next: "client-work",
  },
  {
    slug: "client-work",
    chapter: "07",
    title: "Client Work",
    subtitle: "Real briefs, shipped.",
    kicker: "Three live builds at ProtoVinci",
    status: "Client",
    category: "client",
    accent: "lime",
    year: "2025–2026",
    role: "Built at ProtoVinci · design and engineering",
    team: "ProtoVinci",
    stack: ["Next.js", "React", "GSAP", "Tailwind", "HTML/CSS"],
    metric: "3",
    metricLabel: "live client sites",
    summary:
      "Three live client builds: an event décor studio, a motion-led marketing agency and a thrifted streetwear storefront. Different briefs, same discipline: make the work legible and make it ship.",
    problem:
      "A client site has to do a job: show the work, explain the offer, and make the next step obvious. It also has to survive real content, real devices and a real deadline.",
    decision:
      "Start from the client's strongest material, design around it, and keep the build small enough to finish properly.",
    learned:
      "Client work is where you learn to make the work legible to someone who is not in the room.",
    evidence: [
      { value: "3", label: "live client sites" },
      { value: "94", label: "tests on SocialxBrand Pilot" },
      { value: "18", label: "services on SocialxBrand" },
      { value: "100%", label: "responsive builds" },
    ],
    sections: [
      {
        number: "01",
        title: "The brief",
        paragraphs: [
          "Client work is a different kind of constraint. There is no freedom to invent the problem. The business already exists, the work already exists, and the site has to make both legible to someone who is deciding whether to get in touch.",
          "These three builds cover three different jobs: a celebration décor studio that sells craft and trust, a marketing agency that sells taste and motion, and a streetwear store that sells scarcity and culture.",
        ],
      },
      {
        number: "02",
        title: "The decision",
        paragraphs: [
          "In each case I started from the client's strongest material. For TheArtEvents that was the photography: the balloon arches, the themed stages, the detail. For SocialxBrand it was the reel footage and the voice of the founder. For Gully Culture it was the product photography and the Instagram-first buying ritual.",
          "The design follows the material. TheArtEvents is editorial and warm; SocialxBrand is kinetic and type-led; Gully Culture is a streetwear lookbook with a direct path to a DM.",
        ],
        quote:
          "A good client site does not show what the studio can do. It shows what the client does, in the best possible light.",
      },
      {
        number: "03",
        title: "The build",
        paragraphs: [
          "TheArtEvents is a fast HTML/CSS/JS site with a palette-led gallery, occasion filters and a direct enquiry path. SocialxBrand Pilot is a Next.js 16 and React 19 build with GSAP motion, a full services architecture and 94 passing tests. Gully Culture is a responsive storefront with category tiles and Instagram DM ordering.",
          "All three are live. All three are built to be edited by the people who own them, not just by the person who shipped them.",
        ],
        bullets: [
          "TheArtEvents: editorial gallery, occasion filters, enquiry flow",
          "SocialxBrand Pilot: Next.js 16, GSAP, 18 services, 94 tests",
          "Gully Culture: responsive storefront, category tiles, DM ordering",
          "All three shipped and live",
        ],
      },
      {
        number: "04",
        title: "The evidence",
        paragraphs: [
          "The three sites are live and linked below. SocialxBrand Pilot has 94 passing tests and a complete reduced-motion pass. TheArtEvents and Gully Culture are lightweight static builds designed to load quickly on a phone.",
          "The client tiles below open the real sites, so you can judge the work rather than the case study.",
        ],
      },
      {
        number: "05",
        title: "What I learned",
        paragraphs: [
          "Client work taught me to listen for the sentence the client keeps repeating. That sentence is usually the site. It also taught me that shipping is a design skill: the last 10% is where the work becomes real.",
          "The best compliment is not 'nice site'. It is 'I sent this to a customer and they enquired.'",
        ],
      },
    ],
    images: [],
    clients: [
      {
        name: "TheArtEvents",
        line: "Event décor & styling",
        description:
          "An editorial portfolio for a Mumbai celebration studio: themed stages, balloon architecture and a direct enquiry path.",
        url: "https://theartevents.vercel.app",
        image: "/images/work/client-theartevents.jpg",
        alt: "TheArtEvents website hero showing a Cars-themed birthday stage with balloon arches.",
        tags: ["HTML", "CSS", "JavaScript", "Editorial"],
      },
      {
        name: "SocialxBrand Pilot",
        line: "Digital marketing agency",
        description:
          "A motion-led site for an Indian agency: real client reels in the headline, 18 services and a Next.js 16 build with 94 tests.",
        url: "https://www.socialxbrandpilot.com",
        image: "/images/work/client-socialxbrand.jpg",
        alt: "SocialxBrand Pilot website hero with large kinetic typography and client reel imagery.",
        tags: ["Next.js 16", "GSAP", "Tailwind 4", "94 tests"],
      },
      {
        name: "Gully Culture",
        line: "Thrifted jerseys & streetwear",
        description:
          "A streetwear storefront for thrifted football jerseys and vintage pieces, with Instagram DM ordering and worldwide shipping.",
        url: "https://gullyculture.vercel.app/index.html",
        image: "/images/work/client-gullyculture.jpg",
        alt: "Gully Culture website hero with a Ronaldo jersey collage and large black display type.",
        tags: ["HTML", "CSS", "JavaScript", "Storefront"],
      },
    ],
  },
];

export const projectBySlug = (slug: string) => projects.find((project) => project.slug === slug);

export const categories: { value: ProjectCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "local-ai", label: "Local AI" },
  { value: "space", label: "Space" },
  { value: "bio", label: "Bio" },
  { value: "optics", label: "Optics" },
  { value: "robotics", label: "Robotics" },
  { value: "client", label: "Client" },
];

export const statusTone: Record<ProjectStatus, string> = {
  Complete: "status--complete",
  "In progress": "status--progress",
  Archived: "status--archived",
  Client: "status--client",
};
