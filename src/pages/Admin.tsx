import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BarChart3, 
  Download, 
  Play, 
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataGridBackground } from '@/components/DataGridBackground';
import { supabase } from '@/integrations/supabase/client';
import { Participant, GENDER_OPTIONS } from '@/lib/types';
import { toast } from 'sonner';
import darvixLogo from '@/assets/darvix-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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

interface MatchWithDetails {
  id: string;
  participant_id: string;
  participant_name: string;
  match_1_id: string | null;
  match_1_name: string | null;
  match_1_score: number | null;
  match_2_id: string | null;
  match_2_name: string | null;
  match_2_score: number | null;
  match_3_id: string | null;
  match_3_name: string | null;
  match_3_score: number | null;
}

interface EditingScore {
  matchId: string;
  field: 'match_1_score' | 'match_2_score' | 'match_3_score';
  value: number;
}

export default function Admin() {
  const { user, session, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingRunning, setMatchingRunning] = useState(false);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'participants' | 'matches'>('participants');
  const [editingScore, setEditingScore] = useState<EditingScore | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast.error('Admin access required');
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Load data when authenticated as admin
  useEffect(() => {
    if (user && isAdmin && session) {
      loadData();
    }
  }, [user, isAdmin, session]);

  const loadData = async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      // Load participants via edge function (uses JWT auth)
      const { data: participantsResponse, error: participantsError } = await supabase.functions.invoke('admin-data', {
        body: { action: 'get-participants' }
      });

      if (participantsError) throw participantsError;
      
      const participantsData = participantsResponse?.participants || [];
      // Sort by created_at descending
      participantsData.sort((a: Participant, b: Participant) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setParticipants(participantsData);

      // Calculate stats
      const total = participantsData.length;
      const male = participantsData.filter((p: Participant) => p.gender === 'male').length;
      const female = participantsData.filter((p: Participant) => p.gender === 'female').length;
      const nonBinary = participantsData.filter((p: Participant) => p.gender === 'non_binary').length;
      const completed = participantsData.filter((p: Participant) => p.questionnaire_complete).length;

      setStats({
        total,
        male,
        female,
        nonBinary,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });

      // Load matches via edge function
      const { data: matchesResponse, error: matchesError } = await supabase.functions.invoke('admin-data', {
        body: { action: 'get-matches' }
      });

      if (matchesError) throw matchesError;

      const matchesData = matchesResponse?.matches || [];

      if (matchesData.length > 0) {
        setMatchingComplete(true);
        
        // Build participant name map
        const nameMap = new Map<string, string>();
        participantsData.forEach((p: Participant) => nameMap.set(p.id, p.name));

        const matchesWithDetails: MatchWithDetails[] = matchesData.map((m: any) => ({
          id: m.id,
          participant_id: m.participant_id,
          participant_name: nameMap.get(m.participant_id) || 'Unknown',
          match_1_id: m.match_1_id,
          match_1_name: m.match_1_id ? nameMap.get(m.match_1_id) || 'Unknown' : null,
          match_1_score: m.match_1_score,
          match_2_id: m.match_2_id,
          match_2_name: m.match_2_id ? nameMap.get(m.match_2_id) || 'Unknown' : null,
          match_2_score: m.match_2_score,
          match_3_id: m.match_3_id,
          match_3_name: m.match_3_id ? nameMap.get(m.match_3_id) || 'Unknown' : null,
          match_3_score: m.match_3_score,
        }));

        setMatches(matchesWithDetails);
      }

      // Check results visibility via edge function
      const { data: settingsResponse } = await supabase.functions.invoke('admin-data', {
        body: { action: 'get-settings' }
      });

      const visibilitySetting = settingsResponse?.settings?.find((s: any) => s.key === 'results_visible');
      setResultsVisible(visibilitySetting?.value === true);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    const isRerun = matchingComplete || matches.length > 0;
    
    if (isRerun) {
      const confirmed = window.confirm(
        'Matching has already been run. Running again will DELETE all existing matches and create new ones. Continue?'
      );
      if (!confirmed) return;
    }

    setMatchingRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-matching', {
        body: { force: isRerun }
      });
      
      if (error) throw error;

      toast.success('Matching complete!');
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
      
      const { error } = await supabase.functions.invoke('admin-data', {
        body: { action: 'toggle-visibility', data: { visible: newValue } }
      });

      if (error) throw error;

      setResultsVisible(newValue);
      toast.success(newValue ? 'Results are now visible to participants' : 'Results are now hidden');
    } catch (err) {
      console.error('Error toggling visibility:', err);
      toast.error('Failed to update visibility');
    }
  };

  const startEditing = (matchId: string, field: 'match_1_score' | 'match_2_score' | 'match_3_score', currentValue: number | null) => {
    setEditingScore({
      matchId,
      field,
      value: currentValue || 0,
    });
  };

  const saveScore = async () => {
    if (!editingScore) return;

    try {
      const { error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'update-score', 
          data: { 
            matchId: editingScore.matchId, 
            field: editingScore.field, 
            value: editingScore.value 
          } 
        }
      });

      if (error) throw error;

      // Update local state
      setMatches(prev => prev.map(m => {
        if (m.id === editingScore.matchId) {
          return { ...m, [editingScore.field]: editingScore.value };
        }
        return m;
      }));

      toast.success('Score updated!');
      setEditingScore(null);
    } catch (err) {
      console.error('Error saving score:', err);
      toast.error('Failed to save score');
    }
  };

  const exportMatches = async () => {
    if (matches.length === 0) {
      toast.error('No matches to export');
      return;
    }

    const headers = ['Participant', 'Match 1', 'Score 1', 'Match 2', 'Score 2', 'Match 3', 'Score 3'];
    const rows = matches.map(m => [
      m.participant_name,
      m.match_1_name || 'N/A',
      m.match_1_score || 0,
      m.match_2_name || 'N/A',
      m.match_2_score || 0,
      m.match_3_name || 'N/A',
      m.match_3_score || 0,
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, 'perfect-date-matches.csv');
    toast.success('Matches exported!');
  };

  const exportParticipants = () => {
    if (participants.length === 0) {
      toast.error('No participants to export');
      return;
    }

    const headers = ['Name', 'Email', 'Age', 'Gender', 'Preference', 'Questionnaire Complete'];
    const rows = participants.map(p => [
      p.name,
      p.email,
      p.age,
      getGenderLabel(p.gender),
      p.partner_preference.map(getGenderLabel).join(';'),
      p.questionnaire_complete ? 'Yes' : 'No',
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, 'perfect-date-participants.csv');
    toast.success('Participants exported!');
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

  const filteredMatches = matches.filter(m =>
    m.participant_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGenderLabel = (gender: string) => {
    return GENDER_OPTIONS.find(g => g.value === gender)?.label || gender;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <DataGridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DataGridBackground>
    );
  }

  // Not authenticated or not admin - will be redirected by useEffect
  if (!user || !isAdmin) {
    return (
      <DataGridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Admin access required</p>
          </div>
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
            <img src={darvixLogo} alt="DARVIX" className="h-10" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
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
                disabled={matchingRunning}
                className="gap-2"
              >
                {matchingRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {matchingComplete ? 'Re-run Matching' : 'Run Matching'}
              </Button>

              <Button 
                variant="outline" 
                onClick={toggleResultsVisibility}
                className="gap-2"
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

              <Button variant="outline" onClick={exportParticipants} className="gap-2">
                <Download className="w-4 h-4" />
                Export Participants
              </Button>

              <Button variant="outline" onClick={exportMatches} className="gap-2">
                <Download className="w-4 h-4" />
                Export Matches
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <Button 
                variant={activeTab === 'participants' ? 'default' : 'outline'}
                onClick={() => setActiveTab('participants')}
              >
                Participants ({participants.length})
              </Button>
              <Button 
                variant={activeTab === 'matches' ? 'default' : 'outline'}
                onClick={() => setActiveTab('matches')}
              >
                Matches ({matches.length})
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'participants' ? "Search by name or email..." : "Search by participant name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Data Tables */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {activeTab === 'participants' ? (
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
                    {filteredParticipants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.age}</TableCell>
                        <TableCell>{getGenderLabel(p.gender)}</TableCell>
                        <TableCell>{p.partner_preference.map(getGenderLabel).join(', ')}</TableCell>
                        <TableCell>
                          {p.questionnaire_complete ? (
                            <span className="inline-flex items-center gap-1 text-sm text-green-500">
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-yellow-500">
                              <AlertCircle className="w-4 h-4" />
                              Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No participants found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Match 1</TableHead>
                      <TableHead>Score 1</TableHead>
                      <TableHead>Match 2</TableHead>
                      <TableHead>Score 2</TableHead>
                      <TableHead>Match 3</TableHead>
                      <TableHead>Score 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.participant_name}</TableCell>
                        <TableCell>{m.match_1_name || '-'}</TableCell>
                        <TableCell>
                          {editingScore?.matchId === m.id && editingScore?.field === 'match_1_score' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingScore.value}
                                onChange={(e) => setEditingScore({ ...editingScore, value: parseInt(e.target.value) || 0 })}
                                className="w-16 h-8"
                              />
                              <Button size="sm" variant="ghost" onClick={saveScore}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingScore(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{m.match_1_score ?? '-'}</span>
                              {m.match_1_id && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => startEditing(m.id, 'match_1_score', m.match_1_score)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{m.match_2_name || '-'}</TableCell>
                        <TableCell>
                          {editingScore?.matchId === m.id && editingScore?.field === 'match_2_score' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingScore.value}
                                onChange={(e) => setEditingScore({ ...editingScore, value: parseInt(e.target.value) || 0 })}
                                className="w-16 h-8"
                              />
                              <Button size="sm" variant="ghost" onClick={saveScore}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingScore(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{m.match_2_score ?? '-'}</span>
                              {m.match_2_id && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => startEditing(m.id, 'match_2_score', m.match_2_score)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{m.match_3_name || '-'}</TableCell>
                        <TableCell>
                          {editingScore?.matchId === m.id && editingScore?.field === 'match_3_score' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editingScore.value}
                                onChange={(e) => setEditingScore({ ...editingScore, value: parseInt(e.target.value) || 0 })}
                                className="w-16 h-8"
                              />
                              <Button size="sm" variant="ghost" onClick={saveScore}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingScore(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{m.match_3_score ?? '-'}</span>
                              {m.match_3_id && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => startEditing(m.id, 'match_3_score', m.match_3_score)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {matchingComplete ? 'No matches found' : 'Run matching to generate matches'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </DataGridBackground>
  );
}
