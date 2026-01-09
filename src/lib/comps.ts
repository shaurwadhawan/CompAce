// src/lib/comps.ts
export type TrackKey = "Coding" | "Econ" | "MUN" | "Olympiad" | "Math" | "Science";
export type Mode = "Online" | "In-person";
export type Region = "Local" | "International";

export type Comp = {
  id: string;
  title: string;
  track: TrackKey;
  mode: Mode;
  region: Region;

  // quick list fields
  level: string;
  deadline: string;

  // for sorting (optional; ISO date string "YYYY-MM-DD")
  // leave "" for rolling/variable deadlines
  deadlineSort?: string;

  verifiedSource?: boolean;
  isFeatured?: boolean;

  // details page fields (real info, no placeholders)
  description: string;
  format: string;
  eligibility: string;
  howToApply: string;

  tags: string[];
  applyUrl: string;
  officialUrl: string;
};

export const allComps: Comp[] = [
  {
    id: "usaco",
    title: "USA Computing Olympiad (USACO)",
    track: "Coding",
    mode: "Online",
    region: "International",
    level: "Bronze → Platinum (multiple divisions)",
    deadline: "Seasonal contests (multiple dates)",
    deadlineSort: "",

    description:
      "A well-known competitive programming pathway with official training pages and seasonal online contests. Students compete in divisions (Bronze/Silver/Gold/Platinum) and can train using the official problem archive.",
    format:
      "Online algorithmic contests + official training/problem archive with solutions and submissions (when logged in).",
    eligibility:
      "Student competitors (commonly middle/high school). You create an account to access/submit solutions and participate.",
    howToApply:
      "Create a USACO account, then follow the contests/training pages to participate and practice.",
    tags: [
      "Competitive programming",
      "Algorithms",
      "C++/Java/Python",
      "Multiple divisions",
    ],
    applyUrl: "https://usaco.org/index.php?page=register",
    officialUrl: "https://usaco.org/index.php?page=contests",
  },
  {
    id: "ieo",
    title: "International Economics Olympiad (IEO)",
    track: "Econ",
    mode: "In-person",
    region: "International",
    level: "High school / national team selection (varies by country)",
    deadline: "Depends on your country’s selection process",
    deadlineSort: "",

    description:
      "A global economics competition typically reached via national selections. It combines economics knowledge with problem-solving; your country usually runs a selection process to form a team for the international round.",
    format:
      "National selection (varies) → international round with multiple components depending on official regulations.",
    eligibility:
      "High-school level; exact eligibility and selection rules depend on your national organiser.",
    howToApply:
      "Find your country’s national organiser and follow the national selection/registration steps described in official regulations.",
    tags: ["Economics", "National selection", "International finals", "Academic olympiad"],
    applyUrl: "https://ieo-official.org/statute",
    officialUrl: "https://ieo-official.org/",
  },
  {
    id: "harvardmun",
    title: "Harvard Model United Nations (HMUN)",
    track: "MUN",
    mode: "In-person",
    region: "International",
    level: "All levels (school delegations)",
    deadline: "Registration / application windows vary by session",
    deadlineSort: "",

    description:
      "A major high-school Model UN conference run by Harvard students. Schools apply as delegations and then prepare delegates for committees and debate.",
    format:
      "In-person conference with committees, debate, resolutions, and delegate preparation through a school delegation.",
    eligibility:
      "High-school delegates via a school delegation (your school applies; you attend as part of the delegation).",
    howToApply:
      "Your school (delegation) follows the official application process and uses the delegation portal if accepted.",
    tags: ["Model UN", "Debate", "Delegation", "International conference"],
    applyUrl: "https://www.harvardmun.org/application-process",
    officialUrl: "https://www.harvardmun.org/",
  },
  {
    id: "amc10",
    title: "AMC 10 (American Mathematics Competitions)",
    track: "Olympiad",
    mode: "In-person",
    region: "International",
    level: "Upper middle / high school (AMC 10 level)",
    deadline: "Annual (set test dates each year)",
    deadlineSort: "",

    description:
      "A widely taken mathematics contest that many students use as an entry point into higher levels of math competitions. Typically administered through schools/approved institutions using the official contest system.",
    format:
      "Timed multiple-choice math contest administered through an approved school/host using the official competition system.",
    eligibility:
      "Eligibility depends on AMC rules for the year and your host school/site. Many students take it via their school.",
    howToApply:
      "Register via a participating school/approved host and follow the official competition system instructions.",
    tags: ["Math contest", "Entry olympiad pathway", "School-hosted", "Annual"],
    applyUrl: "https://www.maa.org/",
    officialUrl: "https://www.maa.org/",
  },
];
