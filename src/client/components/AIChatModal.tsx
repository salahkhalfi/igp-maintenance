import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { Ticket } from '../../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// --- HELPER FUNCTION: PURE PARSING LOGIC ---
// Extracted outside component to be pure and testable
const parseAndSanitizeMarkdown = (content: string) => {
    let clean = content;
    
    // 0. DOMAIN SANITIZER (FIREWALL) - FOR EVER FIX
    // Fix explicit "https://api/media/..." (Hallucinated 'api' hostname) which causes 503s
    clean = clean.replace(/https?:\/\/api\/media/g, '/api/media');
    
    // Fix .com hallucination -> .ca
    clean = clean.replace(/igpglass\.com/g, 'igpglass.ca');
    
    // Fix "https://any-domain.com/api/media/..." (Absolute URL to self)
    clean = clean.replace(/https?:\/\/[^\/]+\/api\/media/g, '/api/media');

    // 1. Remove code block markers (```html ... ```)
    if (clean.includes('```')) {
        clean = clean.replace(/```html/g, '').replace(/```/g, '');
    }
    
    // 2. Unescape escaped HTML entities if needed
    if (clean.includes('&lt;') && clean.includes('&gt;')) {
        // Safe DOM parser approach (doesn't execute scripts)
        const txt = document.createElement('textarea');
        txt.innerHTML = clean;
        clean = txt.value;
    }

    // 3. Simple Markdown Parser (Images, Links, Bold, Newlines)
    
    // Images: ![Alt](URL) -> <img src="URL" alt="Alt" ... />
    clean = clean.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
        let validUrl = url.trim();
        // Redundant check: ensure no absolute API links slipped through
        if (validUrl.match(/^https?:\/\/api\//)) {
            validUrl = validUrl.replace(/^https?:\/\/api\//, '/api/');
        }
        return `<img src="${validUrl}" alt="${alt}" class="max-w-full rounded-lg my-2 border border-gray-200 shadow-sm" />`;
    });
    
    // Links: [Text](URL) -> <a href="URL" ...>Text</a>
    clean = clean.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
        // FIX: If text is corrupted as '1$', replace with meaningful text
        if (text === '1$') text = 'Voir Ticket';

        let validUrl = url.trim();
        // Redundant check for links too
        if (validUrl.match(/^https?:\/\/api\//)) {
            validUrl = validUrl.replace(/^https?:\/\/api\//, '/api/');
        }
        return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">${text}</a>`;
    });
    
    // 4. Table Parser (Simple & Robust)
    // Detects blocks of Markdown tables and converts them to responsive HTML tables
    // Matches: Header row + Separator row + Data rows
    // | A | B |
    // |---|---|
    // | C | D |
    
    // Pattern explanation:
    // (^|\n): Start of string or newline
    // (\|.*\|(?:\n|$)): Header row
    // (\|[-:| ]+\|(?:\n|$)): Separator row (must contain dashes)
    // ((?:\|.*\|(?:\n|$))+): Body rows (one or more)
    const tableRegex = /(?:^|\n)(\|.*\|(?:\n|$))(\|[-:| ]+\|(?:\n|$))((?:\|.*\|(?:\n|$))+)/g;
    
    // Function to process a single table block
    const processTable = (match: string, header: string, separator: string, body: string) => {
        const parseRow = (row: string) => row.trim().split('|').filter(c => c !== '').map(c => c.trim());
        
        const headers = parseRow(header);
        const rows = body.trim().split('\n').map(parseRow);
        
        let html = '<div class="overflow-x-auto my-3 rounded-lg border border-gray-200 shadow-sm"><table class="min-w-full divide-y divide-gray-200 text-sm">';
        
        // Header
        html += '<thead class="bg-gray-50"><tr>';
        headers.forEach(h => {
             // Recursive bold parsing for headers too
             const safeHeader = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
             html += `<th class="px-3 py-3 text-left font-bold text-gray-900 tracking-wider whitespace-nowrap">${safeHeader}</th>`;
        });
        html += '</tr></thead>';
    
        // Body
        html += '<tbody class="bg-white divide-y divide-gray-200">';
        rows.forEach(row => {
            html += '<tr class="hover:bg-gray-50 transition-colors">';
            row.forEach(cell => {
                // Parse bold/links inside cells recursively
                let cellContent = cell
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                        const isInternal = url.includes('app.igpglass.ca') || url.startsWith('/');
                        const target = isInternal ? '_self' : '_blank';
                        return `<a href="${url}" target="${target}" class="text-blue-600 underline">${text}</a>`;
                    });
                    
                html += `<td class="px-3 py-3 whitespace-normal text-gray-700 min-w-[120px] leading-relaxed">${cellContent}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        
        return html;
    };

    // Apply Table Parser BEFORE other replacements (to preserve structure)
    // We loop to find matches because the regex is global and complex
    // Simple approach: Replace the whole block
    clean = clean.replace(tableRegex, (match, h, s, b) => processTable(match, h, s, b));

    // Bold: **Text** -> <strong>Text</strong>
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Newlines: \n -> <br/>
    clean = clean.replace(/\n/g, '<br/>');
    
    return clean;
};

// --- OPTIMIZED SUB-COMPONENT: MESSAGE BUBBLE ---
// Wrapped in React.memo to prevent re-rendering unless message props change
const ChatMessageItem = React.memo(({ msg }: { msg: Message }) => {
    return (
        <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role !== 'system' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                }`}>
                    {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
            )}
            
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-tr-none' 
                  : msg.role === 'system'
                  ? 'bg-red-50 text-red-600 border border-red-100 w-full text-center'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none whitespace-pre-wrap overflow-hidden'
            }`}>
                {msg.role === 'assistant' ? (
                  /* Render HTML for assistant messages (Optimized: Parsing logic only runs once per message render) */
                  <div dangerouslySetInnerHTML={{ __html: parseAndSanitizeMarkdown(msg.content) }} />
                ) : (
                  msg.content
                )}
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---
export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, ticket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'init-1',
          role: 'assistant',
          content: `Bonjour. Je suis l'Expert Industriel. Comment puis-je vous aider concernant le ticket #${ticket.id} : "${ticket.title}" ?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, ticket]);

  const sendMessage = async (text: string, isAnalysisRequest = false) => {
    if (!text.trim() && !isAnalysisRequest) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is here
        },
        body: JSON.stringify({
          message: text,
          ticketContext: ticket,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          isAnalysisRequest
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur API');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: "Erreur de connexion avec l'expert. Veuillez réessayer.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisClick = () => {
    const prompt = "À propos de ce problème";
    sendMessage(prompt, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Expert Industriel</h3>
              <p className="text-xs text-purple-200 opacity-90">Assistant Technique & Maintenance (v3.0.1)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions (Sticky under header) */}
        <div className="bg-gray-50 p-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
          <button 
            onClick={handleAnalysisClick}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-full text-sm font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
          >
            <Lightbulb className="w-4 h-4" />
            À propos de ce problème
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} msg={msg} />
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-gray-500 text-sm shadow-sm">
                Analyse en cours...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question technique..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            L'IA peut faire des erreurs. Vérifiez toujours les procédures de sécurité.
          </p>
        </div>
      </div>
    </div>
  );
};
