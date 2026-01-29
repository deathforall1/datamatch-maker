import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Users, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGridBackground } from '@/components/DataGridBackground';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/status');
    }
  }, [user, loading, navigate]);

  return (
    <DataGridBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Event Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">XLRI Exclusive Event</span>
              </motion.div>

              {/* Main Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
                Kismat
                <span className="text-primary"> Konnection</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                Data-driven matchmaking by DARVIX
              </p>

              <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
                Answer 10 quick questions and our algorithm will find your most compatible matches 
                from fellow participants. No swiping, no games — just science.
              </p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8 py-6 glow-card">
                    Register Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid md:grid-cols-3 gap-6 mt-20"
            >
              <div className="bg-card/50 border border-border rounded-xl p-6 text-left">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Smart Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithm analyzes personality, values, and preferences to find genuinely compatible matches.
                </p>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6 text-left">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Top 3 Matches</h3>
                <p className="text-sm text-muted-foreground">
                  Receive your three most compatible matches with compatibility scores after the matching runs.
                </p>
              </div>

              <div className="bg-card/50 border border-border rounded-xl p-6 text-left">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is only used for this event and handled with care by the DARVIX team.
                </p>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>Made with ❤️ by DARVIX — Data Analytics, Research and Visualization at XLRI</p>
          </div>
        </footer>
      </div>
    </DataGridBackground>
  );
}
