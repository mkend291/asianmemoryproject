// Loads and displays the music catalog from CSV
// Uses header names dynamically, not hardcoded

document.addEventListener('DOMContentLoaded', function() {
    fetch('music/amp-music-catalog.csv?_=' + Date.now())
        .then(res => res.text())
        .then(csv => {
            const rows = parseCSV(csv);
            if (!rows.length) return;
            const headers = rows[0].map(h => h.trim());

            let data = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((h, i) => obj[h] = row[i] ? row[i].trim() : '');
                return obj;
            });

            // Sort by year (most recent first) if year column exists
            const yearHeader = headers.find(h => h.toLowerCase() === 'year');
            if (yearHeader) {
                data = data.sort((a, b) => {
                    const ay = parseInt(a[yearHeader]) || 0;
                    const by = parseInt(b[yearHeader]) || 0;
                    return by - ay;
                });
            }

            // Calculate number of pieces and total minutes
            const titleHeader = headers[0];
            const durationHeader = headers.find(h => h.toLowerCase() === 'duration');
            let numPieces = 0;
            let totalMinutes = 0;
            data.forEach(piece => {
                if (piece[titleHeader] && piece[titleHeader] !== '-') {
                    numPieces++;
                    // Parse duration like 3'00" or 3'30" or 17'00" etc.
                    if (durationHeader && piece[durationHeader] && piece[durationHeader] !== '-') {
                        const match = piece[durationHeader].match(/(\d+)'(\d{2})?"?/);
                        if (match) {
                            const min = parseInt(match[1], 10);
                            const sec = match[2] ? parseInt(match[2], 10) : 0;
                            totalMinutes += min + sec / 60;
                        }
                    }
                }
            });
            totalMinutes = Math.round(totalMinutes);
            document.getElementById('music-catalog-subtitle').textContent = `${numPieces} pieces | ${totalMinutes} minutes of music`;

            // Find source header
            const sourceHeader = headers.find(h => h.toLowerCase() === 'source');
            // Get unique sources (excluding '-')
            const sources = Array.from(new Set(data.map(d => d[sourceHeader]).filter(s => s && s !== '-'))).sort();
            const filter = document.getElementById('sourceFilter');
            sources.forEach(source => {
                const opt = document.createElement('option');
                opt.value = source;
                opt.textContent = source;
                filter.appendChild(opt);
            });

            function filterAndRender() {
                const selected = filter.value;
                if (!selected) {
                    renderCatalog(data, headers);
                } else {
                    renderCatalog(data.filter(d => d[sourceHeader] === selected), headers);
                }
            }
            filter.addEventListener('change', filterAndRender);
            filterAndRender();
        });

    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
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
        }
        if (field || row.length) {
            row.push(field);
            rows.push(row);
        }
        return rows;
    }

    function renderCatalog(data, headers) {
        const list = document.getElementById('music-catalog-list');
        list.innerHTML = '';
        data.forEach(piece => {
            // Only display if title exists
            if (!piece[headers[0]] || piece[headers[0]] === '-') return;
            const title = piece[headers[0]];
                const source = piece[headers.find(h => h.toLowerCase() === 'source')] || '';
                const formattedSource = source && source !== '-' ? `from ${source}` : '';
            const composer = piece[headers.find(h => h.toLowerCase() === 'composer')] || '';
            const arranger = piece[headers.find(h => h.toLowerCase() === 'arranger')] || '';
            const instrumentation = piece[headers.find(h => h.toLowerCase() === 'instrumentation')] || '';
            const duration = piece[headers.find(h => h.toLowerCase() === 'duration')] || '';
            const premiere = piece[headers.find(h => h.toLowerCase().includes('premiere'))] || '';
            // Build row
            let html = `<div class="music-row">
                <div class="music-title-row">
                    <span class="music-title">${title}</span>
                </div>`;
            if (formattedSource) {
                html += `<div class="music-source"><em>${formattedSource}</em></div>`;
            }
            if (composer && composer !== '-') {
                html += `<div class="music-composer-arranger">by <span class="music-composer">${composer}</span>`;
                if (arranger && arranger !== '-') {
                    html += ` <span class="music-arranger-label">arr.</span><span class="music-arranger">${arranger}</span>`;
                }
                html += `</div>`;
            } else if (arranger && arranger !== '-') {
                html += `<div class="music-composer-arranger"><span class="music-arranger-label">arr.</span><span class="music-arranger">${arranger}</span></div>`;
            }
            if ((instrumentation && instrumentation !== '-') || (duration && duration !== '-')) {
                html += `<div class="music-instrumentation-duration">`;
                if (instrumentation && instrumentation !== '-') {
                    html += `<span class="music-instrumentation">${instrumentation}</span>`;
                }
                if (duration && duration !== '-') {
                    if (instrumentation && instrumentation !== '-') {
                        html += ' &nbsp;|&nbsp; ';
                    }
                    html += `<span class="music-duration">ca. ${duration}</span>`;
                }
                html += `</div>`;
            }
            if (premiere && premiere !== '-') {
                html += `<div class=\"music-premiere\"><em>Premiered on ${premiere}</em></div>`;
            }
            // Purchase link or request note
            const purchaseLink = piece[headers.find(h => h.toLowerCase().includes('purchase'))] || '';
            if (purchaseLink && purchaseLink !== '-') {
                html += `<div class=\"music-purchase\"><a href=\"${purchaseLink}\" target=\"_blank\" rel=\"noopener noreferrer\">Purchase Here</a></div>`;
            } else {
                html += `<div class=\"music-purchase\"><a href=\"requests.html\" class=\"magic-garden-btn\" style=\"font-size:1.08rem;padding:0.6em 1.6em;margin:0;display:inline-block;\">Request</a></div>`;
            }
            html += '</div>';
            list.innerHTML += html;
        });
    }
});
