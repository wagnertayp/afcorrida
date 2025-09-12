import { useState, useEffect } from "react";
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
  User,
  DollarSign, 
  Coffee, 
  Award,
  MapPin,
  Trophy,
  Target,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Shield,
  Gift,
  Timer,
  Medal,
  Activity,
  Flame,
  Crown,
  Sparkles
} from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RankingEntry {
  position: number;
  bib: number;
  name: string;
  registrationTime: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2025-10-04T17:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-xl p-6 border border-accent/20" data-testid="countdown-timer">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Timer className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-bold text-primary">Evento em:</h3>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="countdown-number text-2xl font-bold text-accent mb-1" data-testid="countdown-days">
            {timeLeft.days}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Dias</div>
        </div>
        <div className="text-center">
          <div className="countdown-number text-2xl font-bold text-accent mb-1" data-testid="countdown-hours">
            {timeLeft.hours}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Horas</div>
        </div>
        <div className="text-center">
          <div className="countdown-number text-2xl font-bold text-accent mb-1" data-testid="countdown-minutes">
            {timeLeft.minutes}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Min</div>
        </div>
        <div className="text-center">
          <div className="countdown-number text-2xl font-bold text-accent mb-1" data-testid="countdown-seconds">
            {timeLeft.seconds}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Seg</div>
        </div>
      </div>
    </div>
  );
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
    <section className="min-h-screen hero-section relative">
      {/* Floating Elements */}
      <div className="floating-element top-20 left-10">
        <Target className="w-8 h-8 text-accent" />
      </div>
      <div className="floating-element top-40 right-20">
        <Zap className="w-6 h-6 text-accent" />
      </div>
      <div className="floating-element bottom-40 left-20">
        <Heart className="w-7 h-7 text-accent" />
      </div>

      {/* Hero Section with Typing Animation */}
      <div className="text-center py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-brand font-bold text-primary mb-6 typing-effect" data-testid="hero-hashtag">
            #BoraCorrer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
            1ª EDIÇÃO EM BUJARU
          </p>
          <p className="motivational-text text-lg md:text-xl mb-12 font-medium">
            "Cada passo é uma vitória. Cada batida do coração, uma conquista."
          </p>
          
          {/* Countdown Timer */}
          <div className="max-w-md mx-auto mb-12">
            <CountdownTimer />
          </div>
          
          {/* Event Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="event-info-card rounded-xl p-6 card-hover fade-in-up" style={{animationDelay: '0.2s'}} data-testid="event-date">
              <Calendar className="w-6 h-6 text-accent mx-auto mb-3" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Data</p>
                <p className="font-bold text-lg text-primary">04 de Outubro</p>
              </div>
            </div>
            <div className="event-info-card rounded-xl p-6 card-hover fade-in-up" style={{animationDelay: '0.4s'}} data-testid="event-time">
              <Clock className="w-6 h-6 text-accent mx-auto mb-3" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Largada</p>
                <p className="font-bold text-lg text-primary">17:00h</p>
              </div>
            </div>
            <div className="event-info-card rounded-xl p-6 card-hover fade-in-up" style={{animationDelay: '0.6s'}} data-testid="event-price">
              <DollarSign className="w-6 h-6 text-accent mx-auto mb-3" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Investimento</p>
                <p className="font-bold text-lg text-primary">R$ 30</p>
              </div>
            </div>
            <div className="event-info-card rounded-xl p-6 card-hover fade-in-up" style={{animationDelay: '0.8s'}} data-testid="event-capacity">
              <Users className="w-6 h-6 text-accent mx-auto mb-3" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponível</p>
                <p className="font-bold text-lg text-primary stats-counter">{100 - ranking.length}/100</p>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <div className="achievement-badge rounded-lg p-4 text-center fade-in-up" style={{animationDelay: '1.0s'}}>
              <Shield className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-semibold text-primary">Evento Oficial</p>
            </div>
            <div className="achievement-badge rounded-lg p-4 text-center fade-in-up" style={{animationDelay: '1.2s'}}>
              <Gift className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-semibold text-primary">Kit Completo</p>
            </div>
            <div className="achievement-badge rounded-lg p-4 text-center fade-in-up" style={{animationDelay: '1.4s'}}>
              <Medal className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-semibold text-primary">Medalha Finisher</p>
            </div>
            <div className="achievement-badge rounded-lg p-4 text-center fade-in-up" style={{animationDelay: '1.6s'}}>
              <Crown className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-semibold text-primary">Ranking Oficial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="bg-card rounded-xl p-6 premium-shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span>Progresso das Inscrições</span>
            </h3>
            <Badge className="bg-accent text-accent-foreground font-bold">
              {ranking.length} inscritos
            </Badge>
          </div>
          <div className="progress-bar h-3 mb-2">
            <div 
              className="progress-fill h-full" 
              style={{ width: `${(ranking.length / 100) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0 vagas</span>
            <span className="font-medium text-accent">{100 - ranking.length} vagas restantes</span>
            <span>100 vagas</span>
          </div>
        </div>
      </div>

      {/* Motivational Section */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="bento-grid">
          <div className="bento-card" data-testid="motivation-challenge">
            <div className="flex items-center space-x-3 mb-3">
              <Target className="w-6 h-6 text-accent" />
              <h3 className="font-bold text-primary">Desafie-se</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Supere seus limites e descubra do que você é capaz. Cada corrida é uma nova oportunidade de crescimento.
            </p>
          </div>
          <div className="bento-card" data-testid="motivation-community">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="w-6 h-6 text-accent" />
              <h3 className="font-bold text-primary">Comunidade</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Faça parte de uma comunidade apaixonada por movimento, onde cada conquista é celebrada juntos.
            </p>
          </div>
          <div className="bento-card" data-testid="motivation-health">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="w-6 h-6 text-accent" />
              <h3 className="font-bold text-primary">Saúde Total</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Invista na sua saúde física e mental. Corrida é medicina natural para corpo e alma.
            </p>
          </div>
          <div className="bento-card" data-testid="motivation-achievement">
            <div className="flex items-center space-x-3 mb-3">
              <Flame className="w-6 h-6 text-accent" />
              <h3 className="font-bold text-primary">Conquiste Metas</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforme sonhos em realidade. Cada passo te aproxima dos seus objetivos pessoais.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Registration Form */}
          <div className="order-2 lg:order-1">
            <Card id="inscricao" className="premium-shadow-lg card-hover">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-brand font-bold text-primary mb-2">
                  Dados da Inscrição
                </CardTitle>
                <p className="text-muted-foreground">Preencha suas informações para participar</p>
              </CardHeader>
              <CardContent className="p-8">

                {/* Enhanced Benefits */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-primary text-lg">Experiência Completa Inclusa</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="feature-highlight rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Coffee className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-primary">Café da Tarde Premium</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Deliciosos quitutes e bebidas para repor suas energias</p>
                    </div>
                    <div className="feature-highlight rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Award className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-primary">Kit Oficial Completo</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Camiseta técnica, número de peito e brindes exclusivos</p>
                    </div>
                    <div className="feature-highlight rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Medal className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-primary">Medalha de Finisher</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Medalha comemorativa para todos os participantes</p>
                    </div>
                    <div className="feature-highlight rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <MapPin className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-primary">Credenciamento VIP</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Retirada do kit 1h antes (16:00h) - sem filas</p>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="testimonial-card rounded-lg p-4 mb-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">Maria Silva</p>
                      <p className="text-xs text-muted-foreground">Participante 2024</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Evento incrível! Organização perfeita, percurso desafiador e aquele café da tarde que valeu cada passo. Já estou ansiosa pela próxima edição!"
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Registration Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="block text-lg font-bold text-primary mb-3 flex items-center space-x-2">
                      <User className="w-5 h-5 text-accent" />
                      <span>Nome Completo *</span>
                    </Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      className="w-full px-6 py-4 bg-background border-2 border-border hover:border-accent/50 focus:border-accent rounded-xl text-lg font-medium smooth-transition premium-shadow-lg focus:ring-4 focus:ring-accent/20"
                      placeholder="Digite seu nome completo"
                      data-testid="input-runner-name"
                      disabled={registrationMutation.isPending}
                    />
                    {form.formState.errors.name && (
                      <p className="text-destructive text-sm mt-2 flex items-center space-x-1" data-testid="error-name">
                        <span className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-xs text-white">!</span>
                        <span>{form.formState.errors.name.message}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-accent" />
                      <span>Seus dados estão seguros e protegidos</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={registrationMutation.isPending}
                    className="w-full bg-accent hover:bg-accent/90 hover:scale-[1.02] text-accent-foreground font-semibold py-4 px-6 rounded-xl smooth-transition premium-shadow glow-accent shimmer pulse-accent"
                    data-testid="button-submit-registration"
                  >
                    {registrationMutation.isPending 
                      ? (
                        <span className="flex items-center justify-center space-x-2">
                          <Activity className="w-5 h-5 animate-spin" />
                          <span>Processando...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-2">
                          <Zap className="w-5 h-5" />
                          <span>Confirmar Inscrição</span>
                        </span>
                      )
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

          {/* Podium dos Vencedores */}
          <div className="order-1 lg:order-2">
            <Card className="premium-shadow-lg card-hover h-fit sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    <span>Pódium dos Vencedores</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-accent border-accent">
                    {ranking.length}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-end justify-center space-x-4 mb-6">
                  {/* 2º Lugar */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-400 rounded-t-lg flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-gray-900">2</span>
                    </div>
                    <div className="w-20 h-12 bg-gray-400/20 rounded-t border-2 border-gray-400/40"></div>
                    <p className="text-xs text-muted-foreground mt-2">2º Lugar</p>
                  </div>
                  
                  {/* 1º Lugar */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-yellow-500 rounded-t-lg flex items-center justify-center mb-2">
                      <Crown className="w-8 h-8 text-yellow-900" />
                    </div>
                    <div className="w-24 h-16 bg-yellow-500/20 rounded-t border-2 border-yellow-500/40"></div>
                    <p className="text-xs text-accent font-semibold mt-2">1º Lugar</p>
                  </div>
                  
                  {/* 3º Lugar */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-amber-600 rounded-t-lg flex items-center justify-center mb-2">
                      <span className="text-xl font-bold text-amber-900">3</span>
                    </div>
                    <div className="w-18 h-10 bg-amber-600/20 rounded-t border-2 border-amber-600/40"></div>
                    <p className="text-xs text-muted-foreground mt-2">3º Lugar</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Os primeiros colocados serão revelados após a corrida
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Medal className="w-4 h-4 text-accent" />
                    <span className="text-xs text-accent font-medium">Premiação Especial</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}