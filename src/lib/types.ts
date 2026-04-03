export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  mode?: "answer" | "research";
};

export type FollowUpAction = {
  label: string;
  icon: string;
  prefix: string;
  mode: "answer" | "research";
};

export type AIModel = {
  id: string;
  name: string;
  description: string;
  icon: string;
  speed: number;
  accuracy: number;
};

export const AI_MODELS: AIModel[] = [
  { id: "fast", name: "Fast AI", description: "Quick responses for simple queries", icon: "⚡", speed: 95, accuracy: 75 },
  { id: "research", name: "Research AI", description: "Deep analysis with citations", icon: "🔬", speed: 60, accuracy: 95 },
  { id: "creative", name: "Creative AI", description: "Creative writing and brainstorming", icon: "✨", speed: 80, accuracy: 85 },
  { id: "coding", name: "Coding AI", description: "Code generation and debugging", icon: "💻", speed: 75, accuracy: 90 },
  { id: "expert", name: "Expert AI", description: "Complex reasoning and analysis", icon: "🧠", speed: 50, accuracy: 98 },
  { id: "gpt5", name: "GPT-5", description: "OpenAI powerful all-rounder", icon: "🤖", speed: 65, accuracy: 96 },
  { id: "gpt52", name: "GPT-5.2", description: "OpenAI latest enhanced reasoning", icon: "🚀", speed: 55, accuracy: 99 },
];
