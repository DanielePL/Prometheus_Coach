// Chat system with RLS enabled.
// Uses SECURITY DEFINER functions for cross-participant queries (get_other_participant).
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
      console.log('useConversations: Processing', conversationsData?.length || 0, 'conversations');
      
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv, index) => {
          try {
            console.log(`useConversations: [${index}] Processing conversation ${conv.id}`);
            
            // Get other participant using SECURITY DEFINER function (bypasses RLS safely)
            console.log(`useConversations: [${index}] Fetching other participant for conversation ${conv.id}`);
            const { data: otherParticipant, error: participantError } = await supabase
              .rpc('get_other_participant', { conv_id: conv.id })
              .maybeSingle();

            if (participantError) {
              console.error(`useConversations: [${index}] ERROR fetching participant:`, {
                conversation_id: conv.id,
                error: participantError,
                message: participantError.message,
                details: participantError.details,
                hint: participantError.hint,
                code: participantError.code
              });
              throw participantError;
            }

            // Skip conversations with no other participant (orphaned data)
            if (!otherParticipant) {
              console.warn(`useConversations: [${index}] No other participant found for conversation ${conv.id}, skipping`);
              return null;
            }

            // Profile data comes directly from the function
            const profileData = {
              id: otherParticipant.user_id,
              full_name: otherParticipant.full_name || 'Unknown User',
              avatar_url: otherParticipant.avatar_url
            };

            console.log(`useConversations: [${index}] Found participant:`, { otherParticipant, profileData });

            // Get last message
            console.log(`useConversations: [${index}] Fetching last message for conversation ${conv.id}`);
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (messageError) {
              console.error(`useConversations: [${index}] ERROR fetching last message:`, {
                conversation_id: conv.id,
                error: messageError
              });
            }

            // Count unread messages
            console.log(`useConversations: [${index}] Counting unread messages for conversation ${conv.id}`);
            const participant = participantData.find(p => p.conversation_id === conv.id);
            const { count: unreadCount, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .gt('created_at', participant?.last_read_at || new Date(0).toISOString());

            if (countError) {
              console.error(`useConversations: [${index}] ERROR counting unread messages:`, {
                conversation_id: conv.id,
                error: countError
              });
            }

            const result = {
              id: conv.id,
              updated_at: conv.updated_at,
              other_user: {
                id: profileData.id,
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url,
              },
              last_message: lastMessage || undefined,
              unread_count: unreadCount || 0,
            };
            
            console.log(`useConversations: [${index}] Successfully processed conversation ${conv.id}`);
            return result;
          } catch (convError: any) {
            console.error(`useConversations: [${index}] CRITICAL ERROR processing conversation ${conv.id}:`, {
              error: convError,
              message: convError?.message,
              details: convError?.details,
              hint: convError?.hint,
              code: convError?.code,
              stack: convError?.stack
            });
            // Re-throw to stop processing and show error to user
            throw convError;
          }
        })
      );

      // Filter out null values (orphaned conversations)
      const validConversations = conversationsWithDetails.filter((c): c is ConversationWithDetails => c !== null);
      console.log('useConversations: Successfully fetched', validConversations.length, 'conversations (filtered from', conversationsWithDetails.length, ')');
      setConversations(validConversations);
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
