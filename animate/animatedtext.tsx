"use client";
import React from "react";
import { motion } from "framer-motion";

const arrowTransition = (delay = 0) => ({
  duration: 3,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
  delay,
});

const AnimatedName: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center mt-25 mb-48">
    <div className="flex flex-col items-center gap-15">
      {[0].map((delay) => (
        <motion.div
          key="animated-arrow"
          animate={{ y: [0, 20], opacity: [0.7, 1] }}
          transition={arrowTransition(delay)}
          className="text-6xl font-bold leading-none will-change-transform"
          style={{ color: "#ffffff" }}
        >
          ↓
        </motion.div>
      ))}
    </div>
  </div>
);

export default AnimatedName;