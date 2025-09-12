import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Registration from "@/pages/registration";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Navigation() {
  return (
    <nav className="bg-card border-b border-border apple-shadow">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="https://i.postimg.cc/nrx3QGnn/LOGOTIPOAF.png" 
              alt="Bora Correr Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-semibold text-primary">Bora Correr</h1>
          </div>
          <div className="flex space-x-4">
            <a 
              href="/" 
              className="text-primary hover:text-accent smooth-transition font-medium"
              data-testid="nav-registration"
            >
              Inscrição
            </a>
            <a 
              href="/admin" 
              className="text-muted-foreground hover:text-accent smooth-transition font-medium"
              data-testid="nav-admin"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Registration} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
