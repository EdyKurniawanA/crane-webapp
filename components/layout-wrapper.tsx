export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-16 px-4">
      <div className="container mx-auto py-6">
        {children}
      </div>
    </div>
  )
} 