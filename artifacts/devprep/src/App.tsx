import { Route, Switch } from 'wouter'
import { HomePage } from '@/components/pages/Home'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              <p className="mt-2 text-muted-foreground">
                The page you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  )
}
