import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  BarChart3, 
  Download, 
  Play, 
  Lock, 
  Unlock,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataGridBackground } from '@/components/DataGridBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Participant, GENDER_OPTIONS } from '@/lib/types';
import { toast } from 'sonner';
import darvixLogo from '@/assets/darvix-logo.png';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Stats {
  total: number;
  male: number;
  female: number;
  nonBinary: number;
  completed: number;
  completionRate: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingRunning, setMatchingRunning] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin) {
        toast.error('Access denied. Admin only.');
        navigate('/status');
        return;
      }
      loadData();
    }
  }, [user, authLoading, isAdmin, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load participants
      const { data: participantsData, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setParticipants(participantsData || []);

      // Calculate stats
      const total = participantsData?.length || 0;
      const male = participantsData?.filter(p => p.gender === 'male').length || 0;
      const female = participantsData?.filter(p => p.gender === 'female').length || 0;
      const nonBinary = participantsData?.filter(p => p.gender === 'non_binary').length || 0;
      const completed = participantsData?.filter(p => p.questionnaire_complete).length || 0;

      setStats({
        total,
        male,
        female,
        nonBinary,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });

      // Check if matching has been run
      const { data: matchesData } = await supabase
        .from('matches')
        .select('id')
        .limit(1);

      setMatchingComplete(matchesData && matchesData.length > 0);

      // Check results visibility
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'results_visible')
        .maybeSingle();

      setResultsVisible(settings?.value === true);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    if (matchingComplete) {
      toast.error('Matching has already been run. This is a one-time operation.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to run the matching algorithm? This can only be done once.'
    );
    if (!confirmed) return;

    setMatchingRunning(true);
    try {
      const { error } = await supabase.functions.invoke('run-matching');
      
      if (error) throw error;

      toast.success('Matching complete! Results are now available.');
      setMatchingComplete(true);
      loadData();
    } catch (err) {
      console.error('Matching error:', err);
      toast.error('Matching failed. Please try again.');
    } finally {
      setMatchingRunning(false);
    }
  };

  const toggleResultsVisibility = async () => {
    try {
      const newValue = !resultsVisible;
      
      // Check if setting exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'results_visible')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('app_settings')
          .update({ value: newValue })
          .eq('key', 'results_visible');
      } else {
        await supabase
          .from('app_settings')
          .insert({ key: 'results_visible', value: newValue });
      }

      setResultsVisible(newValue);
      toast.success(newValue ? 'Results are now visible to participants' : 'Results are now hidden');
    } catch (err) {
      console.error('Error toggling visibility:', err);
      toast.error('Failed to update visibility');
    }
  };

  const exportMatches = async () => {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          participant_id,
          match_1_id,
          match_1_score,
          match_2_id,
          match_2_score,
          match_3_id,
          match_3_score
        `);

      if (error) throw error;
      if (!matches || matches.length === 0) {
        toast.error('No matches to export');
        return;
      }

      // Get all participant names
      const { data: allParticipants } = await supabase
        .from('participants')
        .select('id, name, email');

      const participantMap = new Map(allParticipants?.map(p => [p.id, p]) || []);

      // Build CSV
      const headers = ['Participant', 'Email', 'Match 1', 'Score 1', 'Match 2', 'Score 2', 'Match 3', 'Score 3'];
      const rows = matches.map(m => {
        const participant = participantMap.get(m.participant_id);
        const match1 = m.match_1_id ? participantMap.get(m.match_1_id) : null;
        const match2 = m.match_2_id ? participantMap.get(m.match_2_id) : null;
        const match3 = m.match_3_id ? participantMap.get(m.match_3_id) : null;
        
        return [
          participant?.name || 'Unknown',
          participant?.email || '',
          match1?.name || 'N/A',
          m.match_1_score || 0,
          match2?.name || 'N/A',
          m.match_2_score || 0,
          match3?.name || 'N/A',
          m.match_3_score || 0,
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(csv, 'perfect-date-matches.csv');
      toast.success('Matches exported!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export');
    }
  };

  const exportUnmatched = async () => {
    try {
      const { data: matches } = await supabase
        .from('matches')
        .select('participant_id');

      const matchedIds = new Set(matches?.map(m => m.participant_id) || []);
      
      const unmatched = participants.filter(
        p => p.questionnaire_complete && !matchedIds.has(p.id)
      );

      if (unmatched.length === 0) {
        toast.success('No unmatched participants!');
        return;
      }

      const headers = ['Name', 'Email', 'Gender', 'Preference'];
      const rows = unmatched.map(p => [
        p.name,
        p.email,
        p.gender,
        p.partner_preference.join(';'),
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      downloadCSV(csv, 'perfect-date-unmatched.csv');
      toast.success('Unmatched list exported!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export');
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGenderLabel = (gender: string) => {
    return GENDER_OPTIONS.find(g => g.value === gender)?.label || gender;
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
        <header className="w-full py-6 px-4 border-b border-border">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/">
              <img src={darvixLogo} alt="DARVIX" className="h-10" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Signups</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Gender Ratio</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {stats.male}M : {stats.female}F : {stats.nonBinary}NB
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm text-muted-foreground">Completed</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats.completionRate}%</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                onClick={runMatching} 
                disabled={matchingRunning || matchingComplete}
                className="gap-2"
              >
                {matchingRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {matchingComplete ? 'Matching Complete' : 'Run Matching'}
              </Button>

              <Button 
                variant="outline" 
                onClick={toggleResultsVisibility}
                className="gap-2"
                disabled={!matchingComplete}
              >
                {resultsVisible ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Results
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Results
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={exportMatches} className="gap-2">
                <Download className="w-4 h-4" />
                Export Matches
              </Button>

              <Button variant="outline" onClick={exportUnmatched} className="gap-2">
                <Download className="w-4 h-4" />
                Export Unmatched
              </Button>
            </div>

            {/* Participants Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Preference</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell className="text-muted-foreground">{participant.email}</TableCell>
                        <TableCell>{participant.age}</TableCell>
                        <TableCell>{getGenderLabel(participant.gender)}</TableCell>
                        <TableCell>
                          {participant.partner_preference.map(getGenderLabel).join(', ')}
                        </TableCell>
                        <TableCell>
                          {participant.questionnaire_complete ? (
                            <span className="inline-flex items-center gap-1 text-success text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-warning text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Incomplete
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No participants found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </DataGridBackground>
  );
}
