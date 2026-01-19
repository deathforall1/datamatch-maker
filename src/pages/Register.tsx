import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGridBackground } from '@/components/DataGridBackground';
import { ProgressBar } from '@/components/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GENDER_OPTIONS, GenderType } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import darvixLogo from '@/assets/darvix-logo.png';

type RegistrationStep = 1 | 2 | 3;

interface RegistrationData {
  name: string;
  age: string;
  gender: GenderType | null;
  partnerPreference: GenderType[];
  consent: boolean;
  adminCode: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [data, setData] = useState<RegistrationData>({
    name: '',
    age: '',
    gender: null,
    partnerPreference: [],
    consent: false,
    adminCode: '',
  });

  // Check if user already registered
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkExistingRegistration();
    }
  }, [user, authLoading, navigate]);

  const checkExistingRegistration = async () => {
    if (!user) return;

    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking registration:', error);
        setCheckingExisting(false);
        return;
      }

      if (participant) {
        // User already registered, check questionnaire status
        if (participant.questionnaire_complete) {
          navigate('/status');
        } else {
          navigate('/questionnaire');
        }
      } else {
        setCheckingExisting(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setCheckingExisting(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as RegistrationStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as RegistrationStep);
    }
  };

  const togglePreference = (gender: GenderType) => {
    setData(prev => ({
      ...prev,
      partnerPreference: prev.partnerPreference.includes(gender)
        ? prev.partnerPreference.filter(g => g !== gender)
        : [...prev.partnerPreference, gender]
    }));
  };

  const handleSubmit = async () => {
    if (!user || !data.gender || data.partnerPreference.length === 0) return;

    setLoading(true);

    try {
      // Insert participant
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          user_id: user.id,
          email: user.email!,
          name: data.name,
          age: parseInt(data.age),
          gender: data.gender,
          partner_preference: data.partnerPreference,
          consent_given: data.consent,
          registration_complete: true,
        });

      if (participantError) throw participantError;

      // Create empty questionnaire response
      const { error: responseError } = await supabase
        .from('questionnaire_responses')
        .insert({
          user_id: user.id,
          current_step: 1,
        });

      if (responseError) throw responseError;

      // Check if admin code matches
      if (data.adminCode.trim()) {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'admin_code')
          .maybeSingle();

        if (settings && settings.value === data.adminCode.trim()) {
          // Add admin role
          await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'admin',
            });
          toast.success('Admin access granted!');
        }
      }

      toast.success('Registration complete!');
      navigate('/questionnaire');
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = data.name.trim().length >= 2;
  const isStep2Valid = data.gender !== null && data.partnerPreference.length > 0 && 
    parseInt(data.age) >= 18 && parseInt(data.age) <= 99;
  const isStep3Valid = data.consent;

  if (authLoading || checkingExisting) {
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
            <Link to="/">
              <img src={darvixLogo} alt="DARVIX" className="h-10" />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <ProgressBar currentStep={step} totalSteps={3} className="mb-8" />

            <div className="bg-card border border-border rounded-2xl p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-foreground">Let's get started</h2>
                      <p className="text-muted-foreground mt-1">Tell us about yourself</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">What should we call you?</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={data.name}
                        onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-background"
                      />
                    </div>

                    <Button 
                      onClick={handleNext} 
                      className="w-full" 
                      size="lg"
                      disabled={!isStep1Valid}
                    >
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-foreground">About You</h2>
                      <p className="text-muted-foreground mt-1">This helps us find your matches</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="21"
                        min={18}
                        max={99}
                        value={data.age}
                        onChange={(e) => setData(prev => ({ ...prev, age: e.target.value }))}
                        className="bg-background"
                      />
                      {data.age && parseInt(data.age) < 18 && (
                        <p className="text-sm text-destructive">Must be 18 or older</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>I identify as</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setData(prev => ({ ...prev, gender: option.value }))}
                            className={cn(
                              'p-4 rounded-lg border-2 transition-all text-sm font-medium',
                              data.gender === option.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>I'm interested in (select all that apply)</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => togglePreference(option.value)}
                            className={cn(
                              'p-4 rounded-lg border-2 transition-all text-sm font-medium relative',
                              data.partnerPreference.includes(option.value)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            )}
                          >
                            {data.partnerPreference.includes(option.value) && (
                              <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                            )}
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} size="lg">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back
                      </Button>
                      <Button 
                        onClick={handleNext} 
                        className="flex-1" 
                        size="lg"
                        disabled={!isStep2Valid}
                      >
                        Continue
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-foreground">Almost Done!</h2>
                      <p className="text-muted-foreground mt-1">Review and confirm</p>
                    </div>

                    <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{data.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{data.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium">
                          {GENDER_OPTIONS.find(g => g.value === data.gender)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interested in:</span>
                        <span className="font-medium">
                          {data.partnerPreference.map(g => 
                            GENDER_OPTIONS.find(opt => opt.value === g)?.label
                          ).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent"
                        checked={data.consent}
                        onCheckedChange={(checked) => 
                          setData(prev => ({ ...prev, consent: checked === true }))
                        }
                      />
                      <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
                        I consent to DARVIX using my responses for the Perfect Date matching event. 
                        My data will be handled with care and not shared outside this event.
                      </label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminCode" className="text-muted-foreground">
                        Admin Code (optional)
                      </Label>
                      <Input
                        id="adminCode"
                        type="password"
                        placeholder="Enter if you have one"
                        value={data.adminCode}
                        onChange={(e) => setData(prev => ({ ...prev, adminCode: e.target.value }))}
                        className="bg-background"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} size="lg">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        className="flex-1" 
                        size="lg"
                        disabled={!isStep3Valid || loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          'Complete Registration'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>
      </div>
    </DataGridBackground>
  );
}
