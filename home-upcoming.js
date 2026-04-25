// Render upcoming events on the homepage, similar to events page
// Assumes events_data.csv is available

document.addEventListener('DOMContentLoaded', function() {
    const homeUpcomingGrid = document.getElementById('home-upcoming-grid');
    if (!homeUpcomingGrid) return;
    // Get the section element to hide if no events
    const eventsSection = document.querySelector('.events-list-section');
    fetch('events_data.csv?_=' + Date.now())
        .then(res => res.text())
        .then(csv => {
            function parseCSV(text) {
                const rows = [];
                let row = [];
                let field = '';
                let inQuotes = false;
                let i = 0;
                while (i < text.length) {
                    const char = text[i];
                    if (char === '"') {
                        if (inQuotes && text[i+1] === '"') {
                            field += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        row.push(field);
                        field = '';
                    } else if ((char === '\n' || char === '\r') && !inQuotes) {
                        if (field || row.length) {
                            row.push(field);
                            rows.push(row);
                            row = [];
                            field = '';
                        }
                    } else {
                        field += char;
                    }
                    i++;
                }
                if (field || row.length) {
                    row.push(field);
                    rows.push(row);
                }
                return rows;
            }
            const rows = parseCSV(csv);
            const headers = rows[0];
            const events = rows.slice(1).map(values => {
                let obj = {};
                headers.forEach((h, idx) => {
                    obj[h.trim()] = (values[idx] !== undefined ? values[idx] : '').replace(/^"|"$/g, '');
                });
                return obj;
            });
            const now = new Date();
            const upcoming = events.filter(e => {
                const d = new Date(e.sortDate);
                return d && !isNaN(d.getTime()) && d > now;
            });
            // Sort by soonest
            upcoming.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));
            if (upcoming.length === 0) {
                if (eventsSection) eventsSection.style.display = 'none';
                return;
            }
            upcoming.forEach(event => {
                const eventDate = new Date(event.sortDate);
                const card = document.createElement('a');
                card.className = 'event-card-link';
                card.href = event.event_id ? `event-detail.html?event=${event.event_id}` : '#';
                let cardInner;
                const title = event.title && event.title.trim() ? event.title : 'Untitled Event';
                const subtitle = event.subtitle && event.subtitle.trim() ? event.subtitle : 'Details coming soon';
                const cover = event.cover_image && event.cover_image.trim() ? event.cover_image : '';
                if (cover) {
                    cardInner = document.createElement('div');
                    cardInner.className = 'event-card event-card-with-image';
                    cardInner.style.backgroundImage = `url('${cover}')`;
                    const overlay = document.createElement('div');
                    overlay.className = 'event-card-overlay';
                    let overlayHTML = `<h3 class=\"event-title\">${title}</h3><p class=\"event-description\">${subtitle}</p>`;
                    if (event.displayDate && event.displayDate.trim()) {
                        overlayHTML += `<div class=\"event-display-date\">${event.displayDate}</div>`;
                    }
                    overlay.innerHTML = overlayHTML;
                    cardInner.appendChild(overlay);
                } else {
                    cardInner = document.createElement('div');
                    cardInner.className = 'event-card';
                    let cardHTML = `<h3 class=\"event-title\">${title}</h3><p class=\"event-description\">${subtitle}</p>`;
                    if (event.displayDate && event.displayDate.trim()) {
                        cardHTML += `<div class=\"event-display-date\">${event.displayDate}</div>`;
                    }
                    cardInner.innerHTML = cardHTML;
                }
                card.appendChild(cardInner);
                homeUpcomingGrid.appendChild(card);
            });
        });
});
