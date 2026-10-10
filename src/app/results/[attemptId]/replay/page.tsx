"use client";

import React, { use } from "react";
import Link from "next/link";
import AssessmentReplayView from "@/components/AssessmentReplayView";
import { ArrowLeft } from "lucide-react";

export default function ReplayPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);

  return (
    <div className="replay-page-shell">
      <header className="replay-page-topbar">
        <Link href="/" className="back-to-home-link">
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </Link>
        <div className="topbar-crumb">
          NextLearn <span>/</span> Assessment Replay <span>/</span> <code>{attemptId.slice(0, 8)}</code>
        </div>
      </header>

      <main className="replay-page-main">
        <AssessmentReplayView
          attemptId={attemptId}
          onClose={() => {
            window.location.href = "/";
          }}
        />
      </main>
    </div>
  );
}
