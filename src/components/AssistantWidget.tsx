import React, { useState, useRef, useEffect } from 'react';
import { AssistantMessage } from '../types.js';
import { Sparkles, Send, X, RefreshCw, Bot, User, ArrowUpRight } from 'lucide-react';

interface AssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
  onNavigateToRequest?: (requestId: string) => void;
}

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateToRequest
}) => {
  const isAr = lang === 'ar';
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: isAr
        ? 'مرحباً بك في المساعد الذكي لمجموعة الإمارات لطلبات التعيين والنقل (Right First Time). كيف يمكنني مساعدتك في تدقيق القواعد أو تتبع حالة طلباتك اليوم؟'
        : 'Welcome to the Emirates Group Right First Time (P2P) Assistant. Ask me to track in-flight requests, verify grade parity rules, or analyze risk attribution.',
      language: isAr ? 'ar' : 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      language: /[\u0600-\u06FF]/.test(query) ? 'ar' : 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: isAr ? 'ar' : 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: AssistantMessage = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          language: data.language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedCaseId: data.relatedCaseId,
          actionLinks: data.actionLinks
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      console.error('Chat error', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: isAr
            ? 'عذراً، حدث تعذر مؤقت في الاتصال بالمساعد الذكي. يمكنك المحاولة مجدداً.'
            : 'Temporary connection delay with the assistant. Please try again.',
          language: isAr ? 'ar' : 'en',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = isAr
    ? [
        'أين طلب سارة جينكينز؟',
        'ما هي شروط النقل الجانبي؟',
        'لماذا تم إرجاع طلب فرحان؟',
        'كيف أحصل على اعتماد المسار السريع؟'
      ]
    : [
        "Where is Sarah Jenkins' request?",
        'What are the rules for Lateral Transfer?',
        'Why was Farhan Saeed request returned?',
        'How to qualify for Express Lane?'
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D71921] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight">
              {isAr ? 'مساعد طلبات التعيين الذكي' : 'Emirates RFT Smart Assistant'}
            </h3>
            <p className="text-[10px] text-[#BA9653] font-medium">
              Bilingual Operations Agent · English / العربية
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          {isAr ? 'أسئلة مقترحة سريعة:' : 'Quick Prompt Starters:'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 text-[11px] rounded bg-white hover:bg-red-50 text-slate-700 hover:text-[#D71921] border border-slate-200 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const isMsgAr = msg.language === 'ar';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#D71921] text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
                } ${isMsgAr ? 'text-right font-sans' : 'text-left'}`}
                dir={isMsgAr ? 'rtl' : 'ltr'}
              >
                {msg.text}

                {/* Interactive Action Links inside Assistant bubble */}
                {msg.actionLinks && msg.actionLinks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                    {msg.actionLinks.map((link, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (link.targetId && onNavigateToRequest) {
                            onNavigateToRequest(link.targetId);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-[#D71921] font-bold text-[11px] border border-red-200 hover:bg-red-50 shadow-xs cursor-pointer"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D71921]" />
            <span>{isAr ? 'جاري الاستعلام وتحليل البيانات...' : 'Consulting risk model & cases...'}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isAr ? 'اكتب استفسارك هنا (بالعربية أو الإنجليزية)...' : 'Type your question or case number...'}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#D71921] focus:ring-[#D71921]"
          dir={isAr ? 'rtl' : 'ltr'}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 text-white bg-[#D71921] hover:bg-[#b5141b] rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
