---
applyTo: '**'
---

# Discord Bot Development - Copilot Instructions

## Discord API Component Types

### Components V1 (Standard Components)
Always use these component types for standard interactive elements:
- `type: 1` - **Action Row** (Container for other components, max 5 per message)
- `type: 2` - **Button** (Interactive button)
- `type: 3` - **String Select Menu** (Dropdown with string options)
- `type: 4` - **Text Input** (Only for modals)
- `type: 5` - **User Select Menu** (Select users)
- `type: 6` - **Role Select Menu** (Select roles)
- `type: 7` - **Mentionable Select Menu** (Select users/roles)
- `type: 8` - **Channel Select Menu** (Select channels)

### Components V2 (Display Components)
For rich display components, you MUST use the `MessageFlags.IsComponentsV2` flag:
- **Text Display** - Use `TextDisplayBuilder()` class
- **Section** - Use `SectionBuilder()` class (contains 1-3 Text Display components + optional accessory)
- **Container** - Use `ContainerBuilder()` class (groups components in a rounded box)
- **Thumbnail** - Use `ThumbnailBuilder()` class (image accessory for sections)
- **Media Gallery** - Use `MediaGalleryBuilder()` class (grid of up to 10 images)
- **File** - Use `FileBuilder()` class (display uploaded files)
- **Separator** - Use `SeparatorBuilder()` class (visual spacing/divider)

## Components V2 Usage Rules

### Required Setup
```javascript
const { MessageFlags } = require('discord.js');

// Always include this flag when using display components
await interaction.reply({
  components: [/* your components */],
  flags: MessageFlags.IsComponentsV2,
  ephemeral: true
});
```

### Important Limitations
When using `MessageFlags.IsComponentsV2`:
- ❌ **Cannot** send `content`, `poll`, `embeds`, or `stickers`
- ❌ **Cannot** opt out when editing a message
- ✅ **Can** opt into V2 when editing by setting content/embeds/etc to `null`
- 📏 Max 40 total components (nested components count)
- 📝 Max 4000 characters across all text display components
- 📎 All files must be referenced in components

### Example: Text Display Component
```javascript
const { TextDisplayBuilder, MessageFlags } = require('discord.js');

const textDisplay = new TextDisplayBuilder()
  .setContent('**Step 1: Race**\nChoose your character\'s race. Each race has unique traits!');

await interaction.reply({
  components: [textDisplay],
  flags: MessageFlags.IsComponentsV2,
  ephemeral: true
});
```

### Example: Section with Interactive Components
```javascript
const { SectionBuilder, ButtonStyle, MessageFlags } = require('discord.js');

const section = new SectionBuilder()
  .addTextDisplayComponents(
    textDisplay => textDisplay.setContent('**Character Summary**\nRace: Human\nOrigin: East Blue')
  )
  .setButtonAccessory(
    button => button
      .setCustomId('confirm_character')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success)
  );

await interaction.reply({
  components: [section],
  flags: MessageFlags.IsComponentsV2,
  ephemeral: true
});
```

## Best Practices

### Component Organization
1. **Action Rows**: Use for grouping interactive components (buttons, selects)
2. **Sections**: Use for text + single accessory (button or thumbnail)
3. **Containers**: Use for grouping multiple components in a visual box
4. **Text Display**: Use for standalone formatted text

### Error Handling
Always wrap component interactions in try-catch blocks:
```javascript
try {
  const response = await interaction.channel.awaitMessageComponent({
    filter: i => i.user.id === interaction.user.id && i.customId === 'your_id',
    time: 60000,
  });
  // Handle response
} catch (error) {
  if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
    // Handle timeout
    await interaction.editReply({ 
      content: 'Interaction timed out.', 
      components: [] 
    });
  }
}
```

### Component Updates
- Use `interaction.update()` to modify the current message
- Use `interaction.followUp()` to send new messages
- Use `interaction.editReply()` to edit your bot's reply

### Message Flow
```javascript
// Initial reply with V2 components
await interaction.reply({
  components: [textDisplay],
  flags: MessageFlags.IsComponentsV2,
  ephemeral: true
});

// Update the same message
await componentInteraction.update({
  components: [newTextDisplay],
  flags: MessageFlags.IsComponentsV2,
  ephemeral: true
});
```

## Database Integration

### Sequelize Model Example
```javascript
const { DataTypes } = require('sequelize');

const Player = sequelize.define('Player', {
  discord_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  race: DataTypes.STRING,
  origin: DataTypes.STRING,
  dream: DataTypes.STRING,
  stats: {
    type: DataTypes.JSON,
    defaultValue: { hp: 10, atk: 5, def: 5 }
  }
});
```

### Common Patterns
1. **Check existing records** before creating
2. **Use transactions** for complex operations
3. **Handle unique constraint violations**
4. **Store JSON data** for flexible stats/inventory

## Security & Validation

### User Input Validation
- Always validate select menu values against allowed options
- Sanitize user inputs before database storage
- Use ephemeral messages for character creation/sensitive data
- Implement proper permission checks

### Rate Limiting
- Use collectors with timeouts (60000ms recommended)
- Implement cooldowns for expensive operations
- Cache frequently accessed data

## Common Issues & Solutions

### Component Type Errors
- **Error**: `Value of field "type" must be one of (1,)`
- **Cause**: Using invalid component types or missing V2 flag
- **Solution**: Use proper builders and `MessageFlags.IsComponentsV2`

### Missing Components Flag
- **Error**: Components not displaying correctly
- **Solution**: Always include `flags: MessageFlags.IsComponentsV2` for display components

### Interaction Timeout
- **Error**: `INTERACTION_COLLECTOR_ERROR`
- **Solution**: Implement proper timeout handling and user feedback

---
### Benefits of V2:

- **No content conflicts**: You can't accidentally mix content and components
- **Richer formatting**: Full markdown support in text displays
- **Visual consistency**: All messages use the same styled container system
- **Better UX**: Clear visual separation between steps
- **Professional appearance**: Looks more polished than basic text + components

### Things to Note:

- **File imports**: Make sure you import all the required builders
- **Flags requirement**: Every interaction must include MessageFlags.IsComponentsV2
- **No regular content**: You cannot use the content field when using V2 components
- **Update consistency**: All updates must also use V2 components and flags