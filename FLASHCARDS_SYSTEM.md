# 📚 Sistema de Revisão Espaçada - Documentação Completa

## 🎯 Visão Geral

Sistema de flashcards com **revisão espaçada baseada em tempo real** (minutos/dias), onde cartões aparecem apenas quando:
1. São **novos** (`status: 'new'`)
2. Estão em **aprendizado** (`status: 'learning'`) **E o timer já venceu**
3. Cartões **dominados** (`status: 'mastered'`) **não aparecem por 4 dias**

---

## ⏱️ Intervalos de Tempo por Rating

| Rating | Intervalo | Próximo Status | Descrição |
|--------|-----------|---------------|-----------|
| **Again** (❌) | **1 minuto** | `learning` | Errou - precisa revisar logo |
| **Hard** (🟡) | **6 minutos** | `learning` | Difícil - revisão em breve |
| **Good** (✅) | **10 minutos** | `learning` | Bom - revisão moderada |
| **Easy** (⭐) | **4 dias** | `mastered` | Fácil - dominou o cartão |

---

## 🔄 Fluxo do Sistema

### 1️⃣ Criação do Cartão
```
Novo cartão → status: 'new'
              next_review_date: agora
              review_interval: 0
```
- Aparece **imediatamente** ao clicar em "Study"

---

### 2️⃣ Primeira Revisão

#### Cenário A: Clicou "Easy"
```
new → mastered (4 dias)
```
- **Não aparece mais por 4 dias**
- Próxima revisão: `now + 4 dias`

#### Cenário B: Clicou "Good" ou "Hard"
```
new → learning (10min ou 6min)
```
- Aparece novamente após o tempo
- Se clicar "Study" antes do tempo: **não aparece** (mostra countdown)

#### Cenário C: Clicou "Again"
```
new → learning (1min)
```
- Revisão rápida em 1 minuto

---

### 3️⃣ Exemplo Prático

**Você tem 3 cartões:**

1. **Cartão A** - Resposta: `hard` (6min)
2. **Cartão B** - Resposta: `good` (10min)  
3. **Cartão C** - Resposta: `easy` (4 dias)

**O que acontece:**

| Tempo | Ação | Cartões Disponíveis |
|-------|------|---------------------|
| T=0 | Finalizou os 3 | Nenhum (todos em cooldown) |
| T=0 | Clica "Study" | ❌ Mostra: "Próximo em 6min" + lista de espera |
| T=6min | Clica "Study" | ✅ Apenas **Cartão A** aparece |
| T=10min | Clica "Study" | ✅ **Cartão A** e **Cartão B** |
| T=4 dias | Clica "Study" | ✅ Todos (A, B, C) |

---

## 🛠️ Backend - API Endpoints

### 📌 GET `/flashcards/decks/:deckId/due`
**Retorna cartões disponíveis para estudo**

**Lógica:**
```sql
SELECT * FROM flashcards
WHERE deck_id = :deckId
  AND user_id = :userId
  AND is_suspended = false
  AND (
    status = 'new' 
    OR 
    (status = 'learning' AND next_review_date <= NOW())
  )
ORDER BY next_review_date ASC
LIMIT 100
```

**Resposta quando há cartões:**
```json
{
  "available": true,
  "count": 5,
  "cards": [ /* array de flashcards */ ],
  "next_available_at": null,
  "waiting": []
}
```

**Resposta quando NÃO há cartões:**
```json
{
  "available": false,
  "count": 0,
  "cards": [],
  "next_available_at": "2025-11-13T02:35:00Z",
  "waiting": [
    {
      "id": "uuid",
      "front": "Pergunta do cartão",
      "next_review_date": "2025-11-13T02:35:00Z",
      "interval_minutes": 6
    }
  ]
}
```

---

### 📌 POST `/flashcards/cards/:id/review`
**Registra uma revisão e atualiza o timer**

**Body:**
```json
{
  "rating": "good",  // "again" | "hard" | "good" | "easy"
  "response_time_seconds": 5,
  "session_id": "uuid-opcional"
}
```

**Lógica Interna:**
```typescript
// ========================================
// SISTEMA DE REVISÃO ESPAÇADA POR TEMPO
// ========================================
if (rating === 'again') {
  newInterval = 1; // 1 minuto
  status = 'learning';
} else if (rating === 'easy') {
  newInterval = 4 * 24 * 60; // 4 dias em minutos
  status = 'mastered';
} else if (rating === 'hard') {
  newInterval = 6; // 6 minutos
  status = 'learning';
} else { // good
  newInterval = 10; // 10 minutos
  status = 'learning';
}

// Próxima revisão = agora + intervalo
next_review_date = NOW() + (newInterval * 60 * 1000);
```

**Resposta:**
```json
{
  "success": true,
  "next_review_date": "2025-11-13T02:35:00Z",
  "status": "learning",
  "interval_minutes": 6
}
```

---

### 📌 PATCH `/flashcards/cards/:id/reset-timer`
**Reset do timer - força disponibilidade imediata**

**Quando usar:**
- Usuário quer revisar antes do tempo
- Botão "Reset" no modal de espera

**Lógica:**
```typescript
UPDATE flashcards
SET next_review_date = NOW()
WHERE id = :cardId
```

**Resposta:**
```json
{
  "success": true,
  "message": "Timer reset - card available now"
}
```

---

## 🎨 Frontend - Componentes

### 1️⃣ `FlashcardsPage.tsx`

**Função `startStudy(deck)`:**
```typescript
async function startStudy(deck: Deck) {
  // 1. Busca cartões disponíveis
  const dueData = await fetch(`/flashcards/decks/${deck.id}/due`);
  
  // 2. Se não há cartões, mostra modal de espera
  if (!dueData.available) {
    setWaitingDialogOpen(true);
    return;
  }
  
  // 3. Se há cartões, inicia sessão normalmente
  setStudyMode(true);
  setSelectedDeck({ ...deck, flashcards: dueData.cards });
}
```

---

### 2️⃣ `WaitingCardsDialog.tsx`

**Modal exibido quando não há cartões disponíveis**

**Funcionalidades:**
- ⏰ **Countdown em tempo real** até o próximo cartão
- 📋 **Lista de cartões em espera** com tempo restante cada um
- 🔄 **Botão "Reset"** por cartão (força disponibilidade)
- 🔃 **Botão "Refresh"** para atualizar a lista

**Exemplo Visual:**
```
┌─────────────────────────────────────┐
│ 🕐 No Cards Available               │
│                                     │
│   Next card available in            │
│          5m 23s                     │
│                                     │
│ Cards in cooldown (3):              │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ What is React?              │   │
│ │ ⏱ 5m 23s remaining  [Reset] │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Explain useState            │   │
│ │ ⏱ 9m 12s remaining  [Reset] │   │
│ └─────────────────────────────┘   │
│                                     │
│ [🔃 Refresh]    [Close]            │
└─────────────────────────────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `flashcards`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `status` | `enum` | `'new'`, `'learning'`, `'review'`, `'mastered'` |
| `review_interval` | `integer` | **Em MINUTOS** (ex: 1, 6, 10, 5760 para 4 dias) |
| `next_review_date` | `timestamp` | Timestamp de quando pode aparecer novamente |
| `repetitions` | `integer` | Quantas vezes foi revisado com sucesso |
| `ease_factor` | `decimal` | Fator SM-2 (1.3 a 2.5+) |

**Exemplo de dados:**
```json
{
  "id": "uuid",
  "front": "What is React?",
  "back": "A JavaScript library",
  "status": "learning",
  "review_interval": 6,  // 6 minutos
  "next_review_date": "2025-11-13T02:35:00Z",
  "repetitions": 1,
  "ease_factor": 2.36
}
```

---

## 🔍 Análise dos Seus Dados

### ❌ Problema Identificado:
```json
{
  "status": "review",           // ❌ Errado
  "review_interval": 6,          // ✅ OK (6 dias mas deveria ser minutos)
  "next_review_date": "2025-11-19T02:32:55.468+00" // ❌ 6 DIAS no futuro
}
```

### ✅ Como Deve Ficar Após as Alterações:
```json
{
  "status": "learning",         // ✅ Correto
  "review_interval": 6,          // ✅ Agora em MINUTOS
  "next_review_date": "2025-11-13T02:38:55Z" // ✅ 6 MINUTOS no futuro
}
```

---

## 🧪 Casos de Teste

### Teste 1: Again (1 min)
```
1. Criar cartão novo
2. Clicar "Study"
3. Responder "Again"
4. Verificar: status = "learning", interval = 1
5. Clicar "Study" imediatamente → ❌ Não deve aparecer
6. Esperar 1 minuto
7. Clicar "Study" → ✅ Deve aparecer
```

### Teste 2: Easy (4 dias)
```
1. Criar cartão novo
2. Responder "Easy"
3. Verificar: status = "mastered", interval = 5760 (4 dias em min)
4. Clicar "Study" → ❌ Não deve aparecer
5. Modal mostra: "Next in 4 days"
```

### Teste 3: Good → Hard → Good
```
1. Cartão novo → "Good" (10min)
2. Esperar 10min → aparece
3. Responder "Hard" (6min)
4. Esperar 6min → aparece
5. Responder "Good" (10min)
6. Status sempre "learning"
```

### Teste 4: Reset Timer
```
1. Cartão em cooldown (6min restantes)
2. Abrir modal de espera
3. Clicar "Reset" no cartão
4. Clicar "Refresh"
5. Clicar "Study" → ✅ Cartão aparece
```

---

## 📊 Contadores do Deck

No card do deck, mostra:

| Badge | Cor | Conta |
|-------|-----|-------|
| **Total** | Cinza | Todos os cartões |
| **New** | Azul | `status = 'new'` |
| **Learning** | Laranja | `status = 'learning'` |
| **Mastered** | Verde | `status = 'mastered'` |

**Importante:** Botão "Study" habilita apenas se houver:
- Cartões `new` OU
- Cartões `learning` com `next_review_date <= NOW()`

---

## 🚀 Como Funciona na Prática

### Cenário Real: Estudando 10 Palavras em Inglês

**T=0**: Cria 10 cartões novos
```
Study → 10 cartões aparecem (todos "new")
```

**T=5min**: Terminou de revisar os 10
- 2 marcados "Easy" → **mastered** (4 dias)
- 5 marcados "Good" → **learning** (10min)
- 3 marcados "Hard" → **learning** (6min)

**T=5min**: Clica "Study" novamente
```
❌ Modal: "No cards available"
    Next in: 1m 0s
    
    Cards in cooldown (8):
    - Card 1: 1m 0s [Reset]
    - Card 2: 1m 0s [Reset]
    - Card 3: 1m 0s [Reset]
    - Card 4: 5m 0s [Reset]
    ...
```

**T=11min**: Clica "Study"
```
✅ 3 cartões aparecem (os "Hard" de 6min)
```

**T=15min**: Terminou os 3, clica "Study"
```
✅ 5 cartões aparecem (os "Good" de 10min)
```

**T=4 dias**: Clica "Study"
```
✅ 2 cartões aparecem (os "Easy" dominados)
```

---

## 🎓 Resumo Executivo

### ✅ O Que Foi Implementado

1. **Intervalos Reais em Minutos:**
   - Again: 1min
   - Hard: 6min
   - Good: 10min
   - Easy: 4 dias (5760min)

2. **Filtro Inteligente:**
   - Só aparecem cartões `new` ou `learning` com timer vencido
   - Endpoint `/due` retorna apenas disponíveis

3. **Modal de Espera:**
   - Countdown em tempo real
   - Lista de cartões com tempo restante
   - Botão reset por cartão

4. **Status Corretos:**
   - `new`: Nunca revisado
   - `learning`: Em aprendizado (tem timer)
   - `mastered`: Dominado (só reaparece após 4 dias)

5. **Endpoint de Reset:**
   - Força cartão a ficar disponível
   - Útil para revisões urgentes

---

## 🐛 Como Verificar se Está Funcionando

1. **Criar 2 cartões novos**
2. **Revisar ambos:** um `hard`, um `good`
3. **Clicar "Study" imediatamente:**
   - Deve mostrar modal "No cards available"
   - Deve mostrar "Next in X minutes"
4. **Esperar 6 minutos**
5. **Clicar "Study":**
   - Deve aparecer apenas o cartão `hard`
6. **Esperar mais 4 minutos (total 10min)**
7. **Clicar "Study":**
   - Deve aparecer os dois cartões

---

## 📝 Observações Importantes

- ⚠️ **Cartões antigos** no banco podem ter `review_interval` em dias. Execute UPDATE para corrigir.
- ⚠️ **Status "review"** não é mais usado - sempre será `learning` ou `mastered`.
- ✅ **Intervalos agora em MINUTOS** (exceto `mastered` que usa minutos equivalentes a 4 dias).

---

## 🔄 Migração de Dados Antigos (Opcional)

Se você tem cartões antigos com dados incorretos:

```sql
-- Resetar todos para "new" (recomeçar do zero)
UPDATE flashcards
SET status = 'new',
    review_interval = 0,
    next_review_date = NOW(),
    repetitions = 0
WHERE status IN ('review', 'learning');

-- OU manter mastered mas corrigir intervalos
UPDATE flashcards
SET review_interval = review_interval * 24 * 60  -- converter dias para minutos
WHERE status = 'mastered';
```

---

**Fim da Documentação** ✅
