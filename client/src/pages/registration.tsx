import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Registrant } from "@shared/schema";
import { CheckCircle } from "lucide-react";

const registrationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Registration() {
  const [registeredUser, setRegisteredUser] = useState<Registrant | null>(null);
  const { toast } = useToast();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await apiRequest("POST", "/api/registrants", data);
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
      toast({
        title: "Erro na inscrição",
        description: error.message || "Ocorreu um erro ao processar sua inscrição",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    registrationMutation.mutate(data);
  };

  const resetRegistration = () => {
    setRegisteredUser(null);
    form.reset();
  };

  if (registeredUser) {
    return (
      <section className="min-h-screen bg-gradient-overlay">
        <div className="max-w-md mx-auto px-4 py-16">
          <Card className="apple-shadow-lg">
            <CardContent className="pt-8 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">Inscrição Confirmada!</h3>
                <p className="text-muted-foreground mb-6">Sua inscrição foi processada com sucesso</p>
                
                <div className="bg-secondary rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-semibold" data-testid="text-registrant-name">{registeredUser.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número:</span>
                      <p className="font-bold text-accent text-xl" data-testid="text-registrant-bib">#{registeredUser.bib}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="text-yellow-600 font-medium">Pendente</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium" data-testid="text-registrant-date">
                        {new Date(registeredUser.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={resetRegistration}
                  className="w-full bg-primary hover:bg-gray-800 text-primary-foreground smooth-transition"
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
    <section className="min-h-screen bg-gradient-overlay">
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="apple-shadow-lg">
          <CardContent className="pt-8 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">Inscreva-se</h2>
              <p className="text-muted-foreground">Complete sua inscrição para a corrida</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nome do Corredor *
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent smooth-transition"
                  placeholder="Digite seu nome completo"
                  data-testid="input-runner-name"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-sm mt-1" data-testid="error-name">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={registrationMutation.isPending}
                className="w-full bg-accent hover:bg-yellow-500 text-accent-foreground font-semibold py-3 px-6 rounded-lg smooth-transition apple-shadow"
                data-testid="button-submit-registration"
              >
                {registrationMutation.isPending ? "Processando..." : "Confirmar Inscrição"}
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
    </section>
  );
}
