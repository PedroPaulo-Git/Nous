"use client";

import { useState, useEffect as React_useEffect } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Edit2, Info } from "lucide-react";
import { toast } from "sonner";
import type { Deck } from "@/types/flashcards";
import { DeckInfoTab } from "./DeckInfoTab";
import { DeckCardsTab } from "./DeckCardsTab";
import { DeleteDeckDialog } from "./DeleteDeckDialog";

interface DeckSettingsDialogProps {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
  authHeader: () => Promise<HeadersInit>;
  apiUrl: string;
  initialTab?: "info" | "edit" | "cards";
}

export function DeckSettingsDialog({ 
  deck, 
  open, 
  onOpenChange, 
  onUpdate,
  onDelete,
  authHeader,
  apiUrl,
  initialTab = "info"
}: DeckSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"info" | "edit" | "cards">(initialTab);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Update activeTab when initialTab changes
  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  
  // Edit form states
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || "");
  const [color, setColor] = useState(deck.color || "#6366f1");

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    setSaving(true);
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${apiUrl}/flashcards/decks/${deck.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name, description, color })
      });
      
      if (!response.ok) throw new Error('Failed to update deck');
      
      toast.success("Deck updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error updating deck", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onOpenChange(false);
    onDelete();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color || '#6366f1' }} />
              {deck.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="info" className="data-[state=active]:bg-background">
                <Info className="w-4 h-4 mr-2" /> Info
              </TabsTrigger>
              <TabsTrigger value="edit" className="data-[state=active]:bg-background">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </TabsTrigger>
              <TabsTrigger value="cards" className="data-[state=active]:bg-background">
                Cards ({deck.flashcards?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4">
              <DeckInfoTab deck={deck} />
            </TabsContent>
            
            <TabsContent value="edit" className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Deck Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border text-foreground"
                  placeholder="Enter deck name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background border-border text-foreground"
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Deck Color</label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-background border-border text-foreground"
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
              </div>
              
              <div className="border-t border-border pt-4 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Deck
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cards" className="mt-4">
              <DeckCardsTab 
                deck={deck}
                authHeader={authHeader}
                apiUrl={apiUrl}
                onUpdate={onUpdate}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <DeleteDeckDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deckName={deck.name}
        cardCount={deck.flashcards?.length || 0}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
