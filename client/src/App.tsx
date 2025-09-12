import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { User } from "lucide-react";
import Registration from "@/pages/registration";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Navigation() {
  return (
    <nav className="bg-card border-b border-border premium-shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo à Esquerda e Maior */}
          <div className="flex items-center">
            <img 
              src="https://i.postimg.cc/nrx3QGnn/LOGOTIPOAF.png" 
              alt="Academia de Futebol" 
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
              data-testid="main-logo"
            />
          </div>
          {/* Ícone de Usuário */}
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent/10 border border-accent/20">
              <User 
                className="w-6 h-6 text-accent" 
                data-testid="user-icon"
              />
            </div>
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
