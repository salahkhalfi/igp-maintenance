/**
 * INDUSTRY TEMPLATES FOR AUTO-GENERATED AI CONTEXT
 * 
 * These templates provide industry-specific knowledge that the AI can use
 * without any manual configuration. The system detects the industry from
 * company_subtitle or equipment types and injects relevant expertise.
 * 
 * Each template includes:
 * - Keywords for detection
 * - Common equipment types
 * - Typical failures and diagnostics
 * - Safety considerations
 * - Seasonal patterns
 * - Industry-specific vocabulary
 */

export interface IndustryTemplate {
    id: string;
    name: string;
    nameEn: string;
    // Keywords to detect this industry (in subtitle or equipment)
    keywords: string[];
    // Common equipment in this industry
    typicalEquipment: string[];
    // Knowledge block for AI
    expertise: string;
    // Safety rules specific to this industry
    safetyRules: string;
    // Common failure patterns
    commonIssues: string;
    // Seasonal considerations
    seasonality?: string;
    // Industry jargon the AI should understand
    vocabulary?: Record<string, string>;
}

// =============================================================================
// INDUSTRY TEMPLATES DATABASE
// =============================================================================

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
    
    // =========================================================================
    // 🏭 GLASS MANUFACTURING / VERRERIE
    // =========================================================================
    {
        id: 'glass_manufacturing',
        name: 'Industrie du verre',
        nameEn: 'Glass Manufacturing',
        keywords: [
            'verre', 'glass', 'vitre', 'vitrage', 'trempe', 'tempering', 'float',
            'laminage', 'laminated', 'miroir', 'mirror', 'verrerie', 'glazing',
            'double vitrage', 'igp', 'saint-gobain', 'agc'
        ],
        typicalEquipment: [
            'four de trempe', 'tempering furnace', 'ligne de lavage', 'washing line',
            'table de découpe', 'cutting table', 'cnc', 'rectifieuse', 'polisseuse',
            'autoclave', 'four de bombage', 'sérigraphie'
        ],
        expertise: `EXPERTISE VERRERIE & TRANSFORMATION DU VERRE:

1. ÉQUIPEMENTS CRITIQUES:
   - Fours de trempe: Température 620-720°C, uniformité critique (±5°C)
   - Lignes de lavage: Qualité eau déminéralisée, séchage sans traces
   - Tables de découpe CNC: Précision ±0.5mm, qualité des molettes
   - Autoclaves: Pression 12-14 bars, cycles de cuisson PVB

2. DIAGNOSTICS TYPIQUES:
   - Casse thermique → Vérifier gradient de température, vitesse de refroidissement
   - Traces sur verre → Qualité eau, état des brosses, buses bouchées
   - Défauts de trempe → Uniformité four, rouleaux usés, oscillation
   - Délaminage → Cycle autoclave, qualité PVB, propreté surfaces

3. INDICATEURS DE PERFORMANCE:
   - Taux de casse < 2%
   - Temps de cycle trempe selon épaisseur
   - Consommation énergétique four (kWh/m²)`,
        
        safetyRules: `SÉCURITÉ VERRERIE:
- ⚠️ VERRE CHAUD: Ne jamais toucher sans gants haute température
- ⚠️ CASSE: Port des lunettes ET gants anti-coupure OBLIGATOIRE
- ⚠️ FOUR: Zone d'exclusion 2m minimum en fonctionnement
- ⚠️ AUTOCLAVE: Vérifier dépressurisation complète avant ouverture
- ⚠️ POUSSIÈRE: Masque FFP2 pour nettoyage des filtres`,
        
        commonIssues: `PANNES FRÉQUENTES VERRERIE:
- Four trempe: Résistances (30%), ventilateurs (25%), thermocouples (20%)
- Lavage: Pompes (35%), buses (25%), moteurs convoyeur (20%)
- Découpe: Tête CNC (25%), rails (20%), aspiration (15%)
- Autoclave: Joints (30%), vannes (25%), capteurs pression (20%)`,
        
        seasonality: `SAISONNALITÉ:
- ÉTÉ: Charge four réduite, attention refroidissement, production vitrages solaires
- HIVER: Demande double vitrage ↑, condensation dans l'usine`,
        
        vocabulary: {
            'la grosse': 'Four de trempe principal',
            'passer au four': 'Cycle de trempe',
            'ça ondule': 'Défaut de planéité post-trempe',
            'laiteux': 'Traces de calcaire sur verre',
            'éclat de bord': 'Micro-fissure sur arête',
            'verre float': 'Verre plat de base avant transformation'
        }
    },

    // =========================================================================
    // 🥖 FOOD & BEVERAGE / AGROALIMENTAIRE
    // =========================================================================
    {
        id: 'food_beverage',
        name: 'Agroalimentaire',
        nameEn: 'Food & Beverage',
        keywords: [
            'alimentaire', 'food', 'boulangerie', 'bakery', 'patisserie', 'cuisine',
            'restaurant', 'traiteur', 'catering', 'brasserie', 'brewery', 'laiterie',
            'dairy', 'fromagerie', 'abattoir', 'viande', 'meat', 'conserverie',
            'boisson', 'beverage', 'embouteillage', 'bottling', 'chocolaterie'
        ],
        typicalEquipment: [
            'four', 'oven', 'pétrin', 'mixer', 'chambre froide', 'cold room',
            'congélateur', 'freezer', 'ligne d\'embouteillage', 'pasteurisateur',
            'autoclave', 'trancheuse', 'slicer', 'mélangeur', 'convoyeur',
            'étiqueteuse', 'emballeuse', 'détecteur métaux'
        ],
        expertise: `EXPERTISE AGROALIMENTAIRE:

1. ÉQUIPEMENTS CRITIQUES:
   - Chaîne du froid: Température -18°C à +4°C selon HACCP
   - Fours/Pasteurisateurs: Courbes de température précises
   - Lignes d'emballage: Cadence, étanchéité, traçabilité
   - Nettoyage CIP (Clean-In-Place): Cycles automatisés

2. DIAGNOSTICS TYPIQUES:
   - Variation température → Vérifier compresseur, fluide frigorigène, joints portes
   - Arrêt ligne → Bourrage, capteur produit, synchronisation
   - Contamination → Nettoyage insuffisant, joints usés, filtres
   - Sous-cuisson/Sur-cuisson → Calibration sondes, résistances

3. CONFORMITÉ HACCP:
   - Points critiques (CCP) documentés
   - Enregistrements température continus
   - Traçabilité lot obligatoire`,
        
        safetyRules: `SÉCURITÉ AGROALIMENTAIRE:
- ⚠️ HYGIÈNE: Lavage mains, charlotte, blouse AVANT toute intervention
- ⚠️ ALLERGÈNES: Nettoyage complet si changement de production
- ⚠️ FROID: EPI grand froid pour chambre < -10°C (max 30 min)
- ⚠️ VAPEUR: Attention conduites chaudes, purger avant intervention
- ⚠️ ÉLECTRIQUE: Environnement humide = risque accru`,
        
        commonIssues: `PANNES FRÉQUENTES AGROALIMENTAIRE:
- Froid: Compresseur (30%), évaporateur givré (25%), thermostat (20%)
- Fours: Résistances (35%), ventilateur (20%), porte/joints (15%)
- Convoyeurs: Courroies (30%), moteurs (25%), capteurs (20%)
- Emballage: Mâchoires soudure (30%), cellule détection (25%)`,
        
        seasonality: `SAISONNALITÉ:
- ÉTÉ: Charge froid maximale, risque rupture chaîne du froid
- FÊTES: Production intensive, usure accélérée des équipements
- HIVER: Condensation, problèmes étiquetage`,
        
        vocabulary: {
            'batch': 'Lot de production',
            'CIP': 'Nettoyage en place automatisé',
            'la chambre': 'Chambre froide principale',
            'ça givre': 'Évaporateur bloqué par le givre',
            'rupture chaîne': 'Perte de température critique'
        }
    },

    // =========================================================================
    // 🚗 AUTOMOTIVE / AUTOMOBILE
    // =========================================================================
    {
        id: 'automotive',
        name: 'Automobile & Garage',
        nameEn: 'Automotive',
        keywords: [
            'garage', 'automobile', 'automotive', 'véhicule', 'vehicle', 'voiture',
            'car', 'camion', 'truck', 'mécanique', 'mechanic', 'carrosserie',
            'body shop', 'peinture', 'paint', 'fleet', 'flotte', 'concessionnaire',
            'dealer', 'pneu', 'tire', 'vidange', 'oil change'
        ],
        typicalEquipment: [
            'pont élévateur', 'lift', 'compresseur', 'cabine peinture', 'paint booth',
            'banc diagnostic', 'équilibreuse', 'démonte-pneu', 'tire changer',
            'station climatisation', 'ac station', 'poste soudure', 'nettoyeur haute pression',
            'extracteur fumées', 'cric', 'jack'
        ],
        expertise: `EXPERTISE AUTOMOBILE & GARAGE:

1. ÉQUIPEMENTS CRITIQUES:
   - Ponts élévateurs: Inspection annuelle obligatoire, câbles/vérins
   - Cabine peinture: Filtration, température, hygrométrie
   - Compresseurs: Pression 8-10 bars, purge quotidienne
   - Diagnostic: Mises à jour logicielles constructeurs

2. DIAGNOSTICS TYPIQUES:
   - Pont ne monte plus → Niveau huile hydraulique, fuites, électrovanne
   - Cabine défaut → Filtres saturés, brûleurs, extracteur
   - Compresseur chauffe → Filtre air, niveau huile, courroie
   - Outil pneumatique faible → Pression, lubrificateur, joints

3. PRODUCTIVITÉ:
   - Taux d'occupation ponts
   - Temps moyen intervention par type
   - Rotation outillage`,
        
        safetyRules: `SÉCURITÉ GARAGE:
- ⚠️ PONT: Vérifier verrouillage AVANT de passer dessous
- ⚠️ BATTERIE: Débrancher borne négative en premier
- ⚠️ HYBRIDE/ÉLECTRIQUE: Habilitation spécifique requise (B2VL)
- ⚠️ CARBURANT: Pas de flamme, ventilation obligatoire
- ⚠️ AMIANTE: Freins anciens véhicules = risque amiante`,
        
        commonIssues: `PANNES FRÉQUENTES GARAGE:
- Ponts: Fuites hydrauliques (35%), câbles (25%), sécurités (20%)
- Compresseur: Pressostat (25%), soupape (20%), moteur (15%)
- Cabine: Filtres (40%), brûleurs (20%), ventilation (15%)
- Outils pneumatiques: Joints (35%), lubrification (30%)`,
        
        seasonality: `SAISONNALITÉ:
- HIVER: Pic changement pneus, batteries, antigel
- ÉTÉ: Climatisation, surchauffe moteurs clients
- CONTRÔLE TECHNIQUE: Pics avant échéances`,
        
        vocabulary: {
            'la fosse': 'Pont élévateur ou fosse d\'inspection',
            'le banc': 'Banc de diagnostic électronique',
            'souffler': 'Nettoyer à l\'air comprimé',
            'ça pisse': 'Fuite importante'
        }
    },

    // =========================================================================
    // 🏨 HOSPITALITY / HÔTELLERIE
    // =========================================================================
    {
        id: 'hospitality',
        name: 'Hôtellerie & Restauration',
        nameEn: 'Hospitality',
        keywords: [
            'hôtel', 'hotel', 'motel', 'resort', 'auberge', 'inn', 'spa',
            'piscine', 'pool', 'restaurant', 'bar', 'banquet', 'conférence',
            'chambre', 'room', 'housekeeping', 'reception', 'lobby'
        ],
        typicalEquipment: [
            'climatisation', 'hvac', 'chaudière', 'boiler', 'ascenseur', 'elevator',
            'pompe piscine', 'pool pump', 'traitement eau', 'water treatment',
            'groupe électrogène', 'generator', 'chambre froide', 'lave-vaisselle',
            'buanderie', 'laundry', 'système incendie', 'fire system', 'serrures électroniques'
        ],
        expertise: `EXPERTISE HÔTELLERIE:

1. ÉQUIPEMENTS CRITIQUES:
   - HVAC: Confort client = priorité absolue
   - Ascenseurs: Disponibilité 99%+, contrat maintenance obligatoire
   - Piscine/Spa: Traitement eau, température, sécurité
   - Groupe électrogène: Test mensuel, autonomie fuel

2. DIAGNOSTICS TYPIQUES:
   - Chambre trop chaude/froide → Thermostat, filtre, ventilo-convecteur
   - Eau pas chaude → Ballon, circulateur, vanne 3 voies
   - Ascenseur bloqué → Procédure déblocage, appel société maintenance
   - Piscine trouble → pH, chlore, filtration, contre-lavage

3. PRIORITÉS:
   - Sécurité incendie = URGENT ABSOLU
   - Confort chambre occupée = HAUTE priorité
   - Espaces communs = priorité normale
   - Back-office = peut attendre`,
        
        safetyRules: `SÉCURITÉ HÔTELLERIE:
- ⚠️ INCENDIE: Connaître procédure évacuation, ne jamais bloquer issues
- ⚠️ LÉGIONELLE: Traitement eau chaude > 55°C, purges régulières
- ⚠️ PISCINE: Produits chimiques = stockage séparé, EPI obligatoire
- ⚠️ ASCENSEUR: Jamais d'intervention sans société agréée
- ⚠️ CLIENT: Toquer et annoncer avant d'entrer dans une chambre`,
        
        commonIssues: `PANNES FRÉQUENTES HÔTELLERIE:
- HVAC: Filtres (30%), thermostat (25%), ventilateur (20%)
- Plomberie: Fuites (35%), chasse d'eau (25%), mitigeur (20%)
- Électrique: Prises (25%), éclairage (35%), serrures cartes (15%)
- Cuisine: Froid (30%), lave-vaisselle (25%), hottes (15%)`,
        
        seasonality: `SAISONNALITÉ:
- ÉTÉ: Charge climatisation max, piscine intensive
- HIVER: Chauffage max, risque gel tuyauteries
- HAUTE SAISON: Maintenance préventive AVANT, pas pendant`,
        
        vocabulary: {
            'la clim': 'Système de climatisation chambre',
            'PAC': 'Pompe à chaleur',
            'GE': 'Groupe électrogène',
            'OOO': 'Out Of Order - chambre hors service',
            'check-out': 'Moment idéal pour maintenance chambre'
        }
    },

    // =========================================================================
    // ⚙️ MACHINING / USINAGE
    // =========================================================================
    {
        id: 'machining',
        name: 'Usinage & Fabrication',
        nameEn: 'Machining & Manufacturing',
        keywords: [
            'usinage', 'machining', 'cnc', 'tour', 'lathe', 'fraiseuse', 'mill',
            'rectifieuse', 'grinder', 'découpe', 'cutting', 'laser', 'plasma',
            'poinçonneuse', 'punch', 'presse', 'press', 'injection', 'moulage',
            'fonderie', 'foundry', 'soudure', 'welding', 'atelier', 'workshop'
        ],
        typicalEquipment: [
            'centre usinage', 'machining center', 'tour cnc', 'cnc lathe',
            'fraiseuse', 'milling machine', 'rectifieuse', 'grinder',
            'découpe laser', 'laser cutter', 'presse plieuse', 'press brake',
            'robot soudure', 'welding robot', 'compresseur', 'aspirateur copeaux'
        ],
        expertise: `EXPERTISE USINAGE & FABRICATION:

1. ÉQUIPEMENTS CRITIQUES:
   - Broches CNC: Lubrification, température, vibrations
   - Axes: Jeu, précision, rails de guidage
   - Changeur outils: Positionnement, pinces, capteurs
   - Arrosage: Pression, concentration lubrifiant, filtration

2. DIAGNOSTICS TYPIQUES:
   - Cotes hors tolérance → Usure outil, jeu axes, température
   - Vibrations → Équilibrage broche, outil mal serré, paliers
   - Alarme axe → Codeur, variateur, câble, fin de course
   - Problème outil → Changeur, pince, cône, capteur présence

3. MÉTROLOGIE:
   - Contrôle dimensionnel régulier
   - Compensation thermique machine
   - Calibration laser annuelle recommandée`,
        
        safetyRules: `SÉCURITÉ USINAGE:
- ⚠️ COPEAUX: Jamais à mains nues, utiliser crochets
- ⚠️ ROTATION: Pas de gants près de broche en rotation
- ⚠️ HUILE: Sol glissant, nettoyer immédiatement
- ⚠️ PIÈCES LOURDES: Utiliser palan, jamais soulever seul
- ⚠️ LASER: Lunettes spécifiques, zone balisée`,
        
        commonIssues: `PANNES FRÉQUENTES USINAGE:
- Broche: Paliers (25%), encodeur (20%), surchauffe (15%)
- Axes: Vis à billes (20%), rails (15%), variateurs (20%)
- Changeur outils: Pinces (30%), capteurs (25%), vérin (20%)
- Hydraulique: Fuites (35%), filtres (25%), pompe (15%)`,
        
        seasonality: `SAISONNALITÉ:
- ÉTÉ: Surchauffe machines, climatisation atelier
- HIVER: Préchauffage machines obligatoire, viscosité huile`,
        
        vocabulary: {
            'la broche': 'Élément rotatif principal porte-outil',
            'ça vibre': 'Problème équilibrage ou usure',
            'prendre du jeu': 'Usure mécanique des guidages',
            'le magasin': 'Changeur d\'outils automatique',
            'offsetter': 'Corriger les décalages d\'usure outil'
        }
    },

    // =========================================================================
    // 🖨️ PRINTING / IMPRIMERIE
    // =========================================================================
    {
        id: 'printing',
        name: 'Imprimerie & Packaging',
        nameEn: 'Printing & Packaging',
        keywords: [
            'imprimerie', 'printing', 'impression', 'offset', 'flexo', 'flexographie',
            'sérigraphie', 'screen printing', 'numérique', 'digital', 'packaging',
            'emballage', 'étiquette', 'label', 'carton', 'cardboard', 'papier', 'paper'
        ],
        typicalEquipment: [
            'presse offset', 'offset press', 'presse flexo', 'flexo press',
            'presse numérique', 'digital press', 'plieuse', 'folder',
            'massicot', 'cutter', 'encarteuse', 'reliure', 'binding',
            'vernisseuse', 'dorure', 'laminage', 'découpe'
        ],
        expertise: `EXPERTISE IMPRIMERIE:

1. ÉQUIPEMENTS CRITIQUES:
   - Presses: Calage, repérage, encrage, mouillage
   - Séchage: UV, IR, température, extraction solvants
   - Finition: Tension bande, découpe, pliage
   - Environnement: Hygrométrie 50-55%, température stable

2. DIAGNOSTICS TYPIQUES:
   - Maculage → Séchage insuffisant, encre, papier
   - Hors repère → Tension, capteur, calage plaques
   - Variations couleur → Encrier, température, viscosité
   - Bourrage → Guides, rouleaux, qualité papier

3. QUALITÉ:
   - Densité encre (spectrodensitomètre)
   - Repérage ±0.1mm
   - Contrôle défauts en ligne`,
        
        safetyRules: `SÉCURITÉ IMPRIMERIE:
- ⚠️ PINCEMENT: Points rentrants nombreux, arrêt machine obligatoire
- ⚠️ SOLVANTS: Ventilation, pas de flamme, EPI
- ⚠️ UV: Exposition interdite, lunettes de protection
- ⚠️ BRUIT: Protection auditive > 85dB
- ⚠️ ROULEAUX: Jamais nettoyer en rotation`,
        
        commonIssues: `PANNES FRÉQUENTES IMPRIMERIE:
- Encrage: Rouleaux (30%), racles (25%), pompes (20%)
- Transport: Courroies (25%), aspirateurs (20%), pinces (15%)
- Séchage: Lampes UV (35%), ventilation (25%), résistances (15%)
- Coupe: Lames (30%), réglages (25%), capteurs (20%)`,
        
        seasonality: `SAISONNALITÉ:
- ÉTÉ: Séchage plus rapide mais surchauffe, encres plus fluides
- HIVER: Électricité statique ↑, papier cassant si trop sec`,
        
        vocabulary: {
            'calage': 'Mise en place des plaques et réglages',
            'la passe': 'Quantité de papier gâché au démarrage',
            'ça maque': 'Transfert encre non désirée',
            'monter en couleur': 'Ajuster densité encre progressivement'
        }
    },

    // =========================================================================
    // 🔧 GENERAL INDUSTRIAL (FALLBACK)
    // =========================================================================
    {
        id: 'general_industrial',
        name: 'Maintenance Industrielle Générale',
        nameEn: 'General Industrial Maintenance',
        keywords: [], // Fallback - matches everything
        typicalEquipment: [
            'moteur', 'motor', 'pompe', 'pump', 'compresseur', 'compressor',
            'convoyeur', 'conveyor', 'ventilateur', 'fan', 'vanne', 'valve',
            'automate', 'plc', 'variateur', 'vfd', 'capteur', 'sensor'
        ],
        expertise: `EXPERTISE MAINTENANCE INDUSTRIELLE:

1. SYSTÈMES COMMUNS:
   - Électrique: Moteurs, variateurs, automates, câblage
   - Mécanique: Roulements, courroies, chaînes, engrenages
   - Pneumatique: Compresseurs, vérins, vannes, traitement air
   - Hydraulique: Pompes, vérins, distributeurs, filtration

2. MÉTHODOLOGIE DIAGNOSTIC:
   - Observer: Bruits, odeurs, températures anormales
   - Mesurer: Vibrations, courant, pression, température
   - Analyser: Historique pannes, conditions de fonctionnement
   - Agir: Intervention ciblée, vérifier résultat

3. MAINTENANCE PRÉVENTIVE:
   - Graissage selon plan
   - Contrôle niveaux (huile, liquide refroidissement)
   - Inspection visuelle équipements
   - Relevé compteurs et paramètres`,
        
        safetyRules: `SÉCURITÉ INDUSTRIELLE:
- ⚠️ CADENASSAGE: TOUJOURS avant intervention sur équipement
- ⚠️ EPI: Selon zone et travail (lunettes, gants, casque, chaussures)
- ⚠️ TRAVAIL EN HAUTEUR: Harnais obligatoire > 1.8m
- ⚠️ ESPACES CONFINÉS: Procédure spécifique, détecteur gaz
- ⚠️ ÉLECTRIQUE: Habilitation requise, consignation`,
        
        commonIssues: `PANNES FRÉQUENTES GÉNÉRALES:
- Moteurs: Roulements (35%), bobinage (20%), ventilateur (15%)
- Pompes: Garnitures (30%), roulements (25%), roue (15%)
- Compresseurs: Filtres (25%), soupapes (20%), huile (15%)
- Convoyeurs: Courroies/chaînes (35%), moteurs (25%), capteurs (15%)`,
        
        seasonality: `SAISONNALITÉ GÉNÉRALE:
- ÉTÉ: Surchauffe équipements, charge climatisation
- HIVER: Problèmes démarrage, gel, condensation
- ARRÊTS: Profiter pour maintenance préventive lourde`
    }
];

// =============================================================================
// INDUSTRY DETECTION FUNCTION
// =============================================================================

/**
 * Detects the most likely industry based on company subtitle and equipment types
 */
export function detectIndustry(
    subtitle: string = '', 
    equipmentTypes: string[] = []
): IndustryTemplate {
    const searchText = [
        subtitle.toLowerCase(),
        ...equipmentTypes.map(e => e.toLowerCase())
    ].join(' ');

    let bestMatch: IndustryTemplate | null = null;
    let bestScore = 0;

    for (const template of INDUSTRY_TEMPLATES) {
        // Skip the general template in first pass
        if (template.id === 'general_industrial') continue;

        let score = 0;
        
        // Check keywords in subtitle and equipment
        for (const keyword of template.keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                score += 2; // Keywords are weighted heavily
            }
        }

        // Check if equipment matches typical equipment
        for (const equipment of template.typicalEquipment) {
            if (searchText.includes(equipment.toLowerCase())) {
                score += 1;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = template;
        }
    }

    // Return best match or fallback to general industrial
    if (bestMatch && bestScore >= 2) {
        console.log(`[AI] Industry detected: ${bestMatch.name} (score: ${bestScore})`);
        return bestMatch;
    }

    console.log(`[AI] No specific industry detected, using general template`);
    return INDUSTRY_TEMPLATES.find(t => t.id === 'general_industrial')!;
}

/**
 * Formats vocabulary as a readable string for the AI prompt
 */
export function formatVocabulary(vocabulary: Record<string, string> | undefined): string {
    if (!vocabulary || Object.keys(vocabulary).length === 0) {
        return '';
    }

    const entries = Object.entries(vocabulary)
        .map(([term, meaning]) => `- "${term}" = ${meaning}`)
        .join('\n');

    return `\nVOCABULAIRE LOCAL À COMPRENDRE:\n${entries}`;
}
