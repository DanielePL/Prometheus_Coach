// TEMPORARY SECURITY (DEV ONLY): RLS is disabled on conversations, conversation_participants, and messages.
// Remember to RE-ENABLE RLS and restore least-privilege policies before production.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  file_url: string | null;
  file_type: string | null;
  file_name: string | null;
  sender: {
    id: string;
    full_name: string;
  };
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (id, full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        edited_at: msg.edited_at,
        file_url: msg.file_url || null,
        file_type: msg.file_type || null,
        file_name: msg.file_name || null,
        sender: {
          id: msg.profiles?.id || '',
          full_name: msg.profiles?.full_name || 'Unknown User',
        },
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const sendMessageWithFile = async (content: string, file: File) => {
    if (!conversationId || !user) return;

    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;

      // 3. Determine file type
      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

      // 4. Create message with file info
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim() || file.name,
          file_url: fileUrl,
          file_type: fileType,
          file_name: file.name,
        });

      if (messageError) throw messageError;
    } catch (error) {
      console.error('Error sending message with file:', error);
      throw error;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!user || !newContent.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
      
      await fetchMessages();
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
      
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Mark messages as read when opening conversation
    markAsRead();

    // Set up realtime subscription for new messages
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return { messages, loading, sendMessage, sendMessageWithFile, editMessage, deleteMessage, refetch: fetchMessages };
};
