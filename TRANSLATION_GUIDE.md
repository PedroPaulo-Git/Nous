# Translation System Implementation Guide

## ✅ Completed Work

### 1. Translation Files
- ✅ **messages/en.json** - Complete with 200+ translation keys
- ✅ **messages/pt-BR.json** - Complete Portuguese translations matching English structure

### 2. Pages Updated with Translations
- ✅ **app/dashboard/page.tsx** - Fully translated
- ✅ **app/dashboard/notes/page.tsx** - Fully translated
- ⚠️ **app/dashboard/todos/page.tsx** - Partially translated (import added, t() hook added, header/dialog translated)
- ✅ **components/Navbar.tsx** - Already using translations

### 3. Infrastructure
- ✅ i18n.ts configured correctly
- ✅ NextIntlClientProvider wrapping app
- ✅ Cookie-based locale system

---

## 🔄 Remaining Work

### Priority 1: Complete Todos Page Translation
**File**: `app/dashboard/todos/page.tsx`

**Lines that need updating:**

1. **Line 281-287** - Filter tabs:
```tsx
// Current:
<TabsTrigger value="all">All ({stats.total})</TabsTrigger>
<TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
<TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>

// Change to:
<TabsTrigger value="all">{t("todos.filter_all")} ({stats.total})</TabsTrigger>
<TabsTrigger value="active">{t("todos.filter_active")} ({stats.active})</TabsTrigger>
<TabsTrigger value="completed">{t("todos.filter_completed")} ({stats.completed})</TabsTrigger>
```

2. **Line 312-318** - Empty state messages:
```tsx
// Current:
<h3 className="text-xl font-semibold text-foreground mb-2">
  {filter === "all" ? "No todos yet" : `No ${filter} todos`}
</h3>
<p className="text-muted-foreground mb-6 text-center">
  {filter === "all"
    ? "Create your first todo to get started"
    : `You have no ${filter} tasks`}
</p>

// Change to:
<h3 className="text-xl font-semibold text-foreground mb-2">
  {filter === "all" ? t("todos.no_todos") : filter === "active" ? t("todos.no_active") : t("todos.no_completed")}
</h3>
<p className="text-muted-foreground mb-6 text-center">
  {filter === "all" ? t("todos.create_first") : t("todos.no_tasks").replace("{filter}", filter)}
</p>
```

3. **Line 322** - Create button:
```tsx
// Current:
<Plus className="w-4 h-4" />
Create Todo

// Change to:
<Plus className="w-4 h-4" />
{t("todos.create_todo")}
```

4. **Find Edit button** - Add translation:
```tsx
// Current:
<Edit className="w-4 h-4" />
Edit

// Change to:
<Edit className="w-4 h-4" />
{t("todos.button_edit")}
```

### Priority 2: Update Flashcards Page
**File**: `app/dashboard/flashcards/page.tsx`

**Steps:**
1. Add import: `import { useTranslations } from "next-intl";`
2. Add hook in component: `const t = useTranslations();`
3. Replace all hardcoded strings with `t("flashcards.*")` calls

**Common strings to replace:**
- Title: `"Flashcards"` → `{t("flashcards.title")}`
- Subtitle → `{t("flashcards.subtitle")}`
- "New Deck" → `{t("flashcards.new_deck")}`
- "Study" → `{t("flashcards.study")}`
- "Add Card" → `{t("flashcards.add_card")}`
- Dialog titles and labels
- Placeholders

### Priority 3: Update Passwords Page
**File**: `app/dashboard/passwords/page.tsx`

**Steps:**
1. Add import: `import { useTranslations } from "next-intl";`
2. Add hook: `const t = useTranslations();`
3. Replace all hardcoded strings with `t("passwords.*")` calls

**Common strings to replace:**
- Title: `"Passwords"` → `{t("passwords.title")}`
- Subtitle → `{t("passwords.subtitle")}`
- "New Password" → `{t("passwords.new_password")}`
- Category tabs: `"All"`, `"Social"`, `"Work"`, etc. → `{t("passwords.category_*")}`
- Dialog content
- Form labels

### Priority 4: Update Home/Landing Page
**File**: `app/page.tsx`

**Steps:**
1. Add import: `import { useTranslations } from "next-intl";`
2. Add hook: `const t = useTranslations();`
3. Replace all hardcoded strings with `t("home.*")` and `t("landing.*")` calls

**Sections to update:**
- Landing hero: `{t("landing.hero_title")}`, `{t("landing.hero_subtitle")}`
- Features: `{t("landing.feature_notes_title")}`, etc.
- Benefits: `{t("landing.benefits_*")}`
- CTAs: `{t("landing.cta_register")}`, `{t("landing.cta_login")}`
- Unsubscribed user section: `{t("home.unsubscribed_*")}`
- Subscribed user section: `{t("home.subscribed_*")}`

### Priority 5: Update Sidebar
**File**: `components/dashboard/sidebar.tsx`

**Steps:**
1. Add import: `import { useTranslations } from "next-intl";`
2. Add hook: `const t = useTranslations();`
3. Update navigation items:

```tsx
// Current:
const navItems = [
  { name: "Notes", icon: StickyNote, href: "/dashboard/notes" },
  { name: "To-Dos", icon: CheckSquare, href: "/dashboard/todos" },
  { name: "Flashcards", icon: Brain, href: "/dashboard/flashcards" },
  { name: "Passwords", icon: Lock, href: "/dashboard/passwords" },
];

// Change to:
const t = useTranslations();
const navItems = [
  { name: t("dashboard.tool_notes"), icon: StickyNote, href: "/dashboard/notes" },
  { name: t("dashboard.tool_todos"), icon: CheckSquare, href: "/dashboard/todos" },
  { name: t("dashboard.tool_flashcards"), icon: Brain, href: "/dashboard/flashcards" },
  { name: t("dashboard.tool_passwords"), icon: Lock, href: "/dashboard/passwords" },
];
```

---

## Testing Instructions

### 1. Check LangSwitcher Component
**File**: Find and verify `components/LangSwitcher.tsx` (or similar)

Should have something like:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function LangSwitcher() {
  const router = useRouter();
  
  const changeLocale = (locale: string) => {
    Cookies.set('NEXT_LOCALE', locale);
    router.refresh();
  };

  return (
    <div>
      <button onClick={() => changeLocale('en')}>English</button>
      <button onClick={() => changeLocale('pt-BR')}>Português</button>
    </div>
  );
}
```

### 2. Test Language Switching
1. Open the app
2. Find the language switcher
3. Click to switch between English and Portuguese
4. Verify all text on the page updates correctly
5. Refresh the page - language should persist (cookie)
6. Navigate between pages - language should remain consistent

### 3. Verify Translation Keys
For each page, check that:
- All visible text uses `t()` calls
- No hardcoded English strings remain
- Console has no errors about missing translation keys
- Portuguese translations display correctly

---

## Translation Key Reference

### Available Translation Scopes
- `landing.*` - Landing page content
- `home.*` - Home page (logged in user)
- `dashboard.*` - Dashboard and tools
- `auth.*` - Authentication pages
- `notes.*` - Notes page
- `todos.*` - Todos page
- `flashcards.*` - Flashcards page
- `passwords.*` - Passwords page
- `admin.*` - Admin panel
- `common.*` - Common UI elements (loading, error, success)

### How to Use
```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('notes.title')}</h1>
      <p>{t('notes.subtitle')}</p>
      <button>{t('notes.new_note')}</button>
    </div>
  );
}
```

---

## Quick Completion Checklist

- [ ] Complete Todos page translation (filter tabs, empty states, buttons)
- [ ] Update Flashcards page (add useTranslations, replace all strings)
- [ ] Update Passwords page (add useTranslations, replace all strings)
- [ ] Update Home/Landing page (add useTranslations, replace all strings)
- [ ] Update Sidebar (add useTranslations, replace nav item names)
- [ ] Test language switching functionality
- [ ] Verify no hardcoded strings remain
- [ ] Check console for missing translation key errors
- [ ] Test all pages in both English and Portuguese
- [ ] Verify cookie persistence after refresh

---

## Current Status

✅ **Translation infrastructure**: Complete and working
✅ **Translation files**: Complete (en.json + pt-BR.json)
✅ **Pages using translations**: Dashboard, Notes, Navbar
⚠️ **Pages partially updated**: Todos (needs completion)
❌ **Pages not yet updated**: Flashcards, Passwords, Home, Sidebar

**Estimated remaining work**: 1-2 hours to complete all page updates and testing
