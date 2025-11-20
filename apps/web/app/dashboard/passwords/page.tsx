"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, API_URL } from "@/lib/api";
import { encryptPassword, decryptPassword, deserializeEncrypted, serializeEncrypted, generateSecurePassword } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lock, Plus, Edit, Trash2, Eye, EyeOff, Copy, RefreshCw, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { useTranslations } from "next-intl";
import type { Password, DecryptedPassword } from "@/types/passwords";

const categories = ["All", "Social", "Work", "Finance", "Shopping", "Other"];

export default function PasswordsPage() {
  const t = useTranslations();
  const [passwords, setPasswords] = useState<DecryptedPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<DecryptedPassword | null>(null);
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("Other");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    fetchPasswords(user); // Pass user directly
  };

  const fetchPasswords = async (currentUser?: any) => {
    try {
      // Use the passed user or the state user
      const userToUse = currentUser || user;
      
      if (!userToUse || !userToUse.email) {
        console.error("User email not available for decryption");
        setLoading(false);
        return;
      }

      const token = await getToken();
      const response = await fetch(`${API_URL}/passwords`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch passwords");
      
      const data: Password[] = await response.json();
      
      // Decrypt all passwords client-side
      const decrypted: DecryptedPassword[] = [];
      for (const pwd of data) {
        try {
          const encryptedData = deserializeEncrypted(pwd.password);
          const plaintext = await decryptPassword(encryptedData, userToUse.email);
          decrypted.push({ ...pwd, password: plaintext });
        } catch (err) {
          console.error(`Failed to decrypt password for ${pwd.website}:`, err);
          // Skip corrupted passwords
        }
      }
      
      setPasswords(decrypted);
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword(16);
    setPassword(newPassword);
    toast.success(t("common.success"));
  };

  const savePassword = async () => {
    if (!website.trim() || !username.trim() || !password.trim()) {
      toast.error(t("common.error"));
      return;
    }

    setSaving(true);
    try {
      // Encrypt password client-side before sending to server
      const encryptedData = await encryptPassword(password, user!.email!);
      const encryptedString = serializeEncrypted(encryptedData);
      
      const token = await getToken();
      const url = editingPassword
        ? `${API_URL}/passwords/${editingPassword.id}`
        : `${API_URL}/passwords`;
      
      const response = await fetch(url, {
        method: editingPassword ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          website, 
          username, 
          password: encryptedString, // Send encrypted
          category 
        }),
      });

      if (!response.ok) throw new Error("Failed to save password");

      toast.success(t("common.success"));
      setDialogOpen(false);
      resetForm();
      fetchPasswords(user); // Pass current user
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deletePassword = async (id: string, website: string) => {
    if (!confirm(`Delete password for ${website}?`)) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/passwords/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(t("common.success"));
      fetchPasswords(user); // Pass current user
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const toggleVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const openNewDialog = () => {
    resetForm();
    setEditingPassword(null);
    setDialogOpen(true);
  };

  const openEditDialog = (pwd: DecryptedPassword) => {
    setWebsite(pwd.website);
    setUsername(pwd.username);
    setPassword(pwd.password);
    setCategory(pwd.category);
    setEditingPassword(pwd);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setWebsite("");
    setUsername("");
    setPassword("");
    setCategory("Other");
  };

  const filteredPasswords = passwords.filter((pwd) =>
    selectedCategory === "All" || pwd.category === selectedCategory
  );

  const categoryColors: Record<string, string> = {
    Social: "bg-blue-500/20 text-blue-400 border-blue-400",
    Work: "bg-purple-500/20 text-purple-400 border-purple-400",
    Finance: "bg-green-500/20 text-green-400 border-green-400",
    Shopping: "bg-orange-500/20 text-orange-400 border-orange-400",
    Other: "bg-gray-500/20 text-gray-400 border-gray-400",
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-foreground">{t("passwords.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("passwords.subtitle")}</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {t("passwords.new_password")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingPassword ? t("passwords.dialog_title_edit") : t("passwords.dialog_title_new")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingPassword ? t("passwords.dialog_desc_edit") : t("passwords.dialog_desc_new")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("passwords.label_website")}</label>
                <Input
                  placeholder={t("passwords.placeholder_website")}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("passwords.label_username")}</label>
                <Input
                  placeholder={t("passwords.placeholder_username")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("passwords.label_password")}</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t("passwords.placeholder_password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generatePassword}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("passwords.label_category")}</label>
                <Tabs value={category} onValueChange={setCategory}>
                  <TabsList className="bg-muted grid grid-cols-5">
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <TabsTrigger
                        key={cat}
                        value={cat}
                        className="data-[state=active]:bg-card data-[state=active]:text-accent text-xs"
                      >
                        {t(`passwords.category_${cat.toLowerCase()}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                {t("passwords.button_cancel")}
              </Button>
              <Button
                onClick={savePassword}
                disabled={saving}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>{editingPassword ? t("passwords.button_update") : t("passwords.button_save")}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="bg-muted">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="data-[state=active]:bg-card data-[state=active]:text-accent"
            >
              {t(`passwords.category_${cat.toLowerCase()}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Passwords Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredPasswords.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <KeyRound className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {selectedCategory === "All" ? t("passwords.no_passwords") : t("passwords.no_category", { category: t(`passwords.category_${selectedCategory.toLowerCase()}`) })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory === "All"
                ? t("passwords.no_passwords_desc")
                : t("passwords.no_category", { category: t(`passwords.category_${selectedCategory.toLowerCase()}`) })}
            </p>
            {selectedCategory === "All" && (
              <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 mr-2" />
                {t("passwords.add_password")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredPasswords.map((pwd) => (
            <Card
              key={pwd.id}
              className="group hover:shadow-lg transition-all duration-200 bg-card border-border hover:border-accent"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground group-hover:text-accent transition-colors">
                      {pwd.website}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      {pwd.username}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`${categoryColors[pwd.category]} border`}>
                    {pwd.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type={visiblePasswords.has(pwd.id) ? "text" : "password"}
                    value={pwd.password}
                    readOnly
                    className="flex-1 border-border bg-background text-foreground font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleVisibility(pwd.id)}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    {visiblePasswords.has(pwd.id) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pwd.password, t("passwords.label_password"))}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(pwd)}
                  className="flex-1 border-border text-foreground hover:bg-muted"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t("passwords.button_edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deletePassword(pwd.id, pwd.website)}
                  className="border-border text-foreground hover:bg-red-900/20 hover:text-red-400 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
