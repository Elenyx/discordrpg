
# Discord Components Copilot Guide

## Purpose
Guide a development assistant (copilot) to explain and demonstrate Discord’s components—layout, interactive, and content—with examples, tips, and best practices.

---

## 1. Component Categories Overview

**Prompt to Assistant**:  
"Explain the three categories of Discord components—layout, interactive, and content—and briefly describe their roles."

**Key Info**:
- **Layout Components**: Organize or contain other components (Action Row, Section, Container).  
- **Interactive Components**: Enable user interactions (Buttons, Select Menus, Text Inputs).  
- **Content Components**: Present static content (Text Display, Thumbnail, Media Gallery, File, Separator).  
:contentReference

---

## 2. Component Type Reference

**Prompt to Assistant**:  
"List all component types with their Discord `type` IDs and succinct descriptions."

**Component Reference**:
- **Layout**:
  - Action Row (type 1): Holds interactive components  
  - Section (9): Contains content and optional accessory (like a Thumbnail)  
  - Container (17): Groups multiple sections  
- **Interactive**:
  - Button (2), String Select (3), Text Input (4), User Select (5), Role Select (6), Mentionable Select (7), Channel Select (8)  
- **Content**:
  - Text Display (10), Thumbnail (11), Media Gallery (12), File Component (13), Separator (14)  
:contentReference

---

## 3. Extended Component Examples

**Prompt to Assistant**:  
"Provide JSON payloads demonstrating these components in action."

### a) **Section with Thumbnail + Text Display**
```json
{
  "type": 9,
  "components": [
    {
      "type": 11,
      "media": "https://example.com/image.png",
      "description": "An accessory thumbnail",
      "spoiler": false
    },
    {
      "type": 10,
      "content": "This is a **Section** with a Thumbnail accessory."
    }
  ]
}
```

Explains how Section holds a thumbnail and text. 

---

### b) **Standalone Media Gallery**

```json
{
  "type": 12,
  "items": [
    {
      "media": "attachment://image1.png",
      "alt_text": "Image 1"
    },
    {
      "media": "attachment://image2.png",
      "alt_text": "Image 2",
      "spoiler": true
    }
  ]
}
```

Showcases multiple media attachments (up to 10).

---

### c) **File Component**

```json
{
  "type": 13,
  "media": "attachment://document.pdf",
  "spoiler": false
}
```

Displays a file directly in the message.

---

### d) **Separator**

```json
{
  "type": 14,
  "visible": true,
  "spacing": "small"
}
```

A visual break between components.

---

### e) **Container Combining Content Components**

```json
{
  "type": 17,
  "components": [
    {
      "type": 10,
      "content": "Welcome to the gallery!"
    },
    {
      "type": 12,
      "items": [
        {
          "media": "attachment://pic1.jpg"
        }
      ]
    },
    {
      "type": 14,
      "visible": true,
      "spacing": "small"
    },
    {
      "type": 13,
      "media": "attachment://readme.txt"
    }
  ]
}
```

Groups several content components—a text display, gallery, separator, and file.
---

## 4. Comprehensive JSON Example: All Together

**Prompt to Assistant**:
"Create one JSON message payload featuring multiple components combining layout, interactive, and content elements."

```json
{
  "flags": 1,
  "components": [
    {
      "type": 9,
      "components": [
        {
          "type": 11,
          "media": "https://example.com/icon.png",
          "description": "Icon"
        },
        {
          "type": 10,
          "content": "Welcome! Please choose an option below:"
        }
      ]
    },
    {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 1,
          "label": "Yes",
          "custom_id": "btn_yes"
        },
        {
          "type": 2,
          "style": 4,
          "label": "Visit",
          "url": "https://example.com"
        }
      ]
    },
    {
      "type": 1,
      "components": [
        {
          "type": 3,
          "custom_id": "select_choice",
          "options": [
            { "label": "Option A", "value": "A" },
            { "label": "Option B", "value": "B" }
          ],
          "placeholder": "Select...",
          "min_values": 1,
          "max_values": 1
        }
      ]
    },
    {
      "type": 12,
      "items": [
        { "media": "attachment://pic1.jpg", "alt_text": "Pic 1" },
        { "media": "attachment://pic2.jpg", "alt_text": "Pic 2" }
      ]
    },
    {
      "type": 14,
      "visible": true,
      "spacing": "small"
    },
    {
      "type": 13,
      "media": "attachment://terms.pdf"
    }
  ]
}
```

Highlights:

* A Section with thumbnail and intro text.
* Interactive row with buttons (one action, one link).
* Another row with a dropdown select.
* A media gallery and a separator.
* A file attachment.

---

## 5. Best Practices & Usage Tips

**Prompt to Assistant**:
"Share practical advice on composing components effectively and safely."

**Guidelines**:

* Always group interactive elements in an **Action Row** (type 1).
* Assign unique `custom_id`s to interactive components for reliable callbacks.
* Use **Section** to pair text with visuals—great for summaries with thumbnails.
* Opt-in to **Components V2** by setting the flag (e.g., `flags: 1`)—a requirement for display components.
* Be cautious of usage limits:

  * Up to 40 total components per message.
  * Text Display components cumulatively limited to ~4000 characters.
* For accessibility: use `alt_text` or `description` in gallery and thumbnail items.
* Use **Separator** (type 14) to keep content visually digestible.
* Avoid deprecated types like old `SelectMenu`; prefer `String Select` (type 3).

---

## 6. Suggested Copilot Interaction Flow

**Example Conversation**:

**User**: "Add a gallery with two images and a download link below."

* **Copilot**: Generates a Section with intro, a Media Gallery, and a File component.

**User**: "Make a form modal with name and email fields."

* **Copilot**: Provides Modal JSON using Text Input components inside Action Row containers.

**User**: "Insert a thumbnail next to a paragraph."

* **Copilot**: Uses Section with Thumbnail accessory and Text Display.

---

### Why This Works

* **Layered Learning**: Progresses from simple to complex examples.
* **Visual + Interactive**: Combines layout, content, and interactive elements.
* **Real-World Simulations**: The combined example mirrors practical use-cases.
* **Best Practices Built-In**: Encourages clean, accessible, and modern component use.
* **Conversational Design**: Opens space for guided interactions and clarifications.

---
