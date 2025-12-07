            updateDOM(item) {
                const { desc, meta, badge, imagePanel, image } = this.elements;
                const data = item.data;
                
                // Handle Image
                if (data.image_url) {
                    image.src = data.image_url;
                    image.onload = () => imagePanel.classList.add('loaded');
                } else {
                    image.src = '';
                }

                // Reset Badge
                badge.classList.add('hidden');
                badge.className = 'hidden px-2 lg:px-3 py-0.5 lg:py-1 rounded text-xs lg:text-sm font-bold uppercase border'; 

                if (item.type === 'ticket') {
                    desc.textContent = data.description || '';
                    meta.textContent = `TICKET #${data.ticket_id} • ${data.machine_name} • ${data.assignee_name || 'Non assigné'}`;
                    
                    // Badge
                    badge.classList.remove('hidden');
                    if (data.status === 'in_progress') {
                        badge.textContent = 'EN COURS';
                        badge.classList.add('bg-green-900', 'text-green-300', 'border-green-700');
                    } else {
                        badge.textContent = 'PLANIFIÉ';
                        badge.classList.add('bg-blue-900', 'text-blue-300', 'border-blue-700');
                    }

                } else {
                    // Use 'details' property for events
                    desc.textContent = data.details || data.category_label || '';
                    meta.textContent = `ÉVÉNEMENT • ${dayjs(data.date).format('D MMMM YYYY')} ${data.time ? '• ' + data.time.substring(0,5) : ''}`;
                    
                    // Badge
                    if (data.category_label) {
                        badge.classList.remove('hidden');
                        badge.textContent = data.category_label;
                        badge.classList.add('bg-slate-800', 'text-slate-300', 'border-slate-600');
                    }
                }
            },

            show(item) {
                if (!this.hasContent(item)) {
                    this.hideImmediate();
                    return;
                }
                this.updateDOM(item);
                this.elements.panel.classList.add('visible');
                
                // Show Image Panel if URL exists
                if (item.data.image_url) {
                    this.elements.imagePanel.classList.add('visible');
                } else {
                    this.elements.imagePanel.classList.remove('visible');
                }
            },

            hide() {
                this.elements.panel.classList.remove('visible');
                this.elements.imagePanel.classList.remove('visible');
            },