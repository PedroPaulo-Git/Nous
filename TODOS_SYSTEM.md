# 📋 Sistema Completo de To-Dos - Guia de Implementação

## 🎯 Visão Geral

Sistema avançado de gerenciamento de tarefas com suporte completo a:
- ✅ Título e descrição
- 📅 Datas de início e conclusão
- ⏰ Horários específicos
- 🔄 Tarefas recorrentes (diária, semanal, mensal, anual)
- 🎯 Níveis de prioridade
- 📁 Categorias
- 🏷️ Tags
- 🔔 Sistema de períodos personalizados

## 🗄️ Estrutura do Banco de Dados

### Campos da Tabela `todos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único da tarefa |
| `user_id` | UUID | ID do usuário (FK para auth.users) |
| `title` | TEXT | Título da tarefa (obrigatório) |
| `description` | TEXT | Descrição detalhada (opcional) |
| `is_done` | BOOLEAN | Status de conclusão |
| `due_date` | DATE | Data de vencimento |
| `due_time` | TIME | Horário de vencimento |
| `start_date` | DATE | Data de início |
| `start_time` | TIME | Horário de início |
| `priority` | TEXT | Prioridade: low, medium, high, urgent |
| `is_recurring` | BOOLEAN | Se a tarefa é recorrente |
| `recurrence_type` | TEXT | Tipo: daily, weekly, monthly, yearly, custom |
| `recurrence_interval` | INTEGER | Intervalo de repetição (ex: a cada 2 semanas) |
| `recurrence_days_of_week` | INTEGER[] | Dias da semana (0=Dom, 6=Sáb) |
| `recurrence_day_of_month` | INTEGER | Dia do mês para recorrência mensal |
| `recurrence_end_date` | DATE | Data final da recorrência |
| `category` | TEXT | Categoria da tarefa |
| `tags` | TEXT[] | Array de tags |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de última atualização |
| `completed_at` | TIMESTAMPTZ | Data de conclusão |

## 📦 Instalação

### 1. Execute a Migration SQL

No Supabase SQL Editor, execute:

```bash
apps/api/migrations/upgrade_todos_table.sql
```

Este script irá:
- Remover a tabela `todos` antiga (se existir)
- Criar a nova estrutura completa
- Configurar índices para performance
- Habilitar Row Level Security (RLS)
- Criar triggers automáticos para `updated_at` e `completed_at`

### 2. Reinicie o Backend

```powershell
cd apps/api
npm run dev
```

### 3. Verifique o Frontend

O frontend já está atualizado com todos os campos!

## 🎨 Recursos do Frontend

### Dialog de Criação/Edição

O dialog inclui:

1. **Informações Básicas**
   - Título (obrigatório)
   - Descrição (opcional)

2. **Prioridade**
   - 🟢 Low (Baixa)
   - 🟡 Medium (Média)
   - 🟠 High (Alta)
   - 🔴 Urgent (Urgente)

3. **Datas e Horários**
   - Data de início + horário
   - Data de vencimento + horário

4. **Organização**
   - Categoria (ex: Trabalho, Pessoal, Estudos)
   - Tags separadas por vírgula (ex: urgente, importante, revisão)

5. **Recorrência**
   - Checkbox para ativar recorrência
   - Tipo de repetição: Diária, Semanal, Mensal, Anual
   - Intervalo (a cada X dias/semanas/meses)
   - Para semanal: Seleção de dias da semana
   - Para mensal: Dia do mês
   - Data final da recorrência (opcional)

### Visualização de Tarefas

Cada tarefa mostra:
- ✅ Checkbox de conclusão
- 🎯 Ícone de prioridade
- 📝 Título e descrição
- 📅 Datas de início e vencimento
- 📁 Categoria
- 🔄 Indicador de recorrência
- 🏷️ Tags
- ⏰ Última atualização

## 🔄 Exemplos de Uso

### Tarefa Simples

```typescript
{
  title: "Comprar leite",
  priority: "medium",
  due_date: "2025-11-15"
}
```

### Tarefa com Horário Específico

```typescript
{
  title: "Reunião com cliente",
  description: "Discutir proposta do projeto X",
  priority: "high",
  start_date: "2025-11-12",
  start_time: "14:00",
  due_date: "2025-11-12",
  due_time: "15:30",
  category: "Trabalho",
  tags: ["reunião", "importante"]
}
```

### Tarefa Recorrente Diária

```typescript
{
  title: "Exercício matinal",
  description: "30 minutos de corrida",
  priority: "medium",
  start_time: "07:00",
  is_recurring: true,
  recurrence_type: "daily",
  recurrence_interval: 1,
  category: "Saúde"
}
```

### Tarefa Recorrente Semanal

```typescript
{
  title: "Reunião de equipe",
  priority: "high",
  start_date: "2025-11-12",
  start_time: "09:00",
  due_time: "10:00",
  is_recurring: true,
  recurrence_type: "weekly",
  recurrence_interval: 1,
  recurrence_days_of_week: [1, 3, 5], // Segunda, Quarta, Sexta
  recurrence_end_date: "2025-12-31",
  category: "Trabalho"
}
```

### Tarefa Recorrente Mensal

```typescript
{
  title: "Pagar aluguel",
  priority: "urgent",
  is_recurring: true,
  recurrence_type: "monthly",
  recurrence_interval: 1,
  recurrence_day_of_month: 5, // Dia 5 de cada mês
  category: "Finanças",
  tags: ["conta", "fixo"]
}
```

### Tarefa Recorrente a Cada 2 Semanas

```typescript
{
  title: "Revisão de código",
  description: "Code review do sprint",
  priority: "high",
  is_recurring: true,
  recurrence_type: "weekly",
  recurrence_interval: 2, // A cada 2 semanas
  recurrence_days_of_week: [5], // Sexta-feira
  category: "Desenvolvimento"
}
```

## 🎯 Filtros e Visualização

### Filtros Disponíveis

- **All**: Todas as tarefas
- **Active**: Apenas tarefas não concluídas
- **Completed**: Apenas tarefas concluídas

### Estatísticas

O dashboard mostra:
- Total de tarefas
- Tarefas ativas (não concluídas)
- Tarefas completadas
- Barra de progresso visual

## 🔧 API Backend

### Endpoints

#### `GET /todos`
Retorna todas as tarefas do usuário autenticado

#### `POST /todos`
Cria uma nova tarefa

**Body:**
```json
{
  "title": "Minha tarefa",
  "description": "Descrição detalhada",
  "priority": "high",
  "due_date": "2025-11-15",
  "due_time": "14:00",
  "category": "Trabalho",
  "tags": ["urgente", "importante"],
  "is_recurring": true,
  "recurrence_type": "weekly",
  "recurrence_days_of_week": [1, 3, 5]
}
```

#### `PUT /todos/:id`
Atualiza uma tarefa existente

#### `DELETE /todos/:id`
Remove uma tarefa

### Validação (Zod)

O backend valida todos os campos usando Zod:
- `title`: string obrigatória (mínimo 1 caractere)
- `priority`: enum ('low', 'medium', 'high', 'urgent')
- `recurrence_type`: enum ('daily', 'weekly', 'monthly', 'yearly', 'custom')
- `recurrence_days_of_week`: array de inteiros (0-6)
- `recurrence_day_of_month`: inteiro (1-31)

## 🎨 Indicadores Visuais

### Ícones de Prioridade

- 🟢 Baixa (Low)
- 🟡 Média (Medium)
- 🟠 Alta (High)
- 🔴 Urgente (Urgent)

### Ícones de Informação

- 📅 Datas
- 🚀 Data de início
- 📁 Categoria
- 🔄 Recorrência
- 🏷️ Tags

## 🚀 Funcionalidades Automáticas

### Trigger `updated_at`

Atualiza automaticamente o campo `updated_at` quando qualquer campo é modificado.

### Trigger `completed_at`

- Quando `is_done` muda de `false` para `true`: Define `completed_at` como agora
- Quando `is_done` muda de `true` para `false`: Define `completed_at` como NULL

## 📊 Performance

### Índices Criados

- `idx_todos_user_id`: Busca rápida por usuário
- `idx_todos_due_date`: Ordenação por data de vencimento
- `idx_todos_is_done`: Filtro por status
- `idx_todos_priority`: Filtro por prioridade
- `idx_todos_category`: Filtro por categoria

## 🔒 Segurança

### Row Level Security (RLS)

Políticas ativas:
- `SELECT`: Usuários veem apenas suas próprias tarefas
- `INSERT`: Usuários criam apenas em seu próprio nome
- `UPDATE`: Usuários editam apenas suas próprias tarefas
- `DELETE`: Usuários deletam apenas suas próprias tarefas

## 🎓 Próximos Passos Sugeridos

1. **Notificações**: Sistema de lembretes baseado em `due_date` e `due_time`
2. **Calendário**: Visualização em calendário mensal
3. **Subtarefas**: Relacionamento de tarefas pai-filho
4. **Anexos**: Upload de arquivos relacionados
5. **Colaboração**: Compartilhar tarefas entre usuários
6. **Relatórios**: Análise de produtividade
7. **Importação/Exportação**: CSV, iCal
8. **Integração**: Google Calendar, Outlook

## 📝 Notas Importantes

- Todos os campos de data/hora são opcionais exceto `title`
- Tags são armazenadas como array PostgreSQL
- Recorrência semanal permite múltiplos dias
- Recorrência pode ter data final ou ser indefinida
- Prioridade padrão é 'medium'
- `is_done` padrão é `false`

## 🐛 Troubleshooting

### Erro: "title is required"
Certifique-se de preencher o campo título antes de salvar.

### Erro: "invalid priority"
Use apenas: 'low', 'medium', 'high', 'urgent'

### Recorrência não aparece
Marque o checkbox "Recurring Task" no dialog.

### Tags não salvam
Separe tags com vírgulas: "tag1, tag2, tag3"

---

**Sistema implementado com sucesso! 🎉**
