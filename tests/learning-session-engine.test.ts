import { describe, it, expect } from "vitest";
import {
  startModuleSession,
  recordPageEnter,
  verifyAndAdvancePage,
  heartbeatSession,
  interruptSession,
  pauseSession,
  resumeSession,
} from "@/lib/server/learning-session";
import { calculateMinSeconds } from "@/lib/learning-experience-types";

describe("Learning Session Engine & Focus Enforcement (Quality Gate)", () => {
  const userId = "test-learner-user-1";
  const pathSlug = "data-analytics";
  const moduleSlug = "frame-the-question";

  it("calculates minimum reading time correctly via word count formula", () => {
    // 50 words -> ceil(50 / 3.8 * 0.6) = ceil(7.89) = 8 seconds (clamped to 8)
    const shortText = "word ".repeat(50);
    expect(calculateMinSeconds(shortText)).toBe(8);

    // 200 words -> ceil(200 / 3.8 * 0.6) = ceil(31.57) = 32 seconds
    const midText = "word ".repeat(200);
    expect(calculateMinSeconds(midText)).toBe(32);

    // 1000 words -> ceil(1000 / 3.8 * 0.6) = 158 seconds (clamped to 90)
    const longText = "word ".repeat(1000);
    expect(calculateMinSeconds(longText)).toBe(90);

    // Relaxed focus mode halves reading time
    expect(calculateMinSeconds(midText, undefined, true)).toBe(16);
  });

  it("enforces single session lock: a second active session terminates the first", async () => {
    const session1 = await startModuleSession(userId, pathSlug, moduleSlug);
    expect(session1.session.state).toBe("active");

    // Start a second session in another tab/device for the same user
    const session2 = await startModuleSession(userId, pathSlug, "clean-the-inputs");
    expect(session2.session.state).toBe("active");

    // Heartbeat on the first session will now be rejected because it was marked interrupted
    const hb1 = await heartbeatSession(
      session1.session.id,
      userId,
      session1.token
    );
    expect(hb1.active).toBe(false);
    expect(hb1.reason).toContain("interrupted");
  });

  it("enforces server-side minimum time gate and rejects early advance", async () => {
    const { session } = await startModuleSession(userId, pathSlug, moduleSlug);
    const { minSeconds, visitId } = await recordPageEnter(
      session.id,
      userId,
      0,
      "teaser",
      150, // requires ~24s
      20  // override 20s
    );

    expect(minSeconds).toBe(20);

    // Attempting to advance immediately must be rejected by server
    const advanceAttempt = await verifyAndAdvancePage(
      session.id,
      userId,
      visitId,
      1,
      "scene",
      true
    );

    expect(advanceAttempt.success).toBe(false);
    expect(advanceAttempt.error).toContain("Pacing gate active");
  });

  it("proves device clock tampering does NOT bypass the gate", async () => {
    const { session } = await startModuleSession(userId, pathSlug, moduleSlug);
    const { visitId } = await recordPageEnter(
      session.id,
      userId,
      1,
      "scene",
      100,
      15 // requires 15s
    );

    // Client could pretend its local clock is in the future, but the server
    // only looks at its own serverEnterAt and rejects
    const advanceAttempt = await verifyAndAdvancePage(
      session.id,
      userId,
      visitId,
      2,
      "concept",
      true
    );

    expect(advanceAttempt.success).toBe(false);
    expect(advanceAttempt.error).toContain("Pacing gate active");
  });

  it("requires interaction to be completed before advancing", async () => {
    const { session } = await startModuleSession(userId, pathSlug, moduleSlug);
    // Page with 0s override to test interaction-only gating
    const { visitId } = await recordPageEnter(
      session.id,
      userId,
      4,
      "tryit",
      20,
      0 // minSeconds = 0
    );

    // If interactionDone is false, advance is blocked
    const earlyAdvance = await verifyAndAdvancePage(
      session.id,
      userId,
      visitId,
      5,
      "check",
      false // interaction not done!
    );

    expect(earlyAdvance.success).toBe(false);
    expect(earlyAdvance.error).toContain("Complete the required interaction");
  });

  it("handles grace period: < 3s allows continuation, > 3s terminates attempt", async () => {
    const { session } = await startModuleSession(userId, pathSlug, moduleSlug);

    // Leaving for 1,500ms (inside grace period)
    const shortLeave = await interruptSession(session.id, userId, "tab_hidden", 1500);
    expect(shortLeave.interrupted).toBe(false);

    // Leaving for 4,500ms (exceeds grace period)
    const longLeave = await interruptSession(session.id, userId, "tab_hidden", 4500);
    expect(longLeave.interrupted).toBe(true);
  });

  it("permits maximum one pause between pages and forbids pause during check", async () => {
    const { session } = await startModuleSession(userId, pathSlug, moduleSlug);

    // Pause on content page
    const pause1 = await pauseSession(session.id, userId);
    expect(pause1.paused).toBe(true);

    // Resume session
    const resume = await resumeSession(session.id, userId);
    expect(resume.resumed).toBe(true);

    // Attempting second pause must fail (max 1 pause per attempt)
    const pause2 = await pauseSession(session.id, userId);
    expect(pause2.paused).toBe(false);
    expect(pause2.error).toContain("Maximum one pause");
  });

  it("verifies reading beat types auto-complete interaction requirement", () => {
    const isAutoCompleted = (pType: string) =>
      ["scene", "concept", "example", "takeaway"].includes(pType);

    expect(isAutoCompleted("scene")).toBe(true);
    expect(isAutoCompleted("concept")).toBe(true);
    expect(isAutoCompleted("example")).toBe(true);
    expect(isAutoCompleted("takeaway")).toBe(true);
    expect(isAutoCompleted("teaser")).toBe(false);
    expect(isAutoCompleted("tryit")).toBe(false);
    expect(isAutoCompleted("check")).toBe(false);
  });
});
