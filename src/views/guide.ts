// Guide HTML generator - accepts baseUrl to avoid hardcoding
export const generateGuideHTML = (baseUrl: string = 'https://example.com'): string => {
  const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide Utilisateur - Système de Gestion</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { scroll-behavior: smooth; }
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            min-height: 100vh;
        }
        .glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .step-card {
            background: linear-gradient(145deg, #f8fafc, #f1f5f9);
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            transition: all 0.2s ease;
        }
        .step-card:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        .icon-box {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .btn-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            font-size: 14px;
        }
        .toc-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
            text-decoration: none;
            color: #334155;
        }
        .toc-link:hover {
            background: #3b82f6;
            color: white;
            transform: translateX(4px);
        }
        .toc-link:hover i { color: white; }
        .kanban-col {
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .priority-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }
        @media (max-width: 768px) {
            .glass { border-radius: 0; }
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
        
        <!-- Header -->
        <div class="glass p-6 mb-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                    <div class="icon-box bg-blue-600 text-white">
                        <i class="fas fa-book"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">Guide Utilisateur</h1>
                        <p class="text-gray-500 text-sm">Système de Gestion - Version Janvier 2025</p>
                    </div>
                </div>
                <a href="/" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-arrow-left"></i>
                    <span>Retour</span>
                </a>
            </div>
        </div>

        <!-- Table des matières -->
        <div class="glass p-6 mb-6" id="top">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-list text-blue-600"></i>
                Table des matières
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="#connexion" class="toc-link">
                    <i class="fas fa-sign-in-alt text-blue-600"></i>
                    <span>1. Se connecter</span>
                </a>
                <a href="#dashboard" class="toc-link">
                    <i class="fas fa-th-large text-purple-600"></i>
                    <span>2. Tableau de bord</span>
                </a>
                <a href="#tickets" class="toc-link">
                    <i class="fas fa-ticket-alt text-orange-600"></i>
                    <span>3. Gérer les tickets</span>
                </a>
                <a href="#vocal" class="toc-link">
                    <i class="fas fa-microphone text-red-600"></i>
                    <span>4. Créer un ticket vocal</span>
                </a>
                <a href="#messenger" class="toc-link">
                    <i class="fas fa-comments text-green-600"></i>
                    <span>5. Messagerie (IGP Connect)</span>
                </a>
                <a href="#notifications" class="toc-link">
                    <i class="fas fa-bell text-yellow-600"></i>
                    <span>6. Notifications</span>
                </a>
                <a href="#planning" class="toc-link">
                    <i class="fas fa-calendar-alt text-indigo-600"></i>
                    <span>7. Planning</span>
                </a>
                <a href="#admin" class="toc-link">
                    <i class="fas fa-cog text-gray-600"></i>
                    <span>8. Administration</span>
                </a>
            </div>
        </div>

        <!-- Section 1: Connexion -->
        <div class="glass p-6 mb-6" id="connexion">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-blue-100 text-blue-600">
                    <i class="fas fa-sign-in-alt"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">1. Se connecter</h2>
            </div>
            
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                        <p class="font-medium text-gray-800">Ouvrir l'application</p>
                        <p class="text-gray-600 text-sm mt-1">Allez à <strong>${domain}</strong> dans votre navigateur (Chrome recommandé)</p>
                    </div>
                </div>
            </div>
            
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                        <p class="font-medium text-gray-800">Entrer vos identifiants</p>
                        <p class="text-gray-600 text-sm mt-1">Saisissez votre <strong>email</strong> et <strong>mot de passe</strong> fournis par l'administrateur</p>
                    </div>
                </div>
            </div>
            
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                        <p class="font-medium text-gray-800">Cliquer sur "Connexion"</p>
                        <p class="text-gray-600 text-sm mt-1">Vous arrivez sur le tableau de bord principal</p>
                    </div>
                </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div class="flex items-start gap-3">
                    <i class="fas fa-lightbulb text-amber-600 mt-1"></i>
                    <div>
                        <p class="font-medium text-amber-800">Astuce</p>
                        <p class="text-amber-700 text-sm">Sur mobile, ajoutez l'app à votre écran d'accueil pour un accès rapide (icône "Partager" puis "Sur l'écran d'accueil")</p>
                    </div>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 2: Dashboard -->
        <div class="glass p-6 mb-6" id="dashboard">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-purple-100 text-purple-600">
                    <i class="fas fa-th-large"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">2. Tableau de bord (Kanban)</h2>
            </div>
            
            <p class="text-gray-600 mb-4">Le tableau de bord affiche tous les tickets organisés en colonnes selon leur statut.</p>
            
            <h3 class="font-semibold text-gray-800 mb-3">Les colonnes</h3>
            <div class="flex flex-wrap gap-2 mb-6">
                <span class="kanban-col bg-blue-100 text-blue-800"><i class="fas fa-inbox"></i> Requête Reçue</span>
                <span class="kanban-col bg-yellow-100 text-yellow-800"><i class="fas fa-search"></i> Diagnostic</span>
                <span class="kanban-col bg-orange-100 text-orange-800"><i class="fas fa-wrench"></i> En Cours</span>
                <span class="kanban-col bg-purple-100 text-purple-800"><i class="fas fa-clock"></i> En Attente Pièces</span>
                <span class="kanban-col bg-green-100 text-green-800"><i class="fas fa-check-circle"></i> Terminé</span>
            </div>
            
            <h3 class="font-semibold text-gray-800 mb-3">Barre de navigation (en haut)</h3>
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-600 mb-3">De gauche à droite :</p>
                <div class="flex flex-wrap gap-3">
                    <div class="flex items-center gap-2">
                        <span class="btn-icon bg-gray-100 text-gray-600"><i class="fas fa-search"></i></span>
                        <span class="text-sm text-gray-600">Recherche</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">Retard</span>
                        <span class="text-sm text-gray-600">Tickets en retard</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs font-medium">Performance</span>
                        <span class="text-sm text-gray-600">Statistiques</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">Planning</span>
                        <span class="text-sm text-gray-600">Calendrier</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium"><i class="fas fa-plus mr-1"></i>Nouveau Ticket</span>
                    </div>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Menu utilisateur (cliquer sur votre nom)</h3>
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-500 mb-3">ACTIONS RAPIDES</p>
                <div class="space-y-2">
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-red-100 text-red-600"><i class="fas fa-exclamation-circle"></i></span>
                        <span class="text-sm text-gray-700">Tickets en Retard</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-purple-100 text-purple-600"><i class="fas fa-chart-line"></i></span>
                        <span class="text-sm text-gray-700">Statistiques Performance</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-green-100 text-green-600"><i class="fas fa-bell"></i></span>
                        <span class="text-sm text-gray-700">Notifications Push</span>
                        <span class="px-2 py-0.5 bg-green-500 text-white text-xs rounded">ON</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-blue-100 text-blue-600"><i class="fas fa-mobile-alt"></i></span>
                        <span class="text-sm text-gray-700">Gérer mes appareils</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-pink-100 text-pink-600"><i class="fas fa-robot"></i></span>
                        <span class="text-sm text-gray-700">Expert Industriel (IA)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="btn-icon bg-gray-100 text-gray-600"><i class="fas fa-archive"></i></span>
                        <span class="text-sm text-gray-700">Voir les tickets archivés</span>
                    </div>
                </div>
                <p class="text-sm text-gray-500 mt-4 mb-2">GESTION</p>
                <div class="flex items-center gap-3">
                    <span class="btn-icon bg-blue-100 text-blue-600"><i class="fas fa-users"></i></span>
                    <span class="text-sm text-gray-700">Gestion Utilisateurs</span>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Bouton vocal</h3>
            <div class="step-card p-4">
                <div class="flex items-center gap-3">
                    <span class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl"><i class="fas fa-microphone"></i></span>
                    <div>
                        <p class="font-medium text-gray-800">Bouton microphone (coin inférieur droit)</p>
                        <p class="text-gray-600 text-sm">Créer un ticket par la voix - toujours visible</p>
                    </div>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 3: Tickets -->
        <div class="glass p-6 mb-6" id="tickets">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-orange-100 text-orange-600">
                    <i class="fas fa-ticket-alt"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">3. Gérer les tickets</h2>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Créer un ticket</h3>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                        <p class="font-medium text-gray-800">Cliquer sur <span class="px-3 py-1 bg-blue-600 text-white rounded text-sm inline-flex items-center mx-1"><i class="fas fa-plus mr-1"></i>Nouveau Ticket</span></p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                        <p class="font-medium text-gray-800">Remplir les champs</p>
                        <ul class="text-gray-600 text-sm mt-2 space-y-1">
                            <li>• <strong>Titre</strong> : Description courte du problème</li>
                            <li>• <strong>Description</strong> : Détails (optionnel)</li>
                            <li>• <strong>Machine</strong> : Équipement concerné</li>
                            <li>• <strong>Priorité</strong> : Urgence du ticket</li>
                            <li>• <strong>Assigné à</strong> : Technicien responsable</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                        <p class="font-medium text-gray-800">Cliquer sur "Créer le ticket"</p>
                    </div>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Niveaux de priorité</h3>
            <div class="flex flex-wrap gap-2 mb-6">
                <span class="priority-badge bg-gray-100 text-gray-700"><i class="fas fa-minus mr-1"></i> Basse</span>
                <span class="priority-badge bg-blue-100 text-blue-700"><i class="fas fa-equals mr-1"></i> Normale</span>
                <span class="priority-badge bg-yellow-100 text-yellow-700"><i class="fas fa-arrow-up mr-1"></i> Moyenne</span>
                <span class="priority-badge bg-orange-100 text-orange-700"><i class="fas fa-exclamation mr-1"></i> Haute</span>
                <span class="priority-badge bg-red-100 text-red-700"><i class="fas fa-fire mr-1"></i> Urgente</span>
                <span class="priority-badge bg-red-200 text-red-800"><i class="fas fa-bomb mr-1"></i> Critique</span>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Comprendre une carte ticket</h3>
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <p class="font-medium text-gray-800 mb-3">Chaque ticket affiche :</p>
                <ul class="text-gray-600 text-sm space-y-2">
                    <li class="flex items-center gap-2"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">MAC-1225-0004</span> Numéro unique</li>
                    <li class="flex items-center gap-2"><span class="px-2 py-0.5 bg-green-500 text-white text-xs rounded">PLANIFIÉ</span> Badge si planifié (avec date)</li>
                    <li class="flex items-center gap-2"><span class="px-2 py-0.5 bg-red-500 text-white text-xs rounded">HAUT</span><span class="px-2 py-0.5 bg-red-700 text-white text-xs rounded">CRIT</span><span class="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded">MOY</span> Priorité</li>
                    <li class="flex items-center gap-2"><i class="fas fa-cog text-gray-500"></i> Machine concernée</li>
                    <li class="flex items-center gap-2"><i class="fas fa-user text-gray-500"></i> Rapporté par (créateur)</li>
                    <li class="flex items-center gap-2"><i class="fas fa-clock text-red-500"></i> Retard (si applicable)</li>
                    <li class="flex items-center gap-2"><i class="fas fa-hourglass-half text-orange-500"></i> Requête reçue depuis</li>
                </ul>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Modifier un ticket</h3>
            <div class="step-card p-4 mb-3">
                <p class="text-gray-600"><strong>Cliquer sur un ticket</strong> pour ouvrir sa fiche détaillée</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <p class="font-medium text-gray-800 mb-2">Dans la fiche, vous pouvez :</p>
                <ul class="text-gray-600 text-sm space-y-2">
                    <li class="flex items-center gap-2"><i class="fas fa-exchange-alt text-blue-600"></i> Changer le statut</li>
                    <li class="flex items-center gap-2"><i class="fas fa-comment text-green-600"></i> Ajouter un commentaire</li>
                    <li class="flex items-center gap-2"><i class="fas fa-camera text-purple-600"></i> Ajouter une photo</li>
                    <li class="flex items-center gap-2"><i class="fas fa-user-edit text-orange-600"></i> Modifier l'assignation</li>
                    <li class="flex items-center gap-2"><i class="fas fa-calendar text-indigo-600"></i> Planifier une date</li>
                    <li class="flex items-center gap-2"><i class="fas fa-history text-gray-600"></i> Voir l'historique</li>
                </ul>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3 mt-6">Déplacer un ticket</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-blue-50 rounded-lg p-4">
                    <p class="font-medium text-blue-800 mb-2"><i class="fas fa-desktop mr-2"></i>Sur ordinateur</p>
                    <p class="text-blue-700 text-sm">Glisser-déposer le ticket vers la colonne souhaitée</p>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                    <p class="font-medium text-green-800 mb-2"><i class="fas fa-mobile-alt mr-2"></i>Sur mobile</p>
                    <p class="text-green-700 text-sm">Ouvrir le ticket → Bouton "Déplacer" en bas</p>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 4: Vocal -->
        <div class="glass p-6 mb-6" id="vocal">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-red-100 text-red-600">
                    <i class="fas fa-microphone"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">4. Créer un ticket vocal</h2>
            </div>
            
            <p class="text-gray-600 mb-4">Créez un ticket rapidement en parlant. L'IA transcrit et remplit automatiquement les champs.</p>
            
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                        <p class="font-medium text-gray-800">Appuyer sur le bouton microphone <span class="btn-icon bg-red-600 text-white inline-flex mx-1"><i class="fas fa-microphone"></i></span></p>
                        <p class="text-gray-600 text-sm mt-1">En bas à droite de l'écran</p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                        <p class="font-medium text-gray-800">Décrire le problème clairement</p>
                        <p class="text-gray-600 text-sm mt-1">Exemple : "La presse hydraulique numéro 3 fait un bruit anormal, priorité haute"</p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                        <p class="font-medium text-gray-800">Appuyer sur Stop <span class="btn-icon bg-gray-600 text-white inline-flex mx-1"><i class="fas fa-stop"></i></span></p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                    <div>
                        <p class="font-medium text-gray-800">Vérifier et confirmer</p>
                        <p class="text-gray-600 text-sm mt-1">L'IA remplit les champs. Vérifiez et cliquez sur "Créer"</p>
                    </div>
                </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <i class="fas fa-check-circle text-green-600 mt-1"></i>
                    <div>
                        <p class="font-medium text-green-800">Conseils pour une bonne reconnaissance</p>
                        <ul class="text-green-700 text-sm mt-1 space-y-1">
                            <li>• Parlez clairement et pas trop vite</li>
                            <li>• Mentionnez la machine par son nom</li>
                            <li>• Indiquez la priorité si urgente</li>
                            <li>• Évitez les bruits de fond</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 5: Messenger -->
        <div class="glass p-6 mb-6" id="messenger">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-green-100 text-green-600">
                    <i class="fas fa-comments"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">5. Messagerie (IGP Connect)</h2>
            </div>
            
            <p class="text-gray-600 mb-4">Communiquez avec votre équipe en temps réel.</p>
            
            <h3 class="font-semibold text-gray-800 mb-3">Accéder à la messagerie</h3>
            <div class="step-card p-4 mb-4">
                <p class="text-gray-600">Cliquer sur <span class="btn-icon bg-green-100 text-green-600 inline-flex mx-1"><i class="fas fa-comments"></i></span> dans la barre de navigation, ou aller à <strong>${domain}/messenger</strong></p>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Fonctionnalités</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-user text-blue-600"></i>
                        <span class="font-medium text-gray-800">Messages directs</span>
                    </div>
                    <p class="text-gray-600 text-sm">Conversation privée avec un collègue</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-users text-purple-600"></i>
                        <span class="font-medium text-gray-800">Groupes</span>
                    </div>
                    <p class="text-gray-600 text-sm">Discussion d'équipe</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-microphone text-red-600"></i>
                        <span class="font-medium text-gray-800">Messages vocaux</span>
                    </div>
                    <p class="text-gray-600 text-sm">Enregistrer et envoyer un audio</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-image text-green-600"></i>
                        <span class="font-medium text-gray-800">Photos & fichiers</span>
                    </div>
                    <p class="text-gray-600 text-sm">Partager des images et documents</p>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3 mt-6">Envoyer un message vocal</h3>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <p class="text-gray-600">Maintenir le bouton <span class="btn-icon bg-red-100 text-red-600 inline-flex mx-1"><i class="fas fa-microphone"></i></span> enfoncé</p>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <p class="text-gray-600">Parler pendant l'enregistrement</p>
                </div>
            </div>
            <div class="step-card p-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <p class="text-gray-600">Relâcher pour envoyer automatiquement</p>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 6: Notifications -->
        <div class="glass p-6 mb-6" id="notifications">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-yellow-100 text-yellow-600">
                    <i class="fas fa-bell"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">6. Notifications</h2>
            </div>
            
            <p class="text-gray-600 mb-4">Recevez des alertes en temps réel sur votre téléphone ou ordinateur.</p>
            
            <h3 class="font-semibold text-gray-800 mb-3">Activer les notifications</h3>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                        <p class="font-medium text-gray-800">Cliquer sur <span class="btn-icon bg-blue-100 text-blue-600 inline-flex mx-1"><i class="fas fa-bell"></i></span></p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                        <p class="font-medium text-gray-800">Autoriser les notifications dans votre navigateur</p>
                        <p class="text-gray-600 text-sm mt-1">Une popup apparaîtra, cliquez sur "Autoriser"</p>
                    </div>
                </div>
            </div>
            <div class="step-card p-4 mb-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                        <p class="font-medium text-gray-800">C'est prêt!</p>
                        <p class="text-gray-600 text-sm mt-1">Vous recevrez les alertes même si l'app est fermée</p>
                    </div>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Types de notifications</h3>
            <div class="space-y-2">
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i class="fas fa-plus-circle text-blue-600"></i>
                    <span class="text-gray-700">Nouveau ticket créé</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i class="fas fa-user-check text-green-600"></i>
                    <span class="text-gray-700">Ticket assigné à vous</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i class="fas fa-exchange-alt text-orange-600"></i>
                    <span class="text-gray-700">Changement de statut</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <i class="fas fa-comment text-purple-600"></i>
                    <span class="text-gray-700">Nouveau message</span>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 7: Planning -->
        <div class="glass p-6 mb-6" id="planning">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-indigo-100 text-indigo-600">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">7. Planning</h2>
            </div>
            
            <p class="text-gray-600 mb-4">Visualisez et planifiez les interventions de maintenance.</p>
            
            <h3 class="font-semibold text-gray-800 mb-3">Accéder au planning</h3>
            <div class="step-card p-4 mb-4">
                <p class="text-gray-600">Cliquer sur <span class="btn-icon bg-indigo-100 text-indigo-600 inline-flex mx-1"><i class="fas fa-calendar-alt"></i></span> dans la barre de navigation</p>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Vues disponibles</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <i class="fas fa-calendar-day text-2xl text-indigo-600 mb-2"></i>
                    <p class="font-medium text-gray-800">Jour</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <i class="fas fa-calendar-week text-2xl text-indigo-600 mb-2"></i>
                    <p class="font-medium text-gray-800">Semaine</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <i class="fas fa-calendar text-2xl text-indigo-600 mb-2"></i>
                    <p class="font-medium text-gray-800">Mois</p>
                </div>
            </div>

            <h3 class="font-semibold text-gray-800 mb-3">Planifier un ticket</h3>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <p class="text-gray-600">Ouvrir un ticket existant</p>
                </div>
            </div>
            <div class="step-card p-4 mb-3">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <p class="text-gray-600">Cliquer sur "Planifier" <span class="btn-icon bg-indigo-100 text-indigo-600 inline-flex mx-1"><i class="fas fa-calendar-check"></i></span></p>
                </div>
            </div>
            <div class="step-card p-4">
                <div class="flex items-start gap-4">
                    <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <p class="text-gray-600">Sélectionner la date et l'heure</p>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Section 8: Admin -->
        <div class="glass p-6 mb-6" id="admin">
            <div class="flex items-center gap-3 mb-4">
                <div class="icon-box bg-gray-200 text-gray-600">
                    <i class="fas fa-cog"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800">8. Administration</h2>
                <span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Admin seulement</span>
            </div>
            
            <p class="text-gray-600 mb-4">Fonctions réservées aux administrateurs.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="btn-icon bg-orange-100 text-orange-600"><i class="fas fa-users"></i></span>
                        <span class="font-medium text-gray-800">Utilisateurs</span>
                    </div>
                    <ul class="text-gray-600 text-sm space-y-1">
                        <li>• Créer/modifier des comptes</li>
                        <li>• Assigner des rôles</li>
                        <li>• Réinitialiser mots de passe</li>
                    </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="btn-icon bg-blue-100 text-blue-600"><i class="fas fa-cogs"></i></span>
                        <span class="font-medium text-gray-800">Machines</span>
                    </div>
                    <ul class="text-gray-600 text-sm space-y-1">
                        <li>• Ajouter des équipements</li>
                        <li>• Modifier les informations</li>
                        <li>• Désactiver une machine</li>
                    </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="btn-icon bg-purple-100 text-purple-600"><i class="fas fa-shield-alt"></i></span>
                        <span class="font-medium text-gray-800">Rôles & Permissions</span>
                    </div>
                    <ul class="text-gray-600 text-sm space-y-1">
                        <li>• Créer des rôles personnalisés</li>
                        <li>• Définir les accès</li>
                    </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="btn-icon bg-green-100 text-green-600"><i class="fas fa-sliders-h"></i></span>
                        <span class="font-medium text-gray-800">Paramètres</span>
                    </div>
                    <ul class="text-gray-600 text-sm space-y-1">
                        <li>• Configuration système</li>
                        <li>• Personnalisation</li>
                        <li>• Colonnes Kanban</li>
                    </ul>
                </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-amber-600 mt-1"></i>
                    <div>
                        <p class="font-medium text-amber-800">Attention</p>
                        <p class="text-amber-700 text-sm">Les modifications dans les paramètres affectent tous les utilisateurs. Faites attention avant de sauvegarder.</p>
                    </div>
                </div>
            </div>
            
            <a href="#top" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-4 text-sm">
                <i class="fas fa-arrow-up"></i> Retour en haut
            </a>
        </div>

        <!-- Footer -->
        <div class="glass p-6 text-center">
            <p class="text-gray-600 mb-2">Besoin d'aide supplémentaire?</p>
            <p class="text-gray-500 text-sm">Contactez votre administrateur ou utilisez l'Expert technique <span class="btn-icon bg-purple-100 text-purple-600 inline-flex mx-1"><i class="fas fa-robot"></i></span></p>
            <div class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-gray-400 text-xs">Système de Gestion © 2025 - Guide v2.0</p>
            </div>
        </div>

    </div>
</body>
</html>`;
};
