import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGridBackground } from '@/components/DataGridBackground';
import { ProgressBar } from '@/components/ProgressBar';
import { MCQCard } from '@/components/MCQCard';
import { RankingQuestion } from '@/components/RankingQuestion';
import { SliderQuestion } from '@/components/SliderQuestion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FRIDAY_NIGHT_OPTIONS, 
  HUMOUR_OPTIONS, 
  CONFLICT_OPTIONS,
  LIFE_PILLARS,
  LOVE_LANGUAGES,
  SLIDER_QUESTIONS,
  QuestionnaireResponses
} from '@/lib/types';
import { toast } from 'sonner';

const TOTAL_STEPS = 10;

export default function Questionnaire() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responses, setResponses] = useState<Partial<QuestionnaireResponses>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadExistingResponses();
    }
  }, [user, authLoading, navigate]);

  const loadExistingResponses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResponses(data);
        setCurrentStep(data.current_step || 1);
      }
    } catch (err) {
      console.error('Error loading responses:', err);
      toast.error('Failed to load your progress');
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = useCallback(async (field: string, value: unknown) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('questionnaire_responses')
        .update({ 
          [field]: value,
          current_step: currentStep,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setResponses(prev => ({ ...prev, [field]: value }));
    } catch (err) {
      console.error('Error saving response:', err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [user, currentStep]);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Update current step in DB
      if (user) {
        await supabase
          .from('questionnaire_responses')
          .update({ current_step: nextStep })
          .eq('user_id', user.id);
      }
    } else {
      // Complete questionnaire
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Mark questionnaire as complete
      await supabase
        .from('questionnaire_responses')
        .update({ current_step: TOTAL_STEPS })
        .eq('user_id', user.id);

      await supabase
        .from('participants')
        .update({ questionnaire_complete: true })
        .eq('user_id', user.id);

      toast.success('Questionnaire complete!');
      navigate('/status');
    } catch (err) {
      console.error('Error completing:', err);
      toast.error('Failed to complete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!responses.q1_friday_night;
      case 2: return !!responses.q2_humour;
      case 3: return !!responses.q3_conflict_style;
      case 4: return responses.q4_life_pillars && responses.q4_life_pillars.length === 5;
      case 5: return responses.q5_love_languages && responses.q5_love_languages.length === 5;
      case 6: return responses.q6_social_battery !== null && responses.q6_social_battery !== undefined;
      case 7: return responses.q7_spontaneity !== null && responses.q7_spontaneity !== undefined;
      case 8: return responses.q8_ambition !== null && responses.q8_ambition !== undefined;
      case 9: return responses.q9_productivity !== null && responses.q9_productivity !== undefined;
      case 10: return responses.q10_date_preference !== null && responses.q10_date_preference !== undefined;
      default: return false;
    }
  };

  if (authLoading || loading) {
    return (
      <DataGridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DataGridBackground>
    );
  }

  return (
    <DataGridBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {saving && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} className="mb-8" />

            <AnimatePresence mode="wait">
              {/* Section A: MCQ Questions */}
              {currentStep === 1 && (
                <MCQCard
                  key="q1"
                  question="It's 10 PM on a Friday. Where are you?"
                  options={FRIDAY_NIGHT_OPTIONS}
                  selectedValue={responses.q1_friday_night || null}
                  onSelect={(value) => saveResponse('q1_friday_night', value)}
                  questionNumber={1}
                />
              )}

              {currentStep === 2 && (
                <MCQCard
                  key="q2"
                  question="What's your green flag in a conversation?"
                  options={HUMOUR_OPTIONS}
                  selectedValue={responses.q2_humour || null}
                  onSelect={(value) => saveResponse('q2_humour', value)}
                  questionNumber={2}
                />
              )}

              {currentStep === 3 && (
                <MCQCard
                  key="q3"
                  question="How do you handle a group project disagreement?"
                  options={CONFLICT_OPTIONS}
                  selectedValue={responses.q3_conflict_style || null}
                  onSelect={(value) => saveResponse('q3_conflict_style', value)}
                  questionNumber={3}
                />
              )}

              {/* Section B: Rankings */}
              {currentStep === 4 && (
                <RankingQuestion
                  key="q4"
                  question="Rank your life pillars"
                  items={LIFE_PILLARS}
                  currentOrder={responses.q4_life_pillars || null}
                  onOrderChange={(order) => saveResponse('q4_life_pillars', order)}
                  questionNumber={4}
                />
              )}

              {currentStep === 5 && (
                <RankingQuestion
                  key="q5"
                  question="Rank your love languages"
                  items={LOVE_LANGUAGES}
                  currentOrder={responses.q5_love_languages || null}
                  onOrderChange={(order) => saveResponse('q5_love_languages', order)}
                  questionNumber={5}
                />
              )}

              {/* Section C: Sliders */}
              {currentStep >= 6 && currentStep <= 10 && (
                <SliderQuestion
                  key={`q${currentStep}`}
                  question={SLIDER_QUESTIONS[currentStep - 6].question}
                  leftLabel={SLIDER_QUESTIONS[currentStep - 6].leftLabel}
                  rightLabel={SLIDER_QUESTIONS[currentStep - 6].rightLabel}
                  emoji={SLIDER_QUESTIONS[currentStep - 6].emoji}
                  value={responses[SLIDER_QUESTIONS[currentStep - 6].key as keyof QuestionnaireResponses] as number | null}
                  onChange={(value) => saveResponse(SLIDER_QUESTIONS[currentStep - 6].key, value)}
                  questionNumber={currentStep}
                />
              )}
            </AnimatePresence>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 mt-8 justify-center"
            >
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} size="lg">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
              )}
              
              <Button 
                onClick={handleNext} 
                size="lg"
                disabled={!isStepValid() || saving}
                className="min-w-[160px]"
              >
                {currentStep === TOTAL_STEPS ? (
                  <>
                    <Check className="mr-2 w-4 h-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </DataGridBackground>
  );
}
