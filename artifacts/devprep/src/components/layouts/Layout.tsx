import { ReactNode, useState } from 'react'
import { Menu, X } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showSidebar?: boolean
  sidebarContent?: ReactNode
  headerActions?: ReactNode
  onMenuToggle?: () => void
  isMenuOpen?: boolean
}

export function Layout({
  children,
  title,
  description,
  showSidebar = false,
  sidebarContent,
  headerActions,
  onMenuToggle,
  isMenuOpen = false,
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    if (onMenuToggle) {
      onMenuToggle()
    } else {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    }
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg touch-manipulation touch-feedback"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <a href="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">Dev</span>
              <span className="text-muted-foreground">Prep</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {headerActions}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Home
              </a>
              <a
                href="/content"
                className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Content
              </a>
              <a
                href="/onboarding"
                className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Get Started
              </a>
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b bg-background">
            <nav className="flex flex-col p-4 gap-2">
              <a
                href="/"
                onClick={closeMobileMenu}
                className="py-3 px-4 hover:bg-muted rounded-lg text-sm font-medium"
              >
                Home
              </a>
              <a
                href="/content"
                onClick={closeMobileMenu}
                className="py-3 px-4 hover:bg-muted rounded-lg text-sm font-medium"
              >
                Content
              </a>
              <a
                href="/onboarding"
                onClick={closeMobileMenu}
                className="py-3 px-4 hover:bg-muted rounded-lg text-sm font-medium"
              >
                Get Started
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
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
            <div className="grid gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] xl:grid-cols-[260px_1fr]">
              <aside className="lg:sticky lg:top-20 lg:self-start">{sidebarContent}</aside>
              <div className="min-w-0 space-y-6">{children}</div>
            </div>
          ) : (
            <div className="min-w-0">{children}</div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
