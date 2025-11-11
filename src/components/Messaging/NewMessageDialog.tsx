// TEMPORARY SECURITY (DEV ONLY): RLS disabled for messaging tables; re-enable before production.
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MessageSquarePlus } from 'lucide-react';
import { useAvailableUsers } from '@/hooks/useAvailableUsers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationSelected: (conversationId: string) => void;
}

export const NewMessageDialog = ({ open, onOpenChange, onConversationSelected }: NewMessageDialogProps) => {
  const { user } = useAuth();
  const { users, loading, error } = useAvailableUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  // Clear search when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery('');
    }
    onOpenChange(newOpen);
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = async (selectedUserId: string) => {
    if (!user || creating) return;

    console.log('💬 [NewMessageDialog] ========== CREATING CONVERSATION ==========');
    console.log('💬 [NewMessageDialog] Current user:', user.id);
    console.log('💬 [NewMessageDialog] Selected user:', selectedUserId);

    setCreating(true);
    try {
      // Check if user is admin (admins can message anyone)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const isAdmin = userRoles?.some(r => r.role === 'admin');
      console.log('💬 [NewMessageDialog] Is admin?', isAdmin);

      if (!isAdmin) {
        // Check if users are connected via coach-client relationship
        console.log('💬 [NewMessageDialog] Checking coach-client connection...');
        const { data: connection, error: connectionError } = await supabase
          .from('coach_client_connections')
          .select('*')
          .eq('status', 'accepted')
          .or(`and(coach_id.eq.${user.id},client_id.eq.${selectedUserId}),and(coach_id.eq.${selectedUserId},client_id.eq.${user.id})`)
          .maybeSingle();

        console.log('💬 [NewMessageDialog] Connection found:', connection);
        console.log('💬 [NewMessageDialog] Connection error:', connectionError);

        if (!connection) {
          console.log('❌ [NewMessageDialog] No connection found - blocking conversation');
          toast.error('You must be connected to message this user. Send a connection request first.');
          setCreating(false);
          return;
        }

        console.log('✅ [NewMessageDialog] Connection verified! Proceeding...');
      } else {
        console.log('✅ [NewMessageDialog] Admin user - bypassing connection check');
      }
      // Check if conversation already exists between these two users
      console.log('💬 [NewMessageDialog] Checking for existing conversations...');
      const { data: existingParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      console.log('💬 [NewMessageDialog] My conversations:', existingParticipants);
      console.log('💬 [NewMessageDialog] Participants error:', participantsError);

      if (participantsError) {
        console.error('❌ [NewMessageDialog] Error fetching my conversations:', participantsError);
        throw participantsError;
      }

      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map(p => p.conversation_id);
        console.log('💬 [NewMessageDialog] Checking if selected user is in any of these:', conversationIds);

        // Check which of these conversations include the selected user
        const { data: otherUserParticipants, error: otherError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', selectedUserId)
          .in('conversation_id', conversationIds);

        console.log('💬 [NewMessageDialog] Selected user conversations:', otherUserParticipants);
        console.log('💬 [NewMessageDialog] Other user error:', otherError);

        if (otherError) {
          console.error('❌ [NewMessageDialog] Error checking other user:', otherError);
          throw otherError;
        }

        // If conversation exists, navigate to it
        if (otherUserParticipants && otherUserParticipants.length > 0) {
          console.log('✅ [NewMessageDialog] Conversation already exists! Navigating to:', otherUserParticipants[0].conversation_id);
          onConversationSelected(otherUserParticipants[0].conversation_id);
          onOpenChange(false);
          setSearchQuery('');
          return;
        }
      }

      // Create new conversation without RETURNING to avoid RLS on SELECT
      console.log('💬 [NewMessageDialog] No existing conversation found. Creating new one...');
      const newConversationId = crypto.randomUUID();
      const { error: conversationError } = await supabase
        .from('conversations')
        .insert({ id: newConversationId });

      console.log('💬 [NewMessageDialog] New conversation ID:', newConversationId);
      console.log('💬 [NewMessageDialog] Conversation insert error:', conversationError);

      if (conversationError) {
        console.error('❌ [NewMessageDialog] Error creating conversation:', conversationError);
        throw conversationError;
      }

      // Add both users as participants
      console.log('💬 [NewMessageDialog] Adding participants to conversation:', newConversationId);
      const participantsToAdd = [
        { conversation_id: newConversationId, user_id: user.id },
        { conversation_id: newConversationId, user_id: selectedUserId },
      ];
      console.log('💬 [NewMessageDialog] Participants to add:', participantsToAdd);

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantsToAdd);

      console.log('💬 [NewMessageDialog] Participant insert error:', participantError);

      if (participantError) {
        console.error('❌ [NewMessageDialog] Error adding participants:', participantError);
        throw participantError;
      }

      console.log('✅ [NewMessageDialog] Conversation created successfully!');
      // Navigate to new conversation
      onConversationSelected(newConversationId);
      onOpenChange(false);
      setSearchQuery('');
      toast.success('New conversation started!');
    } catch (error) {
      console.error('❌ [NewMessageDialog] CATCH ERROR:', error);
      toast.error(`Failed to start conversation: ${error.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('admin')) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (roles.includes('coach')) return 'bg-primary/20 text-primary border-primary/30';
    return 'bg-accent/20 text-accent-foreground border-accent/30';
  };

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes('admin')) return 'Admin';
    if (roles.includes('coach')) return 'Coach';
    return 'Client';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl text-foreground">New Message</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select someone to start a conversation
                {!loading && users.length > 0 && (
                  <span className="ml-1 text-primary font-semibold">({users.length} {users.length === 1 ? 'user' : 'users'} available)</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus-visible:ring-primary"
            />
          </div>

          {/* Users List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive font-semibold mb-1">Error loading users</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? `No users found matching "${searchQuery}"` : 'No users available'}
                </p>
              </div>
            ) : (
              filteredUsers.map((availableUser) => (
                <button
                  key={availableUser.id}
                  onClick={() => handleUserSelect(availableUser.id)}
                  disabled={creating}
                  className="w-full p-3 flex items-center gap-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={undefined} alt={availableUser.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {availableUser.full_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{availableUser.full_name}</h3>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 text-xs ${getRoleBadgeColor(availableUser.roles)}`}
                    >
                      {getRoleLabel(availableUser.roles)}
                    </Badge>
                  </div>

                  {creating && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
