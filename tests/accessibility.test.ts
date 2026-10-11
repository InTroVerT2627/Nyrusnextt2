import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Accessibility & WCAG AA Compliance (Quality Gate: Accessibility Check)", () => {
  it("enforces color contrast tokens meeting WCAG AA requirements (≥ 4.5:1)", () => {
    // Relative luminance calculator (WCAG standard)
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const getContrastRatio = (lum1: number, lum2: number) => {
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    // Dark Mode / Sidebar: bg Forest #0F3D2A (15, 61, 42), text On-Forest #DFF9A2 (223, 249, 162)
    const bgDarkLum = getLuminance(15, 61, 42);
    const textDarkLum = getLuminance(223, 249, 162);
    const darkContrast = getContrastRatio(bgDarkLum, textDarkLum);
    expect(darkContrast).toBeGreaterThan(4.5); // 10.58:1 exceeds WCAG AA

    // Lightened Dark Canvas Mode: bg Page-Dark #1E6B47 (30, 107, 71), text White (255, 255, 255)
    const bgPageDarkLum = getLuminance(30, 107, 71);
    const whiteLum = getLuminance(255, 255, 255);
    const pageDarkWhiteContrast = getContrastRatio(bgPageDarkLum, whiteLum);
    expect(pageDarkWhiteContrast).toBeGreaterThan(4.5); // 6.46:1 exceeds WCAG AA

    // Secondary text on Page-Dark: text On-Dark-Soft #E3F0E8 (227, 240, 232)
    const onDarkSoftLum = getLuminance(227, 240, 232);
    const pageDarkSoftContrast = getContrastRatio(bgPageDarkLum, onDarkSoftLum);
    expect(pageDarkSoftContrast).toBeGreaterThan(4.5); // 5.51:1 exceeds WCAG AA

    // Header-Dark #17573A (23, 87, 58) with White text
    const headerDarkLum = getLuminance(23, 87, 58);
    const headerDarkWhiteContrast = getContrastRatio(headerDarkLum, whiteLum);
    expect(headerDarkWhiteContrast).toBeGreaterThan(4.5); // 8.53:1 exceeds WCAG AA

    // Mint Canvas Mode: bg Mint #3EC17B (62, 193, 123), text Ink #13261C (19, 38, 28)
    const bgLightLum = getLuminance(62, 193, 123);
    const textLightLum = getLuminance(19, 38, 28);
    const lightContrast = getContrastRatio(bgLightLum, textLightLum);
    expect(lightContrast).toBeGreaterThan(4.5); // 6.90:1 exceeds WCAG AA

    // Prohibit white text on mint (luminance contrast is only 2.3:1)
    const whiteOnMint = getContrastRatio(getLuminance(255, 255, 255), bgLightLum);
    expect(whiteOnMint).toBeLessThan(4.5);
  });

  it("verifies styles include visible focus rings and prefers-reduced-motion media query", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    // Must define visible focus ring
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline");

    // Must define prefers-reduced-motion
    expect(css).toContain("prefers-reduced-motion");
  });

  it("enforces states are conveyed through text + icons, never color alone", () => {
    // Audit RemoteHome.tsx TreeView rendering
    const sourcePath = path.resolve(process.cwd(), "src/app/RemoteHome.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    // TreeView must render icon + textual state label
    expect(source).toContain('state === "Evidenced" ? <CheckIcon');
    expect(source).toContain('state === "Locked" ? <LockIcon');
    expect(source).toContain('<span className="state-label">');
  });

  it("verifies the Mint & Lime design tokens are declared in globals.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    const tokens = [
      "--mint",
      "--mint-deep",
      "--lime",
      "--lime-light",
      "--lime-mid",
      "--paper",
      "--white",
      "--forest",
      "--page-dark",
      "--header-dark",
      "--forest-deep",
      "--ink",
      "--ink-soft",
      "--muted",
      "--on-forest",
      "--on-dark",
      "--on-dark-soft",
      "--success",
      "--warning",
      "--error",
      "--info",
      "--accent-debug",
      "--tint-debug",
      "--accent-data",
      "--tint-data",
      "--accent-biz",
      "--tint-biz",
      "--accent-comm",
      "--tint-comm",
    ];

    for (const token of tokens) {
      expect(css).toContain(token);
    }
  });

  it("verifies absence of gamification pressure patterns (XP, streaks, countdown timers)", () => {
    const sourcePath = path.resolve(process.cwd(), "src/app/RemoteHome.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    // Must not have XP, streaks, or leaderboards
    expect(source.toLowerCase()).not.toContain("leaderboard");
    expect(source.toLowerCase()).not.toContain("streak count");
    expect(source.toLowerCase()).not.toContain("+100 xp");
    expect(source.toLowerCase()).not.toContain("countdown timer");
  });

  it("verifies learning reading ring uses accessible progressbar semantics and calm pacing", () => {
    const ringSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/learning/ReadingRing.tsx"),
      "utf8"
    );

    // ReadingRing must use standard progressbar ARIA attributes
    expect(ringSource).toContain('role="progressbar"');
    expect(ringSource).toContain('aria-valuenow');
    expect(ringSource).toContain('aria-valuemin');
    expect(ringSource).toContain('aria-valuemax');
    expect(ringSource).toContain('aria-label');
  });

  it("verifies journey map conveys states with icons and text labels", () => {
    const journeySource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/learning/JourneyMap.tsx"),
      "utf8"
    );

    expect(journeySource).toContain("CheckCircle2");
    expect(journeySource).toContain("PlayCircle");
    expect(journeySource).toContain("Lock");
    expect(journeySource).toContain("Passed");
    expect(journeySource).toContain("Ready");
    expect(journeySource).toContain("Locked");
  });
});

