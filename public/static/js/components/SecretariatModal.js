/**
 * SecretariatModal - Secrétariat de Direction
 * Design Premium - Génération de documents professionnels
 * v2.1 - Aide contextuelle dynamique
 */
const SecretariatModal = ({ isOpen, onClose }) => {
    const [selectedCategory, setSelectedCategory] = React.useState('correspondance');
    const [selectedDocType, setSelectedDocType] = React.useState(null);
    const [instructions, setInstructions] = React.useState('');
    const [generatedDoc, setGeneratedDoc] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('form');

    // Textes d'aide dynamiques pour chaque type de document
    const helpTexts = {
        // Correspondance
        'Lettre officielle': {
            tips: [
                '📝 Précisez le nom complet et le titre du destinataire',
                '🏢 Mentionnez le nom de l\'entreprise ou l\'organisme',
                '📋 Décrivez clairement l\'objet et le contexte',
                '📅 Indiquez les dates ou échéances importantes'
            ],
            example: 'Exemple : Lettre à M. Jean Tremblay, Directeur des achats chez Hydro-Québec, concernant notre proposition de fourniture de verre trempé pour le projet de modernisation des postes électriques. Budget approximatif : 150 000$.'
        },
        'Lettre de partenariat': {
            tips: [
                '🤝 Identifiez clairement l\'entreprise partenaire potentielle',
                '💡 Décrivez les bénéfices mutuels du partenariat',
                '📊 Mentionnez les chiffres clés (volumes, marchés)',
                '🎯 Précisez vos objectifs communs'
            ],
            example: 'Exemple : Proposition de partenariat avec Vitrerie Nationale pour la distribution exclusive de nos produits dans la région de Montréal. Volume estimé : 500 unités/an. Objectif : couvrir 30% du marché montréalais.'
        },
        'Réponse fournisseur': {
            tips: [
                '📦 Indiquez le nom du fournisseur et son représentant',
                '📄 Référencez le numéro de soumission ou demande',
                '✅ Précisez si c\'est une acceptation ou un refus',
                '💰 Mentionnez les conditions négociées si applicable'
            ],
            example: 'Exemple : Réponse à la soumission #2024-089 de Verre & Miroirs Inc. concernant la fourniture de float glass 6mm. Acceptation conditionnelle avec demande de réduction de 5% sur volumes > 1000m².'
        },
        'Lettre de remerciement': {
            tips: [
                '🙏 Identifiez clairement la personne ou l\'organisation',
                '⭐ Précisez l\'action ou contribution à remercier',
                '📅 Mentionnez la date de l\'événement si pertinent',
                '🔮 Évoquez une collaboration future si souhaité'
            ],
            example: 'Exemple : Remerciement à l\'équipe de Boisvert Construction pour leur collaboration exemplaire sur le projet du Complexe Desjardins. Livraison complétée le 15 janvier avec zéro défaut.'
        },

        // Subventions
        'PARI-CNRC': {
            tips: [
                '🔬 Décrivez l\'innovation technologique de votre projet',
                '💰 Indiquez le budget total et la contribution demandée (jusqu\'à 80%)',
                '👥 Mentionnez le nombre d\'emplois créés/maintenus',
                '📈 Expliquez le potentiel commercial au Canada'
            ],
            example: 'Exemple : Développement d\'un procédé automatisé de trempe du verre à basse consommation énergétique. Budget : 250 000$. Demande PARI : 175 000$. Création de 3 postes techniques. Réduction de 40% des coûts énergétiques.'
        },
        'Investissement Québec': {
            tips: [
                '🏭 Décrivez l\'investissement prévu au Québec',
                '👷 Indiquez le nombre d\'emplois créés/maintenus',
                '🌍 Précisez l\'impact sur l\'exportation',
                '🏢 Mentionnez la région d\'implantation'
            ],
            example: 'Exemple : Acquisition d\'une ligne de production automatisée pour verre trempé. Investissement : 1,2M$. Création de 8 emplois à Drummondville. Objectif export : 25% de la production vers les USA.'
        },
        'Crédit RS&DE': {
            tips: [
                '🧪 Décrivez les incertitudes technologiques surmontées',
                '📊 Listez les dépenses admissibles (salaires, matériaux, sous-traitance)',
                '📅 Précisez la période couverte (année fiscale)',
                '🔬 Expliquez les avancées technologiques réalisées'
            ],
            example: 'Exemple : Recherche sur les propriétés mécaniques du verre feuilleté pour application architecturale. Année 2024. Salaires R&D : 180 000$. Matériaux : 45 000$. Incertitude : résistance aux impacts à basse température.'
        },
        'Fonds écologique': {
            tips: [
                '🌱 Décrivez l\'impact environnemental positif du projet',
                '📉 Quantifiez les réductions (GES, énergie, déchets)',
                '💵 Précisez le coût total et l\'aide demandée',
                '🔄 Expliquez comment le projet s\'inscrit en économie circulaire'
            ],
            example: 'Exemple : Installation d\'un système de récupération de chaleur sur nos fours de trempe. Économie : 35% d\'énergie. Réduction GES : 120 tonnes CO2/an. Investissement : 85 000$. Demande : 42 500$ (50%).'
        },
        'Formation Emploi-QC': {
            tips: [
                '📚 Décrivez le programme de formation souhaité',
                '👥 Indiquez le nombre d\'employés concernés',
                '⏰ Précisez la durée et le calendrier de formation',
                '🎯 Expliquez les compétences visées'
            ],
            example: 'Exemple : Formation CNC pour 6 opérateurs sur les nouvelles tables de découpe. Durée : 40h/personne. Période : mars-avril 2025. Organisme : Centre de formation professionnelle de Drummondville. Coût total : 18 000$.'
        },

        // Administratif
        'Procès-verbal': {
            tips: [
                '📅 Indiquez la date, l\'heure et le lieu de la réunion',
                '👥 Listez les participants présents et absents',
                '📋 Énumérez les points à l\'ordre du jour',
                '✅ Précisez les décisions prises et actions à suivre'
            ],
            example: 'Exemple : PV du Conseil d\'administration du 15 janvier 2025. Présents : P. Gagnon (PDG), M. Lavoie (CFO), S. Chen (COO). Points : Approbation budget Q1, Projet expansion Montréal, Nomination directeur RH.'
        },
        'Politique interne': {
            tips: [
                '📜 Définissez clairement le sujet de la politique',
                '👥 Précisez les employés/départements concernés',
                '⚖️ Mentionnez les lois ou normes applicables',
                '📅 Indiquez la date d\'entrée en vigueur'
            ],
            example: 'Exemple : Politique de télétravail pour les employés administratifs. Applicable dès février 2025. Maximum 2 jours/semaine. Équipement fourni par l\'entreprise. Conformité aux normes SST du Québec.'
        },
        'Contrat type': {
            tips: [
                '📝 Précisez le type de contrat (service, vente, location)',
                '👥 Identifiez les parties contractantes typiques',
                '💰 Décrivez les conditions financières standards',
                '⏰ Indiquez les durées et conditions de résiliation'
            ],
            example: 'Exemple : Contrat type de fourniture de verre pour entrepreneurs généraux. Conditions : paiement 30 jours, livraison franco chantier, garantie 5 ans. Pénalités de retard : 2%/semaine. Juridiction : Québec.'
        },
        'Mise en demeure': {
            tips: [
                '⚠️ Identifiez précisément le débiteur/contrevenant',
                '💰 Détaillez le montant dû ou le préjudice',
                '📅 Précisez les dates et délais de paiement accordés',
                '⚖️ Mentionnez les recours légaux envisagés'
            ],
            example: 'Exemple : Mise en demeure à Construction ABC Inc. pour facture impayée #2024-567 de 45 000$ + intérêts. Échue depuis 90 jours. Délai accordé : 10 jours. Défaut de paiement = poursuite au civil.'
        },

        // Ressources Humaines
        'Offre d\'emploi': {
            tips: [
                '💼 Décrivez le poste et les responsabilités principales',
                '🎓 Listez les qualifications et expérience requises',
                '💰 Indiquez la fourchette salariale et avantages',
                '📍 Précisez le lieu de travail et horaire'
            ],
            example: 'Exemple : Technicien en transformation du verre. 5 ans d\'expérience minimum. DEP en techniques de fabrication. Salaire : 55 000-65 000$/an + assurances complètes. Drummondville, jour 7h-16h.'
        },
        'Lettre d\'embauche': {
            tips: [
                '👤 Nom complet du candidat retenu',
                '💼 Titre du poste et département',
                '📅 Date d\'entrée en fonction',
                '💰 Salaire, avantages et conditions d\'emploi'
            ],
            example: 'Exemple : Offre à Marie Tremblay pour le poste de Superviseure de production. Début : 1er mars 2025. Salaire : 72 000$/an. Période probatoire : 3 mois. Assurance collective dès jour 1. 4 semaines vacances.'
        },
        'Évaluation employé': {
            tips: [
                '👤 Identifiez l\'employé et son poste',
                '📅 Période d\'évaluation couverte',
                '📊 Points forts et axes d\'amélioration',
                '🎯 Objectifs pour la prochaine période'
            ],
            example: 'Exemple : Évaluation annuelle de Jean-Pierre Bouchard, Opérateur CNC. Période : 2024. Points forts : précision, assiduité. À améliorer : communication équipe. Objectif 2025 : formation leadership.'
        },
        'Fin d\'emploi': {
            tips: [
                '👤 Nom de l\'employé et poste occupé',
                '📅 Date de fin d\'emploi et dernier jour travaillé',
                '💰 Détails de l\'indemnité de départ si applicable',
                '📋 Raison de la fin d\'emploi (si approprié)'
            ],
            example: 'Exemple : Fin d\'emploi de Robert Martin, Manutentionnaire. Dernier jour : 28 février 2025. Motif : abolition de poste. Indemnité : 8 semaines de salaire. Lettre de recommandation fournie.'
        },

        // Technique
        'Manuel procédure': {
            tips: [
                '🔧 Décrivez le processus ou l\'équipement concerné',
                '📋 Listez les étapes principales à documenter',
                '⚠️ Mentionnez les points de sécurité critiques',
                '👥 Précisez le personnel visé par cette procédure'
            ],
            example: 'Exemple : Manuel de procédure pour la trempe du verre 10mm. Étapes : inspection initiale, chargement four, cycle thermique, refroidissement, contrôle qualité. Opérateurs et superviseurs concernés.'
        },
        'Fiche sécurité': {
            tips: [
                '⚠️ Identifiez le produit ou l\'équipement concerné',
                '🛡️ Listez les EPI requis',
                '🚨 Décrivez les risques et mesures d\'urgence',
                '📞 Précisez les contacts en cas d\'incident'
            ],
            example: 'Exemple : FDS pour le nettoyant industriel utilisé sur les tables de découpe. Composants chimiques, risques d\'inhalation, EPI requis (gants nitrile, lunettes), procédure en cas de contact cutané.'
        },
        'Spécification technique': {
            tips: [
                '📐 Décrivez le produit ou composant en détail',
                '📏 Listez les dimensions et tolérances',
                '🔬 Précisez les propriétés physiques requises',
                '✅ Mentionnez les normes de certification'
            ],
            example: 'Exemple : Spécification pour verre trempé architectural. Épaisseur : 10mm ±0.2mm. Résistance flexion : 120 MPa min. Certification CSA A440. Traitement bords polis. Livraison sur chevalet A.'
        },
        'Checklist': {
            tips: [
                '📋 Décrivez l\'opération ou inspection visée',
                '✅ Listez les points de vérification essentiels',
                '📅 Précisez la fréquence (quotidien, hebdo, mensuel)',
                '👤 Identifiez le responsable de la vérification'
            ],
            example: 'Exemple : Checklist quotidienne de démarrage four de trempe. Points : température initiale, pression air, niveau huile hydraulique, état convoyeurs, calibration capteurs. Responsable : opérateur de quart.'
        },

        // Financier
        'Demande financement': {
            tips: [
                '💰 Précisez le montant demandé et l\'utilisation',
                '📊 Décrivez la situation financière actuelle',
                '📈 Présentez les projections de revenus',
                '🏦 Mentionnez les garanties offertes'
            ],
            example: 'Exemple : Demande de marge de crédit de 500 000$ à la Banque Nationale pour fonds de roulement. CA 2024 : 4,2M$. Croissance prévue : 15%. Garantie : équipements et comptes clients.'
        },
        'Plan d\'affaires': {
            tips: [
                '📊 Précisez la section du plan à rédiger',
                '🎯 Décrivez les objectifs stratégiques',
                '📈 Incluez les données financières clés',
                '🏭 Mentionnez les avantages concurrentiels'
            ],
            example: 'Exemple : Section "Analyse de marché" du plan d\'affaires. Focus : marché du verre architectural au Québec. Taille : 180M$/an. Croissance : 8%/an. Part de marché visée : 12% d\'ici 2027.'
        },
        'Justificatif dépenses': {
            tips: [
                '📝 Décrivez la nature des dépenses',
                '💰 Listez les montants et les fournisseurs',
                '📅 Précisez les dates des transactions',
                '📂 Mentionnez le projet ou compte associé'
            ],
            example: 'Exemple : Justificatif pour dépenses R&D Q4 2024. Équipement de test : 25 000$ (Instruments QC). Matériaux : 8 000$ (divers fournisseurs). Main-d\'œuvre : 45 000$. Projet : Optimisation trempe.'
        },
        'Rapport financier': {
            tips: [
                '📅 Précisez la période couverte',
                '📊 Listez les indicateurs à inclure',
                '📈 Mentionnez les comparatifs souhaités',
                '💡 Indiquez les analyses spécifiques voulues'
            ],
            example: 'Exemple : Rapport financier mensuel janvier 2025. Incluant : revenus par ligne de produits, marge brute, dépenses par département, comparatif budget vs réel, prévisions Q1.'
        },

        // Rapports
        'Rapport mensuel': {
            tips: [
                '📅 Le rapport utilisera vos données opérationnelles réelles',
                '📊 KPIs inclus : tickets, temps réponse, disponibilité machines',
                '👥 Performance par technicien disponible',
                '🔧 État du parc machines intégré'
            ],
            example: 'L\'IA générera automatiquement un rapport complet basé sur vos données du mois : nombre de tickets traités, temps moyen de résolution, incidents critiques, et recommandations d\'amélioration.'
        },
        'Bilan performance': {
            tips: [
                '👥 Analyse de la performance de l\'équipe technique',
                '⏱️ Temps de réponse et de résolution',
                '📈 Tendances et comparaisons',
                '🎯 Recommandations d\'amélioration'
            ],
            example: 'Génération d\'un bilan de performance incluant : productivité par technicien, taux de résolution premier contact, satisfaction client interne, et axes d\'amélioration identifiés.'
        },
        'État machines': {
            tips: [
                '🏭 Inventaire complet du parc machines',
                '📊 Taux de disponibilité et pannes récurrentes',
                '🔧 Maintenance préventive vs corrective',
                '💰 Coûts de maintenance par équipement'
            ],
            example: 'Rapport détaillé sur l\'état du parc : disponibilité par machine, historique des pannes, maintenance effectuée, prévisions de remplacement, et budget maintenance.'
        },
        'Incidents critiques': {
            tips: [
                '🚨 Analyse des incidents majeurs du mois',
                '⏱️ Impact sur la production',
                '🔍 Causes racines identifiées',
                '✅ Actions correctives mises en place'
            ],
            example: 'Rapport sur les incidents critiques : arrêts de production > 2h, pannes majeures, analyse des causes, mesures correctives appliquées, et recommandations préventives.'
        },

        // Créatif
        'Texte site web': {
            tips: [
                '🌐 Précisez la page ou section du site',
                '🎯 Décrivez le message clé à transmettre',
                '👥 Identifiez le public cible',
                '✨ Mentionnez le ton souhaité (professionnel, dynamique...)'
            ],
            example: 'Exemple : Texte pour page "Nos services" du site web. Public : architectes et entrepreneurs. Message : expertise en verre architectural sur mesure. Ton : professionnel mais accessible. Inclure : 30 ans d\'expérience, certifications.'
        },
        'Communiqué presse': {
            tips: [
                '📰 Décrivez l\'annonce ou l\'événement',
                '📅 Précisez la date de diffusion souhaitée',
                '🎤 Incluez les citations des dirigeants',
                '📞 Mentionnez le contact média'
            ],
            example: 'Exemple : Communiqué annonçant l\'acquisition d\'une nouvelle ligne de trempe automatisée. Investissement : 1,5M$. 10 nouveaux emplois créés. Citation du PDG. Diffusion : 1er février 2025.'
        },
        'Discours': {
            tips: [
                '🎤 Précisez l\'occasion et l\'audience',
                '⏱️ Indiquez la durée souhaitée',
                '💬 Décrivez les messages clés à transmettre',
                '🎯 Mentionnez le ton désiré'
            ],
            example: 'Exemple : Discours pour le party de Noël des employés. Durée : 5 minutes. Thèmes : remerciements équipe, bilan 2024 positif, perspectives 2025 prometteuses. Ton : chaleureux et motivant.'
        },
        'Pitch commercial': {
            tips: [
                '🎯 Identifiez le client cible et son secteur',
                '💡 Décrivez votre proposition de valeur',
                '📊 Incluez des chiffres clés et références',
                '✅ Mentionnez vos différenciateurs'
            ],
            example: 'Exemple : Pitch pour présentation à Pomerleau Construction. Services : fourniture verre architectural grands projets. Avantages : stock local, délais 2 semaines, service technique intégré. Références : Place Ville-Marie, Complexe Desjardins.'
        }
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

    // Sélection document avec mise à jour aide
    const selectDocument = (doc) => {
        setSelectedDocType(doc.label);
        setInstructions(doc.value);
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

    // Markdown vers HTML amélioré
    const markdownToHtml = (md) => {
        if (!md) return '';
        let html = md
            .replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
                const bodyRows = rows.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
            })
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/^(\s*)[\*\-] (.+)$/gm, (match, indent, content) => {
                const level = Math.floor((indent || '').length / 2);
                return `<li data-level="${level}">${content}</li>`;
            })
            .replace(/^\d+\. (.+)$/gm, '<li class="numbered">$1</li>');
        
        html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
            if (match.includes('class="numbered"')) {
                return `<ol>${match}</ol>`;
            }
            return `<ul>${match}</ul>`;
        });
        
        html = html
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>').replace(/$/, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1234]>)/g, '$1')
            .replace(/(<\/h[1234]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>)/g, '$1')
            .replace(/(<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<ol>)/g, '$1')
            .replace(/(<\/ol>)<\/p>/g, '$1')
            .replace(/<p>(<table>)/g, '$1')
            .replace(/(<\/table>)<\/p>/g, '$1');
        
        return html;
    };

    const documentStyles = `
        .doc-content { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.8; color: #1a1a1a; }
        .doc-content h1 { font-size: 18pt; font-weight: 700; color: #0f172a; margin: 24pt 0 12pt; padding-bottom: 8pt; border-bottom: 2pt solid #3b82f6; }
        .doc-content h2 { font-size: 14pt; font-weight: 600; color: #1e293b; margin: 20pt 0 10pt; padding-left: 12pt; border-left: 3pt solid #3b82f6; }
        .doc-content h3 { font-size: 12pt; font-weight: 600; color: #334155; margin: 16pt 0 8pt; }
        .doc-content h4 { font-size: 11pt; font-weight: 600; color: #475569; margin: 14pt 0 6pt; }
        .doc-content p { margin: 0 0 12pt; text-align: justify; }
        .doc-content ul, .doc-content ol { margin: 12pt 0; padding-left: 24pt; }
        .doc-content li { margin: 6pt 0; }
        .doc-content strong { font-weight: 700; color: #0f172a; }
        .doc-content em { font-style: italic; }
        .doc-content table { width: 100%; border-collapse: collapse; margin: 16pt 0; font-size: 10pt; }
        .doc-content th { background: #f1f5f9; border: 1pt solid #cbd5e1; padding: 10pt; text-align: left; font-weight: 600; }
        .doc-content td { border: 1pt solid #cbd5e1; padding: 10pt; }
        .doc-content tr:nth-child(even) { background: #f8fafc; }
    `;

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
        
        const printHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 20mm 18mm 25mm 18mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.7; color: #333; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30pt; padding-bottom: 15pt; border-bottom: 1pt solid #e0e0e0; }
        .header-left { display: flex; align-items: center; }
        .logo { height: 50pt; margin-right: 15pt; }
        .brand { border-left: 3pt solid #3b82f6; padding-left: 15pt; }
        .brand-name { font-size: 18pt; font-weight: 700; color: #0f172a; letter-spacing: -0.5pt; }
        .brand-sub { font-size: 9pt; color: #64748b; margin-top: 4pt; }
        .header-right { text-align: right; font-size: 10pt; color: #64748b; }
        
        .title-block { text-align: center; padding: 25pt 0; margin-bottom: 25pt; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 8pt; }
        .title-block h1 { font-size: 20pt; font-weight: 700; color: #0f172a; margin: 0; }
        
        ${documentStyles.replace('.doc-content ', '.content ')}
        
        .footer { margin-top: 40pt; padding-top: 15pt; border-top: 1pt solid #e2e8f0; font-size: 9pt; color: #94a3b8; text-align: center; }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header, .title-block { page-break-inside: avoid; }
            h1, h2, h3, h4 { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
            <div class="brand">
                <div class="brand-name">${companyShortName}</div>
                <div class="brand-sub">${companySubtitle}</div>
            </div>
        </div>
        <div class="header-right">
            <div style="font-weight: 600; color: #334155;">${today}</div>
        </div>
    </div>
    
    <div class="title-block">
        <h1>${title}</h1>
    </div>
    
    <div class="content">${html}</div>
    
    <div class="footer">
        Document généré par ${companyShortName} — Secrétariat de Direction
    </div>
</body>
</html>`;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                }, 250);
            };
        } else {
            window.showToast && window.showToast('Popup bloquée. Autorisez les popups pour imprimer.', 'error');
        }
    };

    const copyDocument = () => {
        if (!generatedDoc?.document) return;
        navigator.clipboard.writeText(generatedDoc.document).then(() => {
            window.showToast && window.showToast('Document copié', 'success');
        });
    };

    const newDocument = () => {
        setGeneratedDoc(null);
        setViewMode('form');
        setInstructions('');
        setSelectedDocType(null);
    };

    if (!isOpen) return null;

    const currentCat = categories.find(c => c.id === selectedCategory);
    const colors = colorMap[currentCat?.color || 'indigo'];
    const currentHelp = selectedDocType ? helpTexts[selectedDocType] : null;

    // Vue Preview (document généré)
    if (viewMode === 'preview' && generatedDoc) {
        return React.createElement('div', {
            className: 'fixed inset-0 z-[9999] flex items-center justify-center',
            style: { background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }
        },
            React.createElement('div', {
                className: 'bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden m-4',
                onClick: e => e.stopPropagation()
            },
                // Header
                React.createElement('div', { 
                    className: 'bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0'
                },
                    React.createElement('div', { className: 'flex items-center gap-3 text-white' },
                        React.createElement('i', { className: 'fas fa-file-alt text-xl' }),
                        React.createElement('div', {},
                            React.createElement('h2', { className: 'text-lg font-bold' }, generatedDoc.title || 'Document'),
                            React.createElement('p', { className: 'text-xs text-emerald-100' }, 'Document généré avec succès')
                        )
                    ),
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('button', {
                            onClick: copyDocument,
                            className: 'px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2'
                        }, React.createElement('i', { className: 'fas fa-copy' }), 'Copier'),
                        React.createElement('button', {
                            onClick: printDocument,
                            className: 'px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2'
                        }, React.createElement('i', { className: 'fas fa-print' }), 'Imprimer'),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'ml-2 w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all'
                        }, React.createElement('i', { className: 'fas fa-times' }))
                    )
                ),

                // Document scrollable
                React.createElement('div', { 
                    className: 'flex-1 overflow-y-auto bg-slate-100 p-6'
                },
                    React.createElement('div', { 
                        className: 'bg-white rounded-xl shadow-lg max-w-3xl mx-auto'
                    },
                        React.createElement('div', { className: 'p-8 md:p-12' },
                            React.createElement('style', {}, documentStyles),
                            React.createElement('div', { 
                                className: 'doc-content',
                                dangerouslySetInnerHTML: { __html: markdownToHtml(generatedDoc.document) }
                            })
                        )
                    )
                ),

                // Footer
                React.createElement('div', { className: 'px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0' },
                    React.createElement('button', {
                        onClick: newDocument,
                        className: 'px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2'
                    }, React.createElement('i', { className: 'fas fa-plus' }), 'Nouveau document'),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'px-5 py-2.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all'
                    }, 'Fermer')
                )
            )
        );
    }

    // Vue formulaire
    return React.createElement('div', {
        className: 'fixed inset-0 z-[9999] flex items-center justify-center',
        style: { background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden m-4',
            onClick: e => e.stopPropagation()
        },
            // Header
            React.createElement('div', { 
                className: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between flex-shrink-0'
            },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    React.createElement('div', { className: 'w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center' },
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

            // Corps avec sidebar
            React.createElement('div', { className: 'flex flex-1 overflow-hidden' },
                // Sidebar
                React.createElement('div', { className: 'w-52 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto flex-shrink-0' },
                    React.createElement('div', { className: 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2' }, 'Catégories'),
                    categories.map(cat => {
                        const catColors = colorMap[cat.color];
                        const isActive = selectedCategory === cat.id;
                        return React.createElement('button', {
                            key: cat.id,
                            onClick: () => { setSelectedCategory(cat.id); setInstructions(''); setSelectedDocType(null); },
                            className: `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all text-left ${
                                isActive ? `${catColors.light} ${catColors.text}` : 'hover:bg-slate-100 text-slate-600'
                            }`
                        },
                            React.createElement('div', { 
                                className: `w-7 h-7 rounded-lg ${isActive ? catColors.bg : 'bg-slate-200'} flex items-center justify-center transition-all`
                            },
                                React.createElement('i', { className: `fas ${cat.icon} text-xs ${isActive ? 'text-white' : 'text-slate-500'}` })
                            ),
                            React.createElement('span', { className: `text-sm font-medium` }, cat.label)
                        );
                    })
                ),

                // Zone principale
                React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
                    // Modèles
                    React.createElement('div', { className: 'p-5 border-b border-slate-200 bg-white flex-shrink-0' },
                        React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
                            React.createElement('i', { className: `fas ${currentCat?.icon} ${colors.text}` }),
                            React.createElement('h3', { className: 'text-base font-semibold text-slate-800' }, currentCat?.label)
                        ),
                        React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-2' },
                            (currentCat?.documents || []).map((doc, i) => {
                                const isSelected = selectedDocType === doc.label;
                                return React.createElement('button', {
                                    key: i,
                                    onClick: () => selectDocument(doc),
                                    className: `flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                                        isSelected 
                                            ? `${colors.light} ${colors.text} ring-2 ${colors.ring}` 
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                                    }`
                                },
                                    React.createElement('i', { className: `fas ${doc.icon} text-xs ${isSelected ? colors.text : 'text-slate-400'}` }),
                                    React.createElement('span', { className: 'truncate' }, doc.label)
                                );
                            })
                        )
                    ),

                    // Zone scrollable : Instructions + Aide
                    React.createElement('div', { className: 'flex-1 overflow-y-auto bg-slate-50 p-5' },
                        // Aide contextuelle (si un document est sélectionné)
                        currentHelp && React.createElement('div', { 
                            className: `mb-4 p-4 rounded-xl border-2 ${colors.border} ${colors.light}`
                        },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-3' },
                                React.createElement('i', { className: `fas fa-lightbulb ${colors.text}` }),
                                React.createElement('span', { className: `text-sm font-semibold ${colors.text}` }, 'Trucs & Astuces')
                            ),
                            // Tips
                            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-2 mb-3' },
                                currentHelp.tips.map((tip, i) => 
                                    React.createElement('div', { 
                                        key: i, 
                                        className: 'flex items-start gap-2 text-sm text-slate-700'
                                    },
                                        React.createElement('span', {}, tip)
                                    )
                                )
                            ),
                            // Exemple
                            React.createElement('div', { className: 'mt-3 pt-3 border-t border-slate-200' },
                                React.createElement('p', { className: 'text-xs text-slate-600 italic' }, currentHelp.example)
                            )
                        ),

                        // Instructions
                        React.createElement('label', { className: 'flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2' },
                            React.createElement('i', { className: 'fas fa-pen text-slate-400' }),
                            'Instructions détaillées'
                        ),
                        React.createElement('textarea', {
                            value: instructions,
                            onChange: e => setInstructions(e.target.value),
                            placeholder: selectedDocType 
                                ? `Complétez les informations pour votre ${selectedDocType.toLowerCase()}...`
                                : 'Sélectionnez un type de document ci-dessus, puis décrivez précisément le document souhaité...',
                            rows: 8,
                            className: 'w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none resize-none text-slate-700 placeholder-slate-400 bg-white transition-all'
                        }),
                        React.createElement('p', { className: 'mt-3 text-xs text-slate-500' },
                            React.createElement('i', { className: 'fas fa-info-circle mr-1' }),
                            'L\'IA utilise les lois CA/QC, programmes de subventions et vos données opérationnelles.'
                        )
                    ),

                    // Footer
                    React.createElement('div', { className: 'px-5 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0' },
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all'
                        }, 'Annuler'),
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
                                : React.createElement('i', { className: 'fas fa-wand-magic-sparkles' }),
                            isGenerating ? 'Génération en cours...' : 'Générer le document'
                        )
                    )
                )
            )
        )
    );
};

window.SecretariatModal = SecretariatModal;
