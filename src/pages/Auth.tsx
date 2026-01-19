import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataGridBackground } from '@/components/DataGridBackground';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import darvixLogo from '@/assets/darvix-logo.png';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const otpSchema = z.string().length(6, 'OTP must be 6 digits');

export default function Auth() {
  const navigate = useNavigate();
  const { signInWithOtp, verifyOtp } = useAuth();
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const { error } = await signInWithOtp(email);
    
    if (error) {
      setError(error.message);
      toast.error('Failed to send OTP');
    } else {
      setStep('otp');
      toast.success('Check your email for the magic link!');
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      otpSchema.parse(otp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const { error } = await verifyOtp(email, otp);
    
    if (error) {
      setError(error.message);
      toast.error('Invalid OTP');
    } else {
      toast.success('Welcome!');
      navigate('/register');
    }
    
    setLoading(false);
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
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl p-8 glow-card">
              <AnimatePresence mode="wait">
                {step === 'email' ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        Sign In / Register
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Enter your email to receive a magic link
                      </p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@xlri.ac.in"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background"
                          disabled={loading}
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Magic Link'
                        )}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <button
                      onClick={() => setStep('email')}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                      </div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        Enter OTP
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        We sent a 6-digit code to<br />
                        <span className="text-primary font-medium">{email}</span>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="bg-background text-center text-2xl tracking-widest"
                          maxLength={6}
                          disabled={loading}
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-destructive">{error}</p>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Continue'
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        Didn't receive the code?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setStep('email');
                            setOtp('');
                          }}
                          className="text-primary hover:underline"
                        >
                          Try again
                        </button>
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              By continuing, you agree to our event terms and privacy policy.
            </p>
          </motion.div>
        </main>
      </div>
    </DataGridBackground>
  );
}
