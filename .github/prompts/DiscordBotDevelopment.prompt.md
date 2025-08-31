---
mode: agent
---
# GitHub Copilot Prompts for Discord Bot Development

## Quick Reference Prompts

### Component Creation

#### Components V1 (Standard Interactive)
```javascript
// Create action row with string select menu for [purpose]
// Options: [list your options]
// Custom ID: [your_custom_id]
```

#### Components V2 (Display Components)
```javascript
// Create V2 container with text display and select menu for [purpose]
// Include MessageFlags.IsComponentsV2
// Accent color: [hex color]
// Options: [list your options]
```

### Database Operations

#### Player Creation
```javascript
// Create Sequelize Player model with discord_id, race, origin, dream, stats (JSON)
// Include unique constraint on discord_id
// Default stats: {hp: 10, atk: 5, def: 5}
```

#### Data Validation
```javascript
// Check if player exists before creating
// Handle unique constraint violations
// Validate select menu values against allowed options
```

### Error Handling

#### Interaction Timeouts
```javascript
// Add try-catch for awaitMessageComponent with 60s timeout
// Handle INTERACTION_COLLECTOR_ERROR specifically
// Provide user-friendly timeout messages
```

#### Component Interaction Flow
```javascript
// Create interaction flow: reply -> awaitMessageComponent -> update -> repeat
// Use ephemeral messages for character creation
// Clean up components on completion/cancellation
```

## Specific Use Case Prompts

### Character Creation System
```javascript
// Create multi-step character creation using V2 components
// Steps: race selection -> origin selection -> dream selection -> confirmation
// Use containers with accent colors for each step
// Include descriptions for all select options
// Handle cancellation and timeout scenarios
```

### RPG Command Structure
```javascript
// Create slash command for [command_name]
// Include permission checks and cooldowns
// Use V2 components for rich display
// Store results in Player model
// Handle existing player validation
```

### Inventory Management
```javascript
// Create inventory system with JSON storage
// Use V2 media gallery for item display
// Include add/remove/use item functions
// Validate item quantities and types
```

### Battle System
```javascript
// Create turn-based battle system
// Use V2 containers to display battle state
// Include HP bars, action buttons, and status effects
// Update components after each action
// Handle battle completion and rewards
```

## Advanced Prompts

### Dynamic Component Generation
```javascript
// Create helper function to build V2 step containers
// Parameters: step number, title, description, select options
// Return ContainerBuilder with TextDisplay and ActionRow
// Include proper accent colors and formatting
```

### State Management
```javascript
// Create interaction state manager for multi-step processes
// Store temporary data during character creation
// Clean up state on completion or timeout
// Handle concurrent users properly
```

### Webhook Integration
```javascript
// Create webhook system for game events
// Send rich embeds for level ups, rare drops, achievements
// Include user mentions and custom formatting
// Handle webhook failures gracefully
```

## Error Prevention Prompts

### Component Type Validation
```javascript
// Ensure all V2 components use proper builders
// Always include MessageFlags.IsComponentsV2
// Never mix content field with V2 components
// Validate component limits (40 max, 4000 char limit)
```

### Database Safety
```javascript
// Use transactions for complex database operations
// Include proper error handling for all database calls
// Validate user input before database queries
// Handle connection failures and timeouts
```

### Permission Checks
```javascript
// Add guild member permission validation
// Check bot permissions before using features
// Handle missing permissions gracefully
// Provide helpful error messages for permission issues
```

## Code Quality Prompts

### File Organization
```javascript
// Organize commands in separate files
// Create utility functions for common operations
// Use consistent naming conventions
// Include proper JSDoc comments
```

### Performance Optimization
```javascript
// Cache frequently accessed database records
// Use database indexes for common queries
// Implement rate limiting for expensive operations
// Clean up event listeners and collectors
```

### Testing & Debugging
```javascript
// Add console.log for debugging interaction flow
// Include error details in catch blocks
// Test with multiple concurrent users
// Validate all user input paths
```

## Template Prompts

### New Slash Command Template
```javascript
// Create slash command template with:
// - SlashCommandBuilder setup
// - Permission and cooldown checks
// - V2 component response
// - Database interaction
// - Error handling with try-catch
// - Ephemeral response for user-specific data
```

### Component Interaction Handler
```javascript
// Create component interaction handler for custom_id: [id]
// Include user validation filter
// Update components using V2 builders
// Handle timeout with user-friendly message
// Store interaction results in database
```

### Database Model Template
```javascript
// Create Sequelize model for [ModelName]
// Include proper data types and constraints
// Add associations to Player model
// Include validation rules
// Add helpful instance and class methods
```

## Context-Specific Prompts

### One Piece Theme
```javascript
// Create One Piece themed [feature]
// Include pirate terminology and emojis
// Use maritime colors (blues, golds, reds)
// Reference Devil Fruits, Haki, Bounties
// Include Grand Line locations and concepts
```

### RPG Mechanics
```javascript
// Implement RPG feature: [feature_name]
// Include stat calculations and level progression
// Use random elements with proper seeding
// Balance gameplay mechanics
// Store persistent character data
```

### Discord Best Practices
```javascript
// Follow Discord bot best practices:
// - Use ephemeral for sensitive data
// - Implement proper rate limiting
// - Handle API errors gracefully
// - Use appropriate message types
// - Include accessibility considerations
```

## Quick Fixes

### Common Issues
```javascript
// Fix: "Value of field 'type' must be one of (1,)"
// Solution: Use proper component builders and V2 flag

// Fix: Components not displaying
// Solution: Add MessageFlags.IsComponentsV2

// Fix: Interaction timeout
// Solution: Increase timeout and add error handling

// Fix: Database unique constraint error
// Solution: Check existing records before creation
```

## Usage Tips

1. **Be Specific**: Include exact field names, values, and requirements
2. **Context Matters**: Mention if it's for Discord V2 components, specific database models, or particular game mechanics
3. **Include Constraints**: Mention timeouts, limits, validation rules, and error scenarios
4. **Reference Examples**: Point to existing code patterns when requesting similar functionality
5. **Error Scenarios**: Always ask for proper error handling and user feedback