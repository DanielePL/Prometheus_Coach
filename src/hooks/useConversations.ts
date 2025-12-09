// Chat system with RLS enabled.
// Uses SECURITY DEFINER RPC function get_user_conversations() for efficient fetching.
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
      // Use the SECURITY DEFINER RPC function that bypasses RLS
      // This returns all conversations with other_user info, last_message, and unread_count
      console.log('useConversations: Calling get_user_conversations RPC...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_conversations');

      if (rpcError) {
        console.error('useConversations: RPC error:', rpcError.code, rpcError.message, rpcError);
        // Fallback to legacy method if RPC doesn't exist
        if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
          console.log('useConversations: RPC not found, using legacy method...');
          await fetchConversationsLegacy();
          return;
        }
        throw rpcError;
      }

      console.log('useConversations: RPC SUCCESS - returned', rpcData?.length || 0, 'conversations');
      if (rpcData && rpcData.length > 0) {
        console.log('useConversations: First conversation:', JSON.stringify(rpcData[0], null, 2));
      }

      // Map RPC response to ConversationWithDetails format
      const mappedConversations: ConversationWithDetails[] = (rpcData || [])
        .filter((conv: any) => conv.other_user_id) // Filter out conversations without other user
        .map((conv: any) => ({
          id: conv.conversation_id,
          updated_at: conv.updated_at || new Date().toISOString(),
          other_user: {
            id: conv.other_user_id,
            full_name: conv.other_user_name || 'Unknown User',
            avatar_url: conv.other_user_avatar,
          },
          last_message: conv.last_message_content ? {
            content: conv.last_message_content,
            created_at: conv.last_message_at,
            sender_id: conv.last_message_sender_id,
          } : undefined,
          unread_count: Number(conv.unread_count) || 0,
        }));

      console.log('useConversations: Mapped', mappedConversations.length, 'valid conversations');
      setConversations(mappedConversations);
      setError(null);
    } catch (error: any) {
      console.error('useConversations: Error fetching conversations:', error);
      setConversations([]);

      let errorMessage = 'Failed to load conversations';
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Legacy method as fallback (in case RPC doesn't exist yet)
  const fetchConversationsLegacy = async () => {
    if (!user) return;

    try {
      // Get all conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setError(null);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // For each conversation, get the other participant and last message
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          try {
            // Get other participant using SECURITY DEFINER function
            const { data: otherParticipant } = await supabase
              .rpc('get_other_participant', { conv_id: conv.id })
              .maybeSingle();

            if (!otherParticipant) return null;

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
                id: otherParticipant.user_id,
                full_name: otherParticipant.full_name || 'Unknown User',
                avatar_url: otherParticipant.avatar_url,
              },
              last_message: lastMessage || undefined,
              unread_count: unreadCount || 0,
            };
          } catch {
            return null;
          }
        })
      );

      const validConversations = conversationsWithDetails.filter((c): c is ConversationWithDetails => c !== null);
      setConversations(validConversations);
      setError(null);
    } catch (error: any) {
      console.error('useConversations: Legacy fetch error:', error);
      setConversations([]);
      setError('Failed to load conversations');
    } finally {
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
