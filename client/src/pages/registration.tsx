import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Registrant } from "@shared/schema";
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Coffee, 
  Award,
  MapPin,
  Trophy
} from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().min(1, "Email é obrigatório").email("Email deve ter um formato válido"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RankingEntry {
  position: number;
  bib: number;
  name: string;
  registrationTime: string;
}

export default function Registration() {
  const [registeredUser, setRegisteredUser] = useState<Registrant | null>(null);
  const { toast } = useToast();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Fetch ranking data
  const { data: ranking = [], isLoading: rankingLoading } = useQuery<RankingEntry[]>({
    queryKey: ['/api/ranking'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await apiRequest("POST", "/api/registrants", data);
      
      // Handle capacity exceeded error specifically
      if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.errorType === "CAPACITY_EXCEEDED") {
          throw new Error("CAPACITY_EXCEEDED");
        }
        throw new Error(errorData.message || "Conflito ao processar inscrição");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao processar inscrição");
      }
      
      return response.json();
    },
    onSuccess: (data: Registrant) => {
      setRegisteredUser(data);
      form.reset();
      toast({
        title: "Inscrição realizada com sucesso!",
        description: `Seu número de inscrição é #${data.bib}`,
      });
    },
    onError: (error) => {
      if (error.message === "CAPACITY_EXCEEDED") {
        toast({
          title: "Evento Lotado",
          description: "Desculpe, o evento já atingiu sua capacidade máxima de 100 participantes. Não é possível realizar novas inscrições.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na inscrição",
          description: error.message || "Ocorreu um erro ao processar sua inscrição",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    // Server-side capacity enforcement handles validation
    registrationMutation.mutate(data);
  };

  const resetRegistration = () => {
    setRegisteredUser(null);
    form.reset();
  };

  if (registeredUser) {
    return (
      <section className="min-h-screen hero-section">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="premium-shadow-lg card-hover">
            <CardContent className="pt-8 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-3xl font-bold text-primary mb-2">Inscrição Confirmada!</h3>
                <p className="text-muted-foreground mb-8">Sua inscrição foi processada com sucesso</p>
                
                <div className="bg-secondary rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-semibold text-lg" data-testid="text-registrant-name">{registeredUser.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número:</span>
                      <p className="font-bold text-accent text-2xl" data-testid="text-registrant-bib">#{registeredUser.bib}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium" data-testid="text-registrant-email">{registeredUser.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium" data-testid="text-registrant-date">
                        {new Date(registeredUser.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-6 mb-8 text-left">
                  <h4 className="font-semibold text-primary mb-3">Próximos Passos:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Credenciamento: 1h antes do evento (16:00h)</li>
                    <li>• Local: A ser informado</li>
                    <li>• Kit de imprensa será entregue no credenciamento</li>
                    <li>• Café da tarde incluído após a corrida</li>
                  </ul>
                </div>

                <Button 
                  onClick={resetRegistration}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground smooth-transition"
                  data-testid="button-new-registration"
                >
                  Nova Inscrição
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen hero-section">
      {/* Hero Section with Typing Animation */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-brand font-bold text-primary mb-6 typing-effect" data-testid="hero-hashtag">
            #BoraCorrer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-light">
            Complete sua inscrição para o evento
          </p>
          
          {/* Event Information - Moved below hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-2 bg-card rounded-xl p-6 premium-shadow card-hover fade-in-up" style={{animationDelay: '0.2s'}} data-testid="event-date">
              <Calendar className="w-6 h-6 text-accent" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-bold text-lg">04/10</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2 bg-card rounded-xl p-6 premium-shadow card-hover fade-in-up" style={{animationDelay: '0.4s'}} data-testid="event-time">
              <Clock className="w-6 h-6 text-accent" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Horário</p>
                <p className="font-bold text-lg">17:00h</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2 bg-card rounded-xl p-6 premium-shadow card-hover fade-in-up" style={{animationDelay: '0.6s'}} data-testid="event-price">
              <DollarSign className="w-6 h-6 text-accent" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Taxa</p>
                <p className="font-bold text-lg">R$ 30</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2 bg-card rounded-xl p-6 premium-shadow card-hover fade-in-up" style={{animationDelay: '0.8s'}} data-testid="event-capacity">
              <Users className="w-6 h-6 text-accent" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Vagas</p>
                <p className="font-bold text-lg">{100 - ranking.length}/100</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Registration Form */}
          <div className="order-2 lg:order-1">
            <Card className="premium-shadow-lg card-hover">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-brand font-bold text-primary mb-2">
                  Dados da Inscrição
                </CardTitle>
                <p className="text-muted-foreground">Preencha suas informações para participar</p>
              </CardHeader>
              <CardContent className="p-8">

                {/* Benefits */}
                <div className="mb-8">
                  <h3 className="font-semibold text-primary mb-4">Incluso na Inscrição:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Coffee className="w-4 h-4 text-accent" />
                      <span className="text-sm">Café da tarde</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-accent" />
                      <span className="text-sm">Kit de imprensa</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="text-sm">Credenciamento 1h antes (16:00h)</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Registration Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nome do Corredor *
                    </Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent smooth-transition"
                      placeholder="Digite seu nome completo"
                      data-testid="input-runner-name"
                      disabled={registrationMutation.isPending}
                    />
                    {form.formState.errors.name && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-name">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent smooth-transition"
                      placeholder="Digite seu email"
                      data-testid="input-runner-email"
                      disabled={registrationMutation.isPending}
                    />
                    {form.formState.errors.email && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-email">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={registrationMutation.isPending}
                    className="w-full bg-accent hover:bg-accent/90 hover:scale-[1.02] text-accent-foreground font-semibold py-4 px-6 rounded-xl smooth-transition premium-shadow"
                    data-testid="button-submit-registration"
                  >
                    {registrationMutation.isPending 
                      ? "Processando..." 
                      : "Confirmar Inscrição"
                    }
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Ao se inscrever, você concorda com nossos termos de uso
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Ranking */}
          <div className="order-1 lg:order-2">
            <Card className="premium-shadow-lg card-hover h-fit sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    <span>Ranking ao Vivo</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-accent border-accent">
                    {ranking.length}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {rankingLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-secondary rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : ranking.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma inscrição ainda</p>
                    <p className="text-sm text-muted-foreground">Seja o primeiro a se inscrever!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {ranking.map((entry, index) => (
                      <div 
                        key={entry.bib}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          index < 3 
                            ? 'bg-accent/10 border-accent/20' 
                            : 'bg-secondary/50 border-border'
                        }`}
                        data-testid={`ranking-entry-${entry.bib}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-amber-600 text-amber-900' :
                            'bg-secondary text-secondary-foreground'
                          }`}>
                            {entry.position}
                          </div>
                          <div>
                            <p className="font-medium text-sm" data-testid={`text-name-${entry.bib}`}>
                              {entry.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.registrationTime).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs" data-testid={`text-bib-${entry.bib}`}>
                          #{entry.bib}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}