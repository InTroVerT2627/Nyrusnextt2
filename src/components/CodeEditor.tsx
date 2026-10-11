"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Monaco as MonacoType } from "@monaco-editor/react";

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
  theme?: string;
};

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = "260px",
  theme = "proofloop-forest",
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defineForestTheme = useCallback((monaco: MonacoType) => {
    const forestThemeConfig = {
      base: "vs-dark" as const,
      inherit: true,
      rules: [
        { token: "", background: "0F3D2A", foreground: "FFFFFF" },
        { token: "comment", foreground: "9BC97A", fontStyle: "italic" },
        { token: "keyword", foreground: "DFF9A2", fontStyle: "bold" },
        { token: "string", foreground: "EFFCCF" },
        { token: "number", foreground: "F7FDE8" },
        { token: "identifier", foreground: "FFFFFF" },
        { token: "type", foreground: "DFF9A2" },
        { token: "delimiter", foreground: "BBE698" },
      ],
      colors: {
        "editor.background": "#0F3D2A",
        "editor.foreground": "#FFFFFF",
        "editorCursor.foreground": "#DFF9A2",
        "editor.lineHighlightBackground": "#154D36",
        "editorLineNumber.foreground": "#31945E",
        "editorLineNumber.activeForeground": "#DFF9A2",
        "editor.selectionBackground": "#1D5C40",
        "editor.inactiveSelectionBackground": "#144630",
        "editorGutter.background": "#0F3D2A",
      },
    };
    monaco.editor.defineTheme("proofloop-forest", forestThemeConfig);
    monaco.editor.defineTheme("proofloop-midnight", forestThemeConfig);
  }, []);

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
        theme={theme}
        beforeMount={defineForestTheme}
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
          fontFamily: "var(--font-mono)",
        }}
      />
    </div>
  );
}
