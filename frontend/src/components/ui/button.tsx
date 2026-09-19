import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      default: "bg-emerald-900 text-white hover:bg-emerald-900/90",
      ghost: "hover:bg-emerald-900/10 hover:text-emerald-950",
      outline: "border border-emerald-900/15 bg-transparent hover:bg-emerald-900/5",
      secondary: "bg-emerald-900/10 text-emerald-950 hover:bg-emerald-900/20",
    };

    const sizes = {
      default: "",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-8",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };


