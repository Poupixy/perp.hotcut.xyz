import { motion } from "framer-motion";
import { MessageSquare, Wand2, RotateCcw, Download } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Describe Your Vision",
    description:
      "Type a description of the world you want to create. Be as detailed or as simple as you like. Our AI understands context, mood, and style.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "AI Generates Your World",
    description:
      "In seconds, our neural networks analyze your prompt and construct a complete 3D environment with architecture, terrain, lighting, and atmosphere.",
  },
  {
    icon: RotateCcw,
    step: "03",
    title: "Refine & Iterate",
    description:
      "Make adjustments in real-time. Change the time of day, weather, architectural style, or add new elements with follow-up prompts.",
  },
  {
    icon: Download,
    step: "04",
    title: "Export & Share",
    description:
      "Export your world in multiple formats — 3D models, 360° panoramas, video walkthroughs, or interactive WebXR experiences.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
            Process
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            From text to world in{" "}
            <span className="text-gradient">four steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No 3D modeling skills required. Just describe what you want and let
            the AI do the rest.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border border-border/50 mb-6 group-hover:border-primary/30 transition-colors">
                  <item.icon className="w-7 h-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
