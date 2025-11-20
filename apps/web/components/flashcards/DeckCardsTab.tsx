"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit2, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Deck, Flashcard } from "@/types/flashcards";

interface DeckCardsTabProps {
  deck: Deck;
  authHeader: () => Promise<HeadersInit>;
  apiUrl: string;
  onUpdate: () => void;
}

export function DeckCardsTab({ deck, authHeader, apiUrl, onUpdate }: DeckCardsTabProps) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ front: "", back: "", hint: "" });
  const [adding, setAdding] = useState(false);
  const [newCardForm, setNewCardForm] = useState({ front: "", back: "", hint: "" });
  
  const cards = deck.flashcards || [];

  const handleEditStart = (card: Flashcard) => {
    setEditingCardId(card.id);
    setEditForm({ 
      front: card.front, 
      back: card.back, 
      hint: card.hint || "" 
    });
  };

  const handleEditSave = async (cardId: string) => {
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${apiUrl}/flashcards/cards/${cardId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to update card');
      
      toast.success("Card updated successfully");
      setEditingCardId(null);
      onUpdate();
    } catch (error: any) {
      toast.error("Error updating card", { description: error.message });
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Delete this card? This action cannot be undone.")) return;
    
    try {
      const headers = await authHeader();
      const response = await fetch(`${apiUrl}/flashcards/cards/${cardId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error('Failed to delete card');
      
      toast.success("Card deleted successfully");
      onUpdate();
    } catch (error: any) {
      toast.error("Error deleting card", { description: error.message });
    }
  };

  const handleAddCard = async () => {
    if (!newCardForm.front.trim() || !newCardForm.back.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${apiUrl}/flashcards/decks/${deck.id}/cards`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCardForm)
      });
      
      if (!response.ok) throw new Error('Failed to create card');
      
      toast.success("Card created successfully");
      setNewCardForm({ front: "", back: "", hint: "" });
      setAdding(false);
      onUpdate();
    } catch (error: any) {
      toast.error("Error creating card", { description: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {cards.length} card{cards.length !== 1 ? 's' : ''} in this deck
        </p>
        <Button 
          size="sm"
          onClick={() => setAdding(!adding)}
          variant={adding ? "outline" : "default"}
          className={adding ? "border-border" : "bg-accent text-accent-foreground"}
        >
          {adding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {adding ? "Cancel" : "Add Card"}
        </Button>
      </div>
      
      {adding && (
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Question</label>
              <Textarea
                value={newCardForm.front}
                onChange={(e) => setNewCardForm({ ...newCardForm, front: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder="Enter question"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Answer</label>
              <Textarea
                value={newCardForm.back}
                onChange={(e) => setNewCardForm({ ...newCardForm, back: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder="Enter answer"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Hint (optional)</label>
              <Input
                value={newCardForm.hint}
                onChange={(e) => setNewCardForm({ ...newCardForm, hint: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder="Enter hint"
              />
            </div>
            <Button onClick={handleAddCard} className="w-full bg-accent text-accent-foreground">
              <Save className="w-4 h-4 mr-2" /> Create Card
            </Button>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {cards.length === 0 ? (
          <Card className="bg-background border-border border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No cards yet. Add your first card to get started!</p>
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className="bg-background border-border">
              <CardContent className="p-4">
                {editingCardId === card.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Question</label>
                      <Textarea
                        value={editForm.front}
                        onChange={(e) => setEditForm({ ...editForm, front: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Answer</label>
                      <Textarea
                        value={editForm.back}
                        onChange={(e) => setEditForm({ ...editForm, back: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Hint</label>
                      <Input
                        value={editForm.hint}
                        onChange={(e) => setEditForm({ ...editForm, hint: e.target.value })}
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditSave(card.id)} size="sm" className="flex-1 bg-accent">
                        <Save className="w-3 h-3 mr-2" /> Save
                      </Button>
                      <Button onClick={() => setEditingCardId(null)} size="sm" variant="outline" className="flex-1">
                        <X className="w-3 h-3 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-accent">Q:</p>
                      <p className="text-sm text-foreground">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-500">A:</p>
                      <p className="text-sm text-foreground">{card.back}</p>
                    </div>
                    {card.hint && (
                      <div>
                        <p className="text-xs font-medium text-orange-500">💡 Hint:</p>
                        <p className="text-sm text-muted-foreground italic">{card.hint}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEditStart(card)}
                        className="text-foreground hover:bg-muted"
                      >
                        <Edit2 className="w-3 h-3 mr-2" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(card.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 mr-2" /> Delete
                      </Button>
                      {card.status && (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {card.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
