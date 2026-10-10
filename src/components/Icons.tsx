import React from "react";
import {
  Terminal,
  GitBranch,
  FileCheck2,
  Search,
  CheckSquare,
  History,
  FlaskConical,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  Check,
  X,
  Lock,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  RotateCw,
} from "lucide-react";

type IconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
};

const DEFAULT_STROKE = 1.75;

export function MissionIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Terminal className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function TreeIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <GitBranch className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function EvidenceIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <FileCheck2 className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function RecruiterIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Search className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function ReviewIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <CheckSquare className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function AuditIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <History className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function LabIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <FlaskConical className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function ValidationIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <ClipboardCheck className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function LearningIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <BookOpen className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function NyerasIcon({ className = "", size = 18, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <GraduationCap className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function CheckIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Check className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function CrossIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <X className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function LockIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Lock className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function ShieldIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Shield className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function SunIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Sun className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function MoonIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <Moon className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function ArrowRightIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <ArrowRight className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function RefreshIcon({ className = "", size = 16, strokeWidth = DEFAULT_STROKE }: IconProps) {
  return <RotateCw className={className} size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
