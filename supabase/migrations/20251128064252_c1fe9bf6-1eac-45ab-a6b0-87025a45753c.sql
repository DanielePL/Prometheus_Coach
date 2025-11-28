-- Fix exercises for consistent /explore page visibility
-- Step 1: Update admin's exercise to be public
UPDATE exercises 
SET visibility = 'public'
WHERE created_by = 'e9300926-4193-43c6-bf1a-8063b7dc9918';

-- Step 2: Update exercises with null created_by to be owned by admin
UPDATE exercises 
SET created_by = 'e9300926-4193-43c6-bf1a-8063b7dc9918'
WHERE created_by IS NULL;

-- Step 3: Update coach's exercise to be public (so it shows in /explore)
-- Or keep it private if it should only show in /uploads
-- Per user request, making all consistent for /explore
UPDATE exercises 
SET visibility = 'public',
    created_by = 'e9300926-4193-43c6-bf1a-8063b7dc9918'
WHERE title = 'Reverse Leg Raise';