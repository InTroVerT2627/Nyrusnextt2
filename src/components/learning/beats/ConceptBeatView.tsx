"use client";

import React, { useState } from "react";
import { ConceptContent, GlossaryTooltip } from "@/lib/learning-experience-types";
import { BookOpen, Info, X } from "lucide-react";

type ConceptBeatViewProps = {
  content: ConceptContent;
};

export default function ConceptBeatView({ content }: ConceptBeatViewProps) {
  const [activeTooltip, setActiveTooltip] = useState<GlossaryTooltip | null>(null);

  // Helper to highlight glossary terms inside chunks
  const renderChunkWithGlossary = (chunk: string) => {
    return (
      <p className="concept-prose-chunk">
        {content.glossaryTooltips.reduce((nodes: (string | React.ReactNode)[], item) => {
          const newNodes: (string | React.ReactNode)[] = [];
          nodes.forEach((node) => {
            if (typeof node !== "string") {
              newNodes.push(node);
              return;
            }
            const parts = node.split(new RegExp(`(${item.term})`, "gi"));
            parts.forEach((part, idx) => {
              if (part.toLowerCase() === item.term.toLowerCase()) {
                newNodes.push(
                  <button
                    key={`${item.term}-${idx}`}
                    className="glossary-term-trigger"
                    onClick={() => setActiveTooltip(item)}
                    title={`Click to view definition of ${item.term}`}
                    aria-label={`Definition: ${item.term}`}
                  >
                    <span>{part}</span>
                    <Info size={11} className="term-info-icon" />
                  </button>
                );
              } else if (part) {
                newNodes.push(part);
              }
            });
          });
          return newNodes;
        }, [renderedText])}
      </p>
    );
  };

  return (
    <div className="concept-beat-layout">
      <div className="concept-hero-badge">
        <BookOpen size={16} />
        <span>CORE CONCEPT · BITE-SIZED PRINCIPLES</span>
      </div>

      <h2 className="concept-main-title">{content.title}</h2>

      {/* Concept Chunks (80–120 words per chunk) */}
      <div className="concept-chunks-stack">
        {content.chunks.map((chunk, idx) => (
          <div className="concept-chunk-card" key={idx}>
            <span className="chunk-num-badge">0{idx + 1}</span>
            <div className="chunk-body">{renderChunkWithGlossary(chunk)}</div>
          </div>
        ))}
      </div>

      {/* Glossary Reference Tray */}
      {content.glossaryTooltips && content.glossaryTooltips.length > 0 && (
        <div className="glossary-reference-tray">
          <div className="tray-header">
            <Info size={14} />
            <span>Interactive Glossary Terms (Click term to inspect):</span>
          </div>
          <div className="glossary-pills-row">
            {content.glossaryTooltips.map((item) => (
              <button
                key={item.term}
                className={`glossary-pill-btn ${activeTooltip?.term === item.term ? "active" : ""}`}
                onClick={() => setActiveTooltip(item)}
              >
                <strong>{item.term}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Definition Card */}
      {activeTooltip && (
        <div className="glossary-popover-card" role="region" aria-label="Term definition">
          <div className="popover-top">
            <strong>{activeTooltip.term}</strong>
            <button
              className="popover-close-btn"
              onClick={() => setActiveTooltip(null)}
              aria-label="Close definition"
            >
              <X size={14} />
            </button>
          </div>
          <p className="popover-def">{activeTooltip.definition}</p>
        </div>
      )}
    </div>
  );
}
