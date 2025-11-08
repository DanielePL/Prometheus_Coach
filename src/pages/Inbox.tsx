import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun, Search, Send, Loader2, MessageSquarePlus, Pencil, Trash2, Check, X } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { NewMessageDialog } from "@/components/Messaging/NewMessageDialog";
import { EventMentionParser } from "@/components/Messaging/EventMentionParser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Inbox = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { conversations, loading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useConversations();
  const { messages, loading: messagesLoading, sendMessage, editMessage, deleteMessage } = useMessages(selectedConversationId);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput);
      setMessageInput("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      await editMessage(editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent("");
      toast.success("Message updated");
    } catch (error) {
      toast.error("Failed to update message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage(messageToDelete);
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  return (
    <div
      className="min-h-screen flex w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />

      <main className="flex-1 lg:ml-20 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-7xl">
          {/* Header with Title, New Message Button, and Theme Toggle */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">Inbox</h1>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setNewMessageDialogOpen(true)}
                className="glass-hover transition-smooth hover:bg-primary hover:text-primary-foreground"
                variant="outline"
              >
                <MessageSquarePlus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">New Message</span>
              </Button>
              
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Messenger Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 glass rounded-2xl overflow-hidden flex flex-col">
              {/* Search Bar */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass border-white/10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : conversationsError ? (
                  <div className="flex items-center justify-center h-full p-8 text-center">
                    <div>
                      <p className="text-destructive font-semibold mb-2">Error loading conversations</p>
                      <p className="text-muted-foreground text-sm mb-4">{conversationsError}</p>
                      <Button 
                        onClick={() => refetchConversations()} 
                        variant="outline"
                        size="sm"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-8 text-center">
                    <div>
                      <p className="text-muted-foreground mb-2">
                        {searchQuery ? `No conversations found matching "${searchQuery}"` : "No conversations yet"}
                      </p>
                      {!searchQuery && (
                        <p className="text-sm text-muted-foreground">
                          Click <strong>"New Message"</strong> to start chatting
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full p-4 flex items-center gap-3 transition-smooth hover:bg-white/10 border-b border-white/5 ${
                        selectedConversationId === conversation.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.other_user.avatar_url} alt={conversation.other_user.full_name} />
                          <AvatarFallback>{conversation.other_user.full_name[0]}</AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">{conversation.other_user.full_name}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {conversation.last_message ? formatTimestamp(conversation.last_message.created_at) : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message?.content || 'No messages yet'}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge className="ml-2 bg-primary text-primary-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs px-1.5">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 glass rounded-2xl overflow-hidden flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedConversation.other_user.avatar_url} alt={selectedConversation.other_user.full_name} />
                          <AvatarFallback>{selectedConversation.other_user.full_name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.other_user.full_name}</h3>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        const isEditing = editingMessageId === message.id;
                        const isHovered = hoveredMessageId === message.id;
                        
                        return isOwnMessage ? (
                          <div 
                            key={message.id} 
                            className="flex items-start gap-2 justify-end group"
                            onMouseEnter={() => setHoveredMessageId(message.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            {/* Edit/Delete Icons */}
                            {isHovered && !isEditing && (
                              <div className="flex items-center gap-1 mt-2">
                                <button
                                  onClick={() => handleEditMessage(message.id, message.content)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Edit message"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(message.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            )}

                            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[70%]">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1 hover:bg-primary-foreground/10 rounded transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="p-1 hover:bg-primary-foreground/10 rounded transition-colors"
                                      title="Save"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm">
                                    <EventMentionParser content={message.content} />
                                  </div>
                                  <div className="flex items-center justify-end gap-2 mt-1">
                                    <span className="text-xs opacity-80">
                                      {formatMessageTime(message.created_at)}
                                    </span>
                                    {message.edited_at && (
                                      <span className="text-xs opacity-70 italic" title={`Edited ${formatMessageTime(message.edited_at)}`}>
                                        (edited)
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={message.id} className="flex items-start gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={selectedConversation.other_user.avatar_url} alt={message.sender.full_name} />
                              <AvatarFallback>{message.sender.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="glass rounded-2xl rounded-tl-sm px-4 py-2 max-w-[70%]">
                              <div className="text-sm">
                                <EventMentionParser content={message.content} />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {message.edited_at && (
                                  <span className="text-xs text-muted-foreground italic" title={`Edited ${formatMessageTime(message.edited_at)}`}>
                                    (edited)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 glass border-white/10"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-primary text-primary-foreground p-2.5 rounded-xl transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageDialogOpen}
        onOpenChange={setNewMessageDialogOpen}
        onConversationSelected={(conversationId) => {
          setSelectedConversationId(conversationId);
          refetchConversations();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inbox;
