import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.ts";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 border-primary/20 text-primary shadow-[0_0_8px_rgba(192,193,255,0.2)]",
        secondary: "bg-secondary/10 border-secondary/20 text-secondary shadow-[0_0_8px_rgba(68,226,205,0.2)]",
        error: "bg-error/10 border-error/20 text-error shadow-[0_0_8px_rgba(255,180,171,0.2)]",
        ghost: "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white",
      },
      animate: {
        pulse: "animate-pulse",
        none: "",
      }
    },
    defaultVariants: {
      variant: "ghost",
      animate: "none",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export const Badge = ({ children, variant, animate, className, ...props }: BadgeProps) => {
  return (
    <div className={cn(badgeVariants({ variant, animate }), className)} {...props}>
      {children}
    </div>
  );
};
