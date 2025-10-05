import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Send, 
  Search, 
  User, 
  Check, 
  CheckCheck,
  Reply,
  Forward,
  Paperclip,
  Smile,
  AtSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
  };
  subject: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'email' | 'sms' | 'chat';
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  is_starred: boolean;
  is_archived: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin';
  last_active: string;
  unread_count: number;
  avatar?: string;
}

const CommunicationCenter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'drafts' | 'archived'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: {
            id: 'user1',
            name: 'Rajesh Kumar',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
          },
          recipient: {
            id: 'admin1',
            name: 'Admin Team'
          },
          subject: 'Booking Inquiry for Hyundai Creta',
          content: 'Hello, I would like to book a Hyundai Creta for 3 days from Oct 5-7. Please let me know availability and pricing.',
          timestamp: '2025-09-28T10:30:00Z',
          status: 'read',
          type: 'email',
          priority: 'medium',
          is_starred: false,
          is_archived: false
        },
        {
          id: '2',
          sender: {
            id: 'user2',
            name: 'Priya Sharma'
          },
          recipient: {
            id: 'admin1',
            name: 'Admin Team'
          },
          subject: 'Urgent: Car Issue During Trip',
          content: 'I am currently on a trip with the Maruti Swift and facing engine issues. Please assist immediately.',
          timestamp: '2025-09-28T09:15:00Z',
          status: 'read',
          type: 'sms',
          priority: 'high',
          is_starred: true,
          is_archived: false
        },
        {
          id: '3',
          sender: {
            id: 'user3',
            name: 'Amit Patel',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
          },
          recipient: {
            id: 'admin1',
            name: 'Admin Team'
          },
          subject: 'Feedback on Honda City Experience',
          content: 'Just completed my trip with the Honda City. Overall experience was great, but the AC could be better.',
          timestamp: '2025-09-27T16:45:00Z',
          status: 'delivered',
          type: 'email',
          priority: 'low',
          is_starred: false,
          is_archived: false
        },
        {
          id: '4',
          sender: {
            id: 'admin1',
            name: 'Admin Team'
          },
          recipient: {
            id: 'user4',
            name: 'Sneha Reddy'
          },
          subject: 'Booking Confirmation - Toyota Innova',
          content: 'Your booking for Toyota Innova from Oct 10-15 has been confirmed. Booking ID: #BK20250928004',
          timestamp: '2025-09-28T08:30:00Z',
          status: 'sent',
          type: 'email',
          priority: 'medium',
          is_starred: false,
          is_archived: false
        }
      ];

      const mockContacts: Contact[] = [
        {
          id: 'user1',
          name: 'Rajesh Kumar',
          email: 'rajesh@example.com',
          phone: '+91 98765 43210',
          role: 'customer',
          last_active: '2025-09-28T10:30:00Z',
          unread_count: 0
        },
        {
          id: 'user2',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+91 98765 43211',
          role: 'customer',
          last_active: '2025-09-28T09:15:00Z',
          unread_count: 1
        },
        {
          id: 'user3',
          name: 'Amit Patel',
          email: 'amit@example.com',
          phone: '+91 98765 43212',
          role: 'customer',
          last_active: '2025-09-27T16:45:00Z',
          unread_count: 0
        },
        {
          id: 'staff1',
          name: 'Sneha Reddy',
          email: 'sneha@rpcars.com',
          phone: '+91 98765 43213',
          role: 'staff',
          last_active: '2025-09-28T08:30:00Z',
          unread_count: 0
        }
      ];

      setMessages(mockMessages);
      setContacts(mockContacts);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter messages based on selections
  const filteredMessages = useMemo(() => {
    let filtered = messages;
    
    // Apply tab filter
    if (activeTab === 'inbox') {
      filtered = filtered.filter(msg => msg.recipient.id === 'admin1' && !msg.is_archived);
    } else if (activeTab === 'sent') {
      filtered = filtered.filter(msg => msg.sender.id === 'admin1' && !msg.is_archived);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(msg => msg.is_archived);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.type === typeFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(msg => msg.priority === priorityFilter);
    }
    
    return filtered;
  }, [messages, activeTab, searchTerm, typeFilter, priorityFilter]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="w-4 h-4 text-muted-foreground" />;
      case 'delivered': return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'read': return <CheckCheck className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  // Handle compose submit
  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the message
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully",
    });
    
    setShowCompose(false);
    setComposeData({
      to: '',
      subject: '',
      content: '',
      priority: 'medium'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Communication Center</h1>
          <p className="text-muted-foreground">Manage all customer communications and support</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4 mr-2" />
          Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Message Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inbox</span>
                  <Badge>{messages.filter(m => m.recipient.id === 'admin1' && !m.is_archived).length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sent</span>
                  <span className="text-sm">{messages.filter(m => m.sender.id === 'admin1').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Archived</span>
                  <span className="text-sm">{messages.filter(m => m.is_archived).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <div className="relative">
                      {contact.avatar ? (
                        <img 
                          src={contact.avatar} 
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      {contact.unread_count > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {contact.unread_count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Tabs */}
          <div className="flex border-b">
            <Button
              variant={activeTab === 'inbox' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('inbox')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Inbox
            </Button>
            <Button
              variant={activeTab === 'sent' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('sent')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Sent
            </Button>
            <Button
              variant={activeTab === 'archived' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('archived')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Archived
            </Button>
          </div>

          {/* Message List */}
          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No messages found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'inbox' 
                      ? "Your inbox is empty. Messages will appear here when customers contact you."
                      : activeTab === 'sent'
                      ? "You haven't sent any messages yet."
                      : "No archived messages."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          {message.sender.avatar ? (
                            <img 
                              src={message.sender.avatar} 
                              alt={message.sender.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-muted rounded-full p-1">
                            {getTypeIcon(message.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{message.sender.name}</p>
                                <Badge variant={getPriorityVariant(message.priority)} className="text-xs">
                                  {message.priority}
                                </Badge>
                              </div>
                              <p className="font-medium truncate">{message.subject}</p>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {message.content.substring(0, 100)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(message.status)}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Message Detail View */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">From: {selectedMessage.sender.name}</span>
                  <Badge variant={getPriorityVariant(selectedMessage.priority)} className="text-xs">
                    {selectedMessage.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Reply className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Forward className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                  ✕
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments ({selectedMessage.attachments.length})
                    </h4>
                    <div className="mt-2 space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-primary hover:underline cursor-pointer">
                            {attachment.split('/').pop()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </span>
                  {getStatusIcon(selectedMessage.status)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Compose Message Modal */}
      {showCompose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Compose Message</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleComposeSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">To</label>
                <Select value={composeData.to} onValueChange={(value) => setComposeData({...composeData, to: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={composeData.priority} onValueChange={(value) => setComposeData({...composeData, priority: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={composeData.content}
                  onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                  placeholder="Type your message here..."
                  rows={8}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Smile className="w-4 h-4 mr-2" />
                  Emoji
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <AtSign className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
            </form>

            <div className="p-6 border-t">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleComposeSubmit}>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CommunicationCenter;