"use client";

import React from "react";
import Link from "next/link";
import FairnessLabView from "@/components/FairnessLabView";
import { ArrowLeft } from "lucide-react";

export default function FairnessPage() {
  return (
    <div className="fairness-page-shell">
      <header className="fairness-page-topbar">
        <Link href="/" className="back-to-home-link">
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </Link>
        <div className="topbar-crumb">
          NextLearn <span>/</span> Reviewer Lab <span>/</span> Fairness & Language Consistency
        </div>
      </header>

      <main className="fairness-page-main">
        <FairnessLabView />
      </main>
    </div>
  );
}
