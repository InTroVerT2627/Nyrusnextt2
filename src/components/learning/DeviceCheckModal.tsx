"use client";

import { useEffect, useRef, useState } from "react";
import { ProctorMode } from "@/lib/final-test-types";

type DeviceCheckModalProps = {
  isOpen: boolean;
  pathTitle: string;
  onCancel: () => void;
  onProceed: (config: {
    proctorMode: ProctorMode;
    cameraVerified: boolean;
    micVerified: boolean;
    hasAccommodation: boolean;
  }) => void;
};

export default function DeviceCheckModal({
  isOpen,
  pathTitle,
  onCancel,
  onProceed,
}: DeviceCheckModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [hasAccommodation, setHasAccommodation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      cleanupStreams();
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setDeviceError(null);

    async function initDevices() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Hardware access is not supported by your browser environment.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasCamera(stream.getVideoTracks().length > 0);
        setHasMic(stream.getAudioTracks().length > 0);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Setup local audio level meter (analyser node only; no recording)
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function updateVolume() {
              if (!analyser) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              const level = Math.min(100, Math.round((avg / 128) * 100));
              setAudioLevel(level);
              animFrameRef.current = requestAnimationFrame(updateVolume);
            }
            updateVolume();
          }
        } catch {
          // Audio analyzer failure is non-blocking
        }
      } catch (err: any) {
        if (isMounted) {
          setDeviceError(
            err?.message || "Camera or microphone permission was denied or unavailable."
          );
          setHasCamera(false);
          setHasMic(false);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initDevices();

    return () => {
      isMounted = false;
      cleanupStreams();
    };
  }, [isOpen]);

  function cleanupStreams() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }

  function handleProceedDeviceChecked() {
    cleanupStreams();
    onProceed({
      proctorMode: "device_checked",
      cameraVerified: hasCamera,
      micVerified: hasMic,
      hasAccommodation,
    });
  }

  function handleProceedUnproctored() {
    cleanupStreams();
    onProceed({
      proctorMode: "unproctored",
      cameraVerified: false,
      micVerified: false,
      hasAccommodation,
    });
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-check-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 45, 78, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #D9E8F3",
          maxWidth: "560px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(20, 45, 78, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#142D4E",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              FINAL TEST PREPARATION
            </span>
            <h2 id="device-check-title" style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 700, color: "#142D4E" }}>
              Device Readiness & Privacy Check
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
              {pathTitle} · 45 minutes · 8 questions
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupStreams();
              onCancel();
            }}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#64748B",
            }}
          >
            ✕
          </button>
        </div>

        {/* Video Preview & Mic Bar */}
        <div
          style={{
            background: "#142D4E",
            borderRadius: "10px",
            overflow: "hidden",
            position: "relative",
            aspectRatio: "16 / 9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          {isInitializing ? (
            <p style={{ color: "#EAF6FC", fontSize: "13px" }}>Checking camera and microphone…</p>
          ) : hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)", // Mirror effect
              }}
            />
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#EAF6FC" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>Camera preview not active</p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748B" }}>
                {deviceError || "No camera detected. You may still proceed with the unproctored route."}
              </p>
            </div>
          )}

          {/* Local Status Indicators */}
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              right: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(20, 45, 78, 0.75)",
              padding: "6px 12px",
              borderRadius: "6px",
              backdropFilter: "blur(2px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: hasCamera ? "#059669" : "#DC2626", fontWeight: 600 }}>
                {hasCamera ? "● Camera OK" : "○ No Camera"}
              </span>
              <span style={{ fontSize: "12px", color: hasMic ? "#059669" : "#DC2626", fontWeight: 600 }}>
                {hasMic ? "● Mic OK" : "○ No Mic"}
              </span>
            </div>

            {/* Mic Level Bar */}
            {hasMic && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#EAF6FC" }}>Audio:</span>
                <div style={{ width: "60px", height: "6px", backgroundColor: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${audioLevel}%`,
                      backgroundColor: "#06C6E6",
                      transition: "width 80ms ease-out",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Non-Negotiable Declaration */}
        <div
          style={{
            backgroundColor: "#EAF6FC",
            border: "1px solid #D9E8F3",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#334155",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#142D4E", display: "block", marginBottom: "4px" }}>
            🔒 Strict Privacy Guarantee
          </strong>
          Your video and microphone streams run <strong>100% locally</strong> on your device.
          No video, audio, snapshots, or biometric records are ever captured, stored, or sent to any server. We only confirm device presence.
        </div>

        {/* Accessibility Accommodation Toggle */}
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="accommodation-check"
            checked={hasAccommodation}
            onChange={(e) => setHasAccommodation(e.target.checked)}
            style={{ accentColor: "#06C6E6", cursor: "pointer" }}
          />
          <label htmlFor="accommodation-check" style={{ fontSize: "12px", color: "#334155", cursor: "pointer" }}>
            Enable accessibility accommodation (+50% extra time: 67.5 minutes)
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleProceedUnproctored}
            style={{
              padding: "9px 14px",
              borderRadius: "6px",
              border: "1px solid #D9E8F3",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Take without camera & mic
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                cleanupStreams();
                onCancel();
              }}
              style={{
                padding: "9px 14px",
                borderRadius: "6px",
                border: "1px solid #D9E8F3",
                backgroundColor: "#FFFFFF",
                color: "#64748B",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceedDeviceChecked}
              disabled={!hasCamera && !hasMic}
              style={{
                padding: "9px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: hasCamera || hasMic ? "#06C6E6" : "#D9E8F3",
                color: "#142D4E",
                fontSize: "13px",
                fontWeight: 700,
                cursor: hasCamera || hasMic ? "pointer" : "not-allowed",
              }}
            >
              Start Final Test →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
