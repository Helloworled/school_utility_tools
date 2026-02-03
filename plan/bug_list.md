**This file is constantly changing depended on the current bug:**

**Please fix the bugs mentioned below. When finished, please add a simple summary of the bug fix in the respond section.**

**You are permitted to use "eslint disable" command if necessary, please mention the fix in the respond.**

---

**Description:**

problem with recuring todo: currently, this doesn't do anything, it won't actually recure and the calendar also shows it as single time event. Logic i need: i would like that the backend will check the status of recurring todos at regular intervals (probally once a day/1h) (because the status (due, in progress, upcoming) was generated onspot in frontend, need to implement some kind of code go generate part of the status in backend (check if due)) if the status is due, program will "move" the todo acording to the "recurrence" tag. (eg, if "recurrence"=="month", then add the start_date and the end_date by the month number of the month (because diff day num in diff month), thus moving the todo to the next time), and reset the "status" tag to "not_done".



**Frontend bugs:**

recurring todo not functioning

**Backend bugs:**

NONE

**Respond:**

## Bug Fix Summary

### Problem

Recurring todos were not functioning correctly. The system was creating new todo instances instead of updating existing ones, and the calendar showed them as single-time events.

### Root Cause

The original implementation had several issues:

1. It created new todo instances for each recurrence instead of updating the existing todo
2. It used `created_at` timestamp instead of `end_date` to determine when to create new instances
3. It didn't check if the todo status was "due" (end_date has passed)
4. It didn't properly handle months with different numbers of days

### Solution

Completely rewrote the recurrence logic in `backend/utils/recurrence.js`:

1. **Changed approach from creating instances to updating existing todos**:

   - Now finds all recurring todos that are due (end_date < now)
   - Only processes todos that have been completed or are in progress (status != 'not_done')
   - Updates the existing todo with new dates instead of creating a new one
2. **Improved date calculation**:

   - For daily recurrence: Adds 1 day to both start_date and end_date
   - For weekly recurrence: Adds 7 days to both start_date and end_date
   - For monthly recurrence: Adds 1 month and handles different month lengths
   - Special handling for months with different numbers of days (e.g., January 31 → February 28/29)
3. **Reset status and reminder**:

   - Sets status back to 'not_done' after updating dates
   - Clears the reminder for the new occurrence
4. **Maintained scheduler**:

   - Still runs daily at midnight using node-cron
   - Updated function name from `generateRecurringTodos` to `updateRecurringTodos`

### Benefits

- Recurring todos now properly move to their next occurrence
- Calendar will correctly display recurring todos
- No accumulation of duplicate todo instances
- Proper handling of edge cases (month boundaries, leap years, etc.)
- Cleaner, more maintainable code

### Technical Details

- Uses MongoDB's `findByIdAndUpdate` for atomic updates
- Properly calculates month boundaries using JavaScript Date object
- Handles edge cases where the original day doesn't exist in the new month
- Logs each update for debugging purposes
