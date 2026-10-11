const { execSync } = require("child_process");
const path = require("path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const screenshotDir = "C:\\Users\\musai\\.gemini\\antigravity\\brain\\b2b15033-7816-405d-8c51-31102ff541c7\\screenshots";

const tasks = [
  { name: "after_learning_paths_360.png", url: "http://localhost:3000/learning", width: 360, height: 800 },
  { name: "after_learning_paths_1440.png", url: "http://localhost:3000/learning", width: 1440, height: 900 },
  { name: "after_learner_home_360.png", url: "http://localhost:3000/?role=learner", width: 360, height: 800 },
  { name: "after_learner_home_1440.png", url: "http://localhost:3000/?role=learner", width: 1440, height: 900 },
  { name: "after_story_panel_360.png", url: "http://localhost:3000/learning?immersive=1&intro=0", width: 360, height: 800 },
  { name: "after_story_panel_1440.png", url: "http://localhost:3000/learning?immersive=1&intro=0", width: 1440, height: 900 },
  { name: "after_coding_workspace_360.png", url: "http://localhost:3000/?role=learner&section=Missions", width: 360, height: 800 },
  { name: "after_coding_workspace_1440.png", url: "http://localhost:3000/?role=learner&section=Missions", width: 1440, height: 900 },
  { name: "after_recruiter_dashboard_360.png", url: "http://localhost:3000/?role=recruiter", width: 360, height: 800 },
  { name: "after_recruiter_dashboard_1440.png", url: "http://localhost:3000/?role=recruiter", width: 1440, height: 900 },
];

for (const task of tasks) {
  const dest = path.join(screenshotDir, task.name);
  console.log(`Capturing ${task.name} (${task.width}x${task.height}) from ${task.url}...`);
  const cmd = `"${edgePath}" --headless=new --disable-gpu --virtual-time-budget=6000 "--screenshot=${dest}" "--window-size=${task.width},${task.height}" "${task.url}"`;
  try {
    execSync(cmd, { stdio: "ignore" });
    console.log(`Saved ${task.name}`);
  } catch (err) {
    console.error(`Error capturing ${task.name}:`, err.message);
  }
}
console.log("All screenshots captured successfully.");
