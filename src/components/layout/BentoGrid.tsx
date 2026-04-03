import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";

export const BentoGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div 
    initial="hidden"
    animate="show"
    variants={{ show: { transition: { staggerChildren: 0.1 } } }}
    className={cn("grid gap-6 p-8", className)}
  >
    {children}
  </motion.div>
);

export const BentoItem = ({ children, className, colSpan = 1, rowSpan = 1 }: { children: React.ReactNode; className?: string; colSpan?: number; rowSpan?: number }) => {
  const colSpans: Record<number, string> = { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4" };
  const rowSpans: Record<number, string> = { 1: "row-span-1", 2: "row-span-2", 3: "row-span-3" };
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, scale: 0.95, y: 20 }, show: { opacity: 1, scale: 1, y: 0 } }}
      className={cn(colSpans[colSpan] || "col-span-1", rowSpans[rowSpan] || "row-span-1", className)}
    >
      {children}
    </motion.div>
  );
};
