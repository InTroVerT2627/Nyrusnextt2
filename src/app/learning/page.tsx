import LearningPathsClient from "@/app/learning/LearningPathsClient";

export const metadata = {
  title: "Learning paths | Nextlearn",
  description: "Learn data analytics, business analytics, and communication through short lessons and knowledge checks.",
};

export default function LearningPage() {
  return <LearningPathsClient />;
}
