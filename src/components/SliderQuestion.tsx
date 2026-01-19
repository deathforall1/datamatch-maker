import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

interface SliderQuestionProps {
  question: string;
  leftLabel: string;
  rightLabel: string;
  value: number | null;
  onChange: (value: number) => void;
  questionNumber: number;
  emoji?: string;
}

export function SliderQuestion({
  question,
  leftLabel,
  rightLabel,
  value,
  onChange,
  questionNumber,
  emoji,
}: SliderQuestionProps) {
  const currentValue = value ?? 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="text-primary text-sm font-medium tracking-wider uppercase">
          Question {questionNumber}
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold mt-2 text-foreground flex items-center justify-center gap-3">
          {emoji && <span className="text-3xl">{emoji}</span>}
          {question}
        </h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex justify-between mb-6">
          <span className="text-sm font-medium text-muted-foreground">
            {leftLabel}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {rightLabel}
          </span>
        </div>

        <Slider
          value={[currentValue]}
          onValueChange={(values) => onChange(values[0])}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />

        <div className="flex justify-between mt-3">
          {[1, 2, 3, 4, 5].map((num) => (
            <motion.div
              key={num}
              animate={{
                scale: currentValue === num ? 1.2 : 1,
                color: currentValue === num ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}
              className="w-8 h-8 flex items-center justify-center text-sm font-semibold"
            >
              {num}
            </motion.div>
          ))}
        </div>

        <motion.div
          key={currentValue}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-primary font-semibold text-lg">{currentValue}</span>
            <span className="text-muted-foreground text-sm">/ 5</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
