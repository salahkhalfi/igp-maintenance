const AIChatModal = ({ isOpen, onClose, ticket }) => {
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [markedLoaded, setMarkedLoaded] = React.useState(!!window.marked);
    const [showHelp, setShowHelp] = React.useState(false);
    const messagesEndRef = React.useRef(null);
    
    // Vérifier si l'utilisateur est admin/supervisor
    const isAdmin = React.useMemo(() => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return false;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return ['admin', 'supervisor'].includes(payload.role);
        } catch { return false; }
    }, []);
    
    // Trucs & Astuces personnalisés pour IGP Glass
    const helpContent = {
        categories: [
            {
                title: '📊 Rapports & Bilans',
                icon: 'fa-chart-line',
                examples: [
                    { label: 'Bilan mensuel', prompt: 'Prépare-moi un rapport mensuel complet sur les opérations de maintenance avec les KPIs clés' },
                    { label: 'Analyse équipements', prompt: 'Fais une analyse des pannes récurrentes par type de machine ce mois-ci' },
                    { label: 'Performance équipe', prompt: 'Génère un rapport de performance de l\'équipe technique avec les temps de réponse' },
                    { label: 'Tendances', prompt: 'Analyse les tendances de maintenance sur les 3 derniers mois et propose des améliorations' }
                ]
            },
            {
                title: '✉️ Correspondance',
                icon: 'fa-envelope',
                examples: [
                    { label: 'Lettre fournisseur', prompt: 'Rédige une lettre de relance au fournisseur concernant la livraison en retard de pièces détachées' },
                    { label: 'Remerciement partenaire', prompt: 'Écris une lettre de remerciement à notre partenaire pour leur collaboration sur le projet d\'optimisation' },
                    { label: 'Communication interne', prompt: 'Rédige une note de service concernant les nouvelles procédures de sécurité' }
                ]
            },
            {
                title: '💰 Subventions',
                icon: 'fa-hand-holding-usd',
                examples: [
                    { label: 'PARI-CNRC', prompt: 'Aide-moi à préparer une demande PARI-CNRC pour notre projet d\'automatisation des fours' },
                    { label: 'RS&DE', prompt: 'Documente nos activités R&D de l\'année pour la demande de crédit RS&DE' },
                    { label: 'Investissement Québec', prompt: 'Rédige un argumentaire pour une demande de financement ESSOR pour moderniser notre équipement' }
                ]
            },
            {
                title: '📋 Documents Techniques',
                icon: 'fa-cogs',
                examples: [
                    { label: 'Procédure cadenassage', prompt: 'Crée une procédure de cadenassage complète selon la norme CSA Z460 pour le four de trempe' },
                    { label: 'Fiche de sécurité', prompt: 'Génère une fiche de sécurité pour les opérations de manutention de verre' },
                    { label: 'Manuel opérateur', prompt: 'Rédige un mode opératoire pour le démarrage et l\'arrêt sécuritaire de la ligne de découpe' },
                    { label: 'Checklist maintenance', prompt: 'Crée une checklist de maintenance préventive mensuelle pour les équipements critiques' }
                ]
            },
            {
                title: '✨ Communication & Marketing',
                icon: 'fa-bullhorn',
                examples: [
                    { label: 'Page À propos', prompt: 'Écris une page "À propos" professionnelle pour notre site web mettant en valeur notre expertise' },
                    { label: 'Communiqué', prompt: 'Rédige un communiqué de presse pour annoncer notre nouvelle certification ISO' },
                    { label: 'Pitch', prompt: 'Prépare un pitch de 2 minutes pour présenter nos capacités à un nouveau client potentiel' }
                ]
            }
        ],
        tips: [
            '💡 Soyez précis: "Rapport sur le four de trempe" > "Fais-moi un rapport"',
            '📅 Précisez la période: "ce mois-ci", "depuis janvier", "semaine dernière"',
            '🎯 Indiquez le destinataire: "pour la direction", "pour le client", "pour l\'équipe"',
            '📊 Demandez des chiffres: L\'IA a accès aux données réelles de vos tickets et machines',
            '🔄 Itérez: Vous pouvez demander des modifications après la première génération'
        ]
    };

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
        @page { margin: 15mm 12mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1f2937;
            margin: 0;
            padding: 0;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 10pt;
            padding-bottom: 8pt;
            border-bottom: 2pt solid #7c3aed;
            margin-bottom: 10pt;
        }
        .header-icon {
            width: 32pt;
            height: 32pt;
            background: #7c3aed;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14pt;
        }
        .header-text h1 {
            font-size: 14pt;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        .header-text p {
            font-size: 8pt;
            color: #6b7280;
            margin: 1pt 0 0 0;
        }
        .date {
            margin-left: auto;
            font-size: 8pt;
            color: #6b7280;
        }
        .ticket-info {
            background: #f3f4f6;
            border-left: 2pt solid #7c3aed;
            padding: 6pt 10pt;
            margin-bottom: 10pt;
            font-size: 9pt;
        }
        .content h1, .content h2, .content h3 {
            color: #1f2937;
            margin: 8pt 0 4pt 0;
        }
        .content h1 { font-size: 12pt; font-weight: 700; }
        .content h2 { font-size: 11pt; font-weight: 600; color: #4f46e5; }
        .content h3 { font-size: 10pt; font-weight: 600; }
        .content p {
            margin: 4pt 0;
            line-height: 1.4;
        }
        .content ul, .content ol {
            margin: 4pt 0 4pt 14pt;
            padding: 0;
        }
        .content li {
            margin: 2pt 0;
            line-height: 1.35;
        }
        .content strong { color: #4f46e5; }
        .content a { color: #7c3aed; }
        .footer {
            margin-top: 14pt;
            padding-top: 6pt;
            border-top: 1pt solid #e5e7eb;
            font-size: 7pt;
            color: #9ca3af;
            text-align: center;
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
        <div class="date">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
    ${ticketInfo}
    <div class="content">${assistantMessages.map(m => processContent(m.content)).join('<hr style="border:none;border-top:1pt solid #e5e7eb;margin:10pt 0;">')}</div>
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
                timestamp: new Date(),
                // Document detection
                isDocument: response.data.isDocument || false,
                documentType: response.data.documentType || null,
                documentTitle: response.data.documentTitle || null
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

        // Fonction d'impression d'un document spécifique
        const handlePrintDocument = (msg) => {
            const processedContent = processContent(msg.content);
            const docTitle = msg.documentTitle || 'Document';
            
            const printHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${docTitle}</title>
    <style>
        @page { margin: 20mm 15mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1f2937;
            margin: 0;
            padding: 0;
        }
        h1 { font-size: 18pt; margin-bottom: 10pt; color: #111827; border-bottom: 2px solid #7c3aed; padding-bottom: 5pt; }
        h2 { font-size: 14pt; margin-top: 15pt; margin-bottom: 8pt; color: #374151; }
        h3 { font-size: 12pt; margin-top: 12pt; margin-bottom: 6pt; color: #4b5563; }
        p { margin: 6pt 0; }
        ul, ol { margin: 6pt 0; padding-left: 20pt; }
        li { margin: 3pt 0; }
        table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 10pt; }
        th, td { border: 1px solid #d1d5db; padding: 6pt 8pt; text-align: left; }
        th { background-color: #f3f4f6; font-weight: 600; }
        strong { color: #111827; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15pt;
            padding-bottom: 10pt;
            border-bottom: 1px solid #e5e7eb;
        }
        .header-title { font-size: 10pt; color: #6b7280; }
        .header-date { font-size: 9pt; color: #9ca3af; }
        .footer { margin-top: 20pt; padding-top: 10pt; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; text-align: center; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="header">
        <span class="header-title">📄 ${docTitle}</span>
        <span class="header-date">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
    <div class="content">
        ${processedContent}
    </div>
    <div class="footer">
        Document généré par l'Assistant IA
    </div>
</body>
</html>`;

            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(printHtml);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 300);
            }
        };

        // Fonction de copie du document
        const handleCopyDocument = (msg) => {
            navigator.clipboard.writeText(msg.content).then(() => {
                window.showToast && window.showToast('Document copié !', 'success');
            }).catch(() => {
                window.showToast && window.showToast('Erreur lors de la copie', 'error');
            });
        };

        return messages.map(msg => 
            React.createElement('div', {
                key: msg.id,
                className: `flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`
            },
                msg.role !== 'system' && React.createElement('div', {
                    className: `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'assistant' 
                            ? (msg.isDocument ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700')
                            : 'bg-gray-200 text-gray-600'
                    }`
                },
                    React.createElement('i', { 
                        className: msg.role === 'assistant' 
                            ? (msg.isDocument ? 'fas fa-file-alt' : 'fas fa-robot') 
                            : 'fas fa-user' 
                    })
                ),
                React.createElement('div', {
                    className: `max-w-[85%] rounded-2xl text-sm shadow-sm ${
                        msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-tr-none p-3' 
                            : msg.role === 'system'
                            ? 'bg-red-50 text-red-600 border border-red-100 w-full text-center p-3'
                            : msg.isDocument
                            ? 'bg-white border-2 border-indigo-200 text-gray-900 rounded-tl-none overflow-hidden'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-tl-none overflow-hidden shadow-sm p-3'
                    }`
                },
                    // Header pour les documents
                    msg.isDocument && React.createElement('div', {
                        className: 'bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between'
                    },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-file-alt text-indigo-600' }),
                            React.createElement('span', { className: 'text-xs font-semibold text-indigo-700 uppercase tracking-wide' }, 
                                msg.documentTitle || 'Document'
                            )
                        ),
                        React.createElement('div', { className: 'flex items-center gap-1' },
                            React.createElement('button', {
                                onClick: () => handleCopyDocument(msg),
                                className: 'p-1.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors',
                                title: 'Copier le document'
                            },
                                React.createElement('i', { className: 'fas fa-copy text-sm' })
                            ),
                            React.createElement('button', {
                                onClick: () => handlePrintDocument(msg),
                                className: 'p-1.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors',
                                title: 'Imprimer le document'
                            },
                                React.createElement('i', { className: 'fas fa-print text-sm' })
                            )
                        )
                    ),
                    // Contenu
                    React.createElement('div', {
                        className: `prose-sm ${msg.isDocument ? 'p-3' : ''}`,
                        dangerouslySetInnerHTML: { 
                            __html: (msg.role !== 'user') 
                                ? processContent(msg.content)
                                : msg.content.replace(/\n/g, '<br/>')
                        }
                    })
                )
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
                    // Bouton Aide (admin/supervisor seulement)
                    isAdmin && React.createElement('button', {
                        onClick: () => setShowHelp(!showHelp),
                        className: `p-2 rounded-full transition-colors ${showHelp ? 'bg-white/30' : 'hover:bg-white/20'}`,
                        title: 'Aide & Exemples'
                    },
                        React.createElement('i', { className: 'fas fa-question-circle text-lg' })
                    ),
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

            // Panneau d'aide (admin/supervisor seulement)
            showHelp && isAdmin && React.createElement('div', { 
                className: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-indigo-100 max-h-80 overflow-y-auto'
            },
                // Tips en haut
                React.createElement('div', { className: 'px-4 py-3 border-b border-indigo-100/50' },
                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                        React.createElement('i', { className: 'fas fa-magic text-indigo-600' }),
                        React.createElement('span', { className: 'text-sm font-semibold text-indigo-800' }, 'Conseils pour de meilleurs résultats')
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 gap-1' },
                        helpContent.tips.map((tip, i) => 
                            React.createElement('p', { key: i, className: 'text-xs text-indigo-700/80' }, tip)
                        )
                    )
                ),
                // Catégories avec exemples
                React.createElement('div', { className: 'p-4 space-y-3' },
                    helpContent.categories.map((cat, catIndex) => 
                        React.createElement('div', { key: catIndex, className: 'bg-white rounded-lg shadow-sm border border-indigo-100/50 overflow-hidden' },
                            React.createElement('div', { className: 'px-3 py-2 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center gap-2' },
                                React.createElement('i', { className: `fas ${cat.icon} text-indigo-600 text-sm` }),
                                React.createElement('span', { className: 'text-sm font-medium text-indigo-800' }, cat.title)
                            ),
                            React.createElement('div', { className: 'p-2 flex flex-wrap gap-1.5' },
                                cat.examples.map((ex, exIndex) => 
                                    React.createElement('button', {
                                        key: exIndex,
                                        onClick: () => {
                                            setInput(ex.prompt);
                                            setShowHelp(false);
                                        },
                                        className: 'px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full transition-colors border border-indigo-100 hover:border-indigo-200'
                                    }, ex.label)
                                )
                            )
                        )
                    )
                ),
                // Bouton fermer le panneau
                React.createElement('div', { className: 'px-4 py-2 bg-indigo-50/50 border-t border-indigo-100/50 flex justify-center' },
                    React.createElement('button', {
                        onClick: () => setShowHelp(false),
                        className: 'text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1'
                    },
                        React.createElement('i', { className: 'fas fa-chevron-up' }),
                        'Fermer l\'aide'
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
