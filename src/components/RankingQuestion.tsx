import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface RankingItem {
  value: string;
  label: string;
  emoji?: string;
}

interface RankingQuestionProps {
  question: string;
  items: RankingItem[];
  currentOrder: string[] | null;
  onOrderChange: (order: string[]) => void;
  questionNumber: number;
}

export function RankingQuestion({ 
  question, 
  items, 
  currentOrder, 
  onOrderChange, 
  questionNumber 
}: RankingQuestionProps) {
  // Initialize order from currentOrder or default to items order
  const [orderedItems, setOrderedItems] = useState<RankingItem[]>(() => {
    if (currentOrder && currentOrder.length === items.length) {
      return currentOrder.map(value => 
        items.find(item => item.value === value) || items[0]
      );
    }
    return items;
  });

  useEffect(() => {
    if (currentOrder && currentOrder.length === items.length) {
      const newOrder = currentOrder.map(value => 
        items.find(item => item.value === value) || items[0]
      );
      setOrderedItems(newOrder);
    }
  }, [currentOrder, items]);

  const handleReorder = (newOrder: RankingItem[]) => {
    setOrderedItems(newOrder);
    onOrderChange(newOrder.map(item => item.value));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="text-center mb-8">
        <span className="text-primary text-sm font-medium tracking-wider uppercase">
          Question {questionNumber}
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold mt-2 text-foreground">
          {question}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Drag to rank from most to least important
        </p>
      </div>

      <Reorder.Group
        axis="y"
        values={orderedItems}
        onReorder={handleReorder}
        className="space-y-3"
      >
        {orderedItems.map((item, index) => (
          <Reorder.Item
            key={item.value}
            value={item}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1.05 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 text-primary rounded-full font-bold text-sm">
                {index + 1}
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                {item.emoji && (
                  <span className="text-xl">{item.emoji}</span>
                )}
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </motion.div>
  );
}
