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
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_conversations');

      if (error) throw error;

      const formattedConversations = (data || []).map((conv: any) => ({
        id: conv.id,
        updated_at: conv.updated_at,
        other_user: {
          id: conv.other_user_id,
          full_name: conv.other_user_full_name || 'Unknown User',
          avatar_url: conv.other_user_avatar_url,
        },
        last_message: conv.last_message_content ? {
          content: conv.last_message_content,
          created_at: conv.last_message_created_at,
          sender_id: conv.last_message_sender_id,
        } : undefined,
        unread_count: conv.unread_count,
      }));

      setConversations(formattedConversations);
      setError(null);
    } catch (error: any) {
      console.error('useConversations: Error fetching conversations:', error);
      setConversations([]);
      setError(error.message);
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
