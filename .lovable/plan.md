

## Fix: Handle Gender Imbalance in Matching Algorithm

### Problem
9 male participants have null/empty matches because there are 17 males seeking 8 females. With the mutual matching constraint (max 3 matches per person), there aren't enough female "slots" for everyone.

### Solution: Multi-Pass Matching with Better Distribution

**Step 1: First pass - Ensure everyone gets at least 1 match**
- Process participants by fewest compatible candidates first
- Only assign 1 match per person initially
- This ensures the 8 females each get 1 male, covering 8 males

**Step 2: Second pass - Fill up to 2 matches each**
- Repeat the process to give everyone a second match where possible
- Again prioritizing those with fewer options

**Step 3: Third pass - Complete to 3 matches**
- Fill remaining slots up to 3 matches per person

**Step 4: Fallback for unmatched participants**
- For participants who still have 0 matches after all passes, assign their best compatible candidates even if one-sided
- Mark these as "suggested connections" rather than mutual matches

### Alternative Option: Allow Asymmetric Matching
- Allow more than 3 matches for participants in the minority gender (females in this case) so that more males can be matched
- Or increase match limit to 4-5 for everyone

### Database Changes (Optional)
- Add `match_is_mutual` boolean columns to indicate if matches are reciprocal
- This helps admins and participants understand match quality

### Expected Outcome
After implementing this fix:
- All 25 participants will have at least 1-2 matches
- High-compatibility pairs will still be prioritized
- Participants will see fallback matches if mutual options are exhausted

