"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="editor-loading-placeholder">
      <div className="spinner" />
      <span>Loading Monaco Code Editor…</span>
    </div>
  ),
});

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
  minHeight?: string;
  theme?: "vs-dark" | "light";
};

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = "260px",
  theme,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"vs-dark" | "light">("vs-dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const docTheme = document.documentElement.getAttribute("data-theme");
    setCurrentTheme(theme || (docTheme === "light" ? "light" : "vs-dark"));

    const observer = new MutationObserver(() => {
      const updated = document.documentElement.getAttribute("data-theme");
      setCurrentTheme(theme || (updated === "light" ? "light" : "vs-dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [theme]);

  const monacoLang = language.toLowerCase() === "java" ? "java" : "javascript";

  if (!mounted) {
    return (
      <textarea
        className="code-editor-fallback"
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        aria-label="Code editor"
      />
    );
  }

  return (
    <div className="monaco-wrapper" style={{ minHeight }}>
      <Monaco
        height={minHeight}
        language={monacoLang}
        theme={currentTheme}
        value={value}
        onChange={(val) => onChange(val || "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          lineDecorationsWidth: 6,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 10, bottom: 10 },
        }}
      />
    </div>
  );
}
