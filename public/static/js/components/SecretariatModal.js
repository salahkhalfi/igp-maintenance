/**
 * SecretariatModal - Secrétariat de Direction
 * Design Premium - Génération de documents professionnels
 * Accès réservé aux admin/supervisor
 */
const SecretariatModal = ({ isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = React.useState('correspondance');
    const [instructions, setInstructions] = React.useState('');
    const [generatedDoc, setGeneratedDoc] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const categories = [
        { id: 'correspondance', label: 'Correspondance', icon: 'fa-envelope', color: 'blue', documents: [
            { icon: 'fa-file-alt', label: 'Lettre officielle', value: 'Rédiger une lettre officielle à [destinataire] concernant : ' },
            { icon: 'fa-handshake', label: 'Lettre de partenariat', value: 'Proposition de partenariat commercial avec : ' },
            { icon: 'fa-reply', label: 'Réponse fournisseur', value: 'Réponse à une demande de fournisseur concernant : ' },
            { icon: 'fa-heart', label: 'Lettre de remerciement', value: 'Lettre de remerciement adressée à : ' }
        ]},
        { id: 'subventions', label: 'Subventions', icon: 'fa-dollar-sign', color: 'emerald', documents: [
            { icon: 'fa-flag', label: 'PARI-CNRC', value: 'Demande de subvention au Programme d\'aide à la recherche industrielle (PARI-CNRC) pour le projet : ' },
            { icon: 'fa-landmark', label: 'Investissement Québec', value: 'Demande de subvention à Investissement Québec pour le projet de : ' },
            { icon: 'fa-flask', label: 'Crédit RS&DE', value: 'Préparation du dossier de crédit d\'impôt RS&DE pour les activités de R&D : ' },
            { icon: 'fa-leaf', label: 'Fonds écologique', value: 'Demande au Fonds Écoleader pour le projet environnemental : ' },
            { icon: 'fa-graduation-cap', label: 'Formation Emploi-QC', value: 'Demande de subvention à Emploi-Québec pour la formation sur : ' }
        ]},
        { id: 'administratif', label: 'Administratif', icon: 'fa-folder', color: 'amber', documents: [
            { icon: 'fa-gavel', label: 'Procès-verbal', value: 'Rédiger le procès-verbal de la réunion du : ' },
            { icon: 'fa-clipboard-list', label: 'Politique interne', value: 'Rédiger une politique interne concernant : ' },
            { icon: 'fa-file-contract', label: 'Contrat type', value: 'Préparer un contrat type pour : ' },
            { icon: 'fa-balance-scale', label: 'Mise en demeure', value: 'Rédiger une mise en demeure adressée à [nom] pour : ' }
        ]},
        { id: 'rh', label: 'Ressources Humaines', icon: 'fa-users', color: 'purple', documents: [
            { icon: 'fa-user-plus', label: 'Offre d\'emploi', value: 'Rédiger une offre d\'emploi pour le poste de : ' },
            { icon: 'fa-file-signature', label: 'Lettre d\'embauche', value: 'Lettre d\'offre d\'embauche pour [nom] au poste de : ' },
            { icon: 'fa-chart-line', label: 'Évaluation employé', value: 'Formulaire d\'évaluation de performance pour : ' },
            { icon: 'fa-door-open', label: 'Fin d\'emploi', value: 'Lettre de fin d\'emploi pour : ' }
        ]},
        { id: 'technique', label: 'Technique', icon: 'fa-cogs', color: 'slate', documents: [
            { icon: 'fa-book', label: 'Manuel procédure', value: 'Rédiger un manuel de procédure pour : ' },
            { icon: 'fa-shield-alt', label: 'Fiche sécurité', value: 'Fiche de données de sécurité (FDS) pour : ' },
            { icon: 'fa-ruler-combined', label: 'Spécification technique', value: 'Spécification technique détaillée pour : ' },
            { icon: 'fa-tasks', label: 'Checklist', value: 'Liste de vérification pour : ' }
        ]},
        { id: 'financier', label: 'Financier', icon: 'fa-chart-pie', color: 'rose', documents: [
            { icon: 'fa-hand-holding-usd', label: 'Demande financement', value: 'Demande de financement bancaire pour : ' },
            { icon: 'fa-briefcase', label: 'Plan d\'affaires', value: 'Section du plan d\'affaires concernant : ' },
            { icon: 'fa-receipt', label: 'Justificatif dépenses', value: 'Justificatif de dépenses pour : ' },
            { icon: 'fa-file-invoice-dollar', label: 'Rapport financier', value: 'Rapport financier périodique incluant : ' }
        ]},
        { id: 'rapports', label: 'Rapports', icon: 'fa-chart-bar', color: 'indigo', documents: [
            { icon: 'fa-calendar-alt', label: 'Rapport mensuel', value: 'Générer un rapport mensuel complet sur les opérations de maintenance avec les KPIs clés' },
            { icon: 'fa-tachometer-alt', label: 'Bilan performance', value: 'Analyse de performance de l\'équipe technique avec temps de réponse et résolution' },
            { icon: 'fa-industry', label: 'État machines', value: 'Rapport sur l\'état et la disponibilité du parc machines' },
            { icon: 'fa-exclamation-triangle', label: 'Incidents critiques', value: 'Rapport sur les incidents critiques et pannes majeures' }
        ]},
        { id: 'creatif', label: 'Créatif', icon: 'fa-paint-brush', color: 'pink', documents: [
            { icon: 'fa-globe', label: 'Texte site web', value: 'Rédiger un texte promotionnel pour notre site web présentant : ' },
            { icon: 'fa-newspaper', label: 'Communiqué presse', value: 'Communiqué de presse annonçant : ' },
            { icon: 'fa-microphone', label: 'Discours', value: 'Rédiger un discours pour [occasion] sur le thème : ' },
            { icon: 'fa-bullhorn', label: 'Pitch commercial', value: 'Rédiger un pitch commercial pour présenter nos services à : ' }
        ]}
    ];

    const colorMap = {
        blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-500' },
        emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500' },
        amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-500' },
        purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-500' },
        slate: { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-500' },
        rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', ring: 'ring-rose-500' },
        indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-500' },
        pink: { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', ring: 'ring-pink-500' }
    };

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
                window.showToast && window.showToast('Document généré', 'success');
            } else {
                throw new Error(response.data.error || 'Erreur');
            }
        } catch (error) {
            window.showToast && window.showToast(error.response?.data?.error || 'Erreur lors de la génération', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const markdownToHtml = (md) => {
        if (!md) return '';
        return md
            .replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
                const bodyRows = rows.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
            })
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>').replace(/$/, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[123]>)/g, '$1')
            .replace(/(<\/h[123]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1')
            .replace(/(<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<table>)/g, '$1')
            .replace(/(<\/table>)<\/p>/g, '$1');
    };

    const printDocument = async () => {
        if (!generatedDoc) return;
        let companyShortName = 'IGP', companySubtitle = '', logoUrl = '/api/settings/logo';
        try {
            const res = await axios.get('/api/settings/config/public');
            if (res.data) {
                companyShortName = res.data.company_short_name || 'IGP';
                companySubtitle = res.data.company_subtitle || '';
                if (res.data.company_logo_url) logoUrl = res.data.company_logo_url;
            }
        } catch (e) {}
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const html = markdownToHtml(generatedDoc.document);
        const title = generatedDoc.title || 'Document';
        const printHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.7;color:#333;padding:20mm 18mm 25mm 18mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25pt;padding-bottom:15pt;border-bottom:1pt solid #e0e0e0}
.header-left{display:flex;align-items:center}.logo{height:45pt;margin-right:15pt}
.brand{border-left:2pt solid #4f46e5;padding-left:15pt}.brand-name{font-size:16pt;font-weight:600;color:#1a1a1a}
.brand-sub{font-size:9pt;color:#555;margin-top:4pt;max-width:250pt}.header-right{text-align:right;font-size:10pt;color:#555}
.title-block{text-align:center;padding:20pt 0;margin-bottom:20pt;border-bottom:2pt solid #4f46e5}
.title-block h1{font-size:18pt;font-weight:700;color:#1a1a1a}
.content{font-size:11pt;line-height:1.6}
.content h1{font-size:14pt;font-weight:700;color:#1a1a1a;margin:18pt 0 10pt;padding-bottom:5pt;border-bottom:1.5pt solid #1a1a1a}
.content h2{font-size:12pt;font-weight:600;color:#333;margin:15pt 0 8pt;padding-left:8pt;border-left:2pt solid #4f46e5}
.content h3{font-size:11pt;font-weight:600;color:#444;margin:12pt 0 6pt}
.content p{margin-bottom:10pt;text-align:justify}
.content ul,.content ol{margin:10pt 0 10pt 20pt}.content li{margin-bottom:5pt}.content strong{color:#1a1a1a}
.content table{width:100%;border-collapse:collapse;margin:15pt 0;font-size:10pt}
.content th{background:#f0f2f5;border:1pt solid #ddd;padding:8pt;text-align:left;font-weight:600}
.content td{border:1pt solid #ddd;padding:8pt}.content tr:nth-child(even){background:#fafafa}
.footer{margin-top:40pt;padding-top:15pt;border-top:1pt solid #ddd;font-size:9pt;color:#666;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:20mm 18mm 25mm 18mm!important}.header,.title-block{page-break-inside:avoid}}
</style></head><body>
<div class="header"><div class="header-left"><img src="${logoUrl}" class="logo" onerror="this.style.display='none'"><div class="brand"><div class="brand-name">${companyShortName}</div><div class="brand-sub">${companySubtitle}</div></div></div><div class="header-right"><div>${today}</div></div></div>
<div class="title-block"><h1>${title}</h1></div>
<div class="content">${html}</div>
<div class="footer">Document généré par ${companyShortName} - Secrétariat de Direction</div>
</body></html>`;
        const w = window.open('', '_blank', 'width=800,height=600');
        if (w) { w.document.write(printHtml); w.document.close(); setTimeout(() => w.print(), 300); }
    };

    const copyDocument = () => {
        if (!generatedDoc?.document) return;
        navigator.clipboard.writeText(generatedDoc.document).then(() => {
            window.showToast && window.showToast('Document copié', 'success');
        });
    };

    if (!isOpen) return null;

    const currentCat = categories.find(c => c.id === selectedCategory);
    const colors = colorMap[currentCat?.color || 'indigo'];

    return React.createElement('div', {
        className: 'fixed inset-0 z-[9999] flex items-center justify-center',
        style: { background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden m-4',
            onClick: e => e.stopPropagation()
        },
            // Header premium
            React.createElement('div', { 
                className: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between'
            },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    React.createElement('div', { 
                        className: 'w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center'
                    },
                        React.createElement('i', { className: 'fas fa-file-signature text-2xl text-white' })
                    ),
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-xl font-bold text-white tracking-tight' }, 'Secrétariat de Direction'),
                        React.createElement('p', { className: 'text-sm text-slate-400' }, 'Génération de documents professionnels')
                    )
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all'
                }, React.createElement('i', { className: 'fas fa-times' }))
            ),

            // Corps principal avec sidebar
            React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                // Sidebar catégories
                React.createElement('div', { className: 'w-56 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto flex-shrink-0' },
                    React.createElement('div', { className: 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2' }, 'Catégories'),
                    categories.map(cat => {
                        const catColors = colorMap[cat.color];
                        const isActive = selectedCategory === cat.id;
                        return React.createElement('button', {
                            key: cat.id,
                            onClick: () => { setSelectedCategory(cat.id); setInstructions(''); setGeneratedDoc(null); },
                            className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-left ${
                                isActive 
                                    ? `${catColors.light} ${catColors.text} ring-2 ${catColors.ring} ring-opacity-50` 
                                    : 'hover:bg-slate-100 text-slate-600'
                            }`
                        },
                            React.createElement('div', { 
                                className: `w-8 h-8 rounded-lg ${isActive ? catColors.bg : 'bg-slate-200'} flex items-center justify-center transition-all`
                            },
                                React.createElement('i', { className: `fas ${cat.icon} text-sm ${isActive ? 'text-white' : 'text-slate-500'}` })
                            ),
                            React.createElement('span', { className: `text-sm font-medium ${isActive ? catColors.text : ''}` }, cat.label)
                        );
                    })
                ),

                // Zone principale
                React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
                    // Modèles
                    React.createElement('div', { className: 'p-6 border-b border-slate-200 bg-white' },
                        React.createElement('div', { className: 'flex items-center gap-2 mb-4' },
                            React.createElement('i', { className: `fas ${currentCat?.icon} ${colors.text}` }),
                            React.createElement('h3', { className: 'text-lg font-semibold text-slate-800' }, currentCat?.label || 'Documents'),
                            React.createElement('span', { className: 'text-sm text-slate-400' }, `${currentCat?.documents?.length || 0} modèles`)
                        ),
                        React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-2' },
                            (currentCat?.documents || []).map((doc, i) => {
                                const isSelected = instructions === doc.value;
                                return React.createElement('button', {
                                    key: i,
                                    onClick: () => setInstructions(doc.value),
                                    className: `group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                                        isSelected 
                                            ? `${colors.light} ${colors.text} ring-2 ${colors.ring}` 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                    }`
                                },
                                    React.createElement('i', { 
                                        className: `fas ${doc.icon} text-sm ${isSelected ? colors.text : 'text-slate-400 group-hover:text-slate-600'}` 
                                    }),
                                    React.createElement('span', { className: 'text-sm font-medium truncate' }, doc.label)
                                );
                            })
                        )
                    ),

                    // Zone instruction + résultat
                    React.createElement('div', { className: 'flex-1 p-6 overflow-y-auto bg-slate-50' },
                        // Textarea
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-pen text-slate-400' }),
                                'Instructions détaillées'
                            ),
                            React.createElement('textarea', {
                                value: instructions,
                                onChange: e => setInstructions(e.target.value),
                                placeholder: 'Décrivez précisément le document : destinataire, objet, contexte, montants, dates...',
                                rows: 4,
                                className: 'w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none resize-none text-slate-700 placeholder-slate-400 bg-white transition-all'
                            })
                        ),

                        // Résultat
                        generatedDoc && React.createElement('div', { className: 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden' },
                            React.createElement('div', { className: 'bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 flex items-center justify-between' },
                                React.createElement('div', { className: 'flex items-center gap-3 text-white' },
                                    React.createElement('i', { className: 'fas fa-check-circle text-lg' }),
                                    React.createElement('span', { className: 'font-semibold' }, generatedDoc.title || 'Document généré')
                                ),
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('button', {
                                        onClick: copyDocument,
                                        className: 'px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all'
                                    }, React.createElement('i', { className: 'fas fa-copy mr-1.5' }), 'Copier'),
                                    React.createElement('button', {
                                        onClick: printDocument,
                                        className: 'px-3 py-1.5 bg-white text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-all'
                                    }, React.createElement('i', { className: 'fas fa-print mr-1.5' }), 'Imprimer')
                                )
                            ),
                            React.createElement('div', { 
                                className: 'p-5 max-h-72 overflow-y-auto prose prose-sm prose-slate',
                                dangerouslySetInnerHTML: { __html: markdownToHtml(generatedDoc.document) }
                            })
                        )
                    ),

                    // Footer
                    React.createElement('div', { className: 'px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between' },
                        React.createElement('div', { className: 'text-xs text-slate-400' },
                            React.createElement('i', { className: 'fas fa-brain mr-1.5' }),
                            'IA avec connaissances : lois CA/QC, subventions, données opérationnelles'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all'
                            }, 'Fermer'),
                            React.createElement('button', {
                                onClick: generateDocument,
                                disabled: isGenerating || !instructions.trim(),
                                className: `px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all flex items-center gap-2 ${
                                    isGenerating || !instructions.trim() 
                                        ? 'bg-slate-300 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/25'
                                }`
                            },
                                isGenerating 
                                    ? React.createElement('i', { className: 'fas fa-circle-notch fa-spin' })
                                    : React.createElement('i', { className: 'fas fa-magic' }),
                                isGenerating ? 'Génération...' : 'Générer'
                            )
                        )
                    )
                )
            )
        )
    );
};

window.SecretariatModal = SecretariatModal;
