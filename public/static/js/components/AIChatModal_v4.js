const AIChatModal = ({ isOpen, onClose, ticket }) => {
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [markedLoaded, setMarkedLoaded] = React.useState(!!window.marked);
    const messagesEndRef = React.useRef(null);

    // Fonction d'impression des conseils
    const handlePrint = () => {
        if (messages.length === 0) {
            window.showToast && window.showToast('Aucun conseil à imprimer', 'warning');
            return;
        }

        // Filtrer uniquement les messages de l'assistant (conseils)
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        if (assistantMessages.length === 0) {
            window.showToast && window.showToast('Aucun conseil à imprimer', 'warning');
            return;
        }

        // Traiter le contenu markdown
        const processContent = (content) => {
            if (!content) return '';
            if (window.marked) {
                try {
                    const parse = (typeof window.marked.parse === 'function') ? window.marked.parse : window.marked;
                    return parse(content);
                } catch (e) {
                    console.error('Marked parse error:', e);
                }
            }
            // Fallback simple
            return content
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
                .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
                .replace(/\n/g, '<br/>');
        };

        // Générer le contenu HTML des conseils
        const conseilsHTML = assistantMessages.map((msg, idx) => `
            <div class="conseil">
                <div class="conseil-content">
                    ${processContent(msg.content)}
                </div>
            </div>
        `).join('');

        const ticketInfo = ticket ? `
            <div class="ticket-info">
                <strong>Équipement:</strong> ${ticket.machine_type || ''} ${ticket.model || ''}<br/>
                <strong>Problème:</strong> ${ticket.title || 'Non spécifié'}
            </div>
        ` : '';

        const printContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Conseils Expert Industriel</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; }
        body {
            font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1f2937;
            padding: 18mm 15mm 20mm 15mm;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 12pt;
            padding-bottom: 12pt;
            border-bottom: 2pt solid #7c3aed;
            margin-bottom: 16pt;
        }
        .header-icon {
            width: 40pt;
            height: 40pt;
            background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18pt;
        }
        .header-text h1 {
            font-size: 16pt;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        .header-text p {
            font-size: 9pt;
            color: #6b7280;
            margin: 2pt 0 0 0;
        }
        .date {
            margin-left: auto;
            font-size: 9pt;
            color: #6b7280;
        }
        
        .ticket-info {
            background: #f3f4f6;
            border-left: 3pt solid #7c3aed;
            padding: 10pt 12pt;
            margin-bottom: 16pt;
            font-size: 10pt;
        }
        
        .conseil {
            margin-bottom: 14pt;
            page-break-inside: avoid;
        }
        .conseil-content {
            background: #fafafa;
            border: 1pt solid #e5e7eb;
            border-radius: 6pt;
            padding: 12pt 14pt;
        }
        .conseil-content h1, .conseil-content h2, .conseil-content h3 {
            color: #1f2937;
            margin: 10pt 0 6pt 0;
        }
        .conseil-content h1 { font-size: 13pt; }
        .conseil-content h2 { font-size: 12pt; }
        .conseil-content h3 { font-size: 11pt; }
        .conseil-content p {
            margin: 6pt 0;
            line-height: 1.5;
        }
        .conseil-content ul, .conseil-content ol {
            margin: 6pt 0 6pt 16pt;
            padding: 0;
        }
        .conseil-content li {
            margin: 4pt 0;
            line-height: 1.45;
        }
        .conseil-content strong {
            color: #4f46e5;
        }
        
        .footer {
            margin-top: 20pt;
            padding-top: 10pt;
            border-top: 1pt solid #e5e7eb;
            font-size: 8pt;
            color: #9ca3af;
            text-align: center;
        }
        
        @media print {
            body { padding: 18mm 15mm 20mm 15mm !important; }
            .conseil { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-icon">🤖</div>
        <div class="header-text">
            <h1>Expert Industriel</h1>
            <p>Conseils Techniques & Maintenance</p>
        </div>
        <div class="date">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    </div>
    
    ${ticketInfo}
    
    ${conseilsHTML}
    
    <div class="footer">
        Document généré automatiquement • Les conseils sont fournis à titre indicatif • Vérifiez toujours les procédures de sécurité
    </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    // Scroll to bottom
    React.useEffect(() => {
        if (messagesEndRef.current) {
            // Small timeout to allow DOM layout (images/text wrap) to finish
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }, [messages, isLoading]); // Also scroll when loading state changes (spinner appears/disappears)

    // RESTORED: Marked dependency. We enforce Markdown.
    
    // Auto-Analyze on open
    React.useEffect(() => {
        if (isOpen && messages.length === 0 && ticket) {
            handleAnalysisClick();
        }
    }, [isOpen, ticket]);

    const sendMessage = async (text, isAnalysisRequest = false) => {
        if (!text.trim() && !isAnalysisRequest) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const headers = {};
            if (token && token !== 'null' && token !== 'undefined') {
                headers['Authorization'] = 'Bearer ' + token;
            }

            const response = await axios.post('/api/ai/chat', {
                message: text,
                ticketContext: ticket ? {
                    title: ticket.title,
                    description: ticket.description,
                    machine_id: ticket.machine_id,
                    machine_name: ticket.machine_type + ' ' + (ticket.model || '')
                } : null,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                isAnalysisRequest
            }, {
                headers: headers
            });

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.reply,
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

    const messageList = React.useMemo(() => {
        // --- HELPER: Process content using Markdown (with robust fallback) ---
        const processContent = (content) => {
            if (!content) return '';
            
            // 1. Try 'marked' library (Standard)
            if (window.marked) {
                try {
                    // Support both marked.parse() (v4+) and marked() (older)
                    const parse = (typeof window.marked.parse === 'function') ? window.marked.parse : window.marked;
                    return parse(content);
                } catch (e) {
                    console.error('Marked parse error, using fallback:', e);
                }
            } else {
                console.warn('Marked library not found, using simple fallback parser');
            }

            // 2. Simple Markdown Parser (Fallback for bold, italic, lists, headers)
            let text = content
                // Escape HTML first to prevent XSS in fallback mode
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                // Bold (**text**)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic (*text*)
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Headers (### Text)
                .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                // Lists (- Item) - Simple single-level support
                .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
                // Newlines to BR
                .replace(/\n/g, '<br/>');

            // Wrap contiguous <li> in <ul> (Basic heuristic)
            if (text.includes('<li>')) {
                // If there are list items, wrap the whole thing loosely or try to identify blocks
                // For simplicity in fallback: just wrap the whole segment if it looks like a list
                // or just leave as is, browsers handle <li> without <ul> but it's ugly.
                // Better: replace <br/><li> with <li> and wrap in <ul> if feasible.
                // Let's keep it simple: just list items are better than stars.
            }

            return text;
        };

        return messages.map(msg => 
            React.createElement('div', {
                key: msg.id,
                className: `flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`
            },
                msg.role !== 'system' && React.createElement('div', {
                    className: `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'assistant' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
                    }`
                },
                    React.createElement('i', { className: msg.role === 'assistant' ? 'fas fa-robot' : 'fas fa-user' })
                ),
                React.createElement('div', {
                    className: `max-w-[85%] p-3 rounded-2xl text-sm shadow-sm prose-sm ${
                        msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : msg.role === 'system'
                            ? 'bg-red-50 text-red-600 border border-red-100 w-full text-center'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-tl-none overflow-hidden shadow-sm'
                    }`,
                    dangerouslySetInnerHTML: { 
                        __html: (msg.role !== 'user') 
                            ? processContent(msg.content)
                            : msg.content.replace(/\n/g, '<br/>')
                    }
                })
            )
        );
    }, [messages]);

    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in',
        style: { zIndex: 10001 }
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200'
        },
            // Header
            React.createElement('div', { className: 'bg-gradient-to-r from-purple-700 to-indigo-800 p-4 flex items-center justify-between text-white shadow-md' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'bg-white/20 p-2 rounded-full' },
                        React.createElement('i', { className: 'fas fa-robot text-white text-lg' })
                    ),
                    React.createElement('div', {},
                        React.createElement('h3', { className: 'font-bold text-lg leading-tight' }, 'Expert Industriel'),
                        React.createElement('p', { className: 'text-xs text-purple-200 opacity-90' }, 'Assistant Technique & Maintenance')
                    )
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    // Bouton Imprimer
                    messages.length > 0 && React.createElement('button', {
                        onClick: handlePrint,
                        className: 'p-2 hover:bg-white/20 rounded-full transition-colors',
                        title: 'Imprimer les conseils'
                    },
                        React.createElement('i', { className: 'fas fa-print text-lg' })
                    ),
                    // Bouton Fermer
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'p-2 hover:bg-white/20 rounded-full transition-colors'
                    },
                        React.createElement('i', { className: 'fas fa-times text-lg' })
                    )
                )
            ),

            // Quick Actions (Only show if ticket exists)
            ticket && React.createElement('div', { className: 'bg-gray-50 p-3 border-b border-gray-200 flex gap-2 overflow-x-auto' },
                React.createElement('button', {
                    onClick: handleAnalysisClick,
                    disabled: isLoading,
                    className: 'flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-full text-sm font-bold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm whitespace-nowrap disabled:opacity-50'
                },
                    React.createElement('i', { className: 'fas fa-lightbulb text-purple-600' }),
                    'À propos de ce problème'
                )
            ),

            // Chat Area
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50' },
                messageList,
                isLoading && React.createElement('div', { className: 'flex gap-3' },
                    React.createElement('div', { className: 'w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-purple-600' })
                    ),
                    React.createElement('div', { className: 'bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-gray-500 text-sm shadow-sm' },
                        'Analyse en cours...'
                    )
                ),
                React.createElement('div', { ref: messagesEndRef })
            ),

            // Input Area
            React.createElement('div', { className: 'p-4 bg-white border-t border-gray-200' },
                React.createElement('form', {
                    onSubmit: (e) => {
                        e.preventDefault();
                        sendMessage(input);
                    },
                    className: 'flex gap-2'
                },
                    React.createElement('input', {
                        type: 'text',
                        value: input,
                        onChange: (e) => setInput(e.target.value),
                        placeholder: 'Posez une question technique...',
                        className: 'flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all',
                        disabled: isLoading
                    }),
                    React.createElement('button', {
                        type: 'submit',
                        disabled: !input.trim() || isLoading,
                        className: 'p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50'
                    },
                        React.createElement('i', { className: 'fas fa-paper-plane' })
                    )
                ),
                React.createElement('p', { className: 'text-center text-[10px] text-gray-400 mt-2' },
                    "L'IA peut faire des erreurs. Vérifiez toujours les procédures de sécurité."
                )
            )
        )
    );
};

window.AIChatModal = AIChatModal;
