"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, CheckCircle2 } from "lucide-react";

interface WaitingCard {
  id: string;
  front: string;
  next_review_date: string;
  interval_minutes: number;
}

interface WaitingCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waiting: WaitingCard[];
  nextAvailableAt: string | null;
  deckName: string;
  onResetTimer: (cardId: string) => Promise<void>;
  onRefresh: () => void;
}

export function WaitingCardsDialog({
  open,
  onOpenChange,
  waiting,
  nextAvailableAt,
  deckName,
  onResetTimer,
  onRefresh,
}: WaitingCardsDialogProps) {
  const [countdown, setCountdown] = useState<string>("");
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    if (!nextAvailableAt) return;

    const updateCountdown = () => {
      const next = new Date(nextAvailableAt);
      const now = new Date();
      const diff = next.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Ready now!");
        return;
      }

      const minutes = Math.floor(diff / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextAvailableAt]);

  const handleReset = async (cardId: string) => {
    setResetting(cardId);
    try {
      await onResetTimer(cardId);
      onRefresh();
    } finally {
      setResetting(null);
    }
  };

  const formatTimeRemaining = (reviewDate: string) => {
    const next = new Date(reviewDate);
    const now = new Date();
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return "Ready!";

    const minutes = Math.floor(diff / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            No Cards Available
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {deckName} - All cards are in review cooldown
          </DialogDescription>
        </DialogHeader>

        {nextAvailableAt && (
          <div className="bg-accent/10 rounded-lg p-4 border border-accent/20 text-center">
            <p className="text-sm text-muted-foreground mb-1">Next card available in</p>
            <p className="text-3xl font-bold text-accent">{countdown}</p>
          </div>
        )}

        {waiting.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-sm font-medium text-foreground">Cards in cooldown ({waiting.length}):</p>
            {waiting.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{card.front}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {formatTimeRemaining(card.next_review_date)} remaining
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReset(card.id)}
                  disabled={resetting === card.id}
                  className="border-accent/50 text-accent hover:bg-accent/10"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {resetting === card.id ? "..." : "Reset"}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">All cards mastered!</p>
            <p className="text-sm text-muted-foreground">Come back in 4 days for review.</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onRefresh} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            <RotateCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
