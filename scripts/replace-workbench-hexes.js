const fs = require("fs");
const path = require("path");

const files = [
  "src/components/DebuggingWorkbench.tsx",
  "src/components/DsaWorkbench.tsx",
  "src/components/learning/beats/TakeawayBeatView.tsx",
  "src/components/learning/beats/TryItBeatView.tsx",
  "src/components/learning/DeviceCheckModal.tsx",
  "src/components/learning/FinalTestShell.tsx",
  "src/components/learning/GlobalNotebookModal.tsx",
  "src/components/learning/HintConfirmationModal.tsx",
  "src/components/learning/JourneyMap.tsx",
  "src/components/learning/MyReflectionsDrawer.tsx",
  "src/components/learning/ReflectionCheckpointView.tsx",
  "src/components/learning/StorySceneSvg.tsx",
  "src/components/learning/TestFollowupView.tsx",
  "src/components/learning/TestQuestionView.tsx",
  "src/components/learning/TestResultView.tsx",
];

for (const rel of files) {
  const filePath = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(filePath)) continue;
  let code = fs.readFileSync(filePath, "utf8");

  code = code.replace(/#142D4E/gi, "var(--forest)");
  code = code.replace(/#06C6E6/gi, "var(--forest)");
  code = code.replace(/#EAF6FC/gi, "var(--lime-light)");
  code = code.replace(/#334155/gi, "var(--ink-soft)");
  code = code.replace(/#64748B/gi, "var(--muted)");
  code = code.replace(/#D9E8F3/gi, "var(--mint-deep)");
  code = code.replace(/#0c1d33/gi, "var(--forest)");
  code = code.replace(/#0d1b2a/gi, "var(--forest)");

  fs.writeFileSync(filePath, code, "utf8");
  console.log(`Updated ${rel}`);
}
