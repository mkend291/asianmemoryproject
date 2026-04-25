// Dynamically split events into upcoming and past
// Assumes events_data.csv is loaded via fetch

document.addEventListener('DOMContentLoaded', function() {
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;

    // Remove static cards
    eventsGrid.innerHTML = '';

    // Create sections
    const upcomingSection = document.createElement('div');
    upcomingSection.className = 'events-list-section';
    const upcomingTitle = document.createElement('h3');
    upcomingTitle.textContent = 'Upcoming Events';
    upcomingSection.appendChild(upcomingTitle);
    const upcomingGrid = document.createElement('div');
    upcomingGrid.className = 'events-grid';
    upcomingSection.appendChild(upcomingGrid);

    const pastSection = document.createElement('div');
    pastSection.className = 'events-list-section';
    const pastTitle = document.createElement('h3');
    pastTitle.textContent = 'Past Events';
    pastSection.appendChild(pastTitle);
    const pastGrid = document.createElement('div');
    pastGrid.className = 'events-grid';
    pastSection.appendChild(pastGrid);

    // Insert sections
    eventsGrid.parentNode.appendChild(upcomingSection);
    eventsGrid.parentNode.appendChild(pastSection);

    // Helper to parse date
    function parseEventDate(dateStr) {
        // Try MM/DD/YYYY, DD-MMM-YY, Month YYYY, etc.
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        // Try custom formats
        if (/\d{1,2}-[A-Za-z]{3}-\d{2,4}/.test(dateStr)) {
            // 28-Jan-23
            const [day, mon, yr] = dateStr.split('-');
            const year = yr.length === 2 ? '20' + yr : yr;
            return new Date(`${mon} ${day}, ${year}`);
        }
        if (/^[A-Za-z]+ \d{4}$/.test(dateStr)) {
            // Month YYYY
            return new Date(dateStr + ' 01');
        }
        if (/Winter|Summer|Spring|Fall/.test(dateStr)) {
            // Season YYYY
            const [season, year] = dateStr.split(' ');
            let month = '01';
            if (season === 'Spring') month = '03';
            if (season === 'Summer') month = '06';
            if (season === 'Fall') month = '09';
            if (season === 'Winter') month = '12';
            return new Date(`${year}-${month}-01`);
        }
        return null;
    }

    // Fetch CSV
    // Add cache-busting query string to force reload
    const cacheBuster = `?_=${Date.now()}`;
    fetch('events_data.csv' + cacheBuster)
        .then(res => res.text())
        .then(csv => {
            // Robust CSV parser for quoted/multiline fields
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
                    // If value is missing, set as empty string
                    obj[h.trim()] = (values[idx] !== undefined ? values[idx] : '').replace(/^"|"$/g, '');
                });
                return obj;
            });

            const now = new Date();
            // Separate upcoming and past events
            const upcomingEvents = [];
            const pastEvents = [];
            events.forEach(event => {
                const eventDate = parseEventDate(event.sortDate);
                if (eventDate && !isNaN(eventDate.getTime()) && eventDate > now) {
                    upcomingEvents.push({ event, eventDate });
                } else {
                    pastEvents.push({ event, eventDate });
                }
            });

            // Sort upcoming events by eventDate ascending (soonest first)
            upcomingEvents.sort((a, b) => a.eventDate - b.eventDate);

            // If no upcoming events, hide the section
            if (upcomingEvents.length === 0) {
                upcomingSection.style.display = 'none';
            }
            // Render upcoming events
            upcomingEvents.forEach(({ event, eventDate }) => {
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
                upcomingGrid.appendChild(card);
            });

            // Sort past events by eventDate descending (most recent first)
            pastEvents.sort((a, b) => b.eventDate - a.eventDate);
            // Render past events
            pastEvents.forEach(({ event, eventDate }) => {
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
                    overlay.innerHTML = overlayHTML;
                    cardInner.appendChild(overlay);
                } else {
                    cardInner = document.createElement('div');
                    cardInner.className = 'event-card';
                    let cardHTML = `<h3 class=\"event-title\">${title}</h3><p class=\"event-description\">${subtitle}</p>`;
                    cardInner.innerHTML = cardHTML;
                }
                card.appendChild(cardInner);
                pastGrid.appendChild(card);
            });
            // Add single-card class if only one card
            if (upcomingGrid.childElementCount === 1) {
                upcomingGrid.classList.add('single-card');
            }
            if (pastGrid.childElementCount === 1) {
                pastGrid.classList.add('single-card');
            }
        });
});
