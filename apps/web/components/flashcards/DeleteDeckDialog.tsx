"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckName: string;
  cardCount: number;
  onConfirm: () => void;
}

export function DeleteDeckDialog({ 
  open, 
  onOpenChange, 
  deckName, 
  cardCount,
  onConfirm 
}: DeleteDeckDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-foreground">
                Delete Deck "{deckName}"?
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-muted-foreground">
          This action cannot be undone. This will permanently delete this deck and all{" "}
          <span className="font-semibold text-foreground">{cardCount} flashcard{cardCount !== 1 ? 's' : ''}</span> inside it.
          <br /><br />
          All study history and progress for these cards will also be lost.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Deck
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
