import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Participant {
  id: string;
  user_id: string;
  gender: 'male' | 'female' | 'non_binary';
  partner_preference: string[];
}

interface QuestionnaireResponse {
  user_id: string;
  q1_friday_night: string | null;
  q2_humour: string | null;
  q3_conflict_style: string | null;
  q4_life_pillars: string[] | null;
  q5_love_languages: string[] | null;
  q6_social_battery: number | null;
  q7_spontaneity: number | null;
  q8_ambition: number | null;
  q9_productivity: number | null;
  q10_date_preference: number | null;
}

interface MatchScore {
  participantId: string;
  matchId: string;
  score: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for force parameter
    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch {
      // No body or invalid JSON, proceed without force
    }

    console.log('Starting matching algorithm...', { force });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if matching already ran
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('id')
      .limit(1);

    if (existingMatches && existingMatches.length > 0) {
      if (!force) {
        console.log('Matching already completed. Use force=true to re-run.');
        return new Response(
          JSON.stringify({ error: 'Matching has already been run. Use force option to re-run.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Force mode: clear existing matches first
      console.log('Force mode: clearing existing matches...');
      const { error: deleteError } = await supabase
        .from('matches')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Failed to clear existing matches:', deleteError);
        throw deleteError;
      }
      console.log('Existing matches cleared successfully');
    }

    // Get all completed participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, user_id, gender, partner_preference')
      .eq('questionnaire_complete', true);

    if (participantsError) throw participantsError;
    if (!participants || participants.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Not enough participants to run matching' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${participants.length} completed participants`);

    // Get all questionnaire responses
    const { data: responses, error: responsesError } = await supabase
      .from('questionnaire_responses')
      .select('*');

    if (responsesError) throw responsesError;

    // Create a map for quick lookup
    const responseMap = new Map<string, QuestionnaireResponse>();
    responses?.forEach(r => responseMap.set(r.user_id, r));

    // Calculate scores for all valid pairs
    const allScores: MatchScore[] = [];

    for (const p1 of participants) {
      for (const p2 of participants) {
        if (p1.id === p2.id) continue;

        // Check bi-directional preference compatibility
        const p1LikesP2 = p1.partner_preference.includes(p2.gender);
        const p2LikesP1 = p2.partner_preference.includes(p1.gender);

        if (!p1LikesP2 || !p2LikesP1) continue;

        const r1 = responseMap.get(p1.user_id);
        const r2 = responseMap.get(p2.user_id);

        if (!r1 || !r2) continue;

        const score = calculateCompatibility(r1, r2);
        allScores.push({ participantId: p1.id, matchId: p2.id, score });
      }
    }

    console.log(`Calculated ${allScores.length} potential matches`);

    // Group by participant and get top 3 for each
    const scoresByParticipant = new Map<string, MatchScore[]>();
    
    allScores.forEach(score => {
      const existing = scoresByParticipant.get(score.participantId) || [];
      existing.push(score);
      scoresByParticipant.set(score.participantId, existing);
    });

    // Create match records
    const matchRecords: any[] = [];

    for (const participant of participants) {
      const scores = scoresByParticipant.get(participant.id) || [];
      // Sort by score descending and take top 3
      scores.sort((a, b) => b.score - a.score);
      const top3 = scores.slice(0, 3);

      matchRecords.push({
        participant_id: participant.id,
        match_1_id: top3[0]?.matchId || null,
        match_1_score: top3[0]?.score || null,
        match_2_id: top3[1]?.matchId || null,
        match_2_score: top3[1]?.score || null,
        match_3_id: top3[2]?.matchId || null,
        match_3_score: top3[2]?.score || null,
      });
    }

    // Insert all matches
    const { error: insertError } = await supabase
      .from('matches')
      .insert(matchRecords);

    if (insertError) throw insertError;

    console.log(`Created ${matchRecords.length} match records`);

    // Set results visible by default
    const { data: existingSetting } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', 'results_visible')
      .maybeSingle();

    if (existingSetting) {
      await supabase
        .from('app_settings')
        .update({ value: false })
        .eq('key', 'results_visible');
    } else {
      await supabase
        .from('app_settings')
        .insert({ key: 'results_visible', value: false });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchesCreated: matchRecords.length,
        message: 'Matching complete! Results are hidden by default.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Matching error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateCompatibility(r1: QuestionnaireResponse, r2: QuestionnaireResponse): number {
  let score = 0;

  // MCQ Questions: +15 points per identical answer
  if (r1.q1_friday_night && r1.q1_friday_night === r2.q1_friday_night) score += 15;
  if (r1.q2_humour && r1.q2_humour === r2.q2_humour) score += 15;
  if (r1.q3_conflict_style && r1.q3_conflict_style === r2.q3_conflict_style) score += 15;

  // Ranking Questions: Compare rank positions
  // Lower distance = higher score, max 10 per ranking question
  if (r1.q4_life_pillars && r2.q4_life_pillars) {
    score += calculateRankingScore(r1.q4_life_pillars, r2.q4_life_pillars);
  }
  if (r1.q5_love_languages && r2.q5_love_languages) {
    score += calculateRankingScore(r1.q5_love_languages, r2.q5_love_languages);
  }

  // Slider Questions: Manhattan distance, 10 - |A - B| * 2
  // Max 10 per slider question
  if (r1.q6_social_battery != null && r2.q6_social_battery != null) {
    score += Math.max(0, 10 - Math.abs(r1.q6_social_battery - r2.q6_social_battery) * 2);
  }
  if (r1.q7_spontaneity != null && r2.q7_spontaneity != null) {
    score += Math.max(0, 10 - Math.abs(r1.q7_spontaneity - r2.q7_spontaneity) * 2);
  }
  if (r1.q8_ambition != null && r2.q8_ambition != null) {
    score += Math.max(0, 10 - Math.abs(r1.q8_ambition - r2.q8_ambition) * 2);
  }
  if (r1.q9_productivity != null && r2.q9_productivity != null) {
    score += Math.max(0, 10 - Math.abs(r1.q9_productivity - r2.q9_productivity) * 2);
  }
  if (r1.q10_date_preference != null && r2.q10_date_preference != null) {
    score += Math.max(0, 10 - Math.abs(r1.q10_date_preference - r2.q10_date_preference) * 2);
  }

  return score;
}

function calculateRankingScore(ranking1: string[], ranking2: string[]): number {
  // Calculate total distance between rankings
  // Max distance per item = 4 (if item is at opposite ends)
  // Max total distance = 4+3+2+1+0 = 10
  // Score = 10 - totalDistance
  
  let totalDistance = 0;
  
  for (let i = 0; i < ranking1.length; i++) {
    const item = ranking1[i];
    const pos2 = ranking2.indexOf(item);
    if (pos2 !== -1) {
      totalDistance += Math.abs(i - pos2);
    }
  }

  // Normalize: max distance is 10, so score = 10 - min(totalDistance, 10)
  return Math.max(0, 10 - totalDistance);
}
