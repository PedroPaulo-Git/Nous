"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Info, Edit, Trash2 } from "lucide-react";
import type { Deck } from "@/types/flashcards";
import { DeckSettingsDialog } from "./DeckSettingsDialog";
import { DeleteDeckDialog } from "./DeleteDeckDialog";

interface DeckActionsMenuProps {
  deck: Deck;
  onUpdate: () => void;
  onDelete: () => void;
  authHeader: () => Promise<HeadersInit>;
  apiUrl: string;
}

export function DeckActionsMenu({ 
  deck, 
  onUpdate, 
  onDelete,
  authHeader,
  apiUrl 
}: DeckActionsMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"info" | "edit" | "cards">("info");

  const handleOpenSettings = (tab: "info" | "edit" | "cards") => {
    setInitialTab(tab);
    setSettingsOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem 
            onClick={() => handleOpenSettings("info")}
            className="cursor-pointer text-foreground hover:bg-muted"
          >
            <Info className="w-4 h-4 mr-2" />
            Deck Info
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleOpenSettings("edit")}
            className="cursor-pointer text-foreground hover:bg-muted"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Deck
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleOpenSettings("cards")}
            className="cursor-pointer text-foreground hover:bg-muted"
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Cards
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem 
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Deck
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeckSettingsDialog
        deck={deck}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUpdate={onUpdate}
        onDelete={() => {
          setSettingsOpen(false);
          onDelete();
        }}
        authHeader={authHeader}
        apiUrl={apiUrl}
        initialTab={initialTab}
      />

      <DeleteDeckDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deckName={deck.name}
        cardCount={deck.flashcards?.length || 0}
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete();
        }}
      />
    </>
  );
}
