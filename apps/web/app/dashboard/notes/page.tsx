"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, API_URL, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StickyNote, Plus, Edit, Trash2, Search, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { useTranslations } from "next-intl";
import type { Note } from "@/types/notes";

export default function NotesPage() {
  const t = useTranslations();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    fetchNotes();
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const fetchNotes = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch notes");
      
      const data = await response.json();
      setNotes(data);
    } catch (error: any) {
      toast.error(t("common.error"), {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!title.trim()) {
      toast.error(t("common.error"), {
        description: "Please enter a title for your note"
      });
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const url = editingNote
        ? `${API_URL}/notes/${editingNote.id}`
        : `${API_URL}/notes`;
      
      const response = await fetch(url, {
        method: editingNote ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to save note"));

      toast.success(t("common.success"), {
        description: `Your note "${title}" has been saved`
      });

      setDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error: any) {
      toast.error(t("common.error"), {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("common.success"), {
        description: `"${title}" has been removed`
      });
      
      fetchNotes();
    } catch (error: any) {
      toast.error(t("common.error"), {
        description: error.message
      });
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6 pt-20 lg:pt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("notes.title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("notes.subtitle")}</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t("notes.new_note")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingNote ? t("notes.dialog_title_edit") : t("notes.dialog_title_new")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingNote ? t("notes.dialog_desc_edit") : t("notes.dialog_desc_new")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("notes.label_title")}</label>
                <Input
                  placeholder={t("notes.placeholder_title")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("notes.label_content")}</label>
                <Textarea
                  placeholder={t("notes.placeholder_content")}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="resize-none border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                {t("notes.button_cancel")}
              </Button>
              <Button onClick={saveNote} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    {editingNote ? t("notes.button_update") : t("notes.button_create")}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("notes.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-border bg-card focus:border-accent focus:ring-accent text-foreground"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? "No notes found" : t("notes.no_notes")}
            </h3>
            <p className="text-muted-foreground mb-6 text-center">
              {searchQuery
                ? "Try adjusting your search query"
                : t("notes.no_notes_desc")}
            </p>
            {!searchQuery && (
              <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4" />
                {t("notes.create_note")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="group hover:shadow-lg transition-all duration-200 bg-card border-border hover:border-accent"
            >
              <CardHeader>
                <CardTitle className="line-clamp-1 text-foreground group-hover:text-accent transition-colors">
                  {note.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content || "No content"}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(note)}
                  className="flex-1 border-border text-foreground hover:bg-muted"
                >
                  <Edit className="w-4 h-4" />
                  {t("notes.button_edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteNote(note.id, note.title)}
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


// interface Note {
//   id: string;
//   title: string;
//   content: string;
//   created_at: string;
//   updated_at: string;
// }

// export default function NotesPage() {
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [editingNote, setEditingNote] = useState<Note | null>(null);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [user, setUser] = useState<any>(null);
//   const router = useRouter();

//   useEffect(() => {
//     checkUser();
//   }, []);

//   const checkUser = async () => {
//     const supabase = createClient();
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       router.push("/auth/login");
//       return;
//     }
//     setUser(user);
//     fetchNotes();
//   };

//   const fetchNotes = async () => {
//     try {
//       const token = await getToken();
//       const response = await fetch(`${API_URL}/notes`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       if (!response.ok) throw new Error("Failed to fetch notes");
      
//       const data = await response.json();
//       setNotes(data);
//     } catch (error: any) {
//       toast.error("Failed to load notes", {
//         description: error.message
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveNote = async () => {
//     if (!title.trim()) {
//       toast.error("Title required", {
//         description: "Please enter a title for your note"
//       });
//       return;
//     }

//     setSaving(true);
//     try {
//       const token = await getToken();
//       const url = editingNote
//         ? `${API_URL}/notes/${editingNote.id}`
//         : `${API_URL}/notes`;
      
//       const response = await fetch(url, {
//         method: editingNote ? "PUT" : "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ title, content }),
//       });

//       if (!response.ok) throw new Error("Failed to save note");

//       toast.success(editingNote ? "Note updated!" : "Note created!", {
//         description: `Your note "${title}" has been saved`
//       });

//       setDialogOpen(false);
//       resetForm();
//       fetchNotes();
//     } catch (error: any) {
//       toast.error("Save failed", {
//         description: error.message
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const deleteNote = async (id: string, title: string) => {
//     if (!confirm(`Delete "${title}"?`)) return;

//     try {
//       const token = await getToken();
//       const response = await fetch(`${API_URL}/notes/${id}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error("Failed to delete");

//       toast.success("Note deleted", {
//         description: `"${title}" has been removed`
//       });
      
//       fetchNotes();
//     } catch (error: any) {
//       toast.error("Delete failed", {
//         description: error.message
//       });
//     }
//   };

//   const openEditDialog = (note: Note) => {
//     setEditingNote(note);
//     setTitle(note.title);
//     setContent(note.content);
//     setDialogOpen(true);
//   };

//   const openNewDialog = () => {
//     resetForm();
//     setDialogOpen(true);
//   };

//   const resetForm = () => {
//     setEditingNote(null);
//     setTitle("");
//     setContent("");
//   };

//   const filteredNotes = notes.filter(
//     (note) =>
//       note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       note.content.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   if (!user) return null;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//           <div className="mb-8 space-y-4">
//             <div className="flex items-center gap-3">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
//                 <StickyNote className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
//                   Notes
//                 </h1>
//                 <p className="text-muted-foreground">Capture and organize your ideas</p>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search notes..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
              
//               <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//                 <DialogTrigger asChild>
//                   <Button onClick={openNewDialog} size="lg" className="shadow-lg">
//                     <Plus className="w-5 h-5" />
//                     New Note
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent className="sm:max-w-[600px]">
//                   <DialogHeader>
//                     <DialogTitle>
//                       {editingNote ? "Edit Note" : "Create New Note"}
//                     </DialogTitle>
//                     <DialogDescription>
//                       {editingNote ? "Make changes to your note" : "Add a new note to your collection"}
//                     </DialogDescription>
//                   </DialogHeader>
//                   <div className="space-y-4 py-4">
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Title</label>
//                       <Input
//                         placeholder="Enter note title..."
//                         value={title}
//                         onChange={(e) => setTitle(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Content</label>
//                       <Textarea
//                         placeholder="Write your note here..."
//                         value={content}
//                         onChange={(e) => setContent(e.target.value)}
//                         rows={8}
//                         className="resize-none"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex justify-end gap-3">
//                     <Button variant="outline" onClick={() => setDialogOpen(false)}>
//                       Cancel
//                     </Button>
//                     <Button onClick={saveNote} disabled={saving}>
//                       {saving ? (
//                         <>
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                           Saving...
//                         </>
//                       ) : (
//                         <>
//                           {editingNote ? "Update" : "Create"}
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </div>

//           {/* Notes Grid */}
//           {loading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {[...Array(6)].map((_, i) => (
//                 <Card key={i} className="animate-pulse">
//                   <CardHeader>
//                     <div className="h-6 bg-muted rounded w-3/4"></div>
//                     <div className="h-4 bg-muted rounded w-1/2"></div>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-2">
//                       <div className="h-4 bg-muted rounded"></div>
//                       <div className="h-4 bg-muted rounded w-5/6"></div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           ) : filteredNotes.length === 0 ? (
//             <Card className="border-dashed border-2">
//               <CardContent className="flex flex-col items-center justify-center py-16">
//                 <FileText className="w-16 h-16 text-muted-foreground mb-4" />
//                 <h3 className="text-xl font-semibold mb-2">
//                   {searchQuery ? "No notes found" : "No notes yet"}
//                 </h3>
//                 <p className="text-muted-foreground mb-6 text-center">
//                   {searchQuery
//                     ? "Try adjusting your search query"
//                     : "Create your first note to get started"}
//                 </p>
//                 {!searchQuery && (
//                   <Button onClick={openNewDialog}>
//                     <Plus className="w-4 h-4" />
//                     Create Note
//                   </Button>
//                 )}
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredNotes.map((note) => (
//                 <Card
//                   key={note.id}
//                   className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
//                 >
//                   <CardHeader>
//                     <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
//                       {note.title}
//                     </CardTitle>
//                     <CardDescription>
//                       {new Date(note.updated_at).toLocaleDateString()}
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-sm text-muted-foreground line-clamp-3">
//                       {note.content || "No content"}
//                     </p>
//                   </CardContent>
//                   <CardFooter className="flex gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => openEditDialog(note)}
//                       className="flex-1"
//                     >
//                       <Edit className="w-4 h-4" />
//                       Edit
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => deleteNote(note.id, note.title)}
//                       className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </CardFooter>
//                 </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
