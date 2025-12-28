/**
 * SecretariatModal - Secrétariat de Direction
 * Génération de documents professionnels : correspondance, subventions, documents techniques, etc.
 * Accès réservé aux admin/supervisor
 */
const SecretariatModal = ({ isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = React.useState('correspondance');
    const [instructions, setInstructions] = React.useState('');
    const [generatedDoc, setGeneratedDoc] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [showHelp, setShowHelp] = React.useState(false);

    // Catégories de documents
    const categories = [
        { id: 'correspondance', label: 'Correspondance', icon: '✉️', documents: [
            { icon: '📧', label: 'Lettre officielle', value: 'Rédiger une lettre officielle à [destinataire] concernant : ' },
            { icon: '🤝', label: 'Lettre de partenariat', value: 'Proposition de partenariat commercial avec : ' },
            { icon: '📬', label: 'Réponse fournisseur', value: 'Réponse à une demande de fournisseur concernant : ' },
            { icon: '🙏', label: 'Lettre de remerciement', value: 'Lettre de remerciement adressée à : ' }
        ]},
        { id: 'subventions', label: 'Subventions', icon: '💰', documents: [
            { icon: '🇨🇦', label: 'Subvention fédérale (PARI-CNRC)', value: 'Demande de subvention au Programme d\'aide à la recherche industrielle (PARI-CNRC) pour le projet : ' },
            { icon: '⚜️', label: 'Subvention Québec (Investissement QC)', value: 'Demande de subvention à Investissement Québec pour le projet de : ' },
            { icon: '🔬', label: 'Crédit R&D (RS&DE)', value: 'Préparation du dossier de crédit d\'impôt RS&DE pour les activités de recherche et développement : ' },
            { icon: '🌱', label: 'Programme écologique', value: 'Demande au Fonds Écoleader / Fonds vert pour le projet environnemental : ' },
            { icon: '👷', label: 'Subvention formation', value: 'Demande de subvention à Emploi-Québec pour la formation des employés sur : ' }
        ]},
        { id: 'administratif', label: 'Administratif', icon: '📁', documents: [
            { icon: '📜', label: 'Procès-verbal', value: 'Rédiger le procès-verbal de la réunion du conseil d\'administration du : ' },
            { icon: '📋', label: 'Politique interne', value: 'Rédiger une politique interne concernant : ' },
            { icon: '📑', label: 'Contrat type', value: 'Préparer un contrat type pour : ' },
            { icon: '⚖️', label: 'Mise en demeure', value: 'Rédiger une mise en demeure adressée à [nom] pour : ' }
        ]},
        { id: 'rh', label: 'Ressources Humaines', icon: '👥', documents: [
            { icon: '📄', label: 'Offre d\'emploi', value: 'Rédiger une offre d\'emploi pour le poste de : ' },
            { icon: '✅', label: 'Lettre d\'embauche', value: 'Lettre d\'offre d\'embauche pour [nom] au poste de : ' },
            { icon: '📝', label: 'Évaluation employé', value: 'Formulaire d\'évaluation de performance pour : ' },
            { icon: '🚪', label: 'Lettre de fin d\'emploi', value: 'Lettre de fin d\'emploi / cessation pour : ' }
        ]},
        { id: 'technique', label: 'Documents Techniques', icon: '🔧', documents: [
            { icon: '📖', label: 'Manuel de procédure', value: 'Rédiger un manuel de procédure pour : ' },
            { icon: '🔒', label: 'Fiche de sécurité', value: 'Fiche de données de sécurité (FDS) pour le produit : ' },
            { icon: '📐', label: 'Spécification technique', value: 'Spécification technique détaillée pour : ' },
            { icon: '✔️', label: 'Liste de vérification', value: 'Checklist / liste de vérification pour : ' }
        ]},
        { id: 'financier', label: 'Documents Financiers', icon: '💼', documents: [
            { icon: '💵', label: 'Demande de financement', value: 'Demande de financement bancaire pour le projet : ' },
            { icon: '📊', label: 'Plan d\'affaires', value: 'Section du plan d\'affaires concernant : ' },
            { icon: '🧾', label: 'Justificatif de dépenses', value: 'Justificatif de dépenses pour le projet/subvention : ' },
            { icon: '📈', label: 'Rapport financier', value: 'Rapport financier périodique incluant : ' }
        ]},
        { id: 'rapports', label: 'Rapports', icon: '📊', documents: [
            { icon: '📅', label: 'Rapport mensuel', value: 'Générer un rapport mensuel complet sur les opérations de maintenance incluant les KPIs clés' },
            { icon: '📈', label: 'Bilan performance', value: 'Analyse de performance de l\'équipe technique avec temps de réponse et résolution' },
            { icon: '🏭', label: 'État des machines', value: 'Rapport sur l\'état et la disponibilité du parc machines' },
            { icon: '⚠️', label: 'Incidents critiques', value: 'Rapport sur les incidents critiques et pannes majeures' }
        ]},
        { id: 'creatif', label: 'Créatif', icon: '🎨', documents: [
            { icon: '🌐', label: 'Texte site web', value: 'Rédiger un texte promotionnel pour notre site web présentant : ' },
            { icon: '📰', label: 'Communiqué de presse', value: 'Communiqué de presse annonçant : ' },
            { icon: '🎤', label: 'Discours / Allocution', value: 'Rédiger un discours pour [occasion] sur le thème : ' },
            { icon: '📢', label: 'Brochure / Dépliant', value: 'Créer le contenu d\'une brochure de présentation mettant en avant : ' },
            { icon: '💡', label: 'Pitch commercial', value: 'Rédiger un pitch commercial pour présenter nos services à : ' },
            { icon: '📝', label: 'Autre (libre)', value: '' }
        ]}
    ];

    // Trucs & Astuces
    const helpTips = [
        '💡 Soyez précis : "Lettre au fournisseur ABC pour retard livraison" > "Lettre fournisseur"',
        '📅 Incluez les dates : "réunion du 15 janvier", "projet démarré en mars 2024"',
        '💰 Montants exacts : "subvention de 50 000$", "investissement de 200 000$"',
        '👤 Nommez les destinataires : "M. Jean Tremblay, Directeur"',
        '🎯 Précisez l\'objectif : "pour obtenir un financement", "pour relancer la commande"',
        '📊 L\'IA utilise vos données réelles : tickets, machines, équipes pour enrichir les documents'
    ];

    // Générer le document
    const generateDocument = async () => {
        if (!instructions.trim()) {
            window.showToast && window.showToast('Veuillez décrire le document souhaité', 'warning');
            return;
        }

        setIsGenerating(true);
        setGeneratedDoc(null);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.post('/api/ai/secretary', {
                documentType: selectedCategory,
                instructions: instructions.trim()
            }, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (response.data.success !== false) {
                setGeneratedDoc(response.data);
                window.showToast && window.showToast('Document généré avec succès', 'success');
            } else {
                throw new Error(response.data.error || 'Erreur de génération');
            }
        } catch (error) {
            console.error('Secretary error:', error);
            window.showToast && window.showToast(error.response?.data?.error || 'Erreur lors de la génération', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Convertir markdown en HTML basique
    const markdownToHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/^### (.*)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
            .replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4">$1</li>')
            .replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>')
            .replace(/\n\n/g, '</p><p class="mb-3">')
            .replace(/\n/g, '<br/>');
    };

    // Imprimer le document
    const printDocument = () => {
        if (!generatedDoc) return;

        const printHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${generatedDoc.title || 'Document'}</title>
    <style>
        @page { margin: 20mm 15mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1f2937; }
        h1 { font-size: 18pt; border-bottom: 2px solid #4f46e5; padding-bottom: 8pt; margin-bottom: 15pt; }
        h2 { font-size: 14pt; color: #374151; margin-top: 20pt; }
        h3 { font-size: 12pt; color: #4b5563; margin-top: 15pt; }
        p { margin: 8pt 0; }
        ul, ol { margin: 8pt 0; padding-left: 20pt; }
        li { margin: 4pt 0; }
        strong { color: #1f2937; }
        .header { text-align: right; font-size: 9pt; color: #6b7280; margin-bottom: 20pt; }
        .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="header">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="content">${markdownToHtml(generatedDoc.document)}</div>
    <div class="footer">Document généré par le Secrétariat</div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 300);
        }
    };

    // Copier le document
    const copyDocument = () => {
        if (!generatedDoc?.document) return;
        navigator.clipboard.writeText(generatedDoc.document).then(() => {
            window.showToast && window.showToast('Document copié !', 'success');
        }).catch(() => {
            window.showToast && window.showToast('Erreur lors de la copie', 'error');
        });
    };

    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        onClick: onClose
    },
        // Overlay
        React.createElement('div', { className: 'absolute inset-0 bg-black/50 backdrop-blur-sm' }),

        // Modal
        React.createElement('div', {
            className: 'relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden',
            onClick: (e) => e.stopPropagation()
        },
            // Header
            React.createElement('div', { className: 'bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center' },
                        React.createElement('i', { className: 'fas fa-file-signature text-xl' })
                    ),
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-lg font-bold' }, 'Secrétariat'),
                        React.createElement('p', { className: 'text-xs text-indigo-200' }, 'Génération de documents professionnels')
                    )
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    // Bouton aide
                    React.createElement('button', {
                        onClick: () => setShowHelp(!showHelp),
                        className: `p-2 rounded-lg transition-colors ${showHelp ? 'bg-white/30' : 'hover:bg-white/20'}`,
                        title: 'Trucs & Astuces'
                    }, React.createElement('i', { className: 'fas fa-question-circle' })),
                    // Bouton fermer
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'p-2 hover:bg-white/20 rounded-lg transition-colors'
                    }, React.createElement('i', { className: 'fas fa-times' }))
                )
            ),

            // Panneau d'aide
            showHelp && React.createElement('div', { className: 'bg-amber-50 border-b border-amber-200 px-6 py-3' },
                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                    React.createElement('i', { className: 'fas fa-lightbulb text-amber-600' }),
                    React.createElement('span', { className: 'text-sm font-semibold text-amber-800' }, 'Trucs & Astuces')
                ),
                React.createElement('ul', { className: 'grid grid-cols-1 md:grid-cols-2 gap-1' },
                    helpTips.map((tip, i) => React.createElement('li', { key: i, className: 'text-xs text-amber-700' }, tip))
                )
            ),

            // Corps
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
                // Catégories
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Type de document'),
                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                        categories.map(cat => React.createElement('button', {
                            key: cat.id,
                            onClick: () => { setSelectedCategory(cat.id); setInstructions(''); setGeneratedDoc(null); },
                            className: `flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                                selectedCategory === cat.id 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`
                        }, 
                            React.createElement('span', {}, cat.icon),
                            React.createElement('span', {}, cat.label)
                        ))
                    )
                ),

                // Documents de la catégorie
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Modèles'),
                    React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 gap-2' },
                        (categories.find(c => c.id === selectedCategory)?.documents || []).map((doc, i) => 
                            React.createElement('button', {
                                key: i,
                                onClick: () => setInstructions(doc.value),
                                className: `flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-all ${
                                    instructions === doc.value 
                                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                                }`
                            }, 
                                React.createElement('span', { className: 'text-base' }, doc.icon),
                                React.createElement('span', { className: 'truncate flex-1' }, doc.label)
                            )
                        )
                    )
                ),

                // Zone de texte
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Instructions détaillées'),
                    React.createElement('textarea', {
                        value: instructions,
                        onChange: (e) => setInstructions(e.target.value),
                        placeholder: 'Décrivez le document souhaité avec tous les détails : destinataire, objet, contexte, montants, dates...',
                        rows: 4,
                        className: 'w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none'
                    })
                ),

                // Info connaissances
                React.createElement('div', { className: 'mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100' },
                    React.createElement('p', { className: 'text-xs text-indigo-700' },
                        React.createElement('span', { className: 'font-semibold' }, '💡 Connaissances intégrées : '),
                        'Lois canadiennes et québécoises, programmes de subventions (PARI-CNRC, IQ, RS&DE), normes industrielles, données de vos tickets et machines.'
                    )
                ),

                // Document généré
                generatedDoc && React.createElement('div', { className: 'mt-6 bg-green-50 rounded-xl border border-green-200 overflow-hidden' },
                    React.createElement('div', { className: 'bg-green-100 px-4 py-3 flex items-center justify-between' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-check-circle text-green-600' }),
                            React.createElement('span', { className: 'font-medium text-green-800' }, generatedDoc.title || 'Document généré')
                        ),
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('button', {
                                onClick: copyDocument,
                                className: 'px-3 py-1.5 text-sm bg-white text-green-700 rounded-lg hover:bg-green-50 border border-green-300 transition-colors',
                                title: 'Copier'
                            }, React.createElement('i', { className: 'fas fa-copy' })),
                            React.createElement('button', {
                                onClick: printDocument,
                                className: 'px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors',
                                title: 'Imprimer'
                            }, React.createElement('i', { className: 'fas fa-print mr-1' }), 'Imprimer')
                        )
                    ),
                    React.createElement('div', { 
                        className: 'p-4 max-h-64 overflow-y-auto text-sm text-gray-700 bg-white prose prose-sm',
                        dangerouslySetInnerHTML: { __html: markdownToHtml(generatedDoc.document) }
                    })
                )
            ),

            // Footer
            React.createElement('div', { className: 'px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                }, 'Fermer'),
                React.createElement('button', {
                    onClick: generateDocument,
                    disabled: isGenerating || !instructions.trim(),
                    className: `px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                        isGenerating || !instructions.trim() 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700'
                    }`
                },
                    isGenerating 
                        ? React.createElement('i', { className: 'fas fa-spinner fa-spin' })
                        : React.createElement('i', { className: 'fas fa-magic' }),
                    isGenerating ? 'Génération...' : 'Générer le document'
                )
            )
        )
    );
};

window.SecretariatModal = SecretariatModal;
