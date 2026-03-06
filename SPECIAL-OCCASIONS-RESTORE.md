# Special Occasions - How to Re-enable

The Special Occasions feature is fully built but currently hidden behind a feature flag.

## Quick Enable

In `components/GroupsScreenSimple.js`, find this line near the top of the file:

```js
const FEATURE_SPECIAL_OCCASIONS = false;
```

Change it to:

```js
const FEATURE_SPECIAL_OCCASIONS = true;
```

That's it. Everything else is already wired up.

## What gets enabled

- Special occasions section on the Groups screen (create, view, respond)
- Past occasions / "Old Events" collapsible section
- Create occasion modal with calendar, type picker, group sharing
- Swipe-to-delete/leave on occasion cards
- Occasion voting integration
- Push notifications for occasion participants

## Files involved

| File | Role |
|------|------|
| `components/GroupsScreenSimple.js` | UI rendering (feature flag lives here) |
| `lib/specialOccasionService.js` | All CRUD operations (untouched) |
| `lib/AppStateContext.js` | State management for occasions (untouched) |
| `lib/notificationService.js` | `notifyOccasionParticipants` function (untouched) |
| `translations/en.json` | English translations under `specialOccasion`, `occasions` keys |
| `translations/nl.json` | Dutch translations under same keys |

## Database tables (all still exist)

- `special_occasions`
- `special_occasion_participants`
- `special_occasion_responses`
- `occasion_meal_options`
- `occasion_meal_votes`
