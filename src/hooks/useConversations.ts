// TEMPORARY SECURITY (DEV ONLY): RLS is disabled on conversations, conversation_participants, and messages.
// Remember to RE-ENABLE RLS and restore least-privilege policies before production.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConversationWithDetails {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export const useConversations = () => {
  const { user } = useAuth();
  // Initialize with empty array to ensure conversations is never undefined
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) {
      console.log('useConversations: No user, setting empty conversations');
      setConversations([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    console.log('useConversations: Fetching conversations for user', user.id);

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('useConversations: request timed out');
      setLoading(false);
      setError('Request timed out. Please try again.');
    }, 8000);

    try {
      // Get all conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (participantError) {
        console.error('useConversations: Error fetching participant data:', {
          message: participantError.message,
          details: participantError.details,
          hint: participantError.hint,
          code: participantError.code
        });
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        console.log('useConversations: No participant data found, user has no conversations');
        setConversations([]);
        setError(null);
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }
      
      console.log('useConversations: Found', participantData.length, 'conversation participations');

      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('useConversations: Error fetching conversations data:', {
          message: conversationsError.message,
          details: conversationsError.details,
          hint: conversationsError.hint,
          code: conversationsError.code
        });
        throw conversationsError;
      }

      // For each conversation, get the other participant and last message
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get other participant
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(id, full_name, avatar_url)')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .limit(1)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          const participant = participantData.find(p => p.conversation_id === conv.id);
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .gt('created_at', participant?.last_read_at || new Date(0).toISOString());

          return {
            id: conv.id,
            updated_at: conv.updated_at,
            other_user: {
              id: participants?.profiles?.id || '',
              full_name: participants?.profiles?.full_name || 'Unknown User',
              avatar_url: participants?.profiles?.avatar_url,
            },
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
          };
        })
      );

      console.log('useConversations: Successfully fetched', conversationsWithDetails.length, 'conversations');
      setConversations(conversationsWithDetails);
      setError(null);
    } catch (error: any) {
      console.error('useConversations: Error fetching conversations:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      });
      // Ensure conversations is set to empty array on error, not left as undefined
      setConversations([]);
      
      // Set a more descriptive error message
      let errorMessage = 'Failed to load conversations';
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error?.hint) {
        errorMessage += ` (${error.hint})`;
      }
      
      setError(errorMessage);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up realtime subscription for new messages and conversation updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { conversations, loading, error, refetch: fetchConversations };
};
