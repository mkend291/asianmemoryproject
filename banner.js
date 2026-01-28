// Fetch and display a scrolling banner of upcoming events (event name + displayDate)
document.addEventListener('DOMContentLoaded', function() {
    const banner = document.getElementById('upcoming-events-banner');
    if (!banner) return;
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
                banner.style.display = 'none';
                return;
            }
            // Prepare fade-in/fade-out single event display
            let idx = 0;
            function renderEvent(i, fadeIn = true) {
                const e = upcoming[i];
                const span = document.createElement('span');
                span.className = 'banner-event banner-fade';
                if (fadeIn) span.classList.add('active');
                // Make the event a hyperlink to its detail page if event_id exists
                let link = '#';
                if (e.event_id && e.event_id.trim()) {
                    link = `event-detail.html?event=${encodeURIComponent(e.event_id)}`;
                }
                span.innerHTML = `<a href="${link}" class="banner-link"><strong>${e.title}</strong> (${e.displayDate})</a>`;
                banner.appendChild(span);
                // After rendering, check if it overflows and shrink if needed
                setTimeout(() => {
                    span.classList.remove('shrink');
                    if (span.scrollWidth > banner.clientWidth * 0.96) {
                        span.classList.add('shrink');
                    }
                }, 0);
                return span;
            }
            // Initial render
            banner.innerHTML = '';
            let current = renderEvent(idx, true);
            if (upcoming.length > 1) {
                setInterval(() => {
                    // Prepare next
                    idx = (idx + 1) % upcoming.length;
                    const next = renderEvent(idx, false);
                    // Force reflow for transition
                    void next.offsetWidth;
                    // Start fade in for next and fade out for current simultaneously
                    next.classList.add('active');
                    current.classList.remove('active');
                    // Remove old after fade
                    setTimeout(() => {
                        if (current && current.parentNode) current.parentNode.removeChild(current);
                        current = next;
                    }, 1200); // match CSS fade duration
                }, 5000);
            }
        });
});
