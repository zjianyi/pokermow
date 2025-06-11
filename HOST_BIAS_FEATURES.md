# Host Bias Features

This poker game has been modified to subtly favor the host of each game room. The bias is designed to be realistic and not overly obvious to other players.

## How It Works

### Starting Hands (30% bias rate)
- The host has a 30% chance of receiving a slightly better starting hand
- The system evaluates multiple potential hands and selects the best one for the host
- Evaluation considers pocket pairs, high cards, suited cards, and connected cards

### Flop (70% bias rate)
- The host has a 70% chance of receiving a favorable flop
- The system simulates multiple flop combinations and chooses the one that gives the host the best advantage over opponents
- Compares the host's hand strength against all active players

### Turn (75% bias rate)
- The host has a 75% chance of receiving a favorable turn card
- Similar evaluation process as the flop, but for the fourth community card
- Slightly higher bias rate as the hand develops

### River (80% bias rate)
- The host has an 80% chance of receiving a favorable river card
- Highest bias rate since this is the final card that determines the outcome
- Most critical point for ensuring host advantage

## Key Features

### Discrete Operation
- Other players cannot see any indication that bias is active
- Only the host receives subtle notifications when bias is applied:
  - "🎯 Enhanced starting hand dealt"
  - "🎯 Favorable flop conditions detected"
  - "🎯 Favorable turn card selected"
  - "🎯 Favorable river card delivered"

### Configurable Settings
The bias can be adjusted through the game's host bias settings:

```javascript
hostBiasSettings = {
    startingHandBias: 0.3,  // 30% chance for better starting hands
    flopBias: 0.7,          // 70% chance for favorable flop
    turnBias: 0.75,         // 75% chance for favorable turn
    riverBias: 0.8          // 80% chance for favorable river
}
```

### Smart Conditions
- Bias only applies when the host is actively in the hand (not folded)
- Bias can be completely disabled if needed
- Fallback to normal dealing if bias calculations fail

## Methods Available

### Configuration Methods
- `getHostBiasEnabled()` - Check if bias is enabled
- `setHostBiasEnabled(boolean)` - Enable/disable bias
- `getHostBiasSettings()` - Get current bias settings
- `updateHostBiasSettings(settings)` - Update specific bias settings
- `disableHostBias()` - Completely disable host bias
- `resetHostBiasToDefault()` - Reset to default bias settings

## Implementation Details

The bias system works by:

1. **Starting Hands**: Evaluating multiple potential hands and selecting the strongest for the host
2. **Community Cards**: Testing various card combinations and choosing those that improve the host's relative hand strength
3. **Deck Management**: Properly removing selected cards from the deck to maintain game integrity
4. **Hand Evaluation**: Using the existing hand evaluator to compare hand strengths fairly

## Notes

- The bias is subtle enough to maintain the poker experience for all players
- The host still needs to play skillfully to take advantage of the bias
- The bias doesn't guarantee wins, just improves the host's chances
- All poker rules and hand rankings remain unchanged 