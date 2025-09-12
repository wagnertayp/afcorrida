import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Search, Download, Trash2, LogOut, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check authentication status
  const { data: authStatus } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/auth/check"],
    enabled: true,
  });

  if (authStatus?.authenticated && !isAuthenticated) {
    setIsAuthenticated(true);
  }

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      form.reset();
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel administrativo",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.clear();
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      });
    },
  });

  // Fetch registrants
  const { data: registrants = [], isLoading } = useQuery<Registrant[]>({
    queryKey: ["/api/registrants", searchQuery ? `?search=${searchQuery}` : ""],
    enabled: isAuthenticated,
  });

  // Fetch statistics
  const { data: stats } = useQuery<{ total: number; confirmed: number; pending: number }>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pendente" | "confirmado" }) => {
      const response = await apiRequest("PATCH", `/api/registrants/${id}/payment-status`, {
        payment_status: status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status atualizado!",
        description: "Status de pagamento foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear all registrants mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/registrants");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Registros limpos!",
        description: "Todos os registros foram removidos com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao limpar registros",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export CSV function
  const exportCSV = async () => {
    try {
      const response = await fetch("/api/registrants/export", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inscricoes.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "CSV exportado!",
        description: "O arquivo foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o CSV",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <section className="min-h-screen bg-gradient-overlay">
        <div className="max-w-md mx-auto px-4 py-16">
          <Card className="apple-shadow-lg">
            <CardContent className="pt-8 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-primary mb-2">Painel Admin</h2>
                <p className="text-muted-foreground">Acesso restrito a administradores</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                    Usuário
                  </Label>
                  <Input
                    id="username"
                    {...form.register("username")}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent smooth-transition"
                    placeholder="Digite seu usuário"
                    data-testid="input-admin-username"
                  />
                  {form.formState.errors.username && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent smooth-transition"
                    placeholder="Digite sua senha"
                    data-testid="input-admin-password"
                  />
                  {form.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-accent hover:bg-yellow-500 text-accent-foreground font-semibold py-3 px-6 rounded-lg smooth-transition apple-shadow"
                  data-testid="button-admin-login"
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-overlay">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">Dashboard</h2>
            <p className="text-muted-foreground">Gerenciar inscrições da corrida</p>
          </div>
          <Button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="bg-primary hover:bg-gray-800 text-primary-foreground px-4 py-2 rounded-lg smooth-transition"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="apple-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total de Inscritos</p>
                  <p className="text-3xl font-bold text-primary" data-testid="stat-total">
                    {stats?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground font-bold">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pagamentos Confirmados</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="stat-confirmed">
                    {stats?.confirmed || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600" data-testid="stat-pending">
                    {stats?.pending || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="apple-shadow mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou número..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 px-4 py-2 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent smooth-transition"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={exportCSV}
                  className="bg-accent hover:bg-yellow-500 text-accent-foreground px-4 py-2 rounded-lg smooth-transition font-medium"
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg smooth-transition font-medium"
                      data-testid="button-clear-records"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Registros
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription>
                        Tem certeza que deseja limpar todos os registros? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-clear">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearAllMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-confirm-clear"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrants Table */}
        <Card className="apple-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Número</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                ) : registrants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  registrants.map((registrant) => (
                    <tr key={registrant.id} className="hover:bg-secondary smooth-transition" data-testid={`row-registrant-${registrant.id}`}>
                      <td className="px-6 py-4">
                        <span className="font-bold text-accent text-lg" data-testid={`text-bib-${registrant.id}`}>
                          #{registrant.bib}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium" data-testid={`text-name-${registrant.id}`}>
                          {registrant.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-muted-foreground" data-testid={`text-date-${registrant.id}`}>
                          {new Date(registrant.created_at).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            registrant.payment_status === "confirmado"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                          data-testid={`text-status-${registrant.id}`}
                        >
                          {registrant.payment_status === "confirmado" ? "Confirmado" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {registrant.payment_status === "pendente" ? (
                          <Button
                            onClick={() =>
                              updatePaymentMutation.mutate({
                                id: registrant.id,
                                status: "confirmado",
                              })
                            }
                            disabled={updatePaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm smooth-transition"
                            data-testid={`button-confirm-${registrant.id}`}
                          >
                            Confirmar
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pago</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
