/**
 * SecretariatModal - Secrétariat de Direction
 * Design Premium - Génération de documents professionnels
 * v2.3 - Mode Universel + Responsive fix
 */
const SecretariatModal = ({ isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = React.useState('correspondance');
    const [selectedDocType, setSelectedDocType] = React.useState(null);
    const [instructions, setInstructions] = React.useState('');
    const [generatedDoc, setGeneratedDoc] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('form');
    const [mobileView, setMobileView] = React.useState('categories'); // 'categories' | 'form'
    const [universalMode, setUniversalMode] = React.useState(false); // Mode assistant universel

    // Textes d'aide dynamiques pour chaque type de document
    const helpTexts = {
        // Correspondance
        'Lettre officielle': {
            tips: ['📝 Nom et titre du destinataire', '🏢 Entreprise ou organisme', '📋 Objet et contexte', '📅 Dates importantes'],
            example: 'Ex: Lettre à M. Tremblay, Directeur chez Hydro-Québec, concernant notre proposition de verre trempé. Budget : 150 000$.'
        },
        'Lettre de partenariat': {
            tips: ['🤝 Entreprise partenaire', '💡 Bénéfices mutuels', '📊 Volumes et marchés', '🎯 Objectifs communs'],
            example: 'Ex: Partenariat avec Vitrerie Nationale pour distribution exclusive à Montréal. Volume : 500 unités/an.'
        },
        'Réponse fournisseur': {
            tips: ['📦 Nom du fournisseur', '📄 Numéro de soumission', '✅ Acceptation ou refus', '💰 Conditions négociées'],
            example: 'Ex: Réponse à soumission #2024-089 de Verre & Miroirs Inc. Acceptation avec -5% sur volumes > 1000m².'
        },
        'Lettre de remerciement': {
            tips: ['🙏 Personne ou organisation', '⭐ Action à remercier', '📅 Date de l\'événement', '🔮 Collaboration future'],
            example: 'Ex: Remerciement à Boisvert Construction pour le projet Complexe Desjardins. Livraison zéro défaut.'
        },
        // Subventions
        'PARI-CNRC': {
            tips: ['🔬 Innovation technologique', '💰 Budget (jusqu\'à 80%)', '👥 Emplois créés', '📈 Potentiel commercial'],
            example: 'Ex: Procédé de trempe basse consommation. Budget: 250k$. Demande: 175k$. 3 postes créés.'
        },
        'Investissement Québec': {
            tips: ['🏭 Investissement au Québec', '👷 Emplois créés', '🌍 Impact export', '🏢 Région d\'implantation'],
            example: 'Ex: Ligne automatisée verre trempé. 1,2M$. 8 emplois à Drummondville. Export 25% USA.'
        },
        'Crédit RS&DE': {
            tips: ['🧪 Incertitudes technologiques', '📊 Dépenses admissibles', '📅 Période couverte', '🔬 Avancées réalisées'],
            example: 'Ex: Recherche verre feuilleté architectural 2024. Salaires R&D: 180k$. Matériaux: 45k$.'
        },
        'Fonds écologique': {
            tips: ['🌱 Impact environnemental', '📉 Réductions (GES, énergie)', '💵 Coût et aide demandée', '🔄 Économie circulaire'],
            example: 'Ex: Récupération chaleur fours. -35% énergie. -120t CO2/an. Investissement: 85k$.'
        },
        'Formation Emploi-QC': {
            tips: ['📚 Programme de formation', '👥 Employés concernés', '⏰ Durée et calendrier', '🎯 Compétences visées'],
            example: 'Ex: Formation CNC 6 opérateurs. 40h/pers. Mars-avril 2025. Coût: 18k$.'
        },
        // Administratif
        'Procès-verbal': {
            tips: ['📅 Date, heure, lieu', '👥 Présents et absents', '📋 Ordre du jour', '✅ Décisions et actions'],
            example: 'Ex: PV CA du 15 janvier. Présents: PDG, CFO, COO. Points: Budget Q1, Expansion Montréal.'
        },
        'Politique interne': {
            tips: ['📜 Sujet de la politique', '👥 Personnes concernées', '⚖️ Lois applicables', '📅 Date d\'entrée en vigueur'],
            example: 'Ex: Politique télétravail. Employés admin. Max 2j/sem. Février 2025. Conforme SST QC.'
        },
        'Contrat type': {
            tips: ['📝 Type de contrat', '👥 Parties contractantes', '💰 Conditions financières', '⏰ Durée et résiliation'],
            example: 'Ex: Contrat fourniture verre. Paiement 30j. Livraison franco. Garantie 5 ans.'
        },
        'Mise en demeure': {
            tips: ['⚠️ Débiteur/contrevenant', '💰 Montant ou préjudice', '📅 Délais accordés', '⚖️ Recours légaux'],
            example: 'Ex: Mise en demeure Construction ABC. Facture 45k$ impayée 90j. Délai: 10 jours.'
        },
        // RH
        'Offre d\'emploi': {
            tips: ['💼 Poste et responsabilités', '🎓 Qualifications requises', '💰 Salaire et avantages', '📍 Lieu et horaire'],
            example: 'Ex: Technicien verre. 5 ans exp. DEP. 55-65k$/an + assurances. Drummondville, jour.'
        },
        'Lettre d\'embauche': {
            tips: ['👤 Nom du candidat', '💼 Poste et département', '📅 Date d\'entrée', '💰 Salaire et conditions'],
            example: 'Ex: Marie Tremblay, Superviseure production. 1er mars. 72k$/an. Probation 3 mois.'
        },
        'Évaluation employé': {
            tips: ['👤 Employé et poste', '📅 Période d\'évaluation', '📊 Forces et améliorations', '🎯 Objectifs suivants'],
            example: 'Ex: Jean-Pierre Bouchard, Opérateur CNC. 2024. Forces: précision. Objectif: leadership.'
        },
        'Fin d\'emploi': {
            tips: ['👤 Nom et poste', '📅 Dernier jour', '💰 Indemnité de départ', '📋 Motif si approprié'],
            example: 'Ex: Robert Martin, Manutentionnaire. 28 février. Motif: abolition poste. Indemnité: 8 sem.'
        },
        // Technique
        'Manuel procédure': {
            tips: ['🔧 Processus ou équipement', '📋 Étapes principales', '⚠️ Points de sécurité', '👥 Personnel visé'],
            example: 'Ex: Manuel trempe verre 10mm. Étapes: inspection, chargement, cycle, contrôle qualité.'
        },
        'Fiche sécurité': {
            tips: ['⚠️ Produit ou équipement', '🛡️ EPI requis', '🚨 Risques et urgences', '📞 Contacts incident'],
            example: 'Ex: FDS nettoyant industriel. Risques inhalation. EPI: gants, lunettes.'
        },
        'Spécification technique': {
            tips: ['📐 Produit en détail', '📏 Dimensions et tolérances', '🔬 Propriétés physiques', '✅ Normes certification'],
            example: 'Ex: Verre trempé architectural. 10mm ±0.2mm. Flexion 120 MPa. Certif CSA A440.'
        },
        'Checklist': {
            tips: ['📋 Opération ou inspection', '✅ Points de vérification', '📅 Fréquence', '👤 Responsable'],
            example: 'Ex: Checklist démarrage four. Points: temp, pression, huile, convoyeurs. Quotidien.'
        },
        // Financier
        'Demande financement': {
            tips: ['💰 Montant et utilisation', '📊 Situation financière', '📈 Projections revenus', '🏦 Garanties offertes'],
            example: 'Ex: Marge crédit 500k$ Banque Nationale. CA 2024: 4,2M$. Croissance 15%.'
        },
        'Plan d\'affaires': {
            tips: ['📊 Section à rédiger', '🎯 Objectifs stratégiques', '📈 Données financières', '🏭 Avantages concurrentiels'],
            example: 'Ex: Section Analyse de marché. Verre architectural QC: 180M$/an. Part visée: 12%.'
        },
        'Justificatif dépenses': {
            tips: ['📝 Nature des dépenses', '💰 Montants et fournisseurs', '📅 Dates transactions', '📂 Projet associé'],
            example: 'Ex: Dépenses R&D Q4 2024. Équipement: 25k$. Matériaux: 8k$. Projet: Optimisation.'
        },
        'Rapport financier': {
            tips: ['📅 Période couverte', '📊 Indicateurs à inclure', '📈 Comparatifs souhaités', '💡 Analyses spécifiques'],
            example: 'Ex: Rapport janvier 2025. Revenus, marge, dépenses, budget vs réel, prévisions Q1.'
        },
        // Rapports
        'Rapport mensuel': {
            tips: ['📅 Données opérationnelles', '📊 KPIs automatiques', '👥 Performance techniciens', '🔧 État machines'],
            example: 'Rapport automatique: tickets traités, temps résolution, incidents, recommandations.'
        },
        'Bilan performance': {
            tips: ['👥 Équipe technique', '⏱️ Temps réponse/résolution', '📈 Tendances', '🎯 Recommandations'],
            example: 'Bilan: productivité/technicien, taux résolution, satisfaction, axes amélioration.'
        },
        'État machines': {
            tips: ['🏭 Parc machines', '📊 Disponibilité et pannes', '🔧 Maintenance préventive', '💰 Coûts maintenance'],
            example: 'Rapport: disponibilité/machine, historique pannes, prévisions remplacement.'
        },
        'Incidents critiques': {
            tips: ['🚨 Incidents majeurs', '⏱️ Impact production', '🔍 Causes racines', '✅ Actions correctives'],
            example: 'Rapport: arrêts > 2h, pannes majeures, causes, mesures correctives.'
        },
        // Créatif
        'Texte site web': {
            tips: ['🌐 Page ou section', '🎯 Message clé', '👥 Public cible', '✨ Ton souhaité'],
            example: 'Ex: Page Services. Public: architectes. Message: expertise sur mesure. Ton: professionnel.'
        },
        'Communiqué presse': {
            tips: ['📰 Annonce ou événement', '📅 Date diffusion', '🎤 Citations dirigeants', '📞 Contact média'],
            example: 'Ex: Acquisition ligne trempe. 1,5M$. 10 emplois. Citation PDG. Diffusion: 1er février.'
        },
        'Discours': {
            tips: ['🎤 Occasion et audience', '⏱️ Durée souhaitée', '💬 Messages clés', '🎯 Ton désiré'],
            example: 'Ex: Party Noël employés. 5 min. Thèmes: remerciements, bilan 2024, perspectives.'
        },
        'Pitch commercial': {
            tips: ['🎯 Client cible', '💡 Proposition de valeur', '📊 Chiffres et références', '✅ Différenciateurs'],
            example: 'Ex: Pitch Pomerleau. Services: verre grands projets. Réf: Place Ville-Marie.'
        }
    };

    // Descriptions des catégories pour guider l'utilisateur
    const categoryHelp = {
        'correspondance': {
            description: 'Lettres officielles, courriels formels, communications externes',
            keywords: ['lettre', 'courrier', 'correspondance', 'réponse', 'demande'],
            notFor: ['rapport', 'kpi', 'performance', 'statistiques']
        },
        'subventions': {
            description: 'Demandes de financement gouvernemental, crédits d\'impôt R&D',
            keywords: ['subvention', 'financement', 'pari', 'rsde', 'crédit'],
            notFor: ['rapport', 'lettre', 'communiqué']
        },
        'administratif': {
            description: 'Documents internes : procès-verbaux, politiques, contrats',
            keywords: ['procès-verbal', 'politique', 'contrat', 'mise en demeure'],
            notFor: ['rapport maintenance', 'kpi', 'site web']
        },
        'rh': {
            description: 'Gestion du personnel : offres d\'emploi, embauches, évaluations',
            keywords: ['employé', 'embauche', 'emploi', 'évaluation', 'congédiement'],
            notFor: ['rapport', 'maintenance', 'machine']
        },
        'technique': {
            description: 'Documentation technique : manuels, procédures, fiches sécurité',
            keywords: ['procédure', 'manuel', 'technique', 'sécurité', 'checklist'],
            notFor: ['rapport mensuel', 'kpi', 'communiqué']
        },
        'financier': {
            description: 'Documents financiers : demandes de crédit, plans d\'affaires',
            keywords: ['financement', 'budget', 'dépenses', 'financier'],
            notFor: ['maintenance', 'technique', 'communiqué']
        },
        'rapports': {
            description: '📊 RAPPORTS DE MAINTENANCE : KPIs, performance équipe, état machines',
            keywords: ['rapport', 'kpi', 'performance', 'mensuel', 'bilan', 'statistiques'],
            notFor: ['lettre', 'communiqué', 'site web']
        },
        'creatif': {
            description: '🎨 CRÉATIF : Communiqués de presse, textes web, discours, pitchs',
            keywords: ['communiqué', 'site web', 'discours', 'pitch', 'marketing'],
            notFor: ['rapport', 'kpi', 'maintenance', 'statistiques', 'mensuel']
        }
    };

    // Fonction pour détecter si l'instruction correspond à une autre catégorie
    const detectMismatch = (instructions, currentCategory) => {
        if (!instructions || instructions.length < 10) return null;
        const lower = instructions.toLowerCase();
        
        // Vérifier si l'instruction contient des mots-clés d'une autre catégorie
        for (const [catId, help] of Object.entries(categoryHelp)) {
            if (catId === currentCategory) continue;
            
            // Si l'instruction contient des mots-clés forts d'une autre catégorie
            const matchCount = help.keywords.filter(kw => lower.includes(kw)).length;
            if (matchCount >= 2) {
                // Et si ces mots sont dans "notFor" de la catégorie actuelle
                const currentHelp = categoryHelp[currentCategory];
                if (currentHelp?.notFor?.some(nf => lower.includes(nf))) {
                    return {
                        suggestedCategory: catId,
                        suggestedLabel: categories.find(c => c.id === catId)?.label || catId,
                        reason: help.description
                    };
                }
            }
        }
        return null;
    };

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
        { id: 'rh', label: 'RH', icon: 'fa-users', color: 'purple', documents: [
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

    const selectDocument = (doc) => {
        setSelectedDocType(doc.label);
        setInstructions(doc.value);
        setMobileView('form');
    };

    const selectCategory = (catId) => {
        setSelectedCategory(catId);
        setInstructions('');
        setSelectedDocType(null);
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
                // En mode universel, envoyer 'auto' pour déclencher l'auto-détection côté serveur
                documentType: universalMode ? 'auto' : selectedCategory,
                instructions: instructions.trim()
            }, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.data.success !== false) {
                setGeneratedDoc(response.data);
                setViewMode('preview');
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
    
    // Activer/désactiver le mode universel
    const toggleUniversalMode = () => {
        setUniversalMode(!universalMode);
        if (!universalMode) {
            // En entrant en mode universel, effacer la sélection
            setSelectedDocType(null);
            setInstructions('');
        }
    };

    const markdownToHtml = (md, isLetter = false) => {
        if (!md) return '';
        
        // Pour les lettres: convertir les lignes vides en blocs espacés
        if (isLetter) {
            // Séparer par double saut de ligne (paragraphes/sections)
            const blocks = md.split(/\n\n+/);
            return blocks.map(block => {
                // Traiter le gras
                block = block.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                // Remplacer les sauts de ligne simples par <br>
                block = block.replace(/\n/g, '<br>');
                return `<div class="letter-block">${block}</div>`;
            }).join('');
        }
        
        // Fonction pour parser les tableaux Markdown avec styles inline pour impression
        const parseTable = (tableText) => {
            const lines = tableText.trim().split('\n').filter(l => l.trim());
            if (lines.length < 2) return tableText;
            
            const separatorLine = lines[1];
            if (!/^[\s|:-]+$/.test(separatorLine)) return tableText;
            
            // slice(1, -1) pour enlever les pipes vides aux extrémités, pas les cellules vides
            const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim());
            const thStyle = 'style="border:2px solid #000 !important;padding:10px 12px;text-align:left;font-weight:bold;background:#d1d5db !important;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important"';
            const headerHtml = headerCells.map(c => `<th ${thStyle}>${c}</th>`).join('');
            
            const tdStyle = 'style="border:1px solid #000 !important;padding:8px 12px"';
            const bodyRows = lines.slice(2).map((row, idx) => {
                // Ne pas filtrer les cellules vides - garder la structure du tableau
                const cells = row.split('|').slice(1, -1).map(c => c.trim());
                return `<tr>${cells.map(c => `<td ${tdStyle}>${c || '&nbsp;'}</td>`).join('')}</tr>`;
            }).join('');
            
            const tableStyle = 'style="width:100%;min-width:500px;border-collapse:collapse;font-size:10pt;border:2px solid #000 !important"';
            // Wrapper pour scroll horizontal sur mobile
            return `<div class="table-wrapper"><table ${tableStyle}><thead><tr>${headerHtml}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
        };
        
        // 1. BLOCKQUOTES - Style citation classique pour documents officiels
        md = md.replace(/^(?:>\s*.+\n?)+/gm, (match) => {
            const lines = match.split('\n').filter(l => l.trim());
            const content = lines.map(l => l.replace(/^>\s*/, '').trim()).join('<br>');
            return `<blockquote>${content}</blockquote>\n`;
        });
        
        // 2. INLINE FORMATTING (avant tableaux pour que **bold** fonctionne dans les cellules)
        let html = md
            // Bold et italic EN PREMIER (avec styles inline pour impression)
            .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:#0f172a">$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em style="font-style:italic">$1</em>')
            // Détecter et convertir les tableaux (blocs commençant par |)
            .replace(/((?:^\|.+\|$\n?)+)/gm, (match) => parseTable(match))
            // Séparateurs horizontaux (---, ***, ___)
            .replace(/^[-*_]{3,}\s*$/gm, '<hr class="doc-separator">')
            // Images ![alt](url) - AVANT les liens pour éviter conflit
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="doc-image" style="max-width:100%;height:auto;margin:10pt 0;border-radius:8pt;box-shadow:0 2pt 8pt rgba(0,0,0,0.1);">')
            // Liens [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#3b82f6;text-decoration:none;font-weight:500;">$1</a>')
            // Headers avec styles inline pour impression - Style document officiel
            .replace(/^#### (.+)$/gm, '<h4 style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;font-weight:600;color:#444;margin:10px 0 6px">$1</h4>')
            .replace(/^### (.+)$/gm, '<h3 style="font-family:Arial,Helvetica,sans-serif;font-size:11pt;font-weight:700;color:#333;margin:14px 0 8px">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:13pt;font-weight:700;color:#1a1a1a;margin:20px 0 10px;padding-bottom:4px;border-bottom:1px solid #ccc">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 style="font-family:Arial,Helvetica,sans-serif;font-size:16pt;font-weight:700;color:#000;margin:24px 0 16px;padding-bottom:6px;border-bottom:2px solid #1a1a1a;text-transform:uppercase;letter-spacing:1px">$1</h1>')
            // Code inline `code`
            .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2pt 6pt;border-radius:4pt;font-family:monospace;font-size:9pt;color:#0f172a;">$1</code>')
            // Listes
            .replace(/^(\s*)[\*\-] (.+)$/gm, (m, indent, content) => `<li data-level="${Math.floor((indent||'').length/2)}">${content}</li>`)
            .replace(/^\d+\. (.+)$/gm, '<li class="numbered">$1</li>');
        // Grouper les listes et nettoyer les sauts de ligne à l'intérieur
        html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => {
            // Supprimer les \n entre les </li> et <li>
            const cleanList = m.replace(/\n/g, '');
            return cleanList.includes('class="numbered"') ? `<ol>${cleanList}</ol>` : `<ul>${cleanList}</ul>`;
        });
        // Paragraphes
        html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>').replace(/^/, '<p>').replace(/$/, '</p>')
            .replace(/<p><\/p>/g, '').replace(/<p>(<h[1234]>)/g, '$1').replace(/(<\/h[1234]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1').replace(/(<\/ul>)<\/p>/g, '$1').replace(/<p>(<ol>)/g, '$1').replace(/(<\/ol>)<\/p>/g, '$1')
            .replace(/<p>(<table>)/g, '$1').replace(/(<\/table>)<\/p>/g, '$1')
            .replace(/<p>(<hr[^>]*>)<\/p>/g, '$1').replace(/<p>(<img[^>]*>)<\/p>/g, '$1');
        return html;
    };

    const documentStyles = `
        /* STYLE DOCUMENT OFFICIEL - Rapport professionnel */
        .doc-content { 
            font-family: 'Georgia', 'Times New Roman', Times, serif; 
            font-size: 11pt; 
            line-height: 1.7; 
            color: #1a1a1a; 
        }
        
        /* Titres - Style rapport officiel */
        .doc-content h1 { 
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 16pt; 
            font-weight: 700; 
            color: #000000; 
            margin: 24pt 0 16pt; 
            padding-bottom: 6pt; 
            border-bottom: 2pt solid #1a1a1a; 
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .doc-content h2 { 
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12pt; 
            font-weight: 700; 
            color: #000; 
            margin: 16pt 0 8pt; 
            padding-bottom: 3pt;
            border-bottom: 0.5pt solid #000;
        }
        .doc-content h3 { 
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt; 
            font-weight: 700; 
            color: #333333; 
            margin: 14pt 0 8pt; 
        }
        .doc-content h4 { 
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10pt; 
            font-weight: 600; 
            color: #444444; 
            margin: 10pt 0 6pt; 
        }
        
        /* Paragraphes */
        .doc-content p { 
            margin: 0 0 10pt; 
            text-align: justify; 
        }
        
        /* Listes - espacement compact */
        .doc-content ul, .doc-content ol { 
            margin: 4pt 0 8pt; 
            padding-left: 18pt; 
        }
        .doc-content li { 
            margin: 1pt 0;
            line-height: 1.4;
        }
        
        /* Citations - Style sobre pour documents */
        .doc-content blockquote { 
            border-left: 3pt solid #666666; 
            padding: 8pt 16pt; 
            margin: 12pt 0 12pt 20pt; 
            font-style: italic;
            color: #444444;
            background: #fafafa;
        }
        
        /* Tableaux - Style rapport officiel */
        .doc-content .table-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin: 14pt 0;
        }
        .doc-content table { 
            width: 100%; 
            min-width: 500px; /* Force scroll on small screens */
            border-collapse: collapse; 
            font-size: 10pt; 
        }
        .doc-content th { 
            background-color: #f5f5f5 !important; 
            border: 0.5pt solid #000 !important; 
            padding: 6pt 8pt; 
            text-align: left; 
            font-weight: 700; 
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #000 !important;
            white-space: nowrap;
        }
        .doc-content td { 
            border: 0.5pt solid #000 !important; 
            padding: 5pt 8pt;
            min-width: 80px;
        }
        .doc-content tr:nth-child(even) td { 
            background-color: transparent !important; 
        }
        
        /* Mobile: hint de scroll */
        @media (max-width: 640px) {
            .doc-content .table-wrapper {
                position: relative;
            }
            .doc-content .table-wrapper::after {
                content: '→ glisser';
                position: absolute;
                top: 0;
                right: 0;
                background: linear-gradient(to left, rgba(255,255,255,0.95), transparent);
                padding: 4px 8px 4px 24px;
                font-size: 9px;
                color: #666;
                pointer-events: none;
            }
            .doc-content table {
                font-size: 9pt;
            }
            .doc-content th, .doc-content td {
                padding: 4pt 6pt;
            }
        }
        
        /* Séparateurs - discrets */
        .doc-content hr, .doc-content .doc-separator { 
            border: none; 
            border-top: 0.5pt solid #ccc; 
            margin: 12pt 0; 
        }
        
        /* Autres éléments */
        .doc-content img { 
            max-width: 100%; 
            height: auto; 
            margin: 12pt 0; 
            display: block; 
        }
        .doc-content a { 
            color: #0066cc; 
            text-decoration: underline; 
        }
        .doc-content code { 
            background: #f5f5f5; 
            padding: 1pt 4pt; 
            font-family: 'Courier New', monospace; 
            font-size: 10pt; 
        }
        .doc-content strong { 
            font-weight: 700; 
        }
        
        /* Titres de section inline - ligne discrète au-dessus */
        .doc-content p > strong:first-child {
            display: inline-block;
            margin-top: 8pt;
            padding-top: 6pt;
            border-top: 0.5pt solid #ddd;
        }
        .doc-content p:first-child > strong:first-child {
            border-top: none;
            margin-top: 0;
            padding-top: 0;
        }
        
        /* Style pour les lettres - blocs bien espacés */
        .letter-block {
            margin-bottom: 16pt;
            line-height: 1.5;
        }
        .letter-block:first-child {
            margin-bottom: 28pt;
            font-weight: 700;
            font-size: 13pt;
        }
        .letter-block:first-child strong {
            font-size: 14pt;
        }
        
        /* Contrôle des sauts de page pour impression */
        @media print {
            .doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 { 
                page-break-after: avoid;
                page-break-inside: avoid; 
            }
            .doc-content p { 
                orphans: 3;
                widows: 3;
            }
            .doc-content table, .doc-content blockquote { 
                page-break-inside: avoid; 
            }
            .doc-content li { 
                page-break-inside: avoid; 
            }
        }
    `;

    const printDocument = async () => {
        if (!generatedDoc) return;
        let companyName = 'Entreprise', logoUrl = '/api/settings/logo';
        try {
            const res = await axios.get('/api/settings/config/public');
            if (res.data) {
                companyName = res.data.company_subtitle || res.data.company_short_name || 'Entreprise';
                if (res.data.company_logo_url) logoUrl = res.data.company_logo_url;
            }
        } catch (e) {}
        
        // Documents confidentiels: rapports, subventions, rh
        const confidentialTypes = ['rapports', 'subventions', 'rh'];
        const isConfidential = confidentialTypes.includes(selectedCategory);
        
        // Lettres: pas de header système (la lettre a son propre en-tête)
        const isLetter = selectedCategory === 'correspondance';
        
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const html = markdownToHtml(generatedDoc.document, isLetter);
        const docTitle = generatedDoc.title || 'Document';
        
        // CSS adapté au type de document
        const printHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${docTitle}</title>
<style>
@page { size: A4; margin: ${isLetter ? '25mm 25mm 25mm 25mm' : '20mm'}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; }
body { font-family: ${isLetter ? "'Times New Roman', Times, serif" : "'Georgia', serif"}; font-size: ${isLetter ? '12pt' : '11pt'}; line-height: ${isLetter ? '1.8' : '1.5'}; color: #000; padding: 0; }

/* Header corporate */
.print-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8pt; margin-bottom: 16pt; border-bottom: 1pt solid #000; }
.print-header-left { display: flex; align-items: center; gap: 10px; }
.print-header-left img { height: 32px; }
.print-header-left .brand { border-left: 1pt solid #000; padding-left: 8px; }
.print-header-left .brand-name { font-family: Arial, sans-serif; font-size: 12pt; font-weight: 700; color: #000; }
.print-header-left .brand-sub { font-family: Arial, sans-serif; font-size: 8pt; color: #333; }
.print-header-right { font-family: Arial, sans-serif; font-size: 9pt; color: #333; }

/* DOCUMENT OFFICIEL - NOIR ET BLANC */
.doc-content { font-family: ${isLetter ? "'Times New Roman', Times, serif" : "'Georgia', 'Times New Roman', serif"}; font-size: ${isLetter ? '12pt' : '11pt'}; line-height: ${isLetter ? '1.8' : '1.6'}; color: #000; }
.doc-content h1 { font-family: Arial, sans-serif; font-size: 14pt; font-weight: 700; color: #000; margin: 18pt 0 12pt; padding-bottom: 4pt; border-bottom: 1.5pt solid #000; text-transform: uppercase; letter-spacing: 0.5px; }
.doc-content h2 { font-family: Arial, sans-serif; font-size: 12pt; font-weight: 700; color: #000; margin: 16pt 0 8pt; padding-bottom: 3pt; border-bottom: 0.5pt solid #000; }
.doc-content h3 { font-family: Arial, sans-serif; font-size: 11pt; font-weight: 700; color: #000; margin: 12pt 0 6pt; }
.doc-content h4 { font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; color: #000; margin: 10pt 0 4pt; }
.doc-content p { margin: 0 0 ${isLetter ? '12pt' : '8pt'}; text-align: ${isLetter ? 'left' : 'justify'}; }
.doc-content ul, .doc-content ol { margin: 4pt 0 8pt; padding-left: 18pt; }
.doc-content li { margin: 1pt 0; line-height: 1.4; }
.doc-content blockquote { border-left: 2pt solid #000; padding: 6pt 12pt; margin: 10pt 0 10pt 16pt; font-style: italic; }
.doc-content table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 9pt; }
.doc-content th { background: #f5f5f5; border: 0.5pt solid #000; padding: 6pt 8pt; text-align: left; font-weight: 700; font-family: Arial, sans-serif; }
.doc-content td { border: 0.5pt solid #000; padding: 5pt 8pt; }
.doc-content hr { border: none; border-top: 0.5pt solid #ccc; margin: 12pt 0; }
.doc-content strong { font-weight: 700; }
/* Titres de section inline (gras en début de paragraphe) - ligne discrète au-dessus */
.doc-content p > strong:first-child { display: inline-block; margin-top: 8pt; padding-top: 6pt; border-top: 0.5pt solid #ddd; }
.doc-content p:first-child > strong:first-child { border-top: none; margin-top: 0; padding-top: 0; }

/* Style spécifique pour les lettres */
.letter-block { margin-bottom: 16pt; line-height: 1.5; }
.letter-block:first-child { margin-bottom: 28pt; font-weight: 700; font-size: 13pt; } /* En-tête entreprise */
.letter-block:first-child strong { font-size: 14pt; }
.letter-block strong { font-weight: 700; }

/* Section wrapper pour éviter les coupures */
.section { page-break-inside: avoid; }

@media print {
  @page { margin: ${isLetter ? '25mm' : '20mm'}; }
  body { padding: 0; }
  .print-header { page-break-inside: avoid; margin-bottom: 10pt; }
  /* Éviter de couper les titres et leur contenu immédiat */
  .doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 { 
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  /* Garder les listes avec leur titre */
  .doc-content h2 + ul, .doc-content h2 + ol,
  .doc-content h3 + ul, .doc-content h3 + ol { page-break-before: avoid; }
  /* Éviter de couper les éléments de liste */
  .doc-content li { page-break-inside: avoid; }
  .doc-content table { page-break-inside: auto; }
  .doc-content tr { page-break-inside: avoid; }
  .doc-content thead { display: table-header-group; }
  .doc-content p { orphans: 3; widows: 3; }
}

/* Footer - Avertissement confidentialité - EN FIN DE DOCUMENT (pas fixe) */
.print-footer {
  margin-top: 40pt;
  padding: 12pt 0;
  border-top: 0.5pt solid #999;
  font-family: Arial, sans-serif;
  font-size: 8pt;
  color: #666;
  text-align: center;
}
.print-footer-content {
  line-height: 1.4;
}
@media print {
  .print-footer { page-break-inside: avoid; margin-top: 30pt; }
}
</style></head>
<body>
<div class="print-header">
  <div class="print-header-left">
    <img src="${logoUrl}" onerror="this.style.display='none'">
    <div class="brand">
      <div class="brand-name">${companyName}</div>
      <div class="brand-sub">${docTitle}</div>
    </div>
  </div>
  <div class="print-header-right">${today}</div>
</div>
<div class="doc-content">${html}</div>
${isConfidential ? `<div class="print-footer">
  <div class="print-footer-content">
    <strong>CONFIDENTIEL</strong> — Ce document est la propriété exclusive de ${companyName}. 
    Toute reproduction, distribution ou divulgation sans autorisation écrite est strictement interdite.
  </div>
</div>` : ''}
</body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(printHtml); w.document.close(); w.onload = () => setTimeout(() => { w.focus(); w.print(); }, 250); }
        else { window.showToast && window.showToast('Popup bloquée', 'error'); }
    };

    const copyDocument = () => {
        if (!generatedDoc?.document) return;
        navigator.clipboard.writeText(generatedDoc.document).then(() => window.showToast && window.showToast('Document copié', 'success'));
    };

    const newDocument = () => {
        setGeneratedDoc(null);
        setViewMode('form');
        setInstructions('');
        setSelectedDocType(null);
        setMobileView('categories');
    };

    // Export HTML pour Word/Pages
    const exportDocument = async () => {
        if (!generatedDoc?.document) return;
        const isLetter = selectedCategory === 'correspondance';
        const html = markdownToHtml(generatedDoc.document, isLetter);
        const docTitle = generatedDoc.title || 'Document';
        
        // Récupérer les infos de l'entreprise
        let companyName = 'Entreprise';
        try {
            const resp = await fetch('/api/settings/config/public');
            if (resp.ok) {
                const cfg = await resp.json();
                companyName = cfg.company_subtitle || cfg.company_short_name || 'Entreprise';
            }
        } catch (e) {}
        
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // HTML compatible Word/Pages avec styles inline
        const exportHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; max-width: 800px; margin: 40px auto; padding: 20px; }
h1 { font-size: 18pt; font-weight: bold; margin: 24pt 0 12pt; border-bottom: 1px solid #000; padding-bottom: 6pt; }
h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 10pt; }
h3 { font-size: 12pt; font-weight: bold; margin: 14pt 0 8pt; }
p { margin: 0 0 10pt; text-align: justify; }
ul, ol { margin: 8pt 0 12pt 24pt; }
li { margin: 4pt 0; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
th { background: #f0f0f0; border: 1px solid #000; padding: 8pt; text-align: left; font-weight: bold; }
td { border: 1px solid #000; padding: 8pt; }
blockquote { border-left: 3pt solid #ccc; padding-left: 12pt; margin: 12pt 0; font-style: italic; color: #333; }
.header { border-bottom: 2px solid #000; padding-bottom: 12pt; margin-bottom: 24pt; }
.header-title { font-size: 16pt; font-weight: bold; }
.header-subtitle { font-size: 10pt; color: #666; }
.header-date { font-size: 10pt; text-align: right; }
</style>
</head>
<body>
<div class="header">
<div class="header-title">${companyName}</div>
<div class="header-subtitle">${docTitle}</div>
<div class="header-date">${today}</div>
</div>
${html}
</body>
</html>`;
        
        // Télécharger le fichier
        const blob = new Blob([exportHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, '').substring(0, 50)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.showToast && window.showToast('Document exporté (ouvrir avec Word/Pages)', 'success');
    };

    // Export DOCX natif pour Word/Pages (avec librairie docx)
    const exportDocx = async () => {
        if (!generatedDoc?.document) return;
        
        // Afficher loading
        window.showToast && window.showToast('Génération du document Word...', 'info');
        
        try {
            // Charger la librairie docx depuis CDN (à la demande)
            if (!window.docx) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } = window.docx;
            
            // Récupérer les infos de l'entreprise
            let companyName = 'Entreprise';
            try {
                const resp = await fetch('/api/settings/config/public');
                if (resp.ok) {
                    const cfg = await resp.json();
                    companyName = cfg.company_subtitle || cfg.company_short_name || 'Entreprise';
                }
            } catch (e) {}
            
            const docTitle = generatedDoc.title || 'Document';
            const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const markdown = generatedDoc.document;
            
            // Parser le Markdown en éléments DOCX
            const children = [];
            
            // Header
            children.push(new Paragraph({
                children: [new TextRun({ text: companyName, bold: true, size: 32 })],
                spacing: { after: 100 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: docTitle, italics: true, size: 24, color: '666666' })],
                spacing: { after: 100 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: today, size: 20, color: '666666' })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 }
            }));
            
            // Parser le contenu ligne par ligne
            const lines = markdown.split('\n');
            let i = 0;
            
            while (i < lines.length) {
                const line = lines[i];
                
                // Tableau Markdown
                if (line.trim().startsWith('|') && lines[i + 1]?.includes('---')) {
                    const tableLines = [];
                    while (i < lines.length && lines[i].trim().startsWith('|')) {
                        tableLines.push(lines[i]);
                        i++;
                    }
                    
                    // Parser le tableau
                    const rows = tableLines.filter(l => !l.includes('---'));
                    if (rows.length > 0) {
                        // Déterminer le nombre de colonnes
                        const numCols = rows[0].split('|').slice(1, -1).length;
                        const colWidth = Math.floor(9000 / numCols); // 9000 twips ≈ largeur page
                        
                        const tableRows = rows.map((row, rowIdx) => {
                            const cells = row.split('|').slice(1, -1).map(c => c.trim());
                            // S'assurer qu'on a le bon nombre de cellules
                            while (cells.length < numCols) cells.push('');
                            
                            return new TableRow({
                                children: cells.map(cellText => new TableCell({
                                    children: [new Paragraph({
                                        children: [new TextRun({ 
                                            text: cellText || ' ', 
                                            bold: rowIdx === 0,
                                            size: 22
                                        })]
                                    })],
                                    width: { size: colWidth, type: WidthType.DXA },
                                    shading: rowIdx === 0 ? { fill: 'E0E0E0' } : undefined,
                                    margins: { top: 50, bottom: 50, left: 100, right: 100 }
                                }))
                            });
                        });
                        
                        children.push(new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            columnWidths: Array(numCols).fill(colWidth)
                        }));
                        children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
                    }
                    continue;
                }
                
                // Titres
                if (line.startsWith('# ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: line.replace(/^# /, '').replace(/\*\*/g, ''), bold: true, size: 32 })],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }));
                    i++;
                    continue;
                }
                if (line.startsWith('## ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: line.replace(/^## /, '').replace(/\*\*/g, ''), bold: true, size: 28 })],
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 300, after: 150 }
                    }));
                    i++;
                    continue;
                }
                if (line.startsWith('### ')) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: line.replace(/^### /, '').replace(/\*\*/g, ''), bold: true, size: 24 })],
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    }));
                    i++;
                    continue;
                }
                
                // Listes
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    const text = line.trim().replace(/^[-*]\s+/, '');
                    // Parser bold dans le texte
                    const parts = text.split(/(\*\*[^*]+\*\*)/g);
                    const runs = parts.filter(p => p).map(part => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
                        }
                        return new TextRun({ text: part, size: 22 });
                    });
                    children.push(new Paragraph({
                        children: runs,
                        bullet: { level: 0 },
                        spacing: { after: 80 }
                    }));
                    i++;
                    continue;
                }
                
                // Paragraphe normal
                if (line.trim()) {
                    const text = line.trim();
                    const parts = text.split(/(\*\*[^*]+\*\*)/g);
                    const runs = parts.filter(p => p).map(part => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
                        }
                        return new TextRun({ text: part, size: 22 });
                    });
                    children.push(new Paragraph({
                        children: runs,
                        spacing: { after: 150 }
                    }));
                }
                
                i++;
            }
            
            // Créer le document
            const doc = new Document({
                sections: [{ children }]
            });
            
            // Générer le blob et télécharger
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${docTitle.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, '').substring(0, 50)}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.showToast && window.showToast('Document Word exporté avec succès', 'success');
            
        } catch (error) {
            console.error('Erreur export DOCX:', error);
            window.showToast && window.showToast('Erreur export Word, tentative HTML...', 'warning');
            // Fallback vers HTML
            exportDocument();
        }
    };

    if (!isOpen) return null;

    const currentCat = categories.find(c => c.id === selectedCategory);
    const colors = colorMap[currentCat?.color || 'indigo'];
    const currentHelp = selectedDocType ? helpTexts[selectedDocType] : null;

    // Vue Preview
    if (viewMode === 'preview' && generatedDoc) {
        return React.createElement('div', {
            className: 'fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4',
            style: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }
        },
            React.createElement('div', {
                className: 'bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden',
                onClick: e => e.stopPropagation()
            },
                // Header responsive
                React.createElement('div', { className: 'bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0' },
                    React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 text-white min-w-0' },
                        React.createElement('i', { className: 'fas fa-file-alt text-lg sm:text-xl flex-shrink-0' }),
                        React.createElement('div', { className: 'min-w-0' },
                            React.createElement('h2', { className: 'text-base sm:text-lg font-bold truncate' }, generatedDoc.title || 'Document'),
                            React.createElement('p', { className: 'text-xs text-emerald-100 hidden sm:block' }, 'Document généré')
                        )
                    ),
                    React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2 flex-shrink-0' },
                        React.createElement('button', { onClick: copyDocument, className: 'p-2 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-all flex items-center gap-1 sm:gap-2', title: 'Copier le texte' },
                            React.createElement('i', { className: 'fas fa-copy' }),
                            React.createElement('span', { className: 'hidden sm:inline' }, 'Copier')
                        ),
                        React.createElement('button', { onClick: exportDocx, className: 'p-2 sm:px-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-all flex items-center gap-1 sm:gap-2', title: 'Exporter pour Word/Pages (.docx)' },
                            React.createElement('i', { className: 'fas fa-file-word' }),
                            React.createElement('span', { className: 'hidden sm:inline' }, 'Word')
                        ),
                        React.createElement('button', { onClick: printDocument, className: 'p-2 sm:px-3 sm:py-2 bg-white text-emerald-600 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2', title: 'Imprimer / PDF' },
                            React.createElement('i', { className: 'fas fa-print' }),
                            React.createElement('span', { className: 'hidden sm:inline' }, 'Imprimer')
                        ),
                        React.createElement('button', { onClick: onClose, className: 'ml-1 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white' },
                            React.createElement('i', { className: 'fas fa-times' })
                        )
                    )
                ),
                // Document
                React.createElement('div', { className: 'flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-6' },
                    React.createElement('div', { className: 'bg-white rounded-lg sm:rounded-xl shadow-lg max-w-3xl mx-auto' },
                        React.createElement('div', { className: 'p-4 sm:p-8 md:p-12' },
                            React.createElement('style', {}, documentStyles),
                            React.createElement('div', { className: 'doc-content', dangerouslySetInnerHTML: { __html: markdownToHtml(generatedDoc.document, selectedCategory === 'correspondance') } })
                        )
                    )
                ),
                // Footer
                React.createElement('div', { className: 'px-4 sm:px-6 py-3 sm:py-4 bg-white border-t flex items-center justify-between flex-shrink-0' },
                    React.createElement('button', { onClick: newDocument, className: 'px-3 sm:px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl flex items-center gap-2' },
                        React.createElement('i', { className: 'fas fa-plus' }),
                        React.createElement('span', { className: 'hidden sm:inline' }, 'Nouveau')
                    ),
                    React.createElement('button', { onClick: onClose, className: 'px-4 sm:px-5 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg sm:rounded-xl' }, 'Fermer')
                )
            )
        );
    }

    // Vue Formulaire - Mobile : 2 écrans (catégories / formulaire)
    return React.createElement('div', {
        className: 'fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4',
        style: { background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden',
            onClick: e => e.stopPropagation()
        },
            // Header
            React.createElement('div', { className: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    // Bouton retour mobile (seulement si pas en mode universel)
                    !universalMode && mobileView === 'form' && React.createElement('button', {
                        onClick: () => setMobileView('categories'),
                        className: 'sm:hidden w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white mr-1'
                    }, React.createElement('i', { className: 'fas fa-arrow-left' })),
                    React.createElement('div', { className: `w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${universalMode ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' : 'bg-white/10'} flex items-center justify-center flex-shrink-0` },
                        React.createElement('i', { className: `fas ${universalMode ? 'fa-magic' : 'fa-file-signature'} text-lg sm:text-2xl text-white` })
                    ),
                    React.createElement('div', { className: 'min-w-0' },
                        React.createElement('h2', { className: 'text-base sm:text-xl font-bold text-white truncate' }, 
                            universalMode ? 'Assistant Universel' : 'Secrétariat'
                        ),
                        React.createElement('p', { className: 'text-xs text-slate-400 hidden sm:block' }, 
                            universalMode ? 'Détection automatique du type' : 'Documents professionnels'
                        )
                    )
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    // Toggle Mode Universel
                    React.createElement('button', { 
                        onClick: toggleUniversalMode, 
                        className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            universalMode 
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg' 
                                : 'bg-white/10 hover:bg-white/20 text-white'
                        }`,
                        title: universalMode ? 'Retour au mode catégories' : 'Mode assistant universel'
                    },
                        React.createElement('i', { className: `fas ${universalMode ? 'fa-th-large' : 'fa-magic'} mr-1.5` }),
                        React.createElement('span', { className: 'hidden sm:inline' }, universalMode ? 'Catégories' : 'Universel')
                    ),
                    React.createElement('button', { onClick: onClose, className: 'w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white' },
                        React.createElement('i', { className: 'fas fa-times' })
                    )
                )
            ),

            // Corps
            React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                
                // MODE UNIVERSEL: Interface simplifiée
                universalMode ? React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
                    // Zone scrollable en mode universel
                    React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-violet-50' },
                        // Intro
                        React.createElement('div', { className: 'max-w-2xl mx-auto' },
                            React.createElement('div', { className: 'text-center mb-6' },
                                React.createElement('div', { className: 'inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-full mb-3' },
                                    React.createElement('i', { className: 'fas fa-magic text-violet-600' }),
                                    React.createElement('span', { className: 'text-sm font-medium text-violet-700' }, 'Détection automatique')
                                ),
                                React.createElement('h3', { className: 'text-lg font-bold text-slate-800 mb-2' }, 'Décrivez simplement ce dont vous avez besoin'),
                                React.createElement('p', { className: 'text-sm text-slate-600' }, 'L\'assistant détectera automatiquement le type de document et utilisera les données appropriées.')
                            ),
                            
                            // Textarea principal
                            React.createElement('div', { className: 'bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200' },
                                React.createElement('label', { className: 'flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3' },
                                    React.createElement('i', { className: 'fas fa-pen-fancy text-violet-500' }),
                                    'Votre demande'
                                ),
                                React.createElement('textarea', {
                                    value: instructions,
                                    onChange: e => setInstructions(e.target.value),
                                    placeholder: 'Exemples :\n• "Génère un rapport mensuel de maintenance avec les KPIs"\n• "Rédige une lettre à Hydro-Québec pour proposer nos services"\n• "Crée une offre d\'emploi pour un technicien de maintenance"\n• "Communiqué de presse pour annoncer notre nouvelle ligne de production"',
                                    rows: 8,
                                    className: 'w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none text-sm text-slate-700 placeholder-slate-400 bg-slate-50'
                                }),
                                
                                // Suggestions rapides
                                React.createElement('div', { className: 'mt-4 pt-4 border-t border-slate-100' },
                                    React.createElement('p', { className: 'text-xs font-medium text-slate-500 mb-2' }, 'Suggestions rapides :'),
                                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                                        ['Rapport mensuel maintenance', 'Lettre officielle', 'Offre d\'emploi', 'Communiqué de presse', 'Demande de subvention'].map((suggestion, i) =>
                                            React.createElement('button', {
                                                key: i,
                                                onClick: () => setInstructions(suggestion),
                                                className: 'px-3 py-1.5 text-xs bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 rounded-full transition-all'
                                            }, suggestion)
                                        )
                                    )
                                )
                            ),
                            
                            // Info
                            React.createElement('p', { className: 'mt-4 text-center text-xs text-slate-500' },
                                React.createElement('i', { className: 'fas fa-info-circle mr-1' }),
                                'L\'IA analysera votre demande et choisira le cerveau spécialisé approprié (Rapports, RH, Correspondance, etc.)'
                            )
                        )
                    ),
                    
                    // Footer mode universel
                    React.createElement('div', { className: 'px-4 sm:px-6 py-3 sm:py-4 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0' },
                        React.createElement('button', { onClick: onClose, className: 'px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg' }, 'Annuler'),
                        React.createElement('button', {
                            onClick: generateDocument,
                            disabled: isGenerating || !instructions.trim(),
                            className: `px-5 py-2.5 text-sm font-semibold text-white rounded-lg flex items-center gap-2 ${
                                isGenerating || !instructions.trim() 
                                    ? 'bg-slate-300 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-200'
                            }`
                        },
                            isGenerating ? React.createElement('i', { className: 'fas fa-circle-notch fa-spin' }) : React.createElement('i', { className: 'fas fa-magic' }),
                            React.createElement('span', {}, isGenerating ? 'Génération...' : 'Générer')
                        )
                    )
                ) :
                
                // MODE CATÉGORIES (existant)
                React.createElement(React.Fragment, null,
                
                // MOBILE: Vue catégories OU formulaire
                // DESKTOP: Les deux côte à côte
                
                // Sidebar / Liste catégories (visible sur desktop, ou mobile si mobileView='categories')
                React.createElement('div', { 
                    className: `${mobileView === 'categories' ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-48 lg:w-52 bg-slate-50 border-r border-slate-200 overflow-hidden flex-shrink-0`
                },
                    // Titre catégories
                    React.createElement('div', { className: 'p-3 border-b border-slate-200 bg-white sm:bg-transparent' },
                        React.createElement('div', { className: 'text-xs font-semibold text-slate-500 uppercase tracking-wider' }, 'Catégories')
                    ),
                    // Liste catégories scrollable
                    React.createElement('div', { className: 'flex-1 overflow-y-auto p-2' },
                        categories.map(cat => {
                            const catColors = colorMap[cat.color];
                            const isActive = selectedCategory === cat.id;
                            return React.createElement('button', {
                                key: cat.id,
                                onClick: () => selectCategory(cat.id),
                                className: `w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg mb-1 transition-all text-left ${
                                    isActive ? `${catColors.light} ${catColors.text} ring-1 ${catColors.ring}` : 'hover:bg-white text-slate-600'
                                }`
                            },
                                React.createElement('div', { className: `w-8 h-8 sm:w-7 sm:h-7 rounded-lg ${isActive ? catColors.bg : 'bg-slate-200'} flex items-center justify-center` },
                                    React.createElement('i', { className: `fas ${cat.icon} text-sm sm:text-xs ${isActive ? 'text-white' : 'text-slate-500'}` })
                                ),
                                React.createElement('span', { className: 'text-sm font-medium flex-1' }, cat.label),
                                React.createElement('i', { className: 'fas fa-chevron-right text-xs text-slate-400 sm:hidden' })
                            );
                        })
                    ),
                    // Documents de la catégorie (mobile only, dans le panneau catégories)
                    React.createElement('div', { className: 'sm:hidden border-t border-slate-200 bg-white' },
                        React.createElement('div', { className: 'p-3 pb-2' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                React.createElement('i', { className: `fas ${currentCat?.icon} ${colors.text}` }),
                                React.createElement('span', { className: 'text-sm font-semibold text-slate-800' }, currentCat?.label)
                            )
                        ),
                        React.createElement('div', { className: 'px-3 pb-3 grid grid-cols-2 gap-2' },
                            (currentCat?.documents || []).map((doc, i) => 
                                React.createElement('button', {
                                    key: i,
                                    onClick: () => selectDocument(doc),
                                    className: `flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200`
                                },
                                    React.createElement('i', { className: `fas ${doc.icon} text-xs text-slate-400` }),
                                    React.createElement('span', { className: 'truncate flex-1' }, doc.label)
                                )
                            )
                        )
                    )
                ),

                // Zone principale (visible sur desktop, ou mobile si mobileView='form')
                React.createElement('div', { 
                    className: `${mobileView === 'form' ? 'flex' : 'hidden'} sm:flex flex-1 flex-col overflow-hidden`
                },
                    // Documents (desktop only)
                    React.createElement('div', { className: 'hidden sm:block p-4 border-b border-slate-200 bg-white flex-shrink-0' },
                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                            React.createElement('i', { className: `fas ${currentCat?.icon} ${colors.text}` }),
                            React.createElement('h3', { className: 'text-sm font-semibold text-slate-800' }, currentCat?.label)
                        ),
                        React.createElement('div', { className: 'flex flex-wrap gap-2' },
                            (currentCat?.documents || []).map((doc, i) => {
                                const isSelected = selectedDocType === doc.label;
                                return React.createElement('button', {
                                    key: i,
                                    onClick: () => selectDocument(doc),
                                    className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                        isSelected ? `${colors.light} ${colors.text} ring-1 ${colors.ring}` : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`
                                },
                                    React.createElement('i', { className: `fas ${doc.icon} text-xs` }),
                                    React.createElement('span', {}, doc.label)
                                );
                            })
                        )
                    ),

                    // Zone scrollable
                    React.createElement('div', { className: 'flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4' },
                        // Type sélectionné (mobile)
                        selectedDocType && React.createElement('div', { className: 'sm:hidden mb-3 flex items-center gap-2' },
                            React.createElement('div', { className: `px-3 py-1.5 rounded-full ${colors.light} ${colors.text} text-sm font-medium flex items-center gap-2` },
                                React.createElement('i', { className: 'fas fa-file-alt text-xs' }),
                                selectedDocType
                            )
                        ),
                        
                        // Aide contextuelle
                        currentHelp && React.createElement('div', { className: `mb-3 p-3 rounded-lg border ${colors.border} ${colors.light}` },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                React.createElement('i', { className: `fas fa-lightbulb ${colors.text} text-sm` }),
                                React.createElement('span', { className: `text-xs font-semibold ${colors.text}` }, 'Conseils')
                            ),
                            React.createElement('div', { className: 'grid grid-cols-2 gap-1.5 mb-2' },
                                currentHelp.tips.map((tip, i) => 
                                    React.createElement('div', { key: i, className: 'text-xs text-slate-600' }, tip)
                                )
                            ),
                            React.createElement('p', { className: 'text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-1' }, currentHelp.example)
                        ),

                        // Instructions
                        React.createElement('label', { className: 'flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2' },
                            React.createElement('i', { className: 'fas fa-pen text-slate-400 text-xs' }),
                            'Instructions'
                        ),
                        React.createElement('textarea', {
                            value: instructions,
                            onChange: e => setInstructions(e.target.value),
                            placeholder: selectedDocType ? `Décrivez votre ${selectedDocType.toLowerCase()}...` : 'Sélectionnez un type de document...',
                            rows: 6,
                            className: 'w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none resize-none text-sm text-slate-700 placeholder-slate-400 bg-white'
                        }),
                        
                        // Avertissement si mauvaise catégorie détectée
                        (() => {
                            const mismatch = detectMismatch(instructions, selectedCategory);
                            if (mismatch) {
                                return React.createElement('div', { 
                                    className: 'mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg'
                                },
                                    React.createElement('div', { className: 'flex items-start gap-2' },
                                        React.createElement('i', { className: 'fas fa-exclamation-triangle text-amber-500 mt-0.5' }),
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('p', { className: 'text-sm font-medium text-amber-800' },
                                                `Cette demande semble mieux convenir à la catégorie "${mismatch.suggestedLabel}"`
                                            ),
                                            React.createElement('p', { className: 'text-xs text-amber-600 mt-1' },
                                                mismatch.reason
                                            ),
                                            React.createElement('button', {
                                                onClick: () => selectCategory(mismatch.suggestedCategory),
                                                className: 'mt-2 text-xs font-medium text-amber-700 hover:text-amber-900 underline'
                                            }, `→ Basculer vers ${mismatch.suggestedLabel}`)
                                        )
                                    )
                                );
                            }
                            return null;
                        })(),
                        
                        // Description de la catégorie actuelle
                        selectedCategory && categoryHelp[selectedCategory] && React.createElement('div', { 
                            className: 'mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100'
                        },
                            React.createElement('p', { className: 'text-xs text-slate-600' },
                                React.createElement('i', { className: 'fas fa-lightbulb text-slate-400 mr-1' }),
                                React.createElement('strong', {}, `${categories.find(c => c.id === selectedCategory)?.label}: `),
                                categoryHelp[selectedCategory].description
                            )
                        ),
                        
                        React.createElement('p', { className: 'mt-2 text-xs text-slate-500' },
                            React.createElement('i', { className: 'fas fa-info-circle mr-1' }),
                            'L\'IA utilise les lois CA/QC et vos données.'
                        )
                    ),

                    // Footer
                    React.createElement('div', { className: 'px-3 sm:px-4 py-3 bg-white border-t flex items-center justify-end gap-2 flex-shrink-0' },
                        React.createElement('button', { onClick: onClose, className: 'px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg' }, 'Annuler'),
                        React.createElement('button', {
                            onClick: generateDocument,
                            disabled: isGenerating || !instructions.trim(),
                            className: `px-4 sm:px-5 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 ${
                                isGenerating || !instructions.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200'
                            }`
                        },
                            isGenerating ? React.createElement('i', { className: 'fas fa-circle-notch fa-spin' }) : React.createElement('i', { className: 'fas fa-wand-magic-sparkles' }),
                            React.createElement('span', {}, isGenerating ? 'Génération...' : 'Générer')
                        )
                    )
                )
                ) // Fin React.Fragment mode catégories
            )
        )
    );
};

window.SecretariatModal = SecretariatModal;
