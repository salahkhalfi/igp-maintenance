const MessagingModal = ({ show, onClose, currentUser, initialContact, initialTab }) => {
    const [activeTab, setActiveTab] = React.useState(initialTab || "public");
    const [publicMessages, setPublicMessages] = React.useState([]);
    const [conversations, setConversations] = React.useState([]);
    const [selectedContact, setSelectedContact] = React.useState(initialContact || null);
    const [privateMessages, setPrivateMessages] = React.useState([]);
    const [availableUsers, setAvailableUsers] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [timestampTick, setTimestampTick] = React.useState(0);

    React.useEffect(() => {
        if (show) {
            loadPublicMessages();
            loadConversations();
            loadAvailableUsers();
            loadUnreadCount();

            if (initialContact) {
                setActiveTab("private");
                setSelectedContact(initialContact);
                loadPrivateMessages(initialContact.id);
            }

            const timestampInterval = setInterval(() => {
                setTimestampTick(prev => prev + 1);
                loadUnreadCount();

                if (activeTab === 'public') {
                    loadPublicMessages();
                } else if (activeTab === 'private' && selectedContact) {
                    loadPrivateMessages(selectedContact.id);
                    loadConversations();
                }
            }, 30000);

            return () => clearInterval(timestampInterval);
        }
    }, [show, activeTab, selectedContact]);

    const loadPublicMessages = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/public');
            setPublicMessages(response.data.messages);
        } catch (error) {}
    };

    const loadConversations = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/conversations');
            setConversations(response.data.conversations);
        } catch (error) {}
    };

    const loadPrivateMessages = async (contactId) => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL + '/messages/private/' + contactId);
            setPrivateMessages(response.data.messages);
            loadConversations();
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            console.log('[Messaging] Loading available users...');
            const response = await axios.get(API_URL + '/messages/available-users');
            const users = response.data.users || [];
            console.log('[Messaging] Available users loaded:', users.length);
            
            if (users.length === 0) {
                console.warn('[Messaging] List is empty. Check API or DB.');
            }
            
            setAvailableUsers(users);
        } catch (error) {
            console.error('[Messaging] Failed to load users:', error);
            if (error.response) {
                console.error('[Messaging] Error details:', error.response.status, error.response.data);
            }
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {}
    };

    const openPrivateMessage = (senderId, senderName) => {
        if (senderId === currentUser.userId) {
            alert('Vous ne pouvez pas vous envoyer un message privé à vous-même.');
            return;
        }
        const user = availableUsers.find(u => u.id === senderId);
        if (!user) {
            alert(senderName + ' ne fait plus partie de la liste des utilisateurs.');
            return;
        }
        setActiveTab('private');
        setSelectedContact(user);
        loadPrivateMessages(senderId);
    };

    const handleSendMessage = async (content) => {
        try {
            const payload = {
                message_type: activeTab,
                content: content,
                recipient_id: activeTab === 'private' && selectedContact ? selectedContact.id : null
            };
            await axios.post(API_URL + '/messages', payload);
            refreshCurrentView();
        } catch (error) {
            alert('Erreur envoi message: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const handleSendAudio = async (audioBlob, duration) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio-message.' + (audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'));
            formData.append('message_type', activeTab);
            formData.append('duration', duration.toString());
            if (activeTab === 'private' && selectedContact) {
                formData.append('recipient_id', selectedContact.id.toString());
            }
            await axios.post(API_URL + '/messages/audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            refreshCurrentView();
        } catch (error) {
            alert('Erreur envoi audio: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
        try {
            await axios.delete(API_URL + '/messages/' + messageId);
            refreshCurrentView();
        } catch (error) {
            alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const handleBulkDelete = async (selectedMessages) => {
        const count = selectedMessages.length;
        if (!confirm('Supprimer ' + count + ' message' + (count > 1 ? 's' : '') + ' ?')) return;
        try {
            await axios.post(API_URL + '/messages/bulk-delete', { message_ids: selectedMessages });
            alert(count + ' message' + (count > 1 ? 's' : '') + ' supprimé' + (count > 1 ? 's' : ''));
            refreshCurrentView();
        } catch (error) {
            alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const refreshCurrentView = () => {
        if (activeTab === 'public') {
            loadPublicMessages();
        } else if (selectedContact) {
            loadPrivateMessages(selectedContact.id);
            loadConversations();
        }
        loadUnreadCount();
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[60] p-2 sm:p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl shadow-lg w-full max-w-6xl h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden',
            onClick: (e) => e.stopPropagation()
        },
            // Header
            React.createElement('div', {
                className: 'bg-slate-800 text-white p-3 sm:p-5 flex justify-between items-center'
            },
                React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                    React.createElement('i', { className: 'fas fa-comments text-xl sm:text-2xl flex-shrink-0' }),
                    React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' }, 'Messagerie Équipe'),
                    unreadCount > 0 ? React.createElement('span', {
                        className: 'bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse'
                    }, unreadCount) : null
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                },
                    React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                )
            ),

            // Tabs
            React.createElement('div', {
                className: 'flex border-b border-gray-200 bg-gray-50 shadow-sm'
            },
                React.createElement('button', {
                    onClick: () => {
                        setActiveTab('public');
                        setSelectedContact(null);
                    },
                    className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all ' +
                        (activeTab === 'public'
                            ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                },
                    React.createElement('i', { className: 'fas fa-globe mr-1 sm:mr-2' }),
                    React.createElement('span', { className: 'hidden xs:inline' }, 'Canal Public'),
                    React.createElement('span', { className: 'inline xs:hidden' }, 'Public')
                ),
                React.createElement('button', {
                    onClick: () => setActiveTab('private'),
                    className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all relative ' +
                        (activeTab === 'private'
                            ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                },
                    React.createElement('i', { className: 'fas fa-user-friends mr-1 sm:mr-2' }),
                    React.createElement('span', { className: 'hidden xs:inline' }, 'Messages Privés'),
                    React.createElement('span', { className: 'inline xs:hidden' }, 'Privés')
                )
            ),

            // Content Area
            React.createElement('div', { className: 'flex-1 flex overflow-hidden relative' },
                
                // Sidebar (Only for Private tab)
                activeTab === 'private' ? React.createElement(MessagingSidebar, {
                    conversations: conversations,
                    availableUsers: availableUsers,
                    selectedContact: selectedContact,
                    onClose: onClose,
                    onSelectContact: (contact) => {
                        setSelectedContact(contact);
                        loadPrivateMessages(contact.id);
                    }
                }) : null,

                // Chat Window (For both Public and Private)
                (activeTab === 'public' || (activeTab === 'private' && selectedContact)) ? React.createElement(MessagingChatWindow, {
                    messages: activeTab === 'public' ? publicMessages : privateMessages,
                    currentUser: currentUser,
                    loading: loading,
                    activeTab: activeTab,
                    selectedContact: selectedContact,
                    onSendMessage: handleSendMessage,
                    onSendAudio: handleSendAudio,
                    onDeleteMessage: handleDeleteMessage,
                    onBulkDelete: handleBulkDelete,
                    onOpenPrivateMessage: openPrivateMessage,
                    onClose: onClose,
                    onBack: () => setSelectedContact(null)
                }) : 
                
                React.createElement(MessagingChatWindow, {
                    messages: activeTab === 'public' ? publicMessages : privateMessages,
                    currentUser: currentUser,
                    loading: loading,
                    activeTab: activeTab,
                    selectedContact: selectedContact,
                    onSendMessage: handleSendMessage,
                    onSendAudio: handleSendAudio,
                    onDeleteMessage: handleDeleteMessage,
                    onBulkDelete: handleBulkDelete,
                    onOpenPrivateMessage: openPrivateMessage,
                    onClose: onClose,
                    onBack: () => setSelectedContact(null)
                })
            )
        )
    );
};
