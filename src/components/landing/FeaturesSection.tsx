import { motion } from "framer-motion";
import { Brain, Globe, Zap, Layers, Sparkles, Eye } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Text-to-World",
    description:
      "Describe any environment in natural language and our AI generates a fully realized 3D world with architecture, lighting, and atmosphere.",
  },
  {
    icon: Globe,
    title: "Infinite Worlds",
    description:
      "Generate cities, forests, alien planets, underwater realms, or fantasy kingdoms. No limit to your imagination.",
  },
  {
    icon: Zap,
    title: "Real-time Rendering",
    description:
      "See your world come to life instantly with our optimized rendering engine. Edit and iterate in seconds.",
  },
  {
    icon: Layers,
    title: "Layered Editing",
    description:
      "Fine-tune every aspect with granular control. Adjust lighting, textures, weather, time of day, and architectural style.",
  },
  {
    icon: Sparkles,
    title: "Style Transfer",
    description:
      "Apply artistic styles to your worlds. From photorealistic to stylized, cyberpunk to watercolor fantasy.",
  },
  {
    icon: Eye,
    title: "360° Exploration",
    description:
      "Walk through your generated worlds in immersive 360° view. Export to VR or share as interactive experiences.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            Capabilities
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Everything you need to{" "}
            <span className="text-gradient">create worlds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From concept to fully realized 3D environments. Our AI handles the
            complexity so you can focus on creativity.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border/50 card-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
