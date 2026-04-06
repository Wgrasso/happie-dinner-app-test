# Full-Page Group View

**Date:** 2026-04-06
**Status:** Approved

## Problem

The current groups screen uses expandable cards in a scrollable list. When a card expands, the content (attendees, voting, recipes) is crammed into an animated height area. It feels cramped and hard to navigate.

## Solution

Replace the expandable card list with a **full-page view showing one group at a time**. Users switch groups via an inline dropdown in the header. The dropdown supports drag-to-reorder so users control which group they see first.

## Design Decisions

- **Layout:** Full-page, not a modal or card expansion
- **Group switcher:** Inline dropdown below the header (not bottom sheet)
- **Reordering:** Long-press + drag in the dropdown to set group order
- **Persistence:** Group order saved to AsyncStorage
- **Visual style:** Identical to current app — same buttons, text, colors, fonts, spacing, border radius. Zero visual changes beyond the layout restructuring.

## Page Structure (top to bottom)

### Header
- Group photo (if set) + group name with ▾ chevron + member count
- Chat icon (with unread dot) + settings gear on the right
- Tapping group name opens the inline dropdown

### Inline Dropdown (when open)
- Floating card positioned below the header
- Lists all groups with: drag handle (☰), group avatar, name, member count
- Checkmark on the active group
- Content behind dims with an overlay
- Hint text at bottom: "Houd ingedrukt om te slepen"
- Tapping a group: closes dropdown, switches page content
- Tapping outside: closes dropdown

### Content Sections
All sections use the **exact same components/styles** as the current ExpandableGroupCard:

1. **My response** — "Eet je mee vanavond?" label + existing YesNoToggle component
2. **Who's eating** — Two-column attendees list (green "Eten mee" / orange "Niet"), same markup
3. **Vote button** — "Stem op recepten" button, visible when voting enabled + user said yes
4. **Top recipes** — Recipe cards with thumbnail, name, votes, cook time, tappable chevron
5. **Bottom actions** — "Uitnodigen" + "Recepten" buttons, same style

### Below Group Content
- Special occasions section (unchanged)
- Create group / Join with code buttons (unchanged)

### Empty State
- When user has no groups: existing EmptyGroups component with create/join buttons

## What Changes

### New Components
- `GroupSwitcherDropdown` — inline floating dropdown with drag-to-reorder
  - Uses `react-native-draggable-flatlist` or manual pan responder for reorder
  - Props: `groups`, `activeGroupId`, `onSelectGroup`, `onReorderGroups`, `visible`, `onClose`

### Modified Components
- `GroupsScreenSimple` — refactored from card list to single-group full-page view
  - `selectedGroupId` state replaces `expandedGroupId`
  - Auto-selects first group in saved order on mount
  - Loads members/responses/topMeals for selected group (same logic as current handleCardToggle)
  - Renders group content inline (not in ExpandableGroupCard)
  - Dropdown visibility state + overlay

### New Storage
- AsyncStorage key: `@happie_group_order` — JSON array of group IDs in user's preferred order
- Read on mount, write on reorder
- New groups appended at end of saved order

### Removed
- `ExpandableGroupCard` component (all its render logic moves inline)
- Expand/collapse animation (expandAnimation, expandedHeight calculations)
- `expandedGroupId` / `expandedGroupIdRef` state
- Dynamic height interpolation logic

## What Does NOT Change

- All existing modals: actions menu, members, group recipes, recipe detail, top 3, create group, join group
- All event handlers: response change, voting navigation, chat navigation, share/copy, leave/delete, photo change
- All styles: colors `#8B7355`, `#E8845C`, `#4CAF50`, `#FF9800`, `#2D2D2D`, `#F5F2EE`, `#F0EDE8`, `#FEFEFE`, `#FAF8F5` — all unchanged
- All fonts: Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, PlayfairDisplay_700Bold
- All border radius values, shadows, spacing, padding
- YesNoToggle component
- Top3Modal component
- Special occasions section
- Bottom tab navigation
- All data fetching and caching logic in AppStateContext

## Edge Cases

- **Single group:** No dropdown chevron shown, no need to switch
- **Group deleted/left:** Switch to next group in order, or show empty state if none left
- **New group created/joined:** Append to order, auto-select the new group
- **Deep link to specific group:** Select that group on mount (existing pendingGroupReopen logic)
- **Returning from voting/results:** Stay on the same group (existing route params logic)
