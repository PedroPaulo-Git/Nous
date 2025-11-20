# 📊 Sistema de Daily Goal Progress - Documentação

## 🎯 Problema Identificado

**Sintoma:** Usuário faz 6 reviews mas contador mostra 9/20.

**Causa Raiz:** Soma duplicada na tela de resultados:
```tsx
// ❌ ERRADO (somava duas vezes)
{todayStudied + studySession.cards_studied}/{dailyGoal}

// ✅ CORRETO (usa valor já atualizado do servidor)
{todayStudied}/{dailyGoal}
```

---

## 🔄 Fluxo Correto de Contagem

### 1️⃣ Durante o Estudo

```tsx
// handleCardRating() - incrementa APENAS ao avaliar
const updatedSession = {
  cards_studied: studySession.cards_studied + 1,  // +1 por rating
  cards_correct: wasCorrect ? +1 : 0,
  cards_wrong: !wasCorrect ? +1 : 0,
};
```

**Importante:** 
- ✅ Incrementa ao clicar em **Again/Hard/Good/Easy**
- ❌ NÃO incrementa ao:
  - Virar o card
  - Navegar com setas prev/next
  - Visualizar o card

---

### 2️⃣ Ao Finalizar Sessão

```tsx
// finishStudySession()
const session = {
  cards_studied: 3,  // Total de avaliações
  cards_correct: 2,
  cards_wrong: 1,
  duration_seconds: 45,
  accuracy_percentage: 66,
};

// 1. Envia para backend
POST /flashcards/sessions
Body: { ...session }

// 2. Backend salva em study_sessions
INSERT INTO study_sessions (cards_studied=3, ...)

// 3. Backend atualiza user_study_stats
UPDATE user_study_stats 
SET total_cards_studied = total_cards_studied + 3

// 4. Frontend aguarda atualização
await fetchUserStats();  // ← CRÍTICO: await antes de mostrar resultados

// 5. Mostra tela de resultados
setShowResults(true);
```

---

### 3️⃣ Endpoint /stats/today

```typescript
// Backend: apps/api/src/routes/flashcards.ts
app.get('/stats/today', async (req) => {
  const today = '2025-11-13';
  
  // Soma todos os cards_studied das sessões de HOJE
  SELECT SUM(cards_studied) FROM study_sessions
  WHERE user_id = :userId
    AND DATE(started_at) = :today;
  
  // Exemplo de dados:
  // Sessão 1: cards_studied = 3
  // Sessão 2: cards_studied = 2
  // Sessão 3: cards_studied = 1
  // Total: 6 ✅
  
  return { today_studied: 6 };
});
```

---

### 4️⃣ Tela de Resultados

```tsx
// ANTES (errado - soma duplicada):
<span>{todayStudied + studySession.cards_studied}/{dailyGoal}</span>
// Se todayStudied = 3 e cards_studied = 3 → mostra 6 + 3 = 9 ❌

// DEPOIS (correto - valor já atualizado):
<span>{todayStudied}/{dailyGoal}</span>
// todayStudied já foi atualizado via fetchUserStats() → mostra 6 ✅
```

**Por que funciona:**
1. `finishStudySession` → POST /sessions → backend atualiza total
2. `await fetchUserStats()` → GET /stats/today → pega total atualizado
3. `todayStudied` agora contém o valor correto (incluindo sessão atual)
4. Não precisa somar novamente

---

## 🗄️ Estrutura do Banco

### Tabela: `study_sessions`

Cada linha = 1 sessão de estudo completa

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "deck_id": "uuid",
  "started_at": "2025-11-13T02:30:56Z",
  "ended_at": "2025-11-13T02:31:03Z",
  "duration_seconds": 7,
  "cards_studied": 3,      // ← Quantos reviews foram feitos
  "cards_correct": 2,
  "cards_wrong": 1,
  "accuracy_percentage": 66.67
}
```

### Tabela: `user_study_stats`

1 linha por usuário (acumulado total)

```json
{
  "user_id": "uuid",
  "total_cards_studied": 17,    // ← Soma de TODAS as sessões
  "total_sessions": 6,
  "current_streak": 1,
  "daily_cards_goal": 20,
  "last_study_date": "2025-11-13"
}
```

---

## 📈 Cálculo do Contador Diário

### Query Interna (Backend)

```sql
-- Endpoint: GET /flashcards/stats/today
SELECT SUM(cards_studied) as today_studied
FROM study_sessions
WHERE user_id = :userId
  AND started_at >= '2025-11-13T00:00:00Z'
  AND started_at <= '2025-11-13T23:59:59Z';
```

### Exemplo de Dados

**study_sessions (hoje):**
| Session ID | Started At | Cards Studied |
|------------|-----------|---------------|
| session-1  | 02:23:45  | 2 |
| session-2  | 02:24:38  | 3 |
| session-3  | 02:30:47  | 3 |
| session-4  | 02:31:03  | 3 |
| session-5  | 02:32:26  | 3 |
| session-6  | 02:33:01  | 3 |

**Total:** 2 + 3 + 3 + 3 + 3 + 3 = **17 cards** ✅

**Frontend exibe:** `17/20` (85% do goal)

---

## 🐛 Casos de Erro Conhecidos

### ❌ Erro 1: Contador duplicado

**Problema:** Tela mostra 9/20 após estudar 6 cards

**Causa:** Soma duplicada `todayStudied + cards_studied`

**Solução:** 
```tsx
// Remover a soma na tela de resultados
<span>{todayStudied}/{dailyGoal}</span>
```

---

### ❌ Erro 2: Contador não atualiza

**Problema:** Finish session mas contador não muda

**Causa:** `fetchUserStats()` não aguardado (sem `await`)

**Solução:**
```tsx
// ANTES
fetchUserStats();  // não espera
setShowResults(true);  // mostra com valor antigo

// DEPOIS
await fetchUserStats();  // espera atualizar
setShowResults(true);  // mostra com valor novo
```

---

### ❌ Erro 3: Contador incrementa ao navegar

**Problema:** Setas prev/next incrementam contador

**Causa:** `cards_studied++` no lugar errado

**Solução:**
```tsx
// ✅ CORRETO: incrementar APENAS em handleCardRating
const handleCardRating = (rating) => {
  cards_studied++;  // ← Aqui sim
};

// ❌ ERRADO: não incrementar em nextCard/prevCard
const nextCard = () => {
  setCurrentCardIndex(i + 1);  // ← SEM incrementar
};
```

---

## 🧪 Casos de Teste

### Teste 1: Sessão Simples
```
1. Criar 3 cartões novos
2. Estudar os 3 e avaliar todos (good/hard/again)
3. Verificar: contador deve mostrar 3/20
4. Fazer outra sessão com 2 cards
5. Verificar: contador deve mostrar 5/20
```

### Teste 2: Navegação Não Conta
```
1. Iniciar estudo com 5 cards
2. Avaliar primeiro card (good) → 1/20
3. Usar seta → próximo card
4. Usar seta → card anterior
5. Avaliar segundo card (hard) → 2/20
6. Verificar: contador NÃO incrementou nas navegações
```

### Teste 3: Múltiplas Sessões
```
1. Sessão 1: 3 reviews → 3/20
2. Sessão 2: 5 reviews → 8/20
3. Sessão 3: 2 reviews → 10/20
4. Verificar soma acumulada correta
```

### Teste 4: Virar Card Não Conta
```
1. Iniciar estudo
2. Virar card 10 vezes (clicar no card)
3. NÃO avaliar
4. Verificar: contador permanece 0/20
```

---

## 📊 Monitoramento

### Como Verificar se Está Correto

**Console do navegador:**
```javascript
// Após finalizar sessão
console.log('Session:', studySession);
// { cards_studied: 3, cards_correct: 2, cards_wrong: 1 }

console.log('Today studied:', todayStudied);
// 6 (soma de todas as sessões de hoje)
```

**Query SQL direto no banco:**
```sql
-- Verificar sessões de hoje
SELECT 
  started_at,
  cards_studied,
  cards_correct,
  cards_wrong
FROM study_sessions
WHERE user_id = :userId
  AND DATE(started_at) = CURRENT_DATE
ORDER BY started_at DESC;

-- Verificar total
SELECT SUM(cards_studied) as total_today
FROM study_sessions
WHERE user_id = :userId
  AND DATE(started_at) = CURRENT_DATE;
```

---

## ✅ Checklist de Correções Aplicadas

- [x] Remover soma duplicada na tela de resultados
- [x] Adicionar `await fetchUserStats()` antes de mostrar resultados
- [x] Documentar que incremento só ocorre em `handleCardRating`
- [x] Adicionar comentários explicativos no código
- [x] Garantir que navegação (prev/next) não incrementa
- [x] Garantir que virar card não incrementa

---

## 🎓 Resumo Executivo

**Como funciona:**
1. Usuário avalia card → `cards_studied++` (local)
2. Fim da sessão → POST /sessions (salva no banco)
3. Backend atualiza `user_study_stats.total_cards_studied`
4. Frontend busca GET /stats/today → pega soma do dia
5. Exibe contador: `todayStudied/dailyGoal`

**Regra de ouro:** 
- Incrementar APENAS ao avaliar (again/hard/good/easy)
- Usar valor do servidor (todayStudied) após atualização
- NUNCA somar localmente na tela de resultados

---

**Fim da Documentação** ✅
