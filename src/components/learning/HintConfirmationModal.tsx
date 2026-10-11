"use client";

type HintConfirmationModalProps = {
  isOpen: boolean;
  tier: "nudge" | "pointer" | "strong";
  currentDeduction: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function HintConfirmationModal({
  isOpen,
  tier,
  currentDeduction,
  onCancel,
  onConfirm,
}: HintConfirmationModalProps) {
  if (!isOpen) return null;

  const deduction = tier === "nudge" ? 5 : tier === "pointer" ? 10 : 20;
  const newTotal = Math.min(35, currentDeduction + deduction);
  const capped = currentDeduction + deduction > 35;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 45, 78, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid var(--mint-deep)",
          maxWidth: "460px",
          width: "100%",
          padding: "22px",
          boxShadow: "0 20px 25px -5px rgba(20, 45, 78, 0.15)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#D97706",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          TIERED HINT CONFIRMATION
        </span>
        <h3 id="hint-modal-title" style={{ margin: "4px 0 10px", fontSize: "18px", color: "var(--forest)", fontWeight: 700 }}>
          Unlock {tier.toUpperCase()} hint?
        </h3>

        <div
          style={{
            backgroundColor: "var(--lime-light)",
            border: "1px solid var(--mint-deep)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "var(--ink-soft)",
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: "0 0 6px" }}>
            This will deduct <strong>{deduction}%</strong> from this question's total possible marks.
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
            Current question penalty: <strong>{currentDeduction}%</strong> → New penalty: <strong>{newTotal}%</strong> (Capped at 35% max).
            {capped && " (35% cap reached)"}
          </p>
        </div>

        <p style={{ margin: "0 0 18px", fontSize: "12px", color: "var(--muted)" }}>
          In the Final Test, hints test your ability to resolve ambiguity with guidance, but reduce total marks. Take a moment to think first.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid var(--mint-deep)",
              backgroundColor: "#FFFFFF",
              color: "var(--muted)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel & Think More
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#D97706",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Accept -{deduction}% & Reveal Hint
          </button>
        </div>
      </div>
    </div>
  );
}
