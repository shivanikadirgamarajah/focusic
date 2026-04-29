"use client";

import { useState, useEffect } from "react";

interface TypedTextProps {
  strings?: string[];
  text?: string;
  typeSpeed?: number;
  backSpeed?: number;
  backDelay?: number;
  loop?: boolean;
  showCursor?: boolean;
  className?: string;
}

export default function TypedText({
  strings = [],
  text,
  typeSpeed = 30,
  backSpeed = 30,
  backDelay = 1500,
  loop = true,
  showCursor = true,
  className = "",
}: TypedTextProps) {
  const textArray = text ? [text] : strings;
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [stringIndex, setStringIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBlinking, setShowBlinking] = useState(true);

  useEffect(() => {
    const currentString = textArray[stringIndex] || "";
    let timer: NodeJS.Timeout;

    if (!isDeleting && index < currentString.length) {
      // Typing forward
      timer = setTimeout(() => {
        setDisplayedText((prev) => prev + currentString[index]);
        setIndex((prev) => prev + 1);
      }, typeSpeed);
    } else if (!isDeleting && index === currentString.length) {
      // Finished typing, wait before deleting (if multiple strings)
      if (textArray.length > 1) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, backDelay);
      }
    } else if (isDeleting && displayedText.length > 0) {
      // Typing backward
      timer = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, backSpeed);
    } else if (isDeleting && displayedText.length === 0) {
      // Move to next string
      setIsDeleting(false);
      setIndex(0);
      setStringIndex((prev) => (loop ? (prev + 1) % textArray.length : prev + 1));
    }

    return () => clearTimeout(timer);
  }, [displayedText, index, isDeleting, stringIndex, typeSpeed, backSpeed, backDelay, textArray, loop]);

  // Blinking cursor effect
  useEffect(() => {
    if (!showCursor) return;
    const cursorTimer = setInterval(() => {
      setShowBlinking((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, [showCursor]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && <span className={showBlinking ? "opacity-100" : "opacity-0"}>|</span>}
    </span>
  );
}
