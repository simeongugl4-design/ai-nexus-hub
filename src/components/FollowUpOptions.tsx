import { motion } from "framer-motion";
import { Search, Lightbulb, Code, ListChecks, ArrowRight, BookOpen } from "lucide-react";

interface FollowUpOption {
  label: string;
  prefix: string;
  icon: React.ElementType;
  color: string;
}

const defaultOptions: FollowUpOption[] = [
  { label: "A. Explore Deeper", icon: Search, prefix: "Explore this topic in much greater depth with specific facts, data, and advanced analysis: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "B. Simplify", icon: Lightbulb, prefix: "Explain the above in simpler terms that a beginner can understand: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "C. Show Examples", icon: Code, prefix: "Provide detailed real-world examples and practical applications of the above: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "D. Compare & Contrast", icon: BookOpen, prefix: "Compare and contrast the key concepts from the above with alternatives or competing approaches: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
  { label: "E. Summarize", icon: ListChecks, prefix: "Provide a concise bullet-point summary of the key takeaways from your previous response: ", color: "text-[hsl(30,90%,55%)] border-[hsl(30,90%,55%)]/30 hover:bg-[hsl(30,90%,55%)]/10" },
  { label: "F. Continue", icon: ArrowRight, prefix: "Continue and expand on your previous answer with additional insights, details, and next steps: ", color: "text-muted-foreground border-border hover:bg-muted" },
];

const researchOptions: FollowUpOption[] = [
  { label: "A. Deep Dive", icon: Search, prefix: "Conduct a much deeper investigation into this topic with primary sources, expert opinions, and recent data: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "B. Latest Updates", icon: Lightbulb, prefix: "What are the most recent developments and breaking news related to: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "C. Case Studies", icon: Code, prefix: "Provide detailed real-world case studies and practical examples related to: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "D. Expert Analysis", icon: BookOpen, prefix: "Provide expert-level analysis comparing different perspectives and methodologies on: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
  { label: "E. Key Takeaways", icon: ListChecks, prefix: "Summarize the most important findings and actionable takeaways from the research on: ", color: "text-[hsl(30,90%,55%)] border-[hsl(30,90%,55%)]/30 hover:bg-[hsl(30,90%,55%)]/10" },
  { label: "F. Related Topics", icon: ArrowRight, prefix: "What are the most important related topics and emerging trends connected to: ", color: "text-muted-foreground border-border hover:bg-muted" },
];

const codeOptions: FollowUpOption[] = [
  { label: "A. Add Tests", icon: Code, prefix: "Write comprehensive unit tests for the code above: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "B. Optimize", icon: Lightbulb, prefix: "Optimize the above code for better performance and readability: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "C. Explain", icon: BookOpen, prefix: "Explain the above code step by step in detail: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
  { label: "D. Add Features", icon: ArrowRight, prefix: "Extend the above code with additional features and improvements: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "E. Convert", icon: ListChecks, prefix: "Convert the above code to a different language or framework: ", color: "text-[hsl(30,90%,55%)] border-[hsl(30,90%,55%)]/30 hover:bg-[hsl(30,90%,55%)]/10" },
  { label: "F. Debug", icon: Search, prefix: "Find potential bugs, edge cases, and security issues in the above code: ", color: "text-muted-foreground border-border hover:bg-muted" },
];

const mathOptions: FollowUpOption[] = [
  { label: "A. Step-by-Step", icon: BookOpen, prefix: "Show a more detailed step-by-step solution with explanations for each step: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
  { label: "B. Alternative Method", icon: Lightbulb, prefix: "Solve the same problem using a different mathematical method or approach: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "C. Similar Problems", icon: Code, prefix: "Generate 3 similar practice problems with solutions based on: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "D. Visual Explanation", icon: Search, prefix: "Provide a visual/geometric interpretation and explanation of: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "E. Applications", icon: ListChecks, prefix: "What are the real-world applications and use cases of this mathematical concept: ", color: "text-[hsl(30,90%,55%)] border-[hsl(30,90%,55%)]/30 hover:bg-[hsl(30,90%,55%)]/10" },
  { label: "F. Verify", icon: ArrowRight, prefix: "Verify the solution by plugging back in and checking all steps: ", color: "text-muted-foreground border-border hover:bg-muted" },
];

const imageOptions: FollowUpOption[] = [
  { label: "A. Variations", icon: Lightbulb, prefix: "Generate a variation of the previous image with different style: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "B. More Detail", icon: Search, prefix: "Generate a more detailed and higher quality version of: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "C. Different Style", icon: Code, prefix: "Generate the same concept but in a completely different art style: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "D. Analyze", icon: BookOpen, prefix: "Analyze the composition, colors, and artistic elements of the generated image: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
];

export type FollowUpType = "chat" | "research" | "code" | "math" | "image";

const optionSets: Record<FollowUpType, FollowUpOption[]> = {
  chat: defaultOptions,
  research: researchOptions,
  code: codeOptions,
  math: mathOptions,
  image: imageOptions,
};

interface FollowUpOptionsProps {
  type: FollowUpType;
  onSelect: (prefix: string) => void;
  context?: string; // the query to append to prefix for research-style
}

export function FollowUpOptions({ type, onSelect, context }: FollowUpOptionsProps) {
  const options = optionSets[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="pt-3"
    >
      <p className="mb-3 text-xs font-medium text-muted-foreground">Continue exploring:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <motion.button
            key={option.label}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(context ? option.prefix + context : option.prefix)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${option.color}`}
          >
            <option.icon className="h-3.5 w-3.5" />
            {option.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
