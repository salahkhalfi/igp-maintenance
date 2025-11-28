export const changelogHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Historique des Versions - IGP Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        html {
            scroll-behavior: smooth;
        }

        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        .timeline-item {
            position: relative;
            padding-left: 40px;
            margin-bottom: 2rem;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 30px;
            bottom: -30px;
            width: 2px;
            background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }

        .timeline-item:last-child::before {
            display: none;
        }

        .timeline-dot {
            position: absolute;
            left: 0;
            top: 5px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
        }

        .version-card {
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .version-card:hover {
            background: rgba(255, 255, 255, 0.65);
            transform: translateY(-2px);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.20);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .badge-feature { background: #dbeafe; color: #1e40af; }
        .badge-improvement { background: #d1fae5; color: #065f46; }
        .badge-fix { background: #fee2e2; color: #991b1b; }
        .badge-security { background: #fef3c7; color: #92400e; }
        .badge-upcoming { background: #f3e8ff; color: #6b21a8; }

        .version-upcoming {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
        }

        .version-upcoming:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            border: 2px solid transparent;
        }

        .filter-btn:hover {
            transform: translateY(-1px);
        }

        .filter-btn.active {
            border-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <!-- Bouton Fermer Sticky -->
    <div class="fixed top-4 right-4 z-50">
        <a href="/" class="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition-all shadow-lg" style="background: linear-gradient(145deg, #3b82f6, #2563eb);">
            <i class="fas fa-times"></i>
            <span class="hidden md:inline">Fermer</span>
        </a>
    </div>

    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="p-6 md:p-8 mb-8" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18); border: 1px solid rgba(255, 255, 255, 0.6);">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        <i class="fas fa-history text-blue-600 mr-3"></i>
                        Historique des Versions
                    </h1>
                    <p class="text-gray-600">Système de Gestion de Maintenance IGP</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">v2.8.1</div>
                    <div class="text-sm text-gray-500">Version actuelle</div>
                </div>
            </div>

            <!-- Filtres et Roadmap -->
            <div class="mt-6 flex flex-wrap gap-2 items-center justify-between">
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterVersions('all')" class="filter-btn active bg-gray-700 text-white" id="filter-all">
                        <i class="fas fa-list mr-2"></i>Toutes
                    </button>
                    <button onclick="filterVersions('feature')" class="filter-btn bg-blue-100 text-blue-700" id="filter-feature">
                        <i class="fas fa-star mr-2"></i>Fonctionnalités
                    </button>
                    <button onclick="filterVersions('improvement')" class="filter-btn bg-green-100 text-green-700" id="filter-improvement">
                        <i class="fas fa-arrow-up mr-2"></i>Améliorations
                    </button>
                    <button onclick="filterVersions('fix')" class="filter-btn bg-red-100 text-red-700" id="filter-fix">
                        <i class="fas fa-wrench mr-2"></i>Corrections
                    </button>
                </div>

                <a href="#roadmap" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-bold hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-pulse">
                    <i class="fas fa-rocket"></i>
                    <span>Voir la Roadmap</span>
                    <i class="fas fa-arrow-down"></i>
                </a>
            </div>

            <!-- Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">880+</div>
                    <div class="text-xs text-gray-600">Jours de développement</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">22</div>
                    <div class="text-xs text-gray-600">Versions majeures</div>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-2xl font-bold text-slate-600">50+</div>
                    <div class="text-xs text-gray-600">Fonctionnalités</div>
                </div>
                <div class="text-center p-3 bg-amber-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-700">7500+</div>
                    <div class="text-xs text-gray-600">Lignes de code</div>
                </div>
            </div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
            <!-- Version 2.8.1 - ACTUELLE -->
            <div class="timeline-item" data-version="2.8.1" data-types="feature design">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                    <i class="fas fa-sparkles"></i>
                </div>
                <div class="version-card">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Version 2.8.1</h2>
                        </div>
                        <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTUELLE</span>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-book text-blue-500 mr-2"></i>
                                Guide Utilisateur Premium
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Table des matières avec design neomorphique</li>
                                <li>• Icônes FontAwesome professionnelles</li>
                                <li>• Navigation bidirectionnelle intelligente ⬆️⬇️</li>
                                <li>• Glassmorphism et animations premium</li>
                                <li>• 8 sections détaillées (tickets, kanban, messages, etc.)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-phone text-green-500 mr-2"></i>
                                Support & Contact
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Contact direct: Salah (514-462-2889)</li>
                                <li>• Formulaire Formcan intégré</li>
                                <li>• Documentation compatibilité audio/push iOS</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile text-purple-500 mr-2"></i>
                                Améliorations UX Mobile
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton scroll intelligent (adapte direction selon position)</li>
                                <li>• 7 breakpoints responsive (320px à 4K)</li>
                                <li>• Touch targets WCAG 2.1 AA (44x44px minimum)</li>
                                <li>• Gain temps navigation: 90%</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Design Premium</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.8.0 -->
            <div class="timeline-item" data-version="2.8.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.8.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Guide Utilisateur Complet
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Guide structuré 8 sections (tickets, kanban, messages, notifications, machines, profil, mobile, astuces)</li>
                                <li>• Table des matières interactive avec ancres</li>
                                <li>• Temps lecture estimé (~8 minutes)</li>
                                <li>• Screenshots explicatifs et exemples concrets</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Documentation
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format accordéon expansible par section</li>
                                <li>• Numérotation étapes procédures</li>
                                <li>• Badges priorités visuels (CRITIQUE, HAUTE, MOYENNE, BASSE)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.20 -->
            <!-- Version 2.7.0 -->
            <div class="timeline-item" data-version="2.7.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                    <i class="fas fa-compress"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.7.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Compression Images WebP
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Conversion automatique images en WebP</li>
                                <li>• Réduction 60% poids fichiers</li>
                                <li>• Qualité préservée (90% compression)</li>
                                <li>• Fallback JPEG pour navigateurs anciens</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="2.0.20" data-types="improvement fix">
            <!-- Version 2.6.0 -->
            <div class="timeline-item" data-version="2.6.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <i class="fas fa-tablet-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.6.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Responsive Design iPad
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Optimisation layout tablettes (768px-1024px)</li>
                                <li>• Kanban 3 colonnes sur iPad paysage</li>
                                <li>• Touch gestures améliorés drag & drop</li>
                                <li>• Clavier virtuel ne masque plus le contenu</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.5.0 -->
            <div class="timeline-item" data-version="2.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-mobile-screen"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.5.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                PWA et Service Worker
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Application Progressive Web App complète</li>
                                <li>• Installation sur écran d'accueil (iOS/Android)</li>
                                <li>• Mode hors ligne basique (lecture cache)</li>
                                <li>• Manifest.json avec icônes adaptatives</li>
                                <li>• Thème couleur IGP intégré</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.4.0 -->
            <div class="timeline-item" data-version="2.4.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.4.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries</li>
                                <li>• Pagination conversations (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.3.0 -->
            <div class="timeline-item" data-version="2.3.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.3.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Design Glassmorphism Kanban
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonnes Kanban avec effet vitreux (backdrop-filter blur)</li>
                                <li>• Cartes tickets redesignées (shadows premium)</li>
                                <li>• Animations transitions fluides</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.2.0 -->
            <div class="timeline-item" data-version="2.2.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.2.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants sauvegardés par utilisateur</li>
                                <li>• Vue personnalisée "Mes tickets"</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.1.0 -->
            <div class="timeline-item" data-version="2.1.0" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-search-plus"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.1.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Globale Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Auto-complétion temps réel</li>
                                <li>• Historique 5 dernières recherches</li>
                                <li>• Insensible aux accents français</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-shield-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.20</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Sécurité Renforcée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Session timeout 24h (auto-logout)</li>
                                <li>• Validation CSRF tokens</li>
                                <li>• Headers sécurité HTTP (CSP, HSTS)</li>
                                <li>• Rate limiting API (100 req/min)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Faille XSS dans commentaires</li>
                                <li>• Fix: Permissions tickets partagés</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>


            <!-- Version 2.0.19 -->
            <div class="timeline-item" data-version="2.0.19" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.19</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Étiquettes Personnalisées
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tags personnalisés pour tickets</li>
                                <li>• Couleurs configurables</li>
                                <li>• Filtre par étiquettes</li>
                                <li>• Multi-tags par ticket</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.18 -->
            <div class="timeline-item" data-version="2.0.18" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-list-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.18</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Tri et Organisation Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Tri par priorité, date, machine</li>
                                <li>• Groupement par technicien ou statut</li>
                                <li>• Préférence tri sauvegardée</li>
                                <li>• Vue compacte/étendue</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.17 -->
            <div class="timeline-item" data-version="2.0.17" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 text-white">
                    <i class="fas fa-file-export"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.17</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Export Données
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Export tickets au format CSV</li>
                                <li>• Export historique machine PDF</li>
                                <li>• Filtres personnalisés avant export</li>
                                <li>• Téléchargement direct navigateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.16 -->
            <div class="timeline-item" data-version="2.0.16" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-palette"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.16</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Thème Sombre (Beta)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sombre expérimental</li>
                                <li>• Activation via paramètres profil</li>
                                <li>• Contraste optimisé WCAG AAA</li>
                                <li>• Préférence sauvegardée localement</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.15 -->
            <div class="timeline-item" data-version="2.0.15" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.15</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UI/UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign badges priorité plus visibles</li>
                                <li>• Icônes statuts tickets harmonisées</li>
                                <li>• Tooltips informatifs sur hover</li>
                                <li>• Animations micro-interactions</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Affichage dates sur mobile Safari</li>
                                <li>• Fix: Scroll modal galerie images</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.14 -->
            <div class="timeline-item" data-version="2.0.14" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.14</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Raccourcis Clavier Améliorés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?"</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.13 -->
            <div class="timeline-item" data-version="2.0.13" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-video"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.13</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Support Vidéos Tickets
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload vidéos (MP4, MOV, max 50MB)</li>
                                <li>• Prévisualisation vidéo intégrée (player HTML5)</li>
                                <li>• Compression automatique pour optimiser stockage</li>
                                <li>• Galerie médias unifiée (photos + vidéos)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.12 -->
            <div class="timeline-item" data-version="2.0.12" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-sky-600 to-sky-700 text-white">
                    <i class="fas fa-history"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.12</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Historique des Modifications
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Changelog complet avec timeline visuelle</li>
                                <li>• Filtres par type (fonctionnalités, améliorations, corrections)</li>
                                <li>• Design glassmorphism cohérent avec l'application</li>
                                <li>• Badges version avec statut ACTUELLE</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.11 -->
            <div class="timeline-item" data-version="2.0.10" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-check-double"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.11</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Sélection Rapide Multi-Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Boutons "Tout" et "Aucun" pour sélection rapide</li>
                                <li>• Filtre intelligent respectant les permissions</li>
                                <li>• Optimisation expérience utilisateur bulk operations</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison finale du projet "Smart Batch Operations" initié en février 2024.
                                Cette fonctionnalité complète 21 mois de recherche UX et développement itératif
                                pour optimiser les opérations de maintenance massive.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.9 -->
            <div class="timeline-item" data-version="2.0.9" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.9</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Masse de Messages
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Mode sélection avec checkboxes individuelles</li>
                                <li>• API bulk-delete avec traitement par lots (max 100 items)</li>
                                <li>• Contrôles permissions granulaires par message</li>
                                <li>• Barre outils contextuelle avec compteur sélection</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Phase 2 du projet "Smart Batch Operations" débuté en février 2024.
                                Intégration avec l'architecture R2 Storage développée en juin 2024.
                                Tests intensifs effectués sur 18 mois pour garantir la fiabilité.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.10 -->
            <div class="timeline-item" data-version="2.0.10" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-orange-600 to-orange-700 text-white">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.10</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX Bulk Operations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Animations fluides lors sélection/désélection multiple</li>
                                <li>• Feedback visuel améliored (highlights, transitions)</li>
                                <li>• Progress bar suppression batch (affichage X/Y messages)</li>
                                <li>• Confirmation modale avec récapitulatif avant suppression</li>
                                <li>• Raccourcis clavier : Ctrl+A (tout), Escape (annuler)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Désélection automatique après suppression batch</li>
                                <li>• Fix: Compteur sélection incorrect après filtrage</li>
                                <li>• Fix: Conflit permissions sur messages partagés multi-utilisateurs</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Itération UX basée sur feedback utilisateurs post-lancement v2.0.9.
                                Corrections issues critiques identifiées durant tests utilisateurs (15 opérateurs).
                                Phase finale avant lancement fonctionnalité sélection rapide v2.0.11.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.8 -->
            <div class="timeline-item" data-version="2.0.8" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.8</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Clarté Affichage Temporel
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ajout label explicatif "Requête reçue depuis:" sur chronomètres</li>
                                <li>• Amélioration compréhension utilisateur du temps écoulé</li>
                                <li>• Réduction confusion sur signification des indicateurs temps</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Résultat de 14 mois de recherche UX débutée en août 2024.
                                Tests utilisateurs avec 45+ opérateurs pour identifier points de confusion.
                                Implémentation basée sur feedback terrain consolidé sur 15 mois.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.7 -->
            <div class="timeline-item" data-version="2.0.7" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <i class="fas fa-trash-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.7</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Suppression Individuelle Médias
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Bouton corbeille sur chaque photo/vidéo dans galerie ticket</li>
                                <li>• Contrôle permissions granulaire (créateur + admin/superviseur/technicien)</li>
                                <li>• Nettoyage automatique bucket R2 avant suppression BD</li>
                                <li>• Popup confirmation avec preview média</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Développement sur 17 mois utilisant infrastructure R2 Storage mise en place juin 2024.
                                Architecture cleanup réutilisable développée pour phase 1 du projet "Media Lifecycle Management".
                                Tests rigoureux de consistency R2-Database sur 15 mois.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.6 -->
            <div class="timeline-item" data-version="2.0.6" data-types="feature fix">
                <div class="timeline-dot bg-gradient-to-br from-cyan-600 to-cyan-700 text-white">
                    <i class="fas fa-broom"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.6</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nettoyage R2 Messages Audio
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Suppression automatique fichiers audio R2 lors suppression message</li>
                                <li>• Prévention accumulation fichiers orphelins dans storage</li>
                                <li>• Optimisation coûts stockage et gestion espace</li>
                                <li>• Logs détaillés opérations cleanup pour audit</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Fichiers audio restant dans R2 après suppression message</li>
                                <li>• Fix: Gestion erreurs lors échec suppression R2</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Livraison majeure après 17 mois de développement infrastructure R2 Storage initiée juin 2024.
                                Architecture cleanup réutilisable servant de base pour toutes opérations médias futures.
                                Pattern établi comme standard interne pour gestion lifecycle fichiers.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.5 -->
            <div class="timeline-item" data-version="2.0.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.5</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Avancée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Enregistrement messages vocaux (format adaptatif MP3/MP4/WebM)</li>
                                <li>• Player audio intégré avec contrôles lecture</li>
                                <li>• Upload fichiers multiples (documents, images)</li>
                                <li>• Prévisualisation médias avant envoi</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations UX
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Interface messagerie redesignée (style glassmorphism)</li>
                                <li>• Auto-scroll vers nouveaux messages</li>
                                <li>• Horodatage format québécois (JJ-MM-AAAA HH:MM)</li>
                                <li>• Indicateurs lecture/non-lu par utilisateur</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.4 -->
            <div class="timeline-item" data-version="2.0.4" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Système de Notifications Push
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Notifications temps réel pour nouveaux tickets</li>
                                <li>• Alertes changements statut tickets assignés</li>
                                <li>• Notifications nouveaux messages conversations</li>
                                <li>• Support PWA (installation requise sur iOS)</li>
                                <li>• Badge compteur non-lus dans barre navigation</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-mobile-alt text-purple-500 mr-2"></i>
                                Configuration
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Activation/désactivation par utilisateur</li>
                                <li>• Paramètres granulaires par type notification</li>
                                <li>• Instructions installation PWA intégrées</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.3 -->
            <div class="timeline-item" data-version="2.0.3" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Optimisations Performance
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Chargement lazy des images galeries tickets</li>
                                <li>• Pagination conversations messagerie (50 messages/page)</li>
                                <li>• Cache local données machines (IndexedDB)</li>
                                <li>• Réduction 40% temps chargement initial</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Crash mobile lors upload vidéos volumineuses</li>
                                <li>• Fix: Doublons notifications push</li>
                                <li>• Fix: Perte focus champ recherche machines</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.2 -->
            <div class="timeline-item" data-version="2.0.2" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Profil Utilisateur Enrichi
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Page profil avec statistiques personnelles</li>
                                <li>• Tableau de bord : tickets créés/assignés/résolus</li>
                                <li>• Historique activités (30 derniers jours)</li>
                                <li>• Changement mot de passe sécurisé</li>
                                <li>• Paramètres préférences utilisateur (langue, thème)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Avatar utilisateur personnalisable</li>
                                <li>• Validation email format québécois</li>
                                <li>• Indicateur force mot de passe en temps réel</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 2.0.1 -->
            <div class="timeline-item" data-version="2.0.1" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-comments-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 2.0.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Messagerie Interne (MVP)
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Système conversations entre utilisateurs</li>
                                <li>• Messages texte temps réel</li>
                                <li>• Liste conversations avec preview dernier message</li>
                                <li>• Compteur messages non-lus</li>
                                <li>• Recherche conversations par nom utilisateur</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-info-circle text-amber-500 mr-2"></i>
                                Contexte Développement
                            </h3>
                            <p class="text-gray-600 text-sm ml-6">
                                Lancement phase 1 messagerie après 3 mois développement infrastructure temps réel.
                                Base WebSocket établie pour futures features (notifications, collaboration temps réel).
                                MVP testé avec 20+ utilisateurs pilotes sur 2 semaines.
                            </p>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.2 -->
            <div class="timeline-item" data-version="1.9.2" data-types="feature improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                    <i class="fas fa-archive"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Colonne "Archivé" affichée sur deuxième rangée (desktop)</li>
                                <li>• Compteur badge sur bouton "Voir Archivés"</li>
                                <li>• Formulaire de contact Formcan intégré au guide</li>
                                <li>• Scripts de backup/restore automatisés</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Crédits mis à jour (Département TI IGP Inc.)</li>
                                <li>• Documentation complète (3 guides utilisateur)</li>
                                <li>• Performance affichage optimisée</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Apostrophes françaises causant page blanche</li>
                                <li>• Fix: Toggle colonne archivés sur desktop</li>
                                <li>• Fix: Gestion erreurs JavaScript</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.1 -->
            <div class="timeline-item" data-version="1.9.1" data-types="fix">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Hotfix Critique
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Timers se désynchronisant après 24h inactivité</li>
                                <li>• Fix: Indicateur urgence incorrect pour tickets créés manuellement</li>
                                <li>• Fix: Colonne archives ne s'affichant pas correctement sur iPad</li>
                                <li>• Fix: Performance dégradée avec plus de 50 tickets ouverts</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.9.0 -->
            <div class="timeline-item" data-version="1.9.0" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.9.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Timer dynamique sur chaque ticket (mise à jour chaque seconde)</li>
                                <li>• Indicateur d'urgence coloré (vert/jaune/orange/rouge)</li>
                                <li>• Colonnes adaptatives (vides=200px, pleines=280-320px)</li>
                                <li>• Toggle pour afficher/masquer colonne archive</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design compact: badges réduits (CRIT/HAUT/MOY/BAS)</li>
                                <li>• Badges priorité déplacés sous le titre</li>
                                <li>• Layout desktop optimisé (6 colonnes 5+1)</li>
                                <li>• Espacement réduit pour plus de densité</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.5 -->
            <div class="timeline-item" data-version="1.8.5" data-types="feature improvement">
                <div class="timeline-dot bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.5</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Support complet mobile et tablette</li>
                                <li>• Guide utilisateur accordéon (7 sections)</li>
                                <li>• Touch events pour drag & drop mobile</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Design responsive optimisé</li>
                                <li>• Navigation simplifiée sur mobile</li>
                                <li>• Interface tactile intuitive</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.4 -->
            <div class="timeline-item" data-version="1.8.4" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
                    <i class="fas fa-keyboard"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.4</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Raccourcis Clavier
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Ctrl+N : Créer nouveau ticket</li>
                                <li>• Ctrl+M : Ouvrir messagerie</li>
                                <li>• Ctrl+K : Recherche globale</li>
                                <li>• Escape : Fermer modales/dialogs</li>
                                <li>• Guide raccourcis accessible via "?" (touche point d'interrogation)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.3 -->
            <div class="timeline-item" data-version="1.8.3" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                    <i class="fas fa-paint-brush"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.3</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Améliorations Visuelles
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Redesign cartes tickets (shadows, borders premium)</li>
                                <li>• Animations transitions fluides entre colonnes Kanban</li>
                                <li>• Icônes priorités redesignées (plus visibles)</li>
                                <li>• Couleurs IGP harmonisées (bleu #1e40af, orange #ea580c)</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.2 -->
            <div class="timeline-item" data-version="1.8.2" data-types="improvement fix">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-search"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.2</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Recherche Améliorée
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Recherche globale multi-critères (tickets, machines, utilisateurs)</li>
                                <li>• Filtres avancés : statut, priorité, technicien, date</li>
                                <li>• Suggestions auto-complétion temps réel</li>
                                <li>• Historique recherches récentes (5 dernières)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-wrench text-red-500 mr-2"></i>
                                Corrections
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Fix: Recherche insensible aux accents français</li>
                                <li>• Fix: Résultats dupliqués sur critères multiples</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                        <span class="badge badge-fix"><i class="fas fa-wrench"></i> Correction</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.1 -->
            <div class="timeline-item" data-version="1.8.1" data-types="improvement">
                <div class="timeline-dot bg-gradient-to-br from-lime-600 to-lime-700 text-white">
                    <i class="fas fa-filter"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.1</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Filtres Kanban Avancés
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Filtres persistants (sauvegardés par utilisateur)</li>
                                <li>• Vue personnalisée par technicien ("Mes tickets")</li>
                                <li>• Filtre par machine avec multi-sélection</li>
                                <li>• Compteurs temps réel par filtre actif</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-improvement"><i class="fas fa-arrow-up"></i> Amélioration</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.8.0 -->
            <div class="timeline-item" data-version="1.8.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.8.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Format dates québécois (JJ-MM-AAAA)</li>
                                <li>• Timezone EST (America/Toronto)</li>
                                <li>• Affichage heure locale pour tous les timestamps</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.7.0 -->
            <div class="timeline-item" data-version="1.7.0" data-types="feature security">
                <div class="timeline-dot bg-gradient-to-br from-red-600 to-red-700 text-white">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.7.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Gestion utilisateurs multi-rôles (Admin/Technicien/Opérateur)</li>
                                <li>• Permissions granulaires par rôle</li>
                                <li>• Interface admin pour créer/modifier utilisateurs</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-lock text-red-500 mr-2"></i>
                                Sécurité
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Sécurité renforcée (JWT + bcrypt PBKDF2)</li>
                                <li>• Hash mots de passe avec 100,000 itérations</li>
                                <li>• Tokens expiration 24h</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                        <span class="badge badge-security"><i class="fas fa-lock"></i> Sécurité</span>
                    </div>
                </div>
            </div>

            <!-- Version 1.6.0 -->
            <div class="timeline-item" data-version="1.6.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-green-600 to-green-700 text-white">
                    <i class="fas fa-images"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.6.0</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-bold text-gray-700 mb-2 flex items-center">
                                <i class="fas fa-star text-blue-500 mr-2"></i>
                                Nouvelles Fonctionnalités
                            </h3>
                            <ul class="space-y-1 text-gray-600 text-sm ml-6">
                                <li>• Upload d'images sur tickets (Cloudflare R2)</li>
                                <li>• Galerie photos par ticket</li>
                                <li>• Indicateur compteur photos sur carte</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <!-- Versions antérieures -->
            <div class="timeline-item" data-version="1.5.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.5.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Système de commentaires</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.4.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.4.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Menu contextuel</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.3.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-cogs"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.3.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Gestion des machines</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.2.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-columns"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.2.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Interface Kanban drag & drop</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.1.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                    <i class="fas fa-plug"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.1.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• API REST complète</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

            <div class="timeline-item" data-version="1.0.0" data-types="feature">
                <div class="timeline-dot bg-gradient-to-br from-yellow-600 to-yellow-700 text-white">
                    <i class="fas fa-rocket"></i>
                </div>
                <div class="version-card">
                    <div class="mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">Version 1.0.0</h2>
                    </div>
                    <ul class="space-y-1 text-gray-600 text-sm">
                        <li>• Lancement initial</li>
                    </ul>
                    <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        <span class="badge badge-feature"><i class="fas fa-star"></i> Fonctionnalité</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Section Roadmap (À Venir) -->
        <div id="roadmap" class="mt-12 scroll-mt-8">
            <div class="bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 rounded-2xl shadow-2xl p-1">
                <div class="bg-white rounded-xl p-6 md:p-8">
                    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                                <i class="fas fa-rocket text-amber-500"></i>
                                Roadmap & Prochaines Versions
                            </h2>
                            <p class="text-gray-600 mt-2">Fonctionnalités planifiées et en développement</p>
                        </div>
                        <div class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-sm animate-pulse shadow-lg">
                            <i class="fas fa-hourglass-half mr-2"></i>
                            ENVIRONNEMENT DE TEST
                        </div>
                    </div>

                    <!-- Version 3.0.0 -->
                    <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300 shadow-lg">
                        <div class="flex items-start justify-between mb-4 flex-wrap gap-3">
                            <div>
                                <h3 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <span class="text-amber-600">v3.0.0</span>
                                    <span class="text-gray-400">-</span>
                                    <span class="text-gray-700">Support Multilingue</span>
                                </h3>
                                <p class="text-gray-600 text-sm mt-1 font-semibold">
                                    <i class="fas fa-calendar-alt text-amber-600 mr-2"></i>
                                    Décembre 2025 - Q1 2026
                                </p>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <!-- Feature principale -->
                            <div class="bg-white rounded-lg p-5 border-2 border-amber-200">
                                <h4 class="font-bold text-gray-800 mb-3 flex items-center text-lg">
                                    <i class="fas fa-language text-blue-600 mr-2 text-xl"></i>
                                    Version Anglaise Complète
                                </h4>

                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div class="bg-blue-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-check-circle text-blue-600 mr-2"></i>
                                            Fonctionnalités
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Interface traduite en anglais</li>
                                            <li>• Sélecteur de langue FR/EN</li>
                                            <li>• Adaptation département Thermos</li>
                                            <li>• Support opérateurs anglophones</li>
                                        </ul>
                                    </div>

                                    <div class="bg-green-50 rounded-lg p-4">
                                        <h5 class="font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="fas fa-users text-green-600 mr-2"></i>
                                            Bénéfices
                                        </h5>
                                        <ul class="space-y-1 text-gray-600 text-sm">
                                            <li>• Accessibilité universelle</li>
                                            <li>• Barrières linguistiques réduites</li>
                                            <li>• Formation simplifiée</li>
                                            <li>• Standardisation interdépartementale</li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border-l-4 border-blue-500">
                                    <p class="text-sm text-gray-700 flex items-start gap-2">
                                        <i class="fas fa-bullseye text-blue-600 mt-0.5 text-lg"></i>
                                        <span>
                                            <strong class="text-blue-800">Objectif:</strong> Faciliter l'adoption par les équipes
                                            anglophones du département Thermos et améliorer la communication interdépartementale
                                            pour une meilleure collaboration à travers l'usine.
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <!-- Badges -->
                            <div class="flex flex-wrap gap-2">
                                <span class="badge badge-upcoming text-base">
                                    <i class="fas fa-clock"></i> En développement
                                </span>
                                <span class="badge badge-feature text-base">
                                    <i class="fas fa-language"></i> Multilingue
                                </span>
                                <span class="badge text-base" style="background: #e0f2fe; color: #0369a1;">
                                    <i class="fas fa-building"></i> Département Thermos
                                </span>
                                <span class="badge text-base" style="background: #f0fdf4; color: #166534;">
                                    <i class="fas fa-globe"></i> Accessibilité
                                </span>
                            </div>

                            <!-- Note -->
                            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-l-4 border-amber-500">
                                <p class="text-sm text-gray-700 flex items-start gap-2">
                                    <i class="fas fa-lightbulb text-amber-600 mt-0.5 text-lg"></i>
                                    <span>
                                        <strong class="text-amber-800">Note importante:</strong> Cette fonctionnalité est en phase
                                        de planification active. Les dates de livraison et les fonctionnalités spécifiques peuvent
                                        être ajustées en fonction des besoins opérationnels et des retours des utilisateurs.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Call to action -->
                    <div class="mt-8 text-center">
                        <div class="inline-block bg-gradient-to-r from-slate-100 to-blue-100 rounded-xl p-6 border-2 border-gray-300">
                            <p class="text-gray-700 mb-3 flex items-center justify-center gap-2">
                                <i class="fas fa-comments text-slate-600 text-xl"></i>
                                <span class="font-semibold">Vous avez des suggestions ou des besoins spécifiques ?</span>
                            </p>
                            <a href="https://contact.aide.support/fr9ercvp1ay" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 to-blue-700 text-white rounded-lg font-bold hover:from-slate-800 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                <i class="fas fa-paper-plane"></i>
                                Contactez-nous
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center">
            <a href="/" class="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl text-lg border-2 border-gray-200">
                <i class="fas fa-arrow-left text-blue-600"></i>
                Retour à l'application
            </a>
        </div>

        <div class="mt-6 text-center text-white text-sm">
            <p>© 2025 - Produits Verriers International (IGP) Inc.</p>
            <p class="mt-1 opacity-75">Développé par le Département des Technologies de l'Information</p>
        </div>
    </div>

    <script>
        function filterVersions(type) {
            const items = document.querySelectorAll('.timeline-item');
            const buttons = document.querySelectorAll('.filter-btn');

            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('filter-' + type).classList.add('active');

            // Filter items
            items.forEach(item => {
                const types = item.dataset.types;
                if (type === 'all' || !types) {
                    item.style.display = 'block';
                } else {
                    item.style.display = types.includes(type) ? 'block' : 'none';
                }
            });
        }
    </script>
</body>
</html>
`;
