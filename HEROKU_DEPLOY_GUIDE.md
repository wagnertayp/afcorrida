# Guia de Deploy para Heroku - Sistema de Inscrições de Corrida

## Pré-requisitos
- Conta no Heroku criada
- Heroku CLI instalado
- Git configurado

## Passo a Passo para Deploy

### 1. Preparar o Repositório
```bash
# Se ainda não é um repositório git
git init
git add .
git commit -m "Initial commit - Race registration system"
```

### 2. Criar Aplicação no Heroku
```bash
# Criar app (substitua 'seu-app-nome' por um nome único)
heroku create seu-app-nome

# Adicionar PostgreSQL (plano gratuito)
heroku addons:create heroku-postgresql:essential-0
```

### 3. Configurar Variáveis de Ambiente
```bash
# Definir NODE_ENV para produção
heroku config:set NODE_ENV=production

# Definir SESSION_SECRET (use uma chave forte!)
heroku config:set SESSION_SECRET="sua-chave-secreta-super-forte-aqui"

# Verificar se DATABASE_URL foi configurada automaticamente
heroku config
```

### 4. Deploy da Aplicação
```bash
# Fazer push para o Heroku
git push heroku main

# Se estiver usando branch diferente de main:
git push heroku sua-branch:main
```

### 5. Verificar o Deploy
```bash
# Ver logs da aplicação
heroku logs --tail

# Abrir a aplicação no navegador
heroku open
```

### 6. Configurar o Banco de Dados
O banco será configurado automaticamente após o primeiro deploy. As tabelas serão criadas pelo script `heroku-postbuild` que executa `npm run db:push`.

### 7. Verificar Funcionamento
1. **Página Principal**: Sistema de inscrições deve estar funcionando
2. **Admin Panel**: Acesse `/admin` com:
   - Usuário: `john`
   - Senha: `batata123`

## Comandos Úteis

```bash
# Ver logs em tempo real
heroku logs --tail

# Executar comandos no servidor
heroku run bash

# Conectar ao banco PostgreSQL
heroku pg:psql

# Reiniciar a aplicação
heroku restart

# Ver configurações
heroku config

# Fazer backup do banco
heroku pg:backups:capture
```

## URLs da Aplicação

Após o deploy, sua aplicação estará disponível em:
- **App URL**: `https://seu-app-nome.herokuapp.com`
- **Admin Panel**: `https://seu-app-nome.herokuapp.com/admin`

## Resolução de Problemas

### Erro de SSL no Banco
Se houver erro de conexão SSL:
```bash
heroku config:set DATABASE_SSL=require
heroku config:set DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

### Erro de Porta
O código já está configurado para usar `process.env.PORT`, então isso não deve ser um problema.

### Verificar Status da Aplicação
```bash
heroku ps
heroku logs --tail
```

### Recriar Banco (CUIDADO: Apaga todos os dados)
```bash
heroku pg:reset DATABASE_URL --confirm seu-app-nome
git push heroku main  # Redeploy para recriar tabelas
```

## Custos

- **Aplicação**: Gratuita (com limitações de horas)
- **Banco PostgreSQL Essential**: Gratuito (limitado a 10k linhas)
- **Upgrade para planos pagos**: A partir de $7/mês para app + $9/mês para banco

## Monitoramento

- **Heroku Dashboard**: https://dashboard.heroku.com
- **Logs**: `heroku logs --tail`
- **Performance**: Heroku Metrics (disponível no dashboard)

---

**Pronto!** Sua aplicação de inscrições de corrida estará online e funcionando no Heroku! 🚀