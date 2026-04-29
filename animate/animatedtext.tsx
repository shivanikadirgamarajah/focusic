"use client";
import React from "react";

const arrowTransition = (delay = 0) => ({
  duration: 3,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
  delay,
});

const AnimatedName: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center mt-25 mb-48">
    <LavaLampSVG />

    <div className="text-4xl md:text-5xl font-bold text-white -mt-40 mb-8 h-20 flex items-center">
      <TypedText
        strings={[
          "I am <span class='text-cyan-400'>an app developer</span>",
          "I am <span class='text-cyan-400'>a web developer</span>",
          "I am <span class='text-cyan-400'>a learner</span>",
        ]}
        typeSpeed={50}
        backSpeed={30}
        backDelay={1500}
        loop={true}
        showCursor={true}
      />
    </div>

    <div className="flex flex-col items-center gap-15">
      {[0].map((delay, i) => (
        <motion.div
          key={i}
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