"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Target, TrendingUp, Award, Clock } from "lucide-react";
import type { Deck } from "@/types/flashcards";

interface DeckInfoTabProps {
  deck: Deck;
}

export function DeckInfoTab({ deck }: DeckInfoTabProps) {
  const totalCards = deck.flashcards?.length || deck.cards_count || 0;
  const newCount = deck.new_count || 0;
  const learningCount = deck.learning_count || 0;
  const masteredCount = deck.mastered_count || 0;
  
  const masteredPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
  
  return (
    <div className="space-y-4">
      {/* Description */}
      {deck.description && (
        <Card className="bg-background border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{deck.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-background border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalCards}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Cards</div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{newCount}</div>
            <div className="text-xs text-muted-foreground mt-1">New</div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{learningCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Learning</div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{masteredCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Mastered</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress */}
      <Card className="bg-background border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Mastery Progress</span>
            </div>
            <span className="text-sm font-bold text-accent">{masteredPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${masteredPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-background border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Created</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {new Date(deck.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-background border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Last Updated</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {new Date(deck.updated_at || deck.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
