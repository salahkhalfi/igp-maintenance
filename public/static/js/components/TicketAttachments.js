const TicketAttachments = ({ ticket, currentUser, onMediaChange }) => {
    const [selectedMedia, setSelectedMedia] = React.useState(null);
    const [uploadingMedia, setUploadingMedia] = React.useState(false);
    const [newMediaFiles, setNewMediaFiles] = React.useState([]);
    const [newMediaPreviews, setNewMediaPreviews] = React.useState([]);
    const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });

    // --- HANDLERS ---

    const handleDeleteMedia = async (mediaId) => {
        setConfirmDialog({
            show: true,
            message: 'Supprimer ce média ?',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    await axios.delete(API_URL + '/media/' + mediaId);
                    // Appel au parent pour rafraîchir
                    if (onMediaChange) onMediaChange();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            }
        });
    };

    const handleNewMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setNewMediaFiles(prevFiles => [...prevFiles, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewMediaPreviews(prev => [...prev, {
                    url: reader.result,
                    type: file.type,
                    name: file.name,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUploadNewMedia = async () => {
        if (newMediaFiles.length === 0) return;

        setUploadingMedia(true);
        try {
            for (let i = 0; i < newMediaFiles.length; i++) {
                const file = newMediaFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('ticket_id', ticket.id);

                await axios.post(API_URL + '/media/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert('Médias ajoutés avec succès !');
            setNewMediaFiles([]);
            setNewMediaPreviews([]);
            if (onMediaChange) onMediaChange();
        } catch (error) {
            alert("Erreur lors de l'upload des médias");
        } finally {
            setUploadingMedia(false);
        }
    };

    // --- RENDER ---

    return React.createElement('div', {},
        // 1. GALERIE EXISTANTE
        (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6' },
            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center' },
                React.createElement('i', { className: 'fas fa-images mr-2 text-blue-700 text-sm sm:text-base' }),
                'Galerie Médias (Photos, Vidéos, Vocaux) (' + ticket.media.length + ')'
            ),
            React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3' },
                ticket.media.map((media) =>
                    React.createElement('div', {
                        key: media.id,
                        className: 'relative group'
                    },
                        React.createElement('div', {
                            className: 'cursor-pointer sm:cursor-pointer',
                            onClick: () => setSelectedMedia(media)
                        },
                            media.file_type.startsWith('image/')
                                ? React.createElement('img', {
                                    src: API_URL + '/media/' + media.id,
                                    alt: media.file_name,
                                    className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all pointer-events-none sm:pointer-events-auto'
                                })
                                : media.file_type.startsWith('audio/')
                                    ? React.createElement('div', { className: 'w-full h-32 bg-slate-100 rounded border-2 border-slate-300 hover:border-igp-blue transition-all flex flex-col items-center justify-center pointer-events-none sm:pointer-events-auto p-2' },
                                        React.createElement('i', { className: 'fas fa-microphone-alt fa-2x text-slate-500 mb-2' }),
                                        React.createElement('span', { className: 'text-xs text-slate-600 font-semibold text-center truncate w-full' }, 
                                            'Vocal du ' + new Date(media.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                        )
                                    )
                                    : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center pointer-events-none sm:pointer-events-auto' },
                                        React.createElement('i', { className: 'fas fa-video fa-3x text-gray-500' })
                                    ),
                            React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center pointer-events-none' },
                                React.createElement('i', { className: 'fas ' + (media.file_type.startsWith('audio/') ? 'fa-play-circle' : 'fa-search-plus') + ' text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                            ),
                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none' },
                                media.file_type.startsWith('image/') ? '📷' : media.file_type.startsWith('audio/') ? '🎤' : '🎥'
                            )
                        ),
                        (currentUser && (
                            currentUser?.role === 'admin' ||
                            currentUser?.role === 'supervisor' ||
                            currentUser?.role === 'technician' ||
                            (ticket.reported_by === currentUser.id)
                        )) ? React.createElement('button', {
                            onClick: (e) => {
                                e.stopPropagation();
                                handleDeleteMedia(media.id);
                            },
                            className: 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg z-20',
                            style: { opacity: 1 },
                            title: 'Supprimer ce média'
                        },
                            React.createElement('i', { className: 'fas fa-trash text-sm' })
                        ) : null
                    )
                )
            )
        ) : null,

        // 2. EMPTY STATE
        (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6 text-center py-6 sm:py-8 bg-gray-50 rounded' },
            React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
            React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
        ) : null,

        // 3. ZONE D'AJOUT
        React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
            React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-blue-700 text-sm sm:text-base' }),
                'Ajouter des photos/vidéos supplémentaires'
            ),

            // Prévisualisation Upload
            newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                    React.createElement('i', { className: 'fas fa-images mr-1' }),
                    newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                ),
                React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3' },
                    newMediaPreviews.map((preview, index) =>
                        React.createElement('div', {
                            key: index,
                            className: 'relative group'
                        },
                            preview.type.startsWith('image/')
                                ? React.createElement('img', {
                                    src: preview.url,
                                    alt: preview.name,
                                    className: 'w-full h-24 object-cover rounded border-2 border-blue-600'
                                })
                                : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-blue-600 flex items-center justify-center' },
                                    React.createElement('i', { className: 'fas fa-video fa-2x text-gray-500' })
                                ),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => {
                                    setNewMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                    setNewMediaPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
                                },
                                className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-all'
                            },
                                React.createElement('i', { className: 'fas fa-times text-xs' })
                            ),
                            React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded max-w-full truncate' },
                                preview.name
                            )
                        )
                    )
                ),
                React.createElement('button', {
                    onClick: handleUploadNewMedia,
                    disabled: uploadingMedia,
                    className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-igp-blue-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                },
                    uploadingMedia
                        ? React.createElement('span', {},
                            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                            'Upload en cours...'
                        )
                        : React.createElement('span', {},
                            React.createElement('i', { className: 'fas fa-cloud-upload-alt mr-2' }),
                            'Uploader ces fichiers'
                        )
                )
            ) : null,

            // Boutons de sélection
            React.createElement('div', { className: 'grid grid-cols-3 gap-2 sm:gap-3' },
                React.createElement('label', {
                    className: 'flex flex-col items-center justify-center px-2 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-blue-500 transition-all text-center h-full'
                },
                    React.createElement('input', {
                        type: 'file',
                        accept: 'image/*',
                        capture: 'environment',
                        onChange: handleNewMediaChange,
                        className: 'hidden',
                        id: 'photo-upload-detail'
                    }),
                    React.createElement('i', { className: 'fas fa-camera text-lg sm:text-xl text-blue-600 mb-1 block' }),
                    React.createElement('span', { className: 'text-[10px] sm:text-xs font-bold text-blue-700 block leading-tight' },
                        'Photo'
                    )
                ),
                React.createElement('label', {
                    className: 'flex flex-col items-center justify-center px-2 py-3 bg-red-50 border-2 border-dashed border-red-300 rounded-lg cursor-pointer hover:bg-red-100 hover:border-red-500 transition-all text-center h-full'
                },
                    React.createElement('input', {
                        type: 'file',
                        accept: 'video/*',
                        capture: 'environment',
                        onChange: handleNewMediaChange,
                        className: 'hidden',
                        id: 'video-upload-detail'
                    }),
                    React.createElement('i', { className: 'fas fa-video text-lg sm:text-xl text-red-600 mb-1 block' }),
                    React.createElement('span', { className: 'text-[10px] sm:text-xs font-bold text-red-700 block leading-tight' },
                        'Vidéo'
                    )
                ),
                React.createElement('label', {
                    className: 'flex flex-col items-center justify-center px-2 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-500 transition-all text-center h-full'
                },
                    React.createElement('input', {
                        type: 'file',
                        multiple: true,
                        accept: 'image/*,video/*',
                        onChange: handleNewMediaChange,
                        className: 'hidden',
                        id: 'media-upload-detail'
                    }),
                    React.createElement('i', { className: 'fas fa-images text-lg sm:text-xl text-gray-600 mb-1 block' }),
                    React.createElement('span', { className: 'text-[10px] sm:text-xs font-bold text-gray-700 block leading-tight' },
                        'Galerie'
                    )
                )
            )
        ),

        // 4. LIGHTBOX MODAL
        selectedMedia ? React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-90 z-[100000] flex items-center justify-center p-4',
            onClick: () => setSelectedMedia(null)
        },
            React.createElement('div', { className: 'relative max-w-6xl max-h-full' },
                React.createElement('button', {
                    onClick: () => setSelectedMedia(null),
                    className: 'absolute top-2 right-2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-all z-10'
                },
                    React.createElement('i', { className: 'fas fa-times fa-lg' })
                ),
                selectedMedia.file_type.startsWith('image/')
                    ? React.createElement('img', {
                        src: API_URL + '/media/' + selectedMedia.id,
                        alt: selectedMedia.file_name,
                        className: 'max-w-full max-h-screen object-contain',
                        onClick: (e) => e.stopPropagation()
                    })
                    : selectedMedia.file_type.startsWith('audio/')
                        ? React.createElement('div', { className: 'bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4', onClick: (e) => e.stopPropagation() },
                            React.createElement('i', { className: 'fas fa-microphone-alt text-6xl text-slate-700' }),
                            React.createElement('h3', { className: 'text-xl font-bold text-gray-800' }, 'Lecture du message vocal'),
                            React.createElement('audio', {
                                src: API_URL + '/media/' + selectedMedia.id,
                                controls: true,
                                autoPlay: true,
                                className: 'w-full min-w-[300px]'
                            })
                        )
                        : React.createElement('video', {
                            src: API_URL + '/media/' + selectedMedia.id,
                            controls: true,
                            className: 'max-w-full max-h-screen',
                            onClick: (e) => e.stopPropagation()
                        }),
                React.createElement('div', { className: 'absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm' },
                    selectedMedia.file_name + ' - ' + Math.round(selectedMedia.file_size / 1024) + ' KB'
                )
            )
        ) : null,

        // 5. CONFIRMATION INTERNE
        React.createElement(ConfirmModal, {
            show: confirmDialog.show,
            message: confirmDialog.message,
            onConfirm: confirmDialog.onConfirm,
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        })
    );
};
