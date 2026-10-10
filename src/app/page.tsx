const missions = [
  {
    number: "01",
    title: "The wrong top seller",
    severity: "S3 · Low",
    skill: "Loop bounds",
    language: "JavaScript",
    state: "Ready to try",
    accent: "mint",
    description: "A dashboard leaves out the product that should be leading the weekly report.",
  },
  {
    number: "02",
    title: "Customers missing from the list",
    severity: "S3 · Low",
    skill: "Mutation during iteration",
    language: "Java",
    state: "Locked · Complete mission 01",
    accent: "blue",
    description: "Some customers disappear while an operations team cleans up duplicate records.",
  },
  {
    number: "03",
    title: "The report arrives too soon",
    severity: "S2 · Medium",
    skill: "Async flow",
    language: "JavaScript",
    state: "Locked · Complete mission 01",
    accent: "amber",
    description: "An order summary renders before all of its data has finished loading.",
  },
  {
    number: "04",
    title: "A cache that never gets a hit",
    severity: "S1 · High",
    skill: "Equality and hashing",
    language: "Java",
    state: "Locked · Complete mission 02 or 03",
    accent: "rose",
    description: "A customer cache misses even when the requested key looks familiar.",
  },
];

const rubric = [
  ["Fix correctness", "35%", "Visible tests"],
  ["Edge cases", "15%", "Hidden tests"],
  ["Root cause", "20%", "Reasoning review"],
  ["Explanation", "10%", "Reasoning review"],
  ["Follow-up reasoning", "20%", "Fixed question bank"],
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="rail" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="ProofLoop home"><span className="brand-mark">P</span><span>proofloop</span></a>
        <div className="rail-label">WORKSPACE</div>
        <a className="nav-link active" href="#missions"><span className="nav-icon">◈</span> Missions</a>
        <a className="nav-link" href="#progress"><span className="nav-icon">⌘</span> Skill tree</a>
        <a className="nav-link" href="#evidence"><span className="nav-icon">▤</span> My evidence</a>
        <div className="rail-bottom"><div className="avatar">A</div><div><strong>Alex Morgan</strong><small>Learner workspace</small></div><span className="more">···</span></div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar"><div className="breadcrumb">Nyeras <span>/</span> <strong>Proof of skill</strong></div><div className="top-actions"><span className="sandbox-pill"><i /> Sandbox environment</span><button className="icon-button" aria-label="Notifications">♧</button></div></header>
        <div className="content">
          <section className="welcome">
            <div><div className="eyebrow">YOUR PRACTICE SPACE</div><h1>Show what you can do.</h1><p>Work through realistic debugging incidents. Your evidence grows when you can explain the thinking behind your fix.</p></div>
            <div className="welcome-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="spark">✳</div><div className="art-card"><span>proof</span><b>✓</b></div></div>
          </section>

          <section className="progress-row" id="progress" aria-label="Your progress">
            <div className="progress-copy"><span className="progress-icon">⌁</span><div><strong>Your debugging path</strong><small>Build evidence one mission at a time</small></div></div>
            <div className="path-nodes"><span className="node next">1</span><i className="path-line"/><span className="node">2</span><i className="path-line"/><span className="node">3</span><i className="path-line"/><span className="node">4</span></div>
            <div className="progress-count"><strong>0 <span>/ 4</span></strong><small>missions evidenced</small></div>
          </section>

          <div className="section-heading" id="missions"><div><div className="eyebrow">INCIDENT MISSIONS</div><h2>Choose a place to start</h2></div><button className="text-button">View skill tree <span>↗</span></button></div>

          <section className="mission-grid" aria-label="Debugging missions">
            {missions.map((mission) => <article className={`mission-card ${mission.accent}`} key={mission.number}>
              <div className="card-top"><span className="mission-number">MISSION {mission.number}</span><span className="severity">{mission.severity}</span></div>
              <div className="mission-illustration"><div className="code-window"><div className="window-dots"><i/><i/><i/></div><div className="code-line short"/><div className="code-line"/><div className="code-line medium"/><div className="bug-mark">!</div></div><div className="mission-symbol">{mission.number === "01" ? "↗" : mission.number === "02" ? "⌁" : mission.number === "03" ? "◷" : "◇"}</div></div>
              <div className="mission-body"><div className="mission-tags"><span>{mission.language}</span><span>{mission.skill}</span></div><h3>{mission.title}</h3><p>{mission.description}</p><div className="card-footer"><span className={mission.number === "01" ? "ready" : "locked"}>{mission.number === "01" ? "●" : "◌"} {mission.state}</span><button disabled={mission.number !== "01"} aria-label={mission.number === "01" ? "Start mission 1" : `Mission ${mission.number} locked`}>{mission.number === "01" ? "Start mission" : "Locked"} <span>→</span></button></div></div>
            </article>)}
          </section>

          <section className="rubric-panel"><div className="rubric-intro"><div className="rubric-icon">◎</div><div><div className="eyebrow">CLEAR BEFORE YOU BEGIN</div><h2>How your work is reviewed</h2><p>Every mission uses the same visible rubric. Tests check your code; reasoning is reviewed against fixed criteria.</p><a href="#rubric-table">See the full rubric <span>→</span></a></div></div><div className="rubric-table" id="rubric-table"><div className="table-head"><span>CRITERION</span><span>WEIGHT</span><span>REVIEWED BY</span></div>{rubric.map(([name, weight, reviewer]) => <div className="table-row" key={name}><span>{name}</span><strong>{weight}</strong><span>{reviewer}</span></div>)}</div></section>

          <footer className="disclaimer"><span>ⓘ</span><p>This is a practice sandbox. Evidence reflects work in these tasks and is not a validated predictor of job performance. Sharing is always your choice.</p><a href="#evidence">Privacy & sharing</a></footer>
        </div>
      </section>
    </main>
  );
}
