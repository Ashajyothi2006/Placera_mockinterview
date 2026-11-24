import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Send, User, Bot, Briefcase, Plus, MessageSquare,
  Trash2, Edit2, Check, X, Search, Sparkles, Clock,
  ChevronRight, ArrowLeft, RefreshCw, Copy
} from 'lucide-react';

const DEFAULT_GREETING = {
  sender: 'Agent',
  text: "Hello! I am your AI Career Agent. I can help you improve your resume, practice specific interview questions, formulate salary negotiation strategies, or guide your placement journey. What would you like to focus on today?"
};

const cleanErrorMessage = (err) => {
  if (!err) return "The AI service is currently experiencing high demand. Please try again in a moment.";
  let msg = typeof err === 'string' ? err : (err.message || String(err));
  if (msg.includes('503') || /high\s*demand/i.test(msg) || /overloaded/i.test(msg) || /spikes\s*in\s*demand/i.test(msg)) {
    return "The AI service is currently experiencing high demand (503 Service Unavailable). Please try again in a few moments.";
  }
  if (msg.includes('429') || /quota/i.test(msg) || /rate\s*limit/i.test(msg) || /exhausted/i.test(msg)) {
    return "AI request limit reached. Please try again in a moment.";
  }
  if (msg.includes('404') || /no longer available/i.test(msg) || /not found/i.test(msg) || /interactions api/i.test(msg)) {
    return "The AI service is currently updating to the latest model channel. Please try again in a moment.";
  }
  msg = msg.replace(/https?:\/\/[^\s)\]]+/gi, '');
  msg = msg.replace(/\[GoogleGenerativeAI\s*Error\]:\s*/gi, '');
  msg = msg.replace(/Error fetching from[^:]*:\s*/gi, '');
  msg = msg.trim().replace(/[:]+$/, '').trim();
  return msg || "AI service temporarily unavailable. Please try again.";
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

const renderInlineMarkdown = (text) => {
  if (!text) return null;

  const tokens = [];
  let remaining = text;
  let keyCounter = 0;

  const inlineRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$|\[[^\]]+\]\([^)]+\))/;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);
    if (!match) {
      tokens.push(remaining);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      tokens.push(remaining.substring(0, matchIndex));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('***') && matchedStr.endsWith('***')) {
      tokens.push(
        <strong key={`bi-${keyCounter++}`} className="font-bold italic text-gray-900">
          {matchedStr.slice(3, -3)}
        </strong>
      );
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push(
        <strong key={`b-${keyCounter++}`} className="font-semibold text-gray-900">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push(
        <em key={`i-${keyCounter++}`} className="italic text-gray-800">
          {matchedStr.slice(1, -1)}
        </em>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push(
        <code key={`c-${keyCounter++}`} className="px-1.5 py-0.5 rounded bg-gray-100 text-blue-600 font-mono text-xs font-semibold border border-gray-200/60">
          {matchedStr.slice(1, -1)}
        </code>
      );
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$') && matchedStr.length > 2) {
      const mathContent = matchedStr.slice(1, -1).replace(/\\/g, '');
      tokens.push(
        <code key={`m-${keyCounter++}`} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-semibold border border-blue-200/50">
          {mathContent}
        </code>
      );
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkParts = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkParts) {
        tokens.push(
          <a
            key={`a-${keyCounter++}`}
            href={linkParts[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            {linkParts[1]}
          </a>
        );
      } else {
        tokens.push(matchedStr);
      }
    } else {
      tokens.push(matchedStr);
    }

    remaining = remaining.substring(matchIndex + matchedStr.length);
  }

  return tokens;
};

const renderMarkdownBlocks = (text, prefix) => {
  const lines = text.split('\n');
  const elements = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      const listKey = `${prefix}-list-${elements.length}`;
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={listKey} className="space-y-2 my-2.5">
            {currentList.items.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2.5 leading-relaxed ${
                  item.isSub ? 'ml-6 text-gray-700' : 'text-gray-800'
                }`}
              >
                <span
                  className={`rounded-full mt-2 shrink-0 ${
                    item.isSub
                      ? 'w-1 h-1 bg-slate-400'
                      : 'w-1.5 h-1.5 bg-blue-600'
                  }`}
                />
                <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={listKey} className="space-y-2 my-2.5">
            {currentList.items.map((item, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2.5 leading-relaxed ${
                  item.isSub ? 'ml-6 text-gray-700' : 'text-gray-800'
                }`}
              >
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold shrink-0 mt-0.5 border border-blue-200/60">
                  {item.num}
                </span>
                <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      elements.push(
        <hr key={`${prefix}-hr-${i}`} className="my-4 border-gray-200/80" />
      );
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      if (level === 1) {
        elements.push(
          <h2
            key={`${prefix}-h1-${i}`}
            className="text-lg font-bold text-gray-900 mt-4 mb-2 tracking-tight"
          >
            {renderInlineMarkdown(headingText)}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3
            key={`${prefix}-h2-${i}`}
            className="text-base font-bold text-gray-900 mt-3.5 mb-1.5 tracking-tight"
          >
            {renderInlineMarkdown(headingText)}
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`${prefix}-h3-${i}`}
            className="text-[15.5px] font-bold text-gray-900 mt-3 mb-1 tracking-tight"
          >
            {renderInlineMarkdown(headingText)}
          </h4>
        );
      }
      continue;
    }

    // Sub-bullet (with leading spaces or tabs)
    const subBulletMatch = rawLine.match(/^(\s{2,}|\t+)[\*\-\•\·]\s+(.*)$/);
    if (subBulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push({ text: subBulletMatch[2], isSub: true });
      continue;
    }

    // Main Bullet (*, -, •, ·)
    const bulletMatch = trimmed.match(/^[\*\-\•\·]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push({ text: bulletMatch[1], isSub: false });
      continue;
    }

    // Sub numbered list
    const subOrderedMatch = rawLine.match(/^(\s{2,}|\t+)(\d+)\.\s+(.*)$/);
    if (subOrderedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({
        num: subOrderedMatch[2],
        text: subOrderedMatch[3],
        isSub: true
      });
      continue;
    }

    // Main Numbered List (1., 2.)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({
        num: orderedMatch[1],
        text: orderedMatch[2],
        isSub: false
      });
      continue;
    }

    // Blockquote (> quote)
    const quoteMatch = trimmed.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      flushList();
      elements.push(
        <blockquote
          key={`${prefix}-bq-${i}`}
          className="pl-3.5 py-1.5 my-2 border-l-4 border-blue-500 bg-blue-50/40 rounded-r-lg text-gray-700 italic text-sm"
        >
          {renderInlineMarkdown(quoteMatch[1])}
        </blockquote>
      );
      continue;
    }

    // Regular line / paragraph
    flushList();
    elements.push(
      <p
        key={`${prefix}-p-${i}`}
        className="text-gray-800 leading-relaxed mb-2.5 last:mb-0"
      >
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList();
  return elements;
};

const FormattedMessage = ({ content }) => {
  if (!content) return null;

  // Split out code blocks (``` ... ```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const sections = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      sections.push({ type: 'markdown', text: content.slice(lastIndex, match.index) });
    }
    sections.push({ type: 'code', lang: match[1] || 'text', code: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    sections.push({ type: 'markdown', text: content.slice(lastIndex) });
  }

  return (
    <div className="space-y-3 text-[14.5px] leading-relaxed text-gray-800 font-normal">
      {sections.map((section, sIdx) => {
        if (section.type === 'code') {
          return (
            <div key={sIdx} className="my-3 rounded-xl overflow-hidden border border-gray-800 shadow-md">
              <div className="bg-gray-800 text-gray-300 text-xs px-4 py-2 font-mono flex justify-between items-center select-none">
                <span className="font-semibold uppercase tracking-wider">{section.lang}</span>
                <span className="text-[11px] text-gray-400">code snippet</span>
              </div>
              <pre className="p-4 bg-gray-950 text-gray-100 font-mono text-xs overflow-x-auto leading-relaxed">
                <code>{section.code.trim()}</code>
              </pre>
            </div>
          );
        }

        return renderMarkdownBlocks(section.text, sIdx);
      })}
    </div>
  );
};

const CareerAgent = () => {
  const scrollRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState('New Conversation');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline edit & delete states
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingConvId, setDeletingConvId] = useState(null);

  // Chat state
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([DEFAULT_GREETING]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopyMessage = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }).catch(() => {});
  };

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authenticated user helper
  const getUserId = useCallback(() => {
    return (localStorage.getItem('user_id') || localStorage.getItem('user_email') || 'demo_candidate@placera.ai').toLowerCase().trim();
  }, []);

  const getUserEmail = useCallback(() => {
    return localStorage.getItem('user_email') || localStorage.getItem('user_id') || 'demo_candidate@placera.ai';
  }, []);

  // Fetch list of conversations
  const fetchConversations = useCallback(async (selectId = null) => {
    setIsLoadingConversations(true);
    try {
      const userId = getUserId();
      const res = await api.get('/agent/conversations', {
        headers: { 'x-user-id': userId }
      });
      const list = res.data?.conversations || [];
      setConversations(list);

      // If requested to select a specific id
      if (selectId) {
        const found = list.find(c => c.id === selectId);
        if (found) {
          setCurrentConversationTitle(found.title);
        }
      }
    } catch (err) {
      console.warn('Failed to load conversations:', err.message);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [getUserId]);

  // Load a specific conversation's full message history
  const loadConversationMessages = useCallback(async (convId, convTitle) => {
    setIsLoadingChat(true);
    setCurrentConversationId(convId);
    setCurrentConversationTitle(convTitle || 'Conversation');
    sessionStorage.setItem('active_career_conv_id', convId);

    try {
      const userId = getUserId();
      const res = await api.get(`/agent/conversations/${convId}`, {
        headers: { 'x-user-id': userId }
      });

      const msgs = res.data?.messages || [];
      if (msgs.length > 0) {
        const formatted = msgs.map(m => ({
          sender: m.role === 'assistant' ? 'Agent' : m.role === 'system' ? 'System' : 'User',
          text: m.content,
          created_at: m.created_at
        }));
        setChatHistory(formatted);
      } else {
        setChatHistory([DEFAULT_GREETING]);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
      setChatHistory([
        DEFAULT_GREETING,
        { sender: 'System', text: 'Notice: Could not load older messages for this conversation.' }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  }, [getUserId]);

  // Initial load: Fetch conversations and restore active conversation if any
  useEffect(() => {
    const initialize = async () => {
      setIsLoadingConversations(true);
      try {
        const userId = getUserId();
        const res = await api.get('/agent/conversations', {
          headers: { 'x-user-id': userId }
        });
        const list = res.data?.conversations || [];
        setConversations(list);

        // Check if there was an active conversation from previous navigation/session
        const savedActiveId = sessionStorage.getItem('active_career_conv_id');
        if (savedActiveId && list.some(c => c.id === savedActiveId)) {
          const matched = list.find(c => c.id === savedActiveId);
          await loadConversationMessages(matched.id, matched.title);
        } else if (list.length > 0) {
          // Auto-load most recent conversation on initial open
          await loadConversationMessages(list[0].id, list[0].title);
        }
      } catch (err) {
        console.warn('Initial conversations load failed:', err.message);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    initialize();
  }, [getUserId, loadConversationMessages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping, isLoadingChat]);

  // Start New Chat
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setCurrentConversationTitle('New Conversation');
    sessionStorage.removeItem('active_career_conv_id');
    setChatHistory([DEFAULT_GREETING]);
    setInputMessage('');
    setEditingConvId(null);
    setDeletingConvId(null);
    setIsMobileSidebarOpen(false);
  };

  // Select conversation from sidebar
  const handleSelectConversation = (conv) => {
    if (editingConvId || deletingConvId) return;
    if (conv.id === currentConversationId) {
      setIsMobileSidebarOpen(false);
      return;
    }
    loadConversationMessages(conv.id, conv.title);
    setIsMobileSidebarOpen(false);
  };

  // Start inline rename
  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
    setDeletingConvId(null);
  };

  // Save inline rename
  const handleSaveRename = async (convId, e) => {
    if (e) e.stopPropagation();
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle) {
      setEditingConvId(null);
      return;
    }

    try {
      const userId = getUserId();
      const res = await api.patch(`/agent/conversations/${convId}`,
        { title: cleanTitle },
        { headers: { 'x-user-id': userId } }
      );
      if (res.data?.success) {
        setConversations(prev =>
          prev.map(c => (c.id === convId ? { ...c, title: cleanTitle, updated_at: new Date().toISOString() } : c))
        );
        if (currentConversationId === convId) {
          setCurrentConversationTitle(cleanTitle);
        }
      }
    } catch (err) {
      console.error('Rename failed:', err);
    } finally {
      setEditingConvId(null);
    }
  };

  // Cancel inline rename
  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditingConvId(null);
  };

  // Trigger delete confirmation
  const handleStartDelete = (convId, e) => {
    e.stopPropagation();
    setDeletingConvId(convId);
    setEditingConvId(null);
  };

  // Confirm delete
  const handleConfirmDelete = async (convId, e) => {
    if (e) e.stopPropagation();
    try {
      const userId = getUserId();
      await api.delete(`/agent/conversations/${convId}`, {
        headers: { 'x-user-id': userId }
      });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete conversation failed:', err);
    } finally {
      setDeletingConvId(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = (e) => {
    if (e) e.stopPropagation();
    setDeletingConvId(null);
  };

  // Handle Send Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isTyping || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to UI state immediately
    const newHistory = [...chatHistory, { sender: 'User', text: userMessage }];
    setChatHistory(newHistory);
    setIsTyping(true);

    try {
      const userId = getUserId();
      const response = await api.post('/agent',
        {
          prompt: userMessage,
          history: newHistory.filter(msg => msg.sender !== 'System'),
          conversationId: currentConversationId,
          userId
        },
        {
          headers: { 'x-user-id': userId }
        }
      );

      const replyText = response.data?.reply || 'No response generated.';
      setChatHistory(prev => [...prev, { sender: 'Agent', text: replyText }]);

      // If a new conversation was created on the first message
      if (response.data?.conversationId) {
        const assignedConvId = response.data.conversationId;
        setCurrentConversationId(assignedConvId);
        sessionStorage.setItem('active_career_conv_id', assignedConvId);

        if (response.data.conversationTitle) {
          setCurrentConversationTitle(response.data.conversationTitle);
        }

        // Re-fetch conversation list to place the new/updated conversation at top
        fetchConversations(assignedConvId);
      }
    } catch (error) {
      const rawErr = error.response?.data?.error || error.response?.data?.reply || error.message;
      const cleanErr = cleanErrorMessage(rawErr);
      setChatHistory(prev => [...prev, { sender: 'System', text: `AI Service Notice: ${cleanErr}` }]);
    } finally {
      setIsTyping(false);
      isSubmittingRef.current = false;
    }
  };

  // Suggested topic click handler
  const handleSelectSuggestedTopic = (topicText) => {
    setInputMessage(topicText);
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white text-gray-800">

      {/* Main Layout: Sidebar + Chat Area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* LEFT: ChatGPT-Style Persistent Chat History Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-30 w-72 md:w-80 bg-slate-50 border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>

          {/* Top of Sidebar: Brand & New Chat */}
          <div className="p-3.5 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">PLACERA</span>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Briefcase size={16} className="text-blue-600" />
                  AI Career Agent
                </h3>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>

            {/* Search Input */}
            <div className="relative mt-2.5">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Middle: Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Recent</span>
              <button
                onClick={() => fetchConversations()}
                title="Refresh history"
                className="hover:text-blue-600 transition-colors"
              >
                <RefreshCw size={12} className={isLoadingConversations ? 'animate-spin' : ''} />
              </button>
            </div>

            {isLoadingConversations && conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                <div>Loading conversations...</div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                {searchQuery ? 'No matching conversations' : 'No previous conversations yet.'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === currentConversationId;
                const isEditing = conv.id === editingConvId;
                const isDeleting = conv.id === deletingConvId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${isActive
                        ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-200 shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    {isEditing ? (
                      /* Inline Rename Form */
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id, e);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 text-xs bg-white border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : isDeleting ? (
                      /* Inline Delete Confirmation */
                      <div className="flex items-center justify-between w-full px-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] text-red-600 font-medium">Delete chat?</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleConfirmDelete(conv.id, e)}
                            className="px-2 py-0.5 text-[11px] bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="px-2 py-0.5 text-[11px] bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Conversation Row */
                      <>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare
                            size={15}
                            className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs" title={conv.title}>
                              {conv.title}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {formatTimeAgo(conv.updated_at || conv.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Rename & Delete */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                            title="Rename"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleStartDelete(conv.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom: Suggested Topics & Account Badge */}
          <div className="p-3 border-t border-gray-200 bg-white space-y-2.5">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Suggested Topics
              </div>
              <div className="space-y-1">
                {[
                  "How to improve my resume for ATS",
                  "Python interview preparation",
                  "TCS placement preparation",
                  "Explain core OOP concepts in Java",
                  "Salary negotiation strategies"
                ].map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestedTopic(topic)}
                    className="w-full text-left truncate text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-1 px-1.5 rounded transition-colors block"
                    title={topic}
                  >
                    • {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5 truncate">
                <User size={13} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{getUserEmail()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-20"
          />
        )}

        {/* RIGHT: Chat Window */}
        <div className="flex-1 flex flex-col relative bg-white overflow-hidden">

          {/* Mobile Sidebar Toggle Button */}
          <div className="md:hidden absolute top-3 left-3 z-10">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 bg-white border border-gray-200 shadow-xs rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              title="Open Chat History"
            >
              <MessageSquare size={18} />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {isLoadingChat ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading conversation history...</span>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 md:gap-4 max-w-3xl mx-auto ${msg.sender === 'User' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'User'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                    }`}>
                    {msg.sender === 'User' ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Message Bubble */}
                  {msg.sender === 'User' ? (
                    <div className="p-4 rounded-2xl max-w-[85%] sm:max-w-[80%] bg-blue-600 text-white rounded-tr-none shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  ) : msg.sender === 'System' ? (
                    <div className="p-4 rounded-2xl max-w-[85%] sm:max-w-[80%] bg-red-50 text-red-600 border border-red-200 rounded-tl-none text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="flex-1 max-w-[92%] sm:max-w-[88%] bg-white border border-gray-200/90 rounded-2xl rounded-tl-none shadow-xs p-5 sm:p-6 transition-all hover:border-gray-300">
                      <FormattedMessage content={msg.text} />

                      {/* ChatGPT-style action toolbar at the bottom of the answer */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 select-none">
                          <Sparkles size={12} className="text-blue-500" /> Placera AI Placement Coach
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text, idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Copy response"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check size={13} className="text-green-600" />
                              <span className="text-[11px] text-green-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex gap-3 md:gap-4 max-w-3xl mx-auto">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-100 text-green-600 flex-shrink-0">
                  <Bot size={18} />
                </div>
                <div className="p-4 px-5 rounded-2xl bg-white border border-gray-200/90 text-gray-500 rounded-tl-none shadow-xs text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse delay-150"></div>
                  <span className="text-xs text-gray-400 font-medium ml-1">Placera AI is writing your response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything about your placement preparation..."
                  className="w-full p-3.5 pr-14 text-sm rounded-xl border border-gray-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isTyping || isLoadingChat}
                />
                <button
                  type="submit"
                  disabled={isTyping || !inputMessage.trim() || isLoadingChat}
                  className={`absolute right-2 top-2 bottom-2 px-3 rounded-lg transition-colors flex items-center justify-center ${inputMessage.trim() && !isTyping && !isLoadingChat
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="text-center text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                <Clock size={12} />
                <span>Conversations are automatically saved and synced to your account.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CareerAgent;
