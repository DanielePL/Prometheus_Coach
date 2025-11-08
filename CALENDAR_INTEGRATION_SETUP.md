# Google Calendar & Outlook Integration Setup Guide

This guide will help you set up two-way calendar synchronization with Google Calendar and Microsoft Outlook.

## Overview

The calendar integration requires:
1. OAuth 2.0 authentication with Google and/or Microsoft
2. API credentials (Client ID and Client Secret)
3. Edge functions to handle token refresh and sync operations
4. Webhook endpoints for real-time updates

## Prerequisites

- A Google Cloud Platform account (for Google Calendar)
- An Azure account (for Outlook/Microsoft 365)
- Access to your Supabase project settings

---

## Part 1: Google Calendar Integration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required fields:
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add test users (your email addresses)
6. Save and continue

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/google-calendar-callback
   https://YOUR-DOMAIN.com/settings (if using custom domain)
   ```
5. Save the **Client ID** and **Client Secret**

### Step 4: Add Secrets to Supabase

Add these secrets to your Supabase project:
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## Part 2: Microsoft Outlook Integration

### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: Your app name
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/outlook-calendar-callback`
5. Click "Register"

### Step 2: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission" > "Microsoft Graph"
3. Choose "Delegated permissions"
4. Add these permissions:
   - `Calendars.ReadWrite`
   - `Calendars.ReadWrite.Shared`
   - `offline_access`
5. Click "Add permissions"
6. Click "Grant admin consent" (if you have admin rights)

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description and set expiration
4. Save the **Value** (this is your client secret)

### Step 4: Add Secrets to Supabase

Add these secrets to your Supabase project:
```bash
MICROSOFT_CLIENT_ID=your_application_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=common
```

---

## Part 3: Implementation

### Required Edge Functions

You'll need to create the following edge functions:

1. **google-calendar-auth** - Initiates OAuth flow
2. **google-calendar-callback** - Handles OAuth callback
3. **google-calendar-sync** - Syncs events bidirectionally
4. **outlook-calendar-auth** - Initiates OAuth flow
5. **outlook-calendar-callback** - Handles OAuth callback
6. **outlook-calendar-sync** - Syncs events bidirectionally

### Example: Google Calendar Auth Function

```typescript
// supabase/functions/google-calendar-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-callback`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID!);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar.events");
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Frontend Integration Component

```typescript
// src/components/Calendar/CalendarIntegration.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CalendarIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth");
      
      if (error) throw error;
      
      // Open OAuth flow in popup
      window.open(data.authUrl, "_blank", "width=600,height=700");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Calendar Integrations</h3>
      <div className="space-y-4">
        <Button onClick={connectGoogleCalendar} disabled={isConnecting}>
          Connect Google Calendar
        </Button>
      </div>
    </Card>
  );
}
```

---

## Part 4: Sync Strategy

### Bidirectional Sync

The sync process should:

1. **Initial Sync**: Fetch all events from external calendar
2. **Change Detection**: Track modified events on both sides
3. **Conflict Resolution**: Use "last write wins" or let user choose
4. **Webhook Updates**: Listen for external calendar changes
5. **Periodic Sync**: Run sync every 15-30 minutes as backup

### Webhook Setup

- **Google**: Use [Push Notifications](https://developers.google.com/calendar/api/guides/push)
- **Microsoft**: Use [Change Notifications](https://learn.microsoft.com/en-us/graph/webhooks)

---

## Part 5: Testing

1. Test OAuth flow in incognito/private browsing
2. Verify token refresh mechanism
3. Test creating events in both directions
4. Test updating and deleting events
5. Test conflict resolution
6. Monitor webhook reliability

---

## Important Notes

- Store OAuth tokens securely in the `calendar_integrations` table (already created)
- Implement token refresh before expiration
- Handle rate limits for both APIs
- Consider timezone conversions carefully
- Implement proper error handling and retry logic
- Add user-facing sync status indicators

---

## Next Steps

Would you like me to:
1. Implement the Google Calendar OAuth flow?
2. Implement the Outlook OAuth flow?
3. Create the sync functions?
4. All of the above?

Please let me know which integration you'd like to start with, and I'll create the complete implementation!