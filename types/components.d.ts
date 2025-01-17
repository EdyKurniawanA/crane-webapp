declare module '@/components/ui/alert' {
  export const Alert: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }>;
  export const AlertDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement>>;
} 