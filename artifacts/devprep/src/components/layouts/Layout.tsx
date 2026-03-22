import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showSidebar?: boolean
  sidebarContent?: ReactNode
  headerActions?: ReactNode
}

export function Layout({
  children,
  title,
  description,
  showSidebar = false,
  sidebarContent,
  headerActions,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">Dev</span>
              <span className="text-muted-foreground">Prep</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {headerActions}
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </a>
              <a
                href="/content"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Content
              </a>
              <a
                href="/onboarding"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Page Header */}
        {title && (
          <div className="container mx-auto px-4 pt-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        {/* Content with Optional Sidebar */}
        <div className="container mx-auto px-4 py-6">
          {showSidebar ? (
            <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
              <aside className="lg:sticky lg:top-20 lg:self-start">{sidebarContent}</aside>
              <div className="min-w-0 space-y-6">{children}</div>
            </div>
          ) : (
            <div className="min-w-0">{children}</div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-semibold mb-4">DevPrep</h3>
              <p className="text-sm text-muted-foreground">
                Technical interview preparation with AI-generated content
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/content" className="hover:text-primary transition-colors">
                    Questions
                  </a>
                </li>
                <li>
                  <a href="/content/flashcards" className="hover:text-primary transition-colors">
                    Flashcards
                  </a>
                </li>
                <li>
                  <a href="/content/exams" className="hover:text-primary transition-colors">
                    Exams
                  </a>
                </li>
                <li>
                  <a href="/coding" className="hover:text-primary transition-colors">
                    Coding Challenges
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/privacy" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevPrep. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
