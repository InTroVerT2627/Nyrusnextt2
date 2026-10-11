const fs = require("fs");
const path = require("path");

const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
let css = fs.readFileSync(cssPath, "utf8");

// Replace midnight
css = css.replace(/color:\s*var\(--midnight\)/g, "color: var(--ink)");
css = css.replace(/background:\s*var\(--midnight\)/g, "background: var(--forest)");
css = css.replace(/background-color:\s*var\(--midnight\)/g, "background-color: var(--forest)");
css = css.replace(/border-color:\s*var\(--midnight\)/g, "border-color: var(--forest)");
css = css.replace(/border:\s*1px solid var\(--midnight\)/g, "border: 1.5px solid var(--forest)");
css = css.replace(/var\(--midnight\)/g, "var(--ink)");

// Replace cyan
css = css.replace(/color:\s*var\(--cyan\)/g, "color: var(--forest)");
css = css.replace(/background:\s*var\(--cyan\)/g, "background: var(--lime)");
css = css.replace(/background-color:\s*var\(--cyan\)/g, "background-color: var(--lime)");
css = css.replace(/border-color:\s*var\(--cyan\)/g, "border-color: var(--mint-deep)");
css = css.replace(/var\(--cyan\)/g, "var(--forest)");

// Replace ice
css = css.replace(/var\(--ice-tint\)/g, "var(--paper)");
css = css.replace(/var\(--ice\)/g, "var(--lime-light)");

// Replace hardcoded hexes
css = css.replace(/#142D4E/gi, "var(--forest)");
css = css.replace(/#06C6E6/gi, "var(--forest)");
css = css.replace(/#EAF6FC/gi, "var(--lime-light)");
css = css.replace(/#334155/gi, "var(--ink-soft)");
css = css.replace(/#64748B/gi, "var(--muted)");
css = css.replace(/#D9E8F3/gi, "var(--mint-deep)");

fs.writeFileSync(cssPath, css, "utf8");
console.log("Updated globals.css successfully!");
