export const historiqueHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Historique des Améliorations - Système de Gestion</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }
        
        .container-glass {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.6);
        }
        
        .timeline-item {
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-left: 4px solid;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .timeline-item:hover {
            background: rgba(255, 255, 255, 0.70);
            transform: translateX(8px);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.20);
        }
        
        .timeline-item.major {
            border-left-color: #3b82f6;
        }
        
        .timeline-item.feature {
            border-left-color: #10b981;
        }
        
        .timeline-item.fix {
            border-left-color: #f59e0b;
        }
        
        .timeline-item.design {
            border-left-color: #8b5cf6;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        
        .badge-major {
            background: rgba(59, 130, 246, 0.15);
            color: #1e40af;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .badge-feature {
            background: rgba(16, 185, 129, 0.15);
            color: #065f46;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .badge-fix {
            background: rgba(245, 158, 11, 0.15);
            color: #92400e;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .badge-design {
            background: rgba(139, 92, 246, 0.15);
            color: #5b21b6;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .icon-circle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
            flex-shrink: 0;
        }
        
        .back-button {
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 6px 6px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .back-button:hover {
            transform: translateY(-2px);
            box-shadow: 8px 8px 16px rgba(37, 99, 235, 0.4);
        }
        
        @media (max-width: 768px) {
            .timeline-item {
                padding: 16px;
            }
            
            .icon-circle {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="container-glass p-6 md:p-8 mb-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                    <div class="icon-circle bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                        <i class="fas fa-history"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Historique des Améliorations</h1>
                        <p class="text-sm text-gray-600 mt-1">Évolution chronologique du système Système de Gestion</p>
                    </div>
                </div>
                <button onclick="window.location.href='/'" class="back-button">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour
                </button>
            </div>
        </div>

        <!-- Timeline -->
        <div class="space-y-6">
            
            <!-- Guide Premium & TOC -->
            <div class="timeline-item design">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                        <i class="fas fa-palette"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-design">
                                <i class="fas fa-paint-brush"></i>
                                Design Premium
                            </span>
                            <span class="text-sm text-gray-600">v2.8.1</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Table des Matières Premium</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Icônes FontAwesome professionnelles</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Design neomorphique avec containers 3D</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Numérotation professionnelle (01-08)</li>
                            <li><i class="fas fa-check text-purple-600 mr-2"></i>Animations premium et glassmorphism</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Navigation Bidirectionnelle -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-arrows-alt-v"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Navigation Intelligente Haut/Bas</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Bouton flottant qui s'adapte au scroll</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Flèche ⬇️ en haut pour descendre rapidement</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Flèche ⬆️ en bas pour remonter instantanément</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Gain de temps: 90% sur navigation longue</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Formulaire Contact -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Formulaire de Contact Formcan</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Widget Formcan intégré dans le guide</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Canal de contact supplémentaire pour demandes détaillées</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Largeur optimisée pour meilleure ergonomie</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Contact Support -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Contact Direct - Salah</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Numéro direct: 514-462-2889</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Lien cliquable pour appel instantané</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Support technique prioritaire</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Guide Complet v2.5.4 -->
            <div class="timeline-item major">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-major">
                                <i class="fas fa-star"></i>
                                Version Majeure
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Guide Utilisateur Complet</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>8 sections détaillées avec exemples visuels</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Design glassmorphism professionnel</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>100% responsive (320px à 4K)</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>36 fonctionnalités UX premium</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Push Notifications -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Notifications Push</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Notifications temps réel pour nouveaux tickets</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Alertes pour nouveaux messages (texte et vocal)</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Fonctionne même application fermée</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Compatible Desktop, Android et iOS (avec PWA)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Messages Audio -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Messages Vocaux</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Enregistrement audio jusqu'à 2 minutes</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Détection automatique du format (MP3, MP4, WebM)</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Compatibilité universelle iOS et Android</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Idéal pour techniciens sur le terrain</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Messagerie Interne -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-comments"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Messagerie Temps Réel</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Chat instantané entre membres de l'équipe</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Indicateurs de présence en ligne</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Accusés de lecture (double coche bleue)</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Polling automatique toutes les 30 secondes</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Tableau Kanban -->
            <div class="timeline-item major">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                        <i class="fas fa-columns"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-major">
                                <i class="fas fa-star"></i>
                                Version Majeure
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Tableau Kanban Interactif</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Drag & Drop pour déplacer les tickets</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>6 statuts: Requête reçue → Archive</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Tri intelligent par urgence ou date</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Badges de priorité visuels</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Gestion Tickets -->
            <div class="timeline-item major">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-major">
                                <i class="fas fa-star"></i>
                                Version Majeure
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Système de Tickets Complet</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Création/modification/suppression de tickets</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>4 niveaux de priorité (Critique à Basse)</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Assignation aux techniciens</li>
                            <li><i class="fas fa-check text-blue-600 mr-2"></i>Upload de photos et documents</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- PWA Installation -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Application Mobile (PWA)</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Installable sur écran d'accueil</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Mode plein écran sans barre navigation</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Fonctionne hors ligne (cache)</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Icône App sur écran d'accueil</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Gestion Machines -->
            <div class="timeline-item feature">
                <div class="flex gap-4">
                    <div class="icon-circle bg-gradient-to-br from-green-500 to-green-700 text-white">
                        <i class="fas fa-cogs"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3 flex-wrap">
                            <span class="badge badge-feature">
                                <i class="fas fa-plus-circle"></i>
                                Nouvelle Fonctionnalité
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Gestion des Machines</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Catalogue complet des équipements</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Historique des interventions par machine</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Suivi des pièces remplacées</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Identification des problèmes récurrents</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div class="text-center mt-8 mb-4">
            <button onclick="window.location.href='/'" class="back-button">
                <i class="fas fa-arrow-left mr-2"></i>
                Retour à l'application
            </button>
            <p class="text-white text-sm mt-4">
                © 2025 Système de Gestion - Système de Gestion de Maintenance v2.8.1
            </p>
        </div>
    </div>
</body>
</html>`;
