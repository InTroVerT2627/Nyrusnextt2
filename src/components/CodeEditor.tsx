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
  theme = "proofloop-midnight",
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defineMidnightTheme = useCallback((monaco: MonacoType) => {
    monaco.editor.defineTheme("proofloop-midnight", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", background: "142D4E", foreground: "EAF6FC" },
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "06C6E6", fontStyle: "bold" },
        { token: "string", foreground: "059669" },
        { token: "number", foreground: "D97706" },
        { token: "identifier", foreground: "EAF6FC" },
        { token: "type", foreground: "06C6E6" },
        { token: "delimiter", foreground: "D9E8F3" },
      ],
      colors: {
        "editor.background": "#142D4E",
        "editor.foreground": "#EAF6FC",
        "editorCursor.foreground": "#06C6E6",
        "editor.lineHighlightBackground": "#1B3A63",
        "editorLineNumber.foreground": "#64748B",
        "editorLineNumber.activeForeground": "#06C6E6",
        "editor.selectionBackground": "#1E477A",
        "editor.inactiveSelectionBackground": "#17375E",
        "editorGutter.background": "#142D4E",
      },
    });
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
        beforeMount={defineMidnightTheme}
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
