import { motion } from "framer-motion";
import neuralHero from "@/assets/neural-hero.jpg";

const stats = [
  { value: "4.2s", label: "Average generation time" },
  { value: "50K+", label: "Worlds created" },
  { value: "98%", label: "User satisfaction" },
  { value: "4K", label: "Resolution output" },
];

export function ShowcaseSection() {
  return (
    <section id="showcase" className="relative py-32 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={neuralHero}
          alt="AI neural network visualization"
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            Impact
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Trusted by <span className="text-gradient">creators worldwide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Game developers, filmmakers, architects, and artists are building
            the next generation of immersive experiences.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl bg-surface/30 backdrop-blur-sm border border-border/30"
            >
              <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-surface/30 backdrop-blur-sm border border-border/30"
        >
          <svg
            className="w-10 h-10 text-primary/30 mx-auto mb-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-xl sm:text-2xl text-foreground leading-relaxed mb-8 italic">
            "Genesis completely transformed our pre-visualization workflow. What
            used to take our art team weeks now happens in minutes. The quality
            is incredible."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              MK
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Maya Kowalski</p>
              <p className="text-sm text-muted-foreground">
                Art Director, Nova Studios
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
