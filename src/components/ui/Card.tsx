import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.ts";

const cardVariants = cva(
  "relative overflow-hidden rounded-2xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-surface-container/60 backdrop-blur-xl border-white/5 shadow-rim",
        flat: "bg-surface-low border-white/5",
        accent: "bg-surface-container border-primary/20 shadow-rim",
        outline: "bg-transparent border-white/10 hover:border-white/20",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1 hover:shadow-2xl",
        glow: "hover:border-primary/30 hover:shadow-[0_0_20px_rgba(192,193,255,0.1)]",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: "none",
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const Card = ({ children, variant, padding, hover, className, ...props }: CardProps) => {
  return (
    <div className={cn(cardVariants({ variant, padding, hover }), className)} {...props}>
      {children}
    </div>
  );
};
