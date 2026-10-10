import { LearningQuestion } from "@/lib/learning-paths";

export type PageType =
  | "teaser"
  | "scene"
  | "concept"
  | "example"
  | "tryit"
  | "check"
  | "takeaway";

export type TeaserFormat = "choice" | "think_first" | "what_would_you_do";

export type TeaserContent = {
  prompt: string;
  format: TeaserFormat;
  options?: string[];
  revealReaction: string;
  realTopic: string;
};

export type SceneDecision = {
  prompt: string;
  choices: {
    id: string;
    label: string;
    consequence: string;
  }[];
};

export type StorySceneContent = {
  sceneNumber: number;
  character: string;
  characterRole: string;
  setting: string;
  narrative: string;
  dialogue?: { speaker: string; text: string }[];
  visualMood: "focused" | "urgent" | "pensive" | "triumphant";
  sceneObjects: string[];
  decisionBranch?: SceneDecision;
};

export type GlossaryTooltip = {
  term: string;
  definition: string;
};

export type ConceptContent = {
  title: string;
  chunks: string[]; // 80-120 words per chunk
  glossaryTooltips: GlossaryTooltip[];
};

export type ExampleStep = {
  stepNumber: number;
  title: string;
  explanation: string;
  calculationOrCode?: string;
};

export type WorkedExampleContent = {
  title: string;
  problem: string;
  context: string;
  steps: ExampleStep[];
  comparisonTable?: {
    headers: string[];
    rows: string[][];
  };
  communicationDiff?: {
    weak: string;
    improved: string;
    annotations: string[];
  };
};

export type TryItChoice = {
  id: string;
  label: string;
  isCorrect?: boolean;
  feedback: string;
};

export type TryItContent = {
  taskType: "predict_output" | "fix_error" | "choose_justify" | "rewrite_sentence";
  prompt: string;
  starterContext: string;
  choices?: TryItChoice[];
  expectedGuidance: string;
  reasoningExplanation: string;
  explainItBackPrompt: string;
};

export type KnowledgeCheckContent = {
  questions: LearningQuestion[];
};

export type TakeawayContent = {
  summaryLines: string[];
  reflectionPrompt: string;
};

export type PageContentMap = {
  teaser: TeaserContent;
  scene: StorySceneContent;
  concept: ConceptContent;
  example: WorkedExampleContent;
  tryit: TryItContent;
  check: KnowledgeCheckContent;
  takeaway: TakeawayContent;
};

export type ModulePage<T extends PageType = PageType> = {
  id: string;
  pageType: T;
  order: number;
  minSecondsOverride?: number;
  content: PageContentMap[T];
};

export type FullModule = {
  slug: string;
  title: string;
  pathSlug: "data-analytics" | "business-analytics" | "communication";
  order: number;
  storyArcId: string;
  storyArcTitle: string;
  estimatedMinutes: number;
  status: "draft_needs_review";
  pages: [
    ModulePage<"teaser">,
    ModulePage<"scene">,
    ModulePage<"concept">,
    ModulePage<"example">,
    ModulePage<"tryit">,
    ModulePage<"check">,
    ModulePage<"takeaway">
  ];
};

export type ModuleSessionState = "active" | "paused" | "interrupted" | "completed";

export type ModuleSession = {
  id: string;
  userId: string;
  pathSlug: string;
  moduleSlug: string;
  state: ModuleSessionState;
  currentPageType: PageType;
  currentPageIndex: number;
  pausesUsed: number;
  relaxedMode: boolean;
  interruptReason?: string | null;
  sessionToken: string;
  lastHeartbeatAt: string;
  startedAt: string;
  endedAt?: string | null;
};

export type ReflectionEvaluation = {
  isGenuine: boolean;
  similarityToLesson: number; // 0 to 1
  understandingLevel: "Needs another look" | "Getting there" | "Solid";
  strength: string;
  gap: string;
  suggestedSectionToRevisit: {
    title: string;
    slug: string;
  };
  coachingFeedback: string;
};

export type LearnerReflection = {
  id: string;
  userId: string;
  pathSlug: string;
  afterModule: 3 | 6 | 9 | 10;
  reflectionText: string;
  aiFeedback: ReflectionEvaluation;
  status: "submitted" | "skipped";
  createdAt: string;
};

/**
 * Calculates minimum reading time in seconds based on text length.
 * Default formula: clamp(ceil(words / 3.8 * 0.6), 8, 90)
 */
export function calculateMinSeconds(text: string, override?: number, relaxedMode = false): number {
  if (override !== undefined && override > 0) {
    return relaxedMode ? Math.max(4, Math.floor(override * 0.5)) : override;
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const raw = Math.ceil((words / 3.8) * 0.6);
  const clamped = Math.min(90, Math.max(8, raw));
  return relaxedMode ? Math.max(4, Math.floor(clamped * 0.5)) : clamped;
}
