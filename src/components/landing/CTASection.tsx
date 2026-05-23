import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/8 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Ready to build your{" "}
            <span className="text-gradient">first world?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of creators who are already building immersive
            experiences with AI. Start for free, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-[0_0_40px_oklch(0.65_0.2_260/0.3)] inline-flex items-center justify-center gap-2"
            >
              Start Creating Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 border border-border bg-surface/50 backdrop-blur-sm text-foreground font-medium rounded-full hover:bg-surface-raised transition-all"
            >
              View Pricing
            </motion.button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Free plan includes 10 world generations per month
          </p>
        </motion.div>
      </div>
    </section>
  );
}
