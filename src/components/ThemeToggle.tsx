"use client";

import React, { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/Icons";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const saved = localStorage.getItem("nextlearn.theme") as "dark" | "light" | null;
    const initial = saved || "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nextlearn.theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
