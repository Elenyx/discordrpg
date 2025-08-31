## **Project Context for the One Piece RPG Discord Bot**

**Objective:**
Create a robust and dynamic Discord bot for a One Piece RPG. The bot will feature character creation, questing, faction systems, ship mechanics, and PvP. The game will use a variety of interactive features (buttons, select menus) and rely on a PostgreSQL database for state persistence.

**Tech Stack:**

* **Backend:** Node.js + discord.js (for advanced interaction and state management)
* **Database:** PostgreSQL (hosted on Railway)
* **Hosting:** Railway (for continuous deployment)
* **Interactions:** Discord Components V2 (buttons, select menus, modals)
* **State Management:** Ensure responsiveness through proper expiration handling to avoid memory leaks.

---

### **Coding Guidelines:**

1. **Use of JavaScript/Node.js (Not Python)**

   * Write code in JavaScript using Node.js and the `discord.js` library for Discord bot interactions.
   * The project is server-side JavaScript-heavy. Avoid Python and its dependencies unless it’s for database operations or separate integrations like analytics.
   * Ensure **modularity**: Each feature (e.g., quests, ships, combat) should be encapsulated in separate modules.

2. **Database Integration:**

   * Use **PostgreSQL** for persistent data storage. Models should be clear and normalized:

     * **Users:** Store player stats, faction alignment, character progression, etc.
     * **Quests:** Track quest status, unlock conditions, and rewards.
     * **Crew System:** Track crews, their reputation, and roles (captain, first mate, etc.).
   * Use **sequelize.js** (ORM for PostgreSQL) for interacting with the database, ensuring that all database queries are safe and efficient.

3. **State Management and Expiration Handling:**

   * Implement **state management** using a session-based approach, where quest progression, ship status, and crew data are stored in-memory or the database.
   * Set expiration for time-sensitive quests, missions, or events to automatically reset after a certain period.
   * Ensure **memory management** is handled efficiently, particularly when dealing with large numbers of players and quests, to avoid memory leaks.

4. **Discord Bot Interactions (discord.js):**

   * **Use Components V2** for interactive messages. Buttons, select menus, and modals should be used to guide users through quests, faction choices, and ship upgrades.
   * **Component state management**: Manage the state of buttons, modals, and select menus. Ensure they handle expiration, updates, and reset conditions to avoid stale interactions or memory overflows.
   * Integrate **reaction-based events** for some non-critical interactions (e.g., quick replies or affirmations).

5. **Modular and Clean Code:**

   * **Keep functions concise**. Each function should handle a single task, whether it’s processing a command or updating a user’s database record.
   * Use **async/await** to handle asynchronous operations (e.g., database queries, Discord API calls).
   * Avoid hardcoding values. Instead, use constants or environment variables where necessary.

6. **Quest and Faction Systems:**

   * Implement a **quest framework** with dynamic quest types: Main Story Quests (MSQ), side quests, faction missions, and PvP missions.
   * Each quest should be its own object/module with clear hooks for interactions, progression tracking, and reward systems.
   * For **faction systems**, create an automatic system that tracks players' alignment with factions (Pirates, Marines, Revolutionaries). Rewards and quests should be faction-specific.
   * Include **multi-path branching** for quests. Choices made during quests should impact future story arcs and character progression.

7. **Combat and PvP:**

   * Design a **turn-based combat system** for PvP, where players can challenge other crews, use their ship's abilities, and engage in tactical combat.
   * **Crew roles and ship upgrades** should impact combat efficiency. For example, the **navigator** role may influence the initiative in battle, while the **shipwright** role can improve ship health or speed.
   * Allow for **crew vs. crew** combat and implement a strategy where multiple crews can battle for control of islands or resources.

8. **User-Friendly Command Structure:**

   * Use clear, **intuitive commands** that align with standard Discord usage:

     * `/createcharacter`: Initialize character creation.
     * `/shop`: Check available items for purchase.
     * `/buy item`: Purchase items from the shop.
     * `/sell item`: Sell items back to the shop.
     * `/auction`: Start an auction for items.
     * `/bid item`: Place a bid on an auction item.
     * `/cancelbid item`: Cancel your bid on an auction item.
     * `/use item`: Use an item from your inventory.
     * `/travel`: Initiate travel to a new location.
     * `/explore`: Discover new areas or hidden treasures.
     * `/dive`: Explore underwater locations.
     * `/faction`: Show faction information and status.
     * `/ally`: Manage alliances with other canon characters from each saga or arc.
     * `/enemy`: Manage rivalries with other canon characters from each saga or arc.
     * `/neutral`: Manage neutral relationships with other canon characters from each saga or arc.
     * `/betray`: Manage betrayals with other canon characters from each saga or arc.
     * `/profile`: Show character profile.
     * `/stats`: Show character stats and attributes.
     * `/skills`: Show character skills and abilities.
     * `/traits`: Show character traits and backgrounds.
     * `/backstory`: Show character backstory and lore.
     * `/lore`: Show world lore and history.
     * `/quests`: Show active and completed quests.
     * `/mainquest`: Show main story quest information and progress.
     * `/sidequests`: Show side quest information and progress.
     * `/factionquests`: Show faction-specific quest information and progress.
     * `/eventquests`: Show event-specific quest information and progress.
     * `/dailyquests`: Show daily quest information and progress.
     * `/weeklyquests`: Show weekly quest information and progress.
     * `/monthlyquests`: Show monthly quest information and progress.
     * `/seasonalquests`: Show seasonal quest information and progress.
     * `/specialquests`: Show special quest information and progress.
     * `/randomquests`: Show random quest information and progress.
     * `/customquests`: Show custom quest information and progress.
     * `/craft`: Show crafting options and materials.
     * `/gather`: Show gathering options and materials.
     * `/harvest`: Show harvesting options and materials.
     * `/mine`: Show mining options and materials.
     * `/fish`: Show fishing options and materials.
     * `/forage`: Show foraging options and materials.
     * `/hunt`: Show hunting options and materials.
     * `/trap`: Show trapping options and materials.
     * `/build`: Show building options and materials.
     * `/upgrade`: Show upgrade options and materials.
     * `/repair`: Show repair options and materials.
     * `/enhance`: Show enhancement options and materials.
     * `/refine`: Show refining options and materials.
     * `/transmute`: Show transmutation options and materials.
     * `/alchemy`: Show alchemy options and materials.
     * `/cooking`: Show cooking options and materials.
     * `/brewing`: Show brewing options and materials.
     * `/smelting`: Show smelting options and materials.
     * `/blacksmithing`: Show blacksmithing options and materials.
     * `/tailoring`: Show tailoring options and materials.
     * `/carpentry`: Show carpentry options and materials.
     * `/devilfruit`: Show devil fruit information and abilities.
     * `/bounty`: Show player bounty information.
     * `/wanted`: Show player wanted status and rewards.
     * `/infamy`: Show player infamy status and rewards.
     * `/fame`: Show player fame status and rewards.
     * `/reputation`: Show player reputation status and rewards.
     * `/rank`: Show player rank and achievements.
     * `/level`: Show player level and experience.
     * `/experience`: Show player experience points and progress.
     * `/inventory`: Show items, ships, and allies.
     * `/bank`: Show player bank information and transactions.
     * `/stash`: Show player stash information and items.
     * `/crew`: Crew creation and management.
     * `/joincrew`: Join an existing crew.
     * `/leavecrew`: Leave the current crew.
     * `/createcrew`: Create a new crew.
     * `/crewinfo`: Show information about the current crew.
     * `/ship`: Ship upgrades and combat.
     * `/pvp`: Show PvP options and challenges.
     * `/pvp challenge`: Initiate PvP battles with other crews.
     

9. **Error Handling & Edge Cases:**

   * Use **error-handling middleware** to catch exceptions or unexpected inputs.
   * Anticipate **edge cases**: What happens if a player leaves mid-quest? If they’ve already completed a quest, how should the bot behave?

10. **Scalability and Performance:**

* Ensure that the bot is **scalable** to handle a large number of players. This includes efficient database queries and rate-limiting of commands to avoid bot overload.
* Optimize the **event-handling system** to handle multiple events (e.g., PvP challenges, quest completions) occurring simultaneously.

---

### **Key Instructions for AI Code Generation (like GitHub Copilot):**

1. **Follow Naming Conventions:**

   * Use **camelCase** for variable and function names.
   * Use **PascalCase** for classes or major object structures (e.g., `QuestManager`, `FactionSystem`).

2. **Use Comments Liberally:**

   * Provide detailed comments for all functions, especially for complex logic such as quest progression, combat mechanics, and state expiration.
   * Inline comments should be used for explanations of the business logic, not just code functionality.

3. **Provide Contextual Understanding:**

   * When generating code for a specific feature (e.g., ship combat mechanics), ensure that it’s built upon the project context, such as the fact that ships play an integral role in PvP and faction control.

4. **Prompt-Based Enhancements:**

   * Ensure that AI understands prompts like **“add a new command for handling crew management”** or **“create a system for tracking quest completion across multiple arcs.”**

5. **Encourage Code Optimization:**

   * When AI generates a solution, it should strive for **efficiency** in both **performance** and **readability**. It should always consider optimizing database queries, API calls, and managing asynchronous code effectively.

---

