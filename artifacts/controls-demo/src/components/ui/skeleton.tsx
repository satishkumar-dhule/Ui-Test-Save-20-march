import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "text" | "heading" | "avatar" | "card";
}) {
  const variantClasses = {
    default: "animate-pulse rounded-md bg-primary/10 skeleton-shimmer",
    text: "skeleton-shimmer skeleton-text",
    heading: "skeleton-shimmer skeleton-heading",
    avatar: "skeleton-shimmer skeleton-avatar",
    card: "skeleton-shimmer skeleton-card",
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      aria-hidden="true"
      role="presentation"
      {...props}
    />
  );
}

function SkeletonGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {props.children}
    </div>
  );
}

function SkeletonLine({
  width,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string }) {
  return (
    <Skeleton
      className={cn("h-4", className)}
      style={{ width: width || "100%" }}
      {...props}
    />
  );
}

export { Skeleton, SkeletonGroup, SkeletonLine };
