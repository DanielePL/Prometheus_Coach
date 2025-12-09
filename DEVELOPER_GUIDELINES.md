# Prometheus Developer Guidelines

**Version:** 1.0.0
**Last Updated:** 2025-12-09
**Applies to:** Mobile App (Android), Coach Web, Coach Mobile

---

## Table of Contents

1. [Overview](#overview)
2. [Coach-Client Relationship Model](#coach-client-relationship-model)
3. [Chat System](#chat-system)
4. [Views and RPCs](#views-and-rpcs)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)

---

## Overview

This document ensures consistency across all Prometheus applications when implementing features related to the coach-client relationship and messaging system.

### Architecture Summary

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Coach Web     │     │  Coach Mobile   │
│   (Android)     │     │   (React)       │     │   (Android)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │       Supabase          │
                    │  - PostgreSQL (RLS)     │
                    │  - Storage              │
                    │  - Realtime             │
                    └─────────────────────────┘
```

---

## Coach-Client Relationship Model

### Database Schema

The coach-client relationship is managed through the `coach_client_connections` table:

```sql
CREATE TABLE coach_client_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(coach_id, client_id)
);
```

### Status Flow

```
pending ──► accepted
    │
    └─────► declined
```

### RLS Policies

```sql
-- Coaches can view their connections
CREATE POLICY "Coaches can view their connections"
  ON coach_client_connections FOR SELECT
  USING (auth.uid() = coach_id);

-- Clients can view their connections
CREATE POLICY "Clients can view their connections"
  ON coach_client_connections FOR SELECT
  USING (auth.uid() = client_id);

-- Only coaches can create connection requests
CREATE POLICY "Coaches can create connection requests"
  ON coach_client_connections FOR INSERT
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'));

-- Only clients can accept/decline
CREATE POLICY "Clients can update connection status"
  ON coach_client_connections FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id AND status IN ('accepted', 'declined'));
```

---

## Chat System

The chat system uses a **conversations-based model** that supports 1:1 messaging between any connected users.

### Database Schema

#### conversations
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### conversation_participants
```sql
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    UNIQUE(conversation_id, user_id)
);
```

#### messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);
```

### Key RPC Functions

#### find_or_create_conversation
Creates a new conversation between two users or returns existing one:

```sql
CREATE FUNCTION find_or_create_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_conv_id UUID;
    new_conv_id UUID;
BEGIN
    -- Check for existing conversation
    SELECT cp1.conversation_id INTO existing_conv_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() AND cp2.user_id = target_user_id
    LIMIT 1;

    IF existing_conv_id IS NOT NULL THEN
        RETURN existing_conv_id;
    END IF;

    -- Create new conversation
    new_conv_id := gen_random_uuid();
    INSERT INTO conversations (id) VALUES (new_conv_id);
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (new_conv_id, auth.uid(), 'member'), (new_conv_id, target_user_id, 'member');

    RETURN new_conv_id;
END;
$$;
```

#### get_other_participant
Returns the other user in a 1:1 conversation:

```sql
CREATE FUNCTION get_other_participant(conv_id UUID)
RETURNS TABLE (user_id UUID, full_name TEXT, avatar_url TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.id, p.full_name, p.avatar_url
    FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.conversation_id = conv_id
    AND cp.user_id != auth.uid()
    AND EXISTS (
        SELECT 1 FROM conversation_participants cp2
        WHERE cp2.conversation_id = conv_id AND cp2.user_id = auth.uid()
    )
    LIMIT 1;
$$;
```

### Chat RLS Policies

```sql
-- Users can view conversations they participate in
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
        )
    );

-- Users can view their own participant records
CREATE POLICY "participants_select" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());

-- Users can view messages in their conversations
CREATE POLICY "messages_select" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
        )
    );

-- Users can send messages to their conversations
CREATE POLICY "messages_insert" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
        )
    );
```

### Realtime Subscriptions

Messages table has realtime enabled:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

---

## Views and RPCs

### When to Use Views vs RPCs

| Use Case | Solution | Reason |
|----------|----------|--------|
| Simple read with joins | View | Cacheable, simple |
| Computed fields | RPC | Server-side logic |
| Write operations | RPC | Transaction safety |
| Cross-user queries | RPC + SECURITY DEFINER | Bypass RLS safely |
| Real-time subscriptions | Table | Supabase Realtime |

### Available Views

| View Name | Purpose |
|-----------|---------|
| `coach_clients_v` | Coach's client list with profile data |

### Available RPCs

| RPC Name | Purpose |
|----------|---------|
| `find_or_create_conversation` | Get or create 1:1 conversation |
| `get_other_participant` | Get other user in conversation |
| `get_conversation_participants` | Get all participants in conversation |
| `find_shared_conversation` | Find existing conversation between two users |

---

## Error Handling

### Network Errors

```kotlin
// Kotlin - Retry with exponential backoff
suspend fun <T> retryWithBackoff(
    maxRetries: Int = 3,
    initialDelayMs: Long = 1000,
    maxDelayMs: Long = 10000,
    block: suspend () -> T
): T {
    var currentDelay = initialDelayMs
    repeat(maxRetries - 1) { attempt ->
        try {
            return block()
        } catch (e: IOException) {
            Log.w("Network", "Attempt ${attempt + 1} failed, retrying in ${currentDelay}ms")
            delay(currentDelay)
            currentDelay = (currentDelay * 2).coerceAtMost(maxDelayMs)
        }
    }
    return block()
}
```

```typescript
// TypeScript - Retry with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000
): Promise<T> {
    let delay = initialDelayMs;
    for (let attempt = 0; attempt < maxRetries - 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 10000);
        }
    }
    return fn();
}
```

---

## Code Examples

### TypeScript/React (Coach Web)

#### Fetching Connected Clients

```typescript
// hooks/useConnectedClients.ts
export const useConnectedClients = () => {
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["connected-clients"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("coach_client_connections")
                .select("id, client_id, responded_at")
                .eq("coach_id", user.id)
                .eq("status", "accepted")
                .order("responded_at", { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return [];

            // Fetch profiles separately
            const clientIds = data.map(d => d.client_id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .in("id", clientIds);

            // Map and return
            return data.map(item => ({
                id: item.client_id,
                connection_id: item.id,
                full_name: profiles?.find(p => p.id === item.client_id)?.full_name || "Unknown",
                connected_at: item.responded_at,
            }));
        },
    });

    return { clients, isLoading };
};
```

#### Starting a Conversation

```typescript
// Navigate to inbox with userId to auto-open conversation
navigate(`/inbox?userId=${clientId}`);

// In Inbox.tsx - auto-create conversation
useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (!targetUserId || !user) return;

    const openConversation = async () => {
        const { data: conversationId, error } = await supabase
            .rpc('find_or_create_conversation', { target_user_id: targetUserId });

        if (error) {
            toast.error('Failed to start conversation');
            return;
        }

        setSelectedConversationId(conversationId);
    };

    openConversation();
}, [searchParams, user]);
```

#### Sending Messages

```typescript
// hooks/useMessages.ts
const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;

    const { error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: content.trim(),
        });

    if (error) throw error;
};
```

#### Real-time Message Subscription

```typescript
const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
            fetchMessages();
            markAsRead();
        }
    )
    .subscribe();
```

### Kotlin (Mobile App)

#### Data Models

```kotlin
data class ConnectedClient(
    val id: String,
    val connectionId: String,
    val fullName: String,
    val avatarUrl: String?,
    val connectedAt: String
)

data class ChatMessage(
    val id: String,
    @SerializedName("conversation_id") val conversationId: String,
    @SerializedName("sender_id") val senderId: String,
    val content: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("edited_at") val editedAt: String?
)

enum class ConnectionStatus {
    @SerializedName("pending") PENDING,
    @SerializedName("accepted") ACCEPTED,
    @SerializedName("declined") DECLINED
}
```

#### Repository Implementation

```kotlin
class ChatRepository(private val supabase: SupabaseClient) {

    suspend fun findOrCreateConversation(targetUserId: String): Result<String> {
        return try {
            val conversationId = supabase.postgrest
                .rpc("find_or_create_conversation", mapOf("target_user_id" to targetUserId))
                .decodeSingle<String>()
            Result.success(conversationId)
        } catch (e: Exception) {
            Log.e("ChatRepository", "Failed to create conversation", e)
            Result.failure(e)
        }
    }

    suspend fun sendMessage(conversationId: String, content: String): Result<ChatMessage> {
        return try {
            val userId = supabase.auth.currentUserOrNull()?.id
                ?: return Result.failure(Exception("Not authenticated"))

            val message = supabase.postgrest
                .from("messages")
                .insert(mapOf(
                    "conversation_id" to conversationId,
                    "sender_id" to userId,
                    "content" to content
                ))
                .decodeSingle<ChatMessage>()

            Result.success(message)
        } catch (e: Exception) {
            Log.e("ChatRepository", "Failed to send message", e)
            Result.failure(e)
        }
    }

    suspend fun getMessages(conversationId: String): Result<List<ChatMessage>> {
        return try {
            val messages = supabase.postgrest
                .from("messages")
                .select()
                .eq("conversation_id", conversationId)
                .order("created_at", Order.ASCENDING)
                .decodeList<ChatMessage>()
            Result.success(messages)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Initial version - Documents existing chat system |

---

## Contributing

When updating this document:
1. Increment the version number
2. Update the "Last Updated" date
3. Add entry to Version History
4. Ensure all code examples compile/work
5. Test any SQL changes in development first
