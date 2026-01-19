import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQOption {
  value: string;
  label: string;
  emoji?: string;
}

interface MCQCardProps {
  question: string;
  options: MCQOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  questionNumber: number;
}

export function MCQCard({ question, options, selectedValue, onSelect, questionNumber }: MCQCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="text-primary text-sm font-medium tracking-wider uppercase">
          Question {questionNumber}
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold mt-2 text-foreground">
          {question}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(option.value)}
            className={cn(
              'relative p-6 rounded-lg border-2 transition-all duration-200 text-left',
              'hover:border-primary hover:bg-primary/5',
              selectedValue === option.value
                ? 'border-primary bg-primary/10 glow-card'
                : 'border-border bg-card'
            )}
          >
            {selectedValue === option.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            )}
            
            <div className="flex items-center gap-3">
              {option.emoji && (
                <span className="text-2xl">{option.emoji}</span>
              )}
              <span className="text-lg font-medium text-foreground">
                {option.label}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
