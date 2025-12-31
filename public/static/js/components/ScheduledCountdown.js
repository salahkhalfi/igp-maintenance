// Composant Compte a rebours pour date planifiee (avec changement de couleur)
const ScheduledCountdown = ({ scheduledDate }) => {
    // Fonction locale car spécifique à ce composant (ou pourrait être dans utils mais utilisée ici seulement)
    // Mais attendez, getCountdownInfo était définie dans index.tsx à la ligne 976.
    // Je dois l'inclure ici ou la mettre dans utils.js. 
    // Le code original l'avait à l'intérieur du scope de index.tsx mais en dehors du composant.
    // Pour simplifier, je vais l'inclure dans ce fichier.
    
    const getCountdownInfo = (scheduledDate) => {
        if (!scheduledDate) return { text: '', className: '', isOverdue: false };

        const now = getNowEST();
        const scheduledISO = scheduledDate.replace(' ', 'T');
        // Ajouter Z pour forcer interpretation UTC
        const scheduledUTC = new Date(scheduledISO + (scheduledISO.includes('Z') ? '' : 'Z'));
        // Appliquer l'offset EST/EDT
        const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
        const scheduled = new Date(scheduledUTC.getTime() + (offset * 60 * 60 * 1000));
        const diffMs = scheduled - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let text = '';
        let className = '';
        let isOverdue = false;

        if (diffMs < 0) {
            // En retard
            const absMs = Math.abs(diffMs);
            const absHours = Math.floor(absMs / (1000 * 60 * 60));
            const absMinutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
            const absSeconds = Math.floor((absMs % (1000 * 60)) / 1000);
            const absDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

            if (absDays > 0) {
                text = 'Retard: ' + absDays + 'j ' + (absHours % 24) + 'h ' + absMinutes + 'min ' + absSeconds + 's';
            } else if (absHours > 0) {
                text = 'Retard: ' + absHours + 'h ' + absMinutes + 'min ' + absSeconds + 's';
            } else {
                text = 'Retard: ' + absMinutes + 'min ' + absSeconds + 's';
            }
            className = 'bg-red-100 text-red-800 animate-pulse';
            isOverdue = true;
        } else if (diffHours < 1) {
            // Moins de 1h - TRES URGENT (avec secondes)
            text = diffMinutes + 'min ' + diffSeconds + 's';
            className = 'bg-red-100 text-red-800 animate-pulse';
        } else if (diffHours < 2) {
            // Moins de 2h - URGENT (avec secondes)
            text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
            className = 'bg-red-100 text-red-800';
        } else if (diffHours < 24) {
            // Moins de 24h - Urgent (avec minutes et secondes)
            text = Math.floor(diffHours) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
            className = 'bg-amber-100 text-amber-800';
        } else if (diffDays < 3) {
            // Moins de 3 jours - Attention (avec secondes)
            text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
            className = 'bg-yellow-100 text-yellow-800';
        } else {
            // Plus de 3 jours - OK (avec secondes)
            text = Math.floor(diffDays) + 'j ' + Math.floor(diffHours % 24) + 'h ' + diffMinutes + 'min ' + diffSeconds + 's';
            className = 'bg-green-100 text-green-800';
        }

        return { text, className, isOverdue };
    };

    const [countdown, setCountdown] = React.useState(() => getCountdownInfo(scheduledDate));

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdownInfo(scheduledDate));
        }, 1000); // Mise a jour chaque seconde

        return () => clearInterval(interval);
    }, [scheduledDate]);

    return React.createElement('div', {
        className: 'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-semibold ' + countdown.className
    },
        React.createElement('i', { className: 'fas fa-clock' }),
        React.createElement('span', {}, countdown.text)
    );
};
