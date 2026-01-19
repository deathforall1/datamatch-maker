import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Users, Sparkles, LogOut, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGridBackground } from '@/components/DataGridBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Participant, Match } from '@/lib/types';
import darvixLogo from '@/assets/darvix-logo.png';

interface MatchWithParticipant {
  id: string;
  name: string;
  score: number;
}

export default function Status() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [matches, setMatches] = useState<MatchWithParticipant[]>([]);
  const [resultsVisible, setResultsVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Get participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (participantError) throw participantError;

      if (!participantData) {
        navigate('/register');
        return;
      }

      setParticipant(participantData);

      // Check if results are visible
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'results_visible')
        .maybeSingle();

      const visible = settings?.value === true;
      setResultsVisible(visible);

      if (visible && participantData.questionnaire_complete) {
        // Load matches
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('participant_id', participantData.id)
          .maybeSingle();

        if (matchData) {
          await loadMatchDetails(matchData);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchDetails = async (matchData: Match) => {
    const matchIds = [matchData.match_1_id, matchData.match_2_id, matchData.match_3_id].filter(Boolean);
    const scores = [matchData.match_1_score, matchData.match_2_score, matchData.match_3_score];

    if (matchIds.length === 0) return;

    const { data: participants } = await supabase
      .from('participants')
      .select('id, name')
      .in('id', matchIds as string[]);

    if (participants) {
      const matchesWithDetails: MatchWithParticipant[] = [];
      
      if (matchData.match_1_id) {
        const p = participants.find(p => p.id === matchData.match_1_id);
        if (p) matchesWithDetails.push({ id: p.id, name: p.name, score: scores[0] || 0 });
      }
      if (matchData.match_2_id) {
        const p = participants.find(p => p.id === matchData.match_2_id);
        if (p) matchesWithDetails.push({ id: p.id, name: p.name, score: scores[1] || 0 });
      }
      if (matchData.match_3_id) {
        const p = participants.find(p => p.id === matchData.match_3_id);
        if (p) matchesWithDetails.push({ id: p.id, name: p.name, score: scores[2] || 0 });
      }

      setMatches(matchesWithDetails);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const getMaxScore = () => {
    // MCQ: 3 questions × 15 = 45
    // Ranking: 2 questions with max distance 4+3+2+1+0 = 10 each = 20
    // Sliders: 5 questions × 10 = 50
    // Total theoretical max = 115, but we'll use 100 for display
    return 100;
  };

  return (
    <DataGridBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/">
              <img src={darvixLogo} alt="DARVIX" className="h-10" />
            </Link>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            {/* Status Card */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center mb-8">
              {participant?.questionnaire_complete ? (
                <>
                  <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-success" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    You're All Set!
                  </h1>
                  <p className="text-muted-foreground">
                    Your questionnaire is complete. {resultsVisible ? "Check out your matches below!" : "We'll notify you when matches are ready."}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Complete Your Profile
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Finish the questionnaire to get matched with compatible people.
                  </p>
                  <Link to="/questionnaire">
                    <Button size="lg">
                      Continue Questionnaire
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Matches Section */}
            {participant?.questionnaire_complete && resultsVisible && matches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center flex items-center justify-center gap-3">
                  <Heart className="w-6 h-6 text-primary" />
                  Your Top Matches
                </h2>
                
                <div className="grid gap-4">
                  {matches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 glow-card"
                    >
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {match.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Compatibility: {Math.min(Math.round((match.score / getMaxScore()) * 100), 99)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  Connect with your matches at the Perfect Date event!
                </p>
              </motion.div>
            )}

            {/* Waiting for matches */}
            {participant?.questionnaire_complete && !resultsVisible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 text-center"
              >
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Matches Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our matching algorithm is waiting for all participants to complete their questionnaires.
                  Check back soon!
                </p>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </DataGridBackground>
  );
}
