import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, MinusCircle, FileText, User, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtime";

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

interface ChatWidgetProps {
  roomId?: string;
  title?: string;
  isSupport?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  roomId,
  title = "Chat Support",
  isSupport = false,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate room ID if not provided
  const currentRoomId = roomId || (isSupport ? `support:${user?.id}` : `general:${user?.id}`);

  // Fetch messages
  const fetchMessages = async () => {
    if (!user || !currentRoomId) {return;}

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", currentRoomId)
        .order("created_at", { ascending: true });

      if (error) {throw error;}
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  // Set up realtime subscription
  useRealtimeSubscription(
    "messages",
    (payload) => {
      if (payload.new.room_id === currentRoomId) {
        setMessages(prev => [...prev, payload.new]);
        
        // Update unread count if chat is closed/minimized
        if (!isOpen || isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
      }
    },
    undefined,
    undefined,
    `room_id=eq.${currentRoomId}`
  );

  useEffect(() => {
    if (user && currentRoomId) {
      fetchMessages();
    }
  }, [user, currentRoomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clear unread count when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !currentRoomId) {return;}

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          room_id: currentRoomId,
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) {throw error;}

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (senderId: string) => senderId === user?.id;

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-2 min-w-[20px] h-5 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-6 right-6 z-50 w-80 shadow-xl transition-all duration-200 ${
          isMinimized ? "h-16" : "h-96"
        }`}>
          {/* Header */}
          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {title}
              {unreadCount > 0 && !isMinimized && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <MinusCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="p-3 h-64 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-xs">Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage(message.sender_id) ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          isOwnMessage(message.sender_id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {isOwnMessage(message.sender_id) ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Bot className="w-3 h-3" />
                          )}
                          <span className="text-xs opacity-70">
                            {isOwnMessage(message.sender_id) ? "You" : "Support"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <div className="text-xs opacity-60 mt-1">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};