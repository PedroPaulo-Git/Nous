-- =====================================================
-- PROFESSIONAL FLASHCARD SYSTEM WITH SPACED REPETITION
-- =====================================================

-- Drop existing tables to rebuild with new structure
DROP TABLE IF EXISTS flashcard_reviews CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS flashcard_decks CASCADE;

-- =====================================================
-- FLASHCARD DECKS TABLE
-- =====================================================
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Deck color for visual organization
  is_archived BOOLEAN DEFAULT FALSE,
  cards_count INTEGER DEFAULT 0,
  mastered_count INTEGER DEFAULT 0,
  learning_count INTEGER DEFAULT 0,
  new_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_flashcard_decks_archived ON flashcard_decks(user_id, is_archived);

-- =====================================================
-- FLASHCARDS TABLE (WITH SPACED REPETITION DATA)
-- =====================================================
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT, -- Optional hint for difficult cards
  
  -- Spaced Repetition (SM-2 Algorithm)
  ease_factor DECIMAL(4,2) DEFAULT 2.5, -- How "easy" the card is (2.5 is default)
  review_interval INTEGER DEFAULT 0, -- Days until next review (0 = new card)
  repetitions INTEGER DEFAULT 0, -- Number of successful reviews
  next_review_date TIMESTAMPTZ DEFAULT NOW(), -- When to show this card next
  
  -- Card Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard')),
  
  -- Statistics
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_wrong INTEGER DEFAULT 0,
  average_time_seconds INTEGER DEFAULT 0, -- Average time to answer
  last_reviewed_at TIMESTAMPTZ,
  
  -- Tags and organization
  tags TEXT[], -- Array of tags for filtering
  is_starred BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE, -- Temporarily remove from reviews
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(user_id, next_review_date) WHERE is_suspended = FALSE;
CREATE INDEX idx_flashcards_status ON flashcards(user_id, status);
CREATE INDEX idx_flashcards_tags ON flashcards USING GIN(tags);

-- =====================================================
-- STUDY SESSIONS TABLE
-- =====================================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE SET NULL,
  
  -- Session metadata
  session_type TEXT DEFAULT 'review' CHECK (session_type IN ('new', 'review', 'cram', 'mixed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Calculated on session end
  
  -- Session statistics
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_wrong INTEGER DEFAULT 0,
  cards_skipped INTEGER DEFAULT 0,
  
  -- Performance metrics
  accuracy_percentage DECIMAL(5,2), -- Calculated: (correct / total) * 100
  average_response_time INTEGER, -- Average seconds per card
  
  -- Streak and goals
  is_daily_goal_completed BOOLEAN DEFAULT FALSE,
  streak_day INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_deck_id ON study_sessions(deck_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(user_id, started_at);
CREATE INDEX idx_study_sessions_daily_goal ON study_sessions(user_id, is_daily_goal_completed);

-- =====================================================
-- FLASHCARD REVIEWS TABLE (Individual Card Reviews)
-- =====================================================
CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  
  -- Review outcome
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  was_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER, -- Time taken to answer
  
  -- Spaced repetition data snapshot (for history)
  ease_factor_before DECIMAL(4,2),
  ease_factor_after DECIMAL(4,2),
  interval_before INTEGER,
  interval_after INTEGER,
  
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX idx_flashcard_reviews_session_id ON flashcard_reviews(session_id);
CREATE INDEX idx_flashcard_reviews_date ON flashcard_reviews(user_id, reviewed_at);

-- =====================================================
-- USER STUDY STATISTICS TABLE
-- =====================================================
CREATE TABLE user_study_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily goals
  daily_cards_goal INTEGER DEFAULT 20,
  daily_minutes_goal INTEGER DEFAULT 15,
  
  -- Current streak
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  
  -- Lifetime statistics
  total_cards_studied INTEGER DEFAULT 0,
  total_study_time_seconds INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Performance
  overall_accuracy DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_study_stats_user_id ON user_study_stats(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_decks_updated_at
  BEFORE UPDATE ON flashcard_decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_study_stats_updated_at
  BEFORE UPDATE ON user_study_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update deck card counts
CREATE OR REPLACE FUNCTION update_deck_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE flashcard_decks
  SET 
    cards_count = (SELECT COUNT(*) FROM flashcards WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)),
    new_count = (SELECT COUNT(*) FROM flashcards WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id) AND status = 'new'),
    learning_count = (SELECT COUNT(*) FROM flashcards WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id) AND status = 'learning'),
    mastered_count = (SELECT COUNT(*) FROM flashcards WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id) AND status = 'mastered')
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deck_counts
  AFTER INSERT OR UPDATE OR DELETE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_counts();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_stats ENABLE ROW LEVEL SECURITY;

-- Flashcard Decks Policies
CREATE POLICY "Users can view their own decks"
  ON flashcard_decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
  ON flashcard_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON flashcard_decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON flashcard_decks FOR DELETE
  USING (auth.uid() = user_id);

-- Flashcards Policies
CREATE POLICY "Users can view their own flashcards"
  ON flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards"
  ON flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards"
  ON flashcards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards"
  ON flashcards FOR DELETE
  USING (auth.uid() = user_id);

-- Study Sessions Policies
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Flashcard Reviews Policies
CREATE POLICY "Users can view their own reviews"
  ON flashcard_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
  ON flashcard_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Study Stats Policies
CREATE POLICY "Users can view their own stats"
  ON user_study_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats"
  ON user_study_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_study_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get cards due for review
CREATE OR REPLACE FUNCTION get_cards_due_for_review(p_user_id UUID, p_deck_id UUID DEFAULT NULL, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  deck_id UUID,
  front TEXT,
  back TEXT,
  hint TEXT,
  status TEXT,
  ease_factor DECIMAL,
  review_interval INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.deck_id,
    f.front,
    f.back,
    f.hint,
    f.status,
    f.ease_factor,
    f.review_interval
  FROM flashcards f
  WHERE f.user_id = p_user_id
    AND f.is_suspended = FALSE
    AND f.next_review_date <= NOW()
    AND (p_deck_id IS NULL OR f.deck_id = p_deck_id)
  ORDER BY f.next_review_date ASC, f.times_reviewed ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate next review interval (SM-2 Algorithm)
CREATE OR REPLACE FUNCTION calculate_sm2_interval(
  p_rating TEXT,
  p_ease_factor DECIMAL,
  p_interval INTEGER,
  p_repetitions INTEGER,
  OUT new_ease_factor DECIMAL,
  OUT new_interval INTEGER,
  OUT new_repetitions INTEGER
) AS $$
DECLARE
  quality INTEGER;
BEGIN
  -- Convert rating to quality score (0-5)
  quality := CASE p_rating
    WHEN 'again' THEN 0
    WHEN 'hard' THEN 3
    WHEN 'good' THEN 4
    WHEN 'easy' THEN 5
    ELSE 4
  END;

  -- Calculate new ease factor
  new_ease_factor := p_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  -- Ensure ease factor doesn't go below 1.3
  IF new_ease_factor < 1.3 THEN
    new_ease_factor := 1.3;
  END IF;

  -- Calculate new interval and repetitions
  IF quality < 3 THEN
    -- Failed card - reset
    new_interval := 1;
    new_repetitions := 0;
  ELSE
    new_repetitions := p_repetitions + 1;
    
    IF new_repetitions = 1 THEN
      new_interval := 1;
    ELSIF new_repetitions = 2 THEN
      new_interval := 6;
    ELSE
      new_interval := ROUND(p_interval * new_ease_factor);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE flashcard_decks IS 'Flashcard decks with statistics';
COMMENT ON TABLE flashcards IS 'Individual flashcards with spaced repetition data (SM-2 algorithm)';
COMMENT ON TABLE study_sessions IS 'Study session history with performance metrics';
COMMENT ON TABLE flashcard_reviews IS 'Individual card review history';
COMMENT ON TABLE user_study_stats IS 'User-level study statistics and streaks';
