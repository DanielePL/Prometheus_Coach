# Event Reminder Cron Job Setup

This guide will help you set up a scheduled cron job to automatically send event reminders.

## Prerequisites

The `send-event-reminders` edge function has been deployed to your Supabase project. This function checks for upcoming events with reminders and sends notifications at the appropriate times.

## Setup Instructions

### Step 1: Enable Required Extensions

First, you need to enable the `pg_cron` and `pg_net` extensions in your Supabase project.

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for and enable:
   - `pg_cron`
   - `pg_net`

### Step 2: Create the Cron Job

Run the following SQL in your Supabase SQL Editor to create a cron job that runs every minute:

```sql
-- Schedule the reminder function to run every minute
select
  cron.schedule(
    'send-event-reminders-every-minute',
    '* * * * *', -- Run every minute
    $$
    select
      net.http_post(
          url:='https://cebruyycvufpfftewktd.supabase.co/functions/v1/send-event-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYnJ1eXljdnVmcGZmdGV3a3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTY1NTIsImV4cCI6MjA3NzEzMjU1Mn0.buZPLfB3BE4fzCyuUFyryrEEy9ya08mOxikSFyraiL8"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
```

### Step 3: Verify the Cron Job

To verify the cron job was created successfully, run:

```sql
SELECT * FROM cron.job;
```

You should see your `send-event-reminders-every-minute` job listed.

### Step 4: Monitor Cron Job Execution

To check the execution history of your cron job:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-event-reminders-every-minute')
ORDER BY start_time DESC
LIMIT 10;
```

## How It Works

1. **Every Minute**: The cron job runs every minute
2. **Check Events**: The edge function queries all events with reminders that are scheduled in the future
3. **Calculate Reminder Times**: For each event, it checks if any reminder should be sent (15 min, 1 hour, or 1 day before)
4. **Send Notifications**: If a reminder is due (within the last minute), it creates a notification in the database
5. **Prevent Duplicates**: The function checks if a reminder was already sent to avoid duplicate notifications

## Reminder Types

The system supports the following reminder intervals:
- **15 minutes before** the event
- **1 hour before** the event
- **1 day before** the event

Users can select any combination of these reminders when creating or editing an event.

## Troubleshooting

### Cron Job Not Running

If the cron job isn't executing:
1. Verify `pg_cron` extension is enabled
2. Check the cron job exists: `SELECT * FROM cron.job;`
3. Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

### No Notifications Being Sent

If notifications aren't being created:
1. Check the edge function logs in Supabase Dashboard → Edge Functions → send-event-reminders → Logs
2. Verify events have reminders set: `SELECT id, title, reminders FROM events WHERE reminders IS NOT NULL AND reminders != '{}'`
3. Check if events are in the future: `SELECT * FROM events WHERE start_time > now()`

### Duplicate Notifications

The function includes duplicate prevention by checking if a notification with the same reminder text was sent in the last 2 minutes. If you're seeing duplicates, check the function logs for any errors.

## Deleting the Cron Job

If you need to remove the cron job:

```sql
SELECT cron.unschedule('send-event-reminders-every-minute');
```

## Alternative Scheduling

If you want to change the frequency, modify the cron expression:

- Every 5 minutes: `*/5 * * * *`
- Every 15 minutes: `*/15 * * * *`
- Every hour: `0 * * * *`

Just replace the second parameter in the `cron.schedule()` call with your desired cron expression.
