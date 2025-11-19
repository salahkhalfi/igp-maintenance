/**
 * Guide Utilisateur - Page HTML statique
 * Contient le guide complet des fonctionnalités de l'application
 */

export const guideHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guide Utilisateur - IGP Maintenance</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'igp-blue': '#1e40af',
                        'igp-orange': '#ea580c',
                        'igp-red': '#dc2626',
                    }
                }
            }
        }
    </script>
    <style>
        /* Background avec photo d'atelier IGP */
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }
        
        .guide-container {
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            border-radius: 12px;
            box-shadow: 
                12px 12px 24px rgba(71, 85, 105, 0.15),
                -6px -6px 16px rgba(255, 255, 255, 0.7),
                inset 1px 1px 2px rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .section-card {
            background: linear-gradient(145deg, #f8fafc, #e2e8f0);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 
                8px 8px 16px rgba(71, 85, 105, 0.12),
                -4px -4px 12px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.08);
            transition: all 0.3s ease;
        }
        
        .section-card:hover {
            box-shadow: 
                10px 10px 20px rgba(71, 85, 105, 0.15),
                -5px -5px 14px rgba(255, 255, 255, 0.9);
            transform: translateY(-2px);
        }
        
        .feature-box {
            background: linear-gradient(145deg, #ffffff, #f1f5f9);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 
                4px 4px 8px rgba(71, 85, 105, 0.1),
                -2px -2px 6px rgba(255, 255, 255, 0.8);
            border-left: 4px solid #3b82f6;
        }
        
        .icon-badge {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: linear-gradient(145deg, #ffffff, #f1f5f9);
            box-shadow: 
                4px 4px 8px rgba(71, 85, 105, 0.12),
                -2px -2px 6px rgba(255, 255, 255, 0.8);
        }
        
        .back-button {
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            box-shadow: 
                6px 6px 12px rgba(37, 99, 235, 0.3),
                -3px -3px 8px rgba(147, 197, 253, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .back-button:hover {
            box-shadow: 
                8px 8px 16px rgba(37, 99, 235, 0.4),
                -4px -4px 10px rgba(147, 197, 253, 0.4);
            transform: translateY(-2px);
        }
        
        .back-button:active {
            box-shadow: 
                4px 4px 8px rgba(37, 99, 235, 0.3),
                -2px -2px 6px rgba(147, 197, 253, 0.3);
            transform: translateY(0);
        }
        
        .toc-link {
            color: #3b82f6;
            text-decoration: none;
            padding: 8px 16px;
            display: block;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        
        .toc-link:hover {
            background: linear-gradient(145deg, #dbeafe, #bfdbfe);
            padding-left: 24px;
        }
        
        .step-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 
                3px 3px 6px rgba(37, 99, 235, 0.3),
                -2px -2px 4px rgba(147, 197, 253, 0.3);
        }
        
        kbd {
            background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 2px 8px;
            font-family: monospace;
            font-size: 0.9em;
            box-shadow: 
                2px 2px 4px rgba(71, 85, 105, 0.1),
                -1px -1px 2px rgba(255, 255, 255, 0.8);
        }
        
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            font-weight: 600;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.1),
                -1px -1px 2px rgba(255, 255, 255, 0.5);
        }
        
        .priority-critical {
            background: linear-gradient(145deg, #fee2e2, #fecaca);
            color: #dc2626;
            border-left: 3px solid #dc2626;
        }
        
        .priority-high {
            background: linear-gradient(145deg, #fef3c7, #fde68a);
            color: #d97706;
            border-left: 3px solid #f59e0b;
        }
        
        .priority-medium {
            background: linear-gradient(145deg, #dbeafe, #bfdbfe);
            color: #1d4ed8;
            border-left: 3px solid #3b82f6;
        }
        
        .priority-low {
            background: linear-gradient(145deg, #d1fae5, #a7f3d0);
            color: #059669;
            border-left: 3px solid #10b981;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85em;
            font-weight: 600;
            background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
            box-shadow: 
                2px 2px 4px rgba(71, 85, 105, 0.1),
                -1px -1px 2px rgba(255, 255, 255, 0.8);
        }
        
        @media (max-width: 768px) {
            .section-card {
                padding: 12px;
                margin-bottom: 12px;
            }
            
            .guide-container {
                margin: 8px;
                padding: 12px;
            }
            
            .feature-box {
                padding: 12px;
                margin-bottom: 8px;
            }
            
            .icon-badge {
                width: 40px;
                height: 40px;
                font-size: 20px;
            }
            
            .step-number {
                width: 28px;
                height: 28px;
                font-size: 14px;
            }
            
            .back-button {
                padding: 10px 16px;
                font-size: 14px;
            }
        }
        
        @media (max-width: 480px) {
            .guide-container {
                margin: 4px;
                padding: 12px;
                border-radius: 8px;
            }
            
            .section-card {
                padding: 12px;
                border-radius: 8px;
            }
            
            .toc-link {
                padding: 6px 12px;
                font-size: 14px;
            }
            
            .priority-badge,
            .status-badge {
                font-size: 12px;
                padding: 3px 8px;
            }
        }
        
        /* Smooth scroll */
        html {
            scroll-behavior: smooth;
        }
        
        /* Highlight target section */
        :target {
            animation: highlight 2s ease;
        }
        
        @keyframes highlight {
            0% {
                background: rgba(59, 130, 246, 0.1);
            }
            100% {
                background: transparent;
            }
        }
    </style>
</head>
<body class="p-3 sm:p-4 md:p-6 lg:p-8">
    <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="guide-container p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                    <div class="icon-badge text-blue-600">
                        <i class="fas fa-book"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                            Guide Utilisateur
                        </h1>
                        <p class="text-sm sm:text-base text-gray-600 mt-1">
                            Système de Gestion de Maintenance - IGP Glass
                        </p>
                    </div>
                </div>
                <button onclick="window.location.href='/'" class="back-button">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Retour à l'application
                </button>
            </div>
        </div>

        <!-- Table des matières -->
        <div class="section-card" id="table-of-contents">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-list text-blue-600"></i>
                Table des matières
            </h2>
            <div class="grid md:grid-cols-2 gap-2">
                <a href="#tickets" class="toc-link">📋 1. Gestion des Tickets</a>
                <a href="#kanban" class="toc-link">🎯 2. Tableau Kanban</a>
                <a href="#messages" class="toc-link">💬 3. Messagerie Interne</a>
                <a href="#notifications" class="toc-link">🔔 4. Notifications Push</a>
                <a href="#machines" class="toc-link">⚙️ 5. Gestion des Machines</a>
                <a href="#profile" class="toc-link">👤 6. Profil & Paramètres</a>
                <a href="#mobile" class="toc-link">📱 7. Utilisation Mobile</a>
                <a href="#tips" class="toc-link">💡 8. Trucs & Astuces</a>
            </div>
        </div>

        <!-- Section 1: Gestion des Tickets -->
        <div class="section-card" id="tickets">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-ticket-alt text-blue-600"></i>
                1. Gestion des Tickets
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Créer un nouveau ticket
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le bouton <strong>"+ Demande"</strong> (bouton bleu avec icône <i class="fas fa-plus"></i>) en haut à gauche</li>
                    <li>• Remplissez les champs obligatoires :
                        <ul class="ml-6 mt-2 space-y-1">
                            <li>- <strong>Titre</strong> : Description courte du problème</li>
                            <li>- <strong>Machine</strong> : Sélectionnez l'équipement concerné</li>
                            <li>- <strong>Priorité</strong> : Choisissez selon l'urgence</li>
                            <li>- <strong>Technicien</strong> : Assignez à un membre de l'équipe</li>
                        </ul>
                    </li>
                    <li>• Ajoutez des détails dans la <strong>Description</strong></li>
                    <li>• Optionnel : Joignez des <strong>photos</strong> ou <strong>documents</strong></li>
                    <li>• Cliquez sur <strong>"Créer"</strong> pour soumettre le ticket</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Comprendre les priorités
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-critical">
                            <i class="fas fa-exclamation-triangle"></i> CRITIQUE
                        </span>
                        <span class="text-gray-700">Arrêt de production imminent - Intervention immédiate requise</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-high">
                            <i class="fas fa-arrow-up"></i> HAUTE
                        </span>
                        <span class="text-gray-700">Impact majeur - Planifier intervention aujourd'hui</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-medium">
                            <i class="fas fa-minus"></i> MOYENNE
                        </span>
                        <span class="text-gray-700">Impact modéré - Planifier dans les 2-3 jours</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="priority-badge priority-low">
                            <i class="fas fa-arrow-down"></i> BASSE
                        </span>
                        <span class="text-gray-700">Impact mineur - Planifier quand disponible</span>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Modifier un ticket existant
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le ticket dans le tableau Kanban</li>
                    <li>• Modifiez les informations nécessaires</li>
                    <li>• Ajoutez des <strong>commentaires</strong> pour documenter l'évolution</li>
                    <li>• Changez le <strong>statut</strong> en déplaçant le ticket (voir section Kanban)</li>
                    <li>• Cliquez sur <strong>"Enregistrer"</strong> pour sauvegarder</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">4</div>
                    Joindre des fichiers
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Photos</strong> : Prenez une photo directement ou choisissez depuis la galerie</li>
                    <li>• <strong>Documents</strong> : PDF, fichiers Word, Excel acceptés</li>
                    <li>• <strong>Taille max</strong> : 10 MB par fichier</li>
                    <li>• <strong>Formats acceptés</strong> : JPG, PNG, PDF, DOC, DOCX, XLS, XLSX</li>
                </ul>
            </div>
        </div>

        <!-- Section 2: Tableau Kanban -->
        <div class="section-card" id="kanban">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-columns text-purple-600"></i>
                2. Tableau Kanban
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Comprendre les colonnes
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟦 Requete Recue
                        </span>
                        <span class="text-gray-700">Nouvelle demande reçue, en attente d'analyse</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟨 Diagnostic
                        </span>
                        <span class="text-gray-700">Analyse du problème en cours par le technicien</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟧 En Cours
                        </span>
                        <span class="text-gray-700">Intervention active par le technicien assigné</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟪 En Attente Pieces
                        </span>
                        <span class="text-gray-700">En attente de pièces de rechange ou matériel</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            🟩 Termine
                        </span>
                        <span class="text-gray-700">Intervention complétée et validée</span>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="status-badge">
                            ⬜ Archive
                        </span>
                        <span class="text-gray-700">Ticket archivé pour historique et consultation</span>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Déplacer un ticket (Drag & Drop)
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Sur ordinateur</strong> : Cliquez et maintenez sur un ticket, puis glissez vers la colonne souhaitée</li>
                    <li>• <strong>Sur mobile/tablette</strong> : Appuyez longuement (1 seconde) puis glissez le ticket</li>
                    <li>• Le ticket change automatiquement de statut</li>
                    <li>• <strong>Restrictions</strong> : Seuls les techniciens assignés ou superviseurs peuvent déplacer certains tickets</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Trier les tickets
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Utilisez le menu déroulant <strong>"Trier:"</strong> en haut du tableau</li>
                    <li>• <strong>Par défaut</strong> : Ordre original (création)</li>
                    <li>• <strong>🔥 Urgence</strong> : Calcul automatique (priorité + temps écoulé) - Les plus urgents en premier</li>
                    <li>• <strong>⏰ Plus ancien</strong> : Tickets les plus anciens en premier</li>
                    <li>• <strong>📅 Planifié</strong> : Tickets avec date de planification, triés par date la plus proche</li>
                    <li>• Le tri est visible uniquement s'il y a <strong>3 tickets ou plus</strong> dans le tableau</li>
                </ul>
            </div>
        </div>

        <!-- Section 3: Messagerie -->
        <div class="section-card" id="messages">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-comments text-green-600"></i>
                3. Messagerie Interne
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Envoyer un message texte
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur le bouton <strong>"Messagerie"</strong> (icône <i class="fas fa-comments"></i>) dans la barre de navigation</li>
                    <li>• Sélectionnez un collègue dans la liste des conversations</li>
                    <li>• Tapez votre message dans la zone de texte en bas</li>
                    <li>• Appuyez sur <kbd>Entrée</kbd> ou cliquez sur <i class="fas fa-paper-plane"></i> pour envoyer</li>
                    <li>• Les messages sont instantanés et le destinataire reçoit une notification</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Envoyer un message vocal
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Dans une conversation, cliquez sur l'icône <i class="fas fa-microphone text-red-600"></i> <strong>microphone</strong></li>
                    <li>• <strong>Maintenez appuyé</strong> pour enregistrer (jusqu'à 2 minutes)</li>
                    <li>• Relâchez pour envoyer automatiquement</li>
                    <li>• <strong>Avantages</strong> : Parfait pour les mains occupées ou messages complexes</li>
                    <li>• Le destinataire peut écouter directement dans l'application</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Indicateurs de conversation
                </h3>
                <div class="space-y-2 ml-12 text-gray-700">
                    <div class="flex items-center gap-2">
                        <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                        <span>Badge rouge : Nombre de messages non lus</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-circle text-green-500 text-xs"></i>
                        <span>Point vert : L'utilisateur est en ligne</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check text-gray-400"></i>
                        <span>Simple coche : Message envoyé</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-double text-blue-500"></i>
                        <span>Double coche bleue : Message lu</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: Notifications Push -->
        <div class="section-card" id="notifications">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-bell text-yellow-600"></i>
                4. Notifications Push
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Activer les notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Lors de votre première connexion, autorisez les notifications quand votre navigateur le demande</li>
                    <li>• Si vous avez refusé, allez dans les <strong>paramètres de votre navigateur</strong> :</li>
                    <ul class="ml-6 mt-2 space-y-1">
                        <li>- Chrome : ⋮ → Paramètres → Confidentialité → Paramètres des sites → Notifications</li>
                        <li>- Safari : Préférences → Sites web → Notifications</li>
                        <li>- Firefox : ☰ → Paramètres → Vie privée → Permissions → Notifications</li>
                    </ul>
                    <li>• Trouvez <strong>mecanique.igpglass.ca</strong> et activez les notifications</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Types de notifications reçues
                </h3>
                <div class="space-y-3 ml-12">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-wrench text-blue-600 text-xl"></i>
                        <div>
                            <strong>Nouveau ticket assigné</strong>
                            <p class="text-sm text-gray-600">Notification : "🔧 [Titre du ticket]" → Cliquez pour ouvrir l'application</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="fas fa-comment text-green-600 text-xl"></i>
                        <div>
                            <strong>Nouveau message texte</strong>
                            <p class="text-sm text-gray-600">Notification : "💬 [Nom de l'expéditeur]" → Cliquez pour lire le message</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <i class="fas fa-microphone text-red-600 text-xl"></i>
                        <div>
                            <strong>Nouveau message vocal</strong>
                            <p class="text-sm text-gray-600">Notification : "🎤 [Nom de l'expéditeur] - Message vocal ([durée])" → Cliquez pour écouter</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Fonctionnement des notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Les notifications apparaissent même si l'application est <strong>fermée</strong></li>
                    <li>• Elles fonctionnent sur <strong>ordinateur, mobile et tablette</strong></li>
                    <li>• Cliquer sur une notification ouvre directement l'application</li>
                    <li>• Les notifications restent visibles jusqu'à ce que vous les consultiez</li>
                </ul>
            </div>
        </div>

        <!-- Section 5: Gestion des Machines -->
        <div class="section-card" id="machines">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-cogs text-gray-600"></i>
                5. Gestion des Machines
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Consulter les machines
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur l'icône <i class="fas fa-cogs"></i> <strong>"Machines"</strong> dans la navigation</li>
                    <li>• Visualisez toutes les machines et leur statut actuel</li>
                    <li>• <strong>Filtre rapide</strong> : Recherchez par nom, numéro de série, ou département</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Historique des interventions
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur une machine pour voir son détail</li>
                    <li>• Consultez l'<strong>historique complet</strong> des tickets associés</li>
                    <li>• Visualisez les <strong>pièces remplacées</strong> et interventions passées</li>
                    <li>• Utile pour identifier les problèmes récurrents</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Ajouter une nouvelle machine (Admin)
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Fonction réservée aux <strong>administrateurs</strong></li>
                    <li>• Cliquez sur <strong>"Nouvelle Machine"</strong></li>
                    <li>• Remplissez les informations : nom, numéro de série, département, etc.</li>
                    <li>• La machine devient immédiatement disponible pour les tickets</li>
                </ul>
            </div>
        </div>

        <!-- Section 6: Profil & Paramètres -->
        <div class="section-card" id="profile">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-user-cog text-indigo-600"></i>
                6. Profil & Paramètres
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Modifier votre profil
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur votre <strong>nom</strong> en haut à droite</li>
                    <li>• Sélectionnez <strong>"Profil"</strong></li>
                    <li>• Modifiez vos informations : nom, email, téléphone</li>
                    <li>• Changez votre <strong>mot de passe</strong> si nécessaire</li>
                    <li>• Cliquez sur <strong>"Enregistrer"</strong></li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Préférences de notifications
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Dans <strong>Paramètres → Notifications</strong></li>
                    <li>• Activez/désactivez les notifications selon vos préférences</li>
                    <li>• Choisissez les types d'événements qui vous intéressent</li>
                    <li>• Les changements prennent effet immédiatement</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Se déconnecter
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Cliquez sur votre nom en haut à droite</li>
                    <li>• Sélectionnez <strong>"Déconnexion"</strong></li>
                    <li>• <strong>Important</strong> : Sur les appareils partagés, déconnectez-vous toujours après utilisation</li>
                </ul>
            </div>
        </div>

        <!-- Section 7: Utilisation Mobile -->
        <div class="section-card" id="mobile">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-mobile-alt text-pink-600"></i>
                7. Utilisation Mobile (PWA)
            </h2>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">1</div>
                    Installer l'application (recommandé)
                </h3>
                <div class="ml-12 space-y-4">
                    <div>
                        <strong class="text-gray-800">Sur iPhone/iPad (Safari) :</strong>
                        <ol class="mt-2 space-y-1 text-gray-700">
                            <li>1. Ouvrez mecanique.igpglass.ca dans Safari</li>
                            <li>2. Appuyez sur l'icône <i class="fas fa-share"></i> <strong>Partager</strong> (en bas)</li>
                            <li>3. Sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
                            <li>4. Appuyez sur <strong>"Ajouter"</strong></li>
                        </ol>
                    </div>
                    <div>
                        <strong class="text-gray-800">Sur Android (Chrome) :</strong>
                        <ol class="mt-2 space-y-1 text-gray-700">
                            <li>1. Ouvrez mecanique.igpglass.ca dans Chrome</li>
                            <li>2. Appuyez sur les <strong>trois points</strong> ⋮ en haut à droite</li>
                            <li>3. Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong></li>
                            <li>4. Appuyez sur <strong>"Installer"</strong></li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">2</div>
                    Avantages de l'installation
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Accès rapide</strong> : Lancez l'app comme une application native</li>
                    <li>• <strong>Mode plein écran</strong> : Plus d'espace pour travailler</li>
                    <li>• <strong>Notifications push</strong> : Recevez des alertes même si l'app est fermée</li>
                    <li>• <strong>Fonctionne hors ligne</strong> : Consultez les données récentes sans connexion</li>
                    <li>• <strong>Plus rapide</strong> : Chargement instantané après installation</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <div class="step-number">3</div>
                    Gestes tactiles
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Glisser</strong> : Faites défiler les listes et le tableau Kanban</li>
                    <li>• <strong>Appui long</strong> : Maintenez 1 seconde sur un ticket pour le déplacer</li>
                    <li>• <strong>Pincer</strong> : Zoomez sur les photos de tickets</li>
                    <li>• <strong>Balayer</strong> : Naviguez entre les conversations de messagerie</li>
                </ul>
            </div>
        </div>

        <!-- Section 8: Trucs & Astuces -->
        <div class="section-card" id="tips">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-lightbulb text-yellow-500"></i>
                8. Trucs & Astuces
            </h2>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-keyboard text-blue-500 mr-2"></i>
                    Raccourcis clavier
                </h3>
                <div class="ml-12 space-y-2 text-gray-700">
                    <div class="flex items-center gap-3">
                        <kbd>Esc</kbd>
                        <span>Fermer les fenêtres modales (popups, formulaires)</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <kbd>Enter</kbd>
                        <span>Soumettre le formulaire actif (création ticket, commentaire, etc.)</span>
                    </div>
                    <p class="text-sm text-gray-600 italic mt-3">Note: L'application privilégie les clics pour éviter les conflits de raccourcis.</p>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-tachometer-alt text-blue-500 mr-2"></i>
                    Optimisations pour efficacité
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• <strong>Utilisez les filtres</strong> : "Mes Tickets" et "Urgents" pour vous concentrer</li>
                    <li>• <strong>Commentez régulièrement</strong> : Documentez vos actions pour les collègues</li>
                    <li>• <strong>Photos systématiques</strong> : Prenez des photos avant/après intervention</li>
                    <li>• <strong>Messages vocaux</strong> : Plus rapide qu'écrire quand vous êtes sur le terrain</li>
                    <li>• <strong>Priorités réalistes</strong> : N'abusez pas du "Critique" - gardez-le pour les vraies urgences</li>
                </ul>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-question-circle text-purple-500 mr-2"></i>
                    Résolution de problèmes
                </h3>
                <div class="ml-12 space-y-3 text-gray-700">
                    <div>
                        <strong>❓ Les notifications ne fonctionnent pas</strong>
                        <p class="text-sm mt-1">→ Vérifiez les autorisations dans les paramètres de votre navigateur/appareil</p>
                    </div>
                    <div>
                        <strong>❓ L'application est lente</strong>
                        <p class="text-sm mt-1">→ Rafraîchissez la page (<kbd>Ctrl</kbd>+<kbd>F5</kbd>) ou videz le cache</p>
                    </div>
                    <div>
                        <strong>❓ Je ne peux pas déplacer un ticket</strong>
                        <p class="text-sm mt-1">→ Vérifiez que vous êtes le technicien assigné ou un superviseur</p>
                    </div>
                    <div>
                        <strong>❓ Une photo ne s'affiche pas</strong>
                        <p class="text-sm mt-1">→ Vérifiez votre connexion internet, puis rechargez la page</p>
                    </div>
                    <div>
                        <strong>❓ Je ne reçois pas les messages</strong>
                        <p class="text-sm mt-1">→ Déconnectez-vous et reconnectez-vous, puis réactivez les notifications</p>
                    </div>
                </div>
            </div>

            <div class="feature-box">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                    Bonnes pratiques de sécurité
                </h3>
                <ul class="space-y-2 ml-12 text-gray-700">
                    <li>• Ne partagez <strong>jamais votre mot de passe</strong></li>
                    <li>• Déconnectez-vous sur les <strong>appareils partagés</strong></li>
                    <li>• Utilisez un <strong>mot de passe fort</strong> (minimum 8 caractères, mélange de lettres et chiffres)</li>
                    <li>• Ne laissez pas votre session ouverte sans surveillance</li>
                    <li>• Signalez immédiatement toute activité suspecte à votre superviseur</li>
                </ul>
            </div>
        </div>

        <!-- Section Aide -->
        <div class="section-card">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <i class="fas fa-life-ring text-red-600"></i>
                Besoin d'aide ?
            </h2>
            <div class="ml-12 space-y-3 text-gray-700">
                <p>
                    <i class="fas fa-envelope text-blue-600 mr-2"></i>
                    <strong>Support technique</strong> : 
                    <a href="mailto:support@igpglass.ca" class="text-blue-600 hover:underline">support@igpglass.ca</a>
                </p>
                <p>
                    <i class="fas fa-phone text-green-600 mr-2"></i>
                    <strong>Téléphone</strong> : 
                    <span class="font-mono">1-800-IGP-HELP</span>
                </p>
                <p>
                    <i class="fas fa-user-tie text-purple-600 mr-2"></i>
                    <strong>Superviseur</strong> : 
                    Contactez votre superviseur d'équipe via la messagerie interne
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 mb-4">
            <button onclick="window.location.href='/'" class="back-button">
                <i class="fas fa-arrow-left mr-2"></i>
                Retour à l'application
            </button>
            <p class="text-white text-sm mt-4">
                © 2025 IGP Glass - Système de Gestion de Maintenance v2.8.1
            </p>
        </div>
    </div>

    <script>
        // Smooth scroll to anchor with offset for fixed header
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add scroll-to-top button when scrolling
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 500) {
                if (!document.getElementById('scroll-top-btn')) {
                    const btn = document.createElement('button');
                    btn.id = 'scroll-top-btn';
                    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
                    btn.className = 'back-button fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg z-50';
                    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.body.appendChild(btn);
                }
            } else {
                const btn = document.getElementById('scroll-top-btn');
                if (btn) btn.remove();
            }
        });

        // Highlight current section in table of contents
        const sections = document.querySelectorAll('.section-card[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    document.querySelectorAll('.toc-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.style.background = 'linear-gradient(145deg, #dbeafe, #bfdbfe)';
                            link.style.paddingLeft = '24px';
                        } else {
                            link.style.background = 'transparent';
                            link.style.paddingLeft = '16px';
                        }
                    });
                }
            });
        }, { threshold: 0.2 });

        sections.forEach(section => observer.observe(section));
    </script>
</body>
</html>
`;
