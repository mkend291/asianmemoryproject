// Load event details dynamically based on URL parameter
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    if (eventId) {
        loadEventDetails(eventId);
    } else {
        window.location.href = 'events.html';
    }
});

async function loadEventDetails(eventId) {
    try {
        const response = await fetch('events_data.csv');
        const csvText = await response.text();
        const event = parseEventCSV(csvText, eventId);
        
        if (event) {
            displayEventDetails(event);
        } else {
            window.location.href = 'events.html';
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        window.location.href = 'events.html';
    }
}

function parseEventCSV(csvText, targetId) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    // Handle multi-line quoted fields
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
            currentLine += char;
        } else if (char === '\n' && !inQuotes) {
            if (currentLine.trim()) {
                lines.push(currentLine);
            }
            currentLine = '';
        } else {
            currentLine += char;
        }
    }
    if (currentLine.trim()) {
        lines.push(currentLine);
    }
    
    // Parse each line
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
            // Only match if event_id matches, regardless of extra columns
            if (values.length > 0 && values[0] === targetId) {
            return {
                id: values[0] || '',
                title: values[1] || '',
                subtitle: values[2] || '',
                sortDate: values[3] || '',
                displayDate: String(values[4] || ''),
                location: values[5] || '',
                team_members: values[6] || '',
                youtube_videos: values[7] || '',
                description: values[8] || '',
                links: values[9] ? JSON.parse(values[9]) : [],
                cover_image: values[10] || '',
                gallery_prefix: values[11] || '',
                gallery_count: values[12] || ''
            };
        }
    }
    
    return null;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && nextChar === '"' && inQuotes) {
            // Escaped quote - add one quote and skip next
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function displayEventDetails(event) {
        // Gallery section: try .jpg, .jpeg, .png for each index
        let galleryHTML = '';
            if (event.gallery_prefix) {
                const prefix = event.gallery_prefix;
                const extensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
                let images = '';
                let found = false;
                let i = 1;
                while (true) {
                    let imageFound = false;
                    for (const ext of extensions) {
                        const fileName = `Events/${prefix}${i}.${ext}`;
                        // Synchronously check if image exists by attempting to load it (will be handled by onerror in img tag)
                        images += `<div class=\"gallery-image\"><img src=\"${fileName}\" alt=\"Gallery ${i}\" onerror=\"this.parentElement.style.display='none'\"></div>`;
                        imageFound = true;
                    }
                    if (!imageFound) break;
                    found = true;
                    i++;
                    // Optional: add a max limit to prevent infinite loop
                    if (i > 100) break;
                }
                if (!found) {
                    images = '<div class="gallery-placeholder">No gallery images found for this event.</div>';
                }
                galleryHTML = `
                    <div class=\"event-gallery-section\">
                        <h2>Event Gallery</h2>
                        <div class=\"event-gallery-grid\">
                            ${images}
                        </div>
                    </div>
                `;
        }
    const container = document.getElementById('event-content');
    
    // Helper function to extract video ID from YouTube URL
    function extractVideoId(url) {
        // If it's already just an ID (no slashes or protocol), return it
        if (!url.includes('/') && !url.includes('://')) {
            return url;
        }
        
        // Extract from various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?\/]+)/,
            /youtube\.com\/embed\/([^&\?\/]+)/,
            /youtube\.com\/v\/([^&\?\/]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        
        return url; // Return as-is if no pattern matches
    }
    
    // Build YouTube videos section if available
    let youtubeHTML = '';
    if (event.youtube_videos && event.youtube_videos !== 'TBD') {
        // Parse if it's a JSON array of video IDs, otherwise treat as single ID
        let videoIds = [];
        try {
            videoIds = JSON.parse(event.youtube_videos);
        } catch {
            videoIds = [event.youtube_videos];
        }
        
        const videoEmbeds = videoIds.map(videoUrl => {
            const videoId = extractVideoId(videoUrl);
            return `
            <div class="youtube-embed">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `}).join('');
        
        youtubeHTML = `
            <div class="event-videos-section">
                <h2>Videos</h2>
                <div class="videos-grid">
                    ${videoEmbeds}
                </div>
            </div>
        `;
    }
    
    let linksHTML = '';
    if (event.links && event.links.length > 0) {
        event.links.forEach(link => {
            linksHTML += `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="event-detail-link">
                    <span>${link.text}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            `;
        });
    } else {
        linksHTML = '<div class="event-placeholder">No event resources found for this event.</div>';
    }
    
    container.innerHTML = `
        ${youtubeHTML}
        
        <h1 class="event-detail-title">${event.title}</h1>
        <p class="event-detail-subtitle">${event.subtitle}</p>
        
        <div class="event-info-grid">
            ${event.displayDate && event.displayDate !== 'TBD' ? (() => {
                // Format displayDate as string and handle line breaks
                let formattedDate = event.displayDate.replace(/\n/g, '<br>');
                return `
                    <div class="event-info-item">
                        <h3>Date</h3>
                        <p>${formattedDate}</p>
                    </div>
                `;
            })() : ''}
            
            ${event.location !== 'TBD' ? `
                <div class="event-info-item">
                    <h3>Location</h3>
                    <p>${event.location.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${event.team_members !== 'TBD' ? (() => {
                // Split team members by comma and list vertically
                const membersArr = event.team_members.split(',').map(m => m.trim()).filter(Boolean);
                const membersHTML = membersArr.map(m => `<li>${m}</li>`).join('');
                return `
                    <div class="event-info-item">
                        <h3>Team Members</h3>
                        <ul class="event-team-list">${membersHTML}</ul>
                    </div>
                `;
            })() : ''}
            
            ${event.description ? `
                <div class="event-info-item">
                    <h3>Description</h3>
                        <p>${event.description.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
        </div>

        <div class="event-links-section">
            <h2>Event Resources</h2>
            <div class="event-links-grid">
                ${linksHTML}
            </div>
        </div>
        
        <div class="event-gallery-section">
            <h2>EVENT GALLERY</h2>
            <div class="event-gallery-grid">
                ${(() => {
                    if (event.gallery_count && parseInt(event.gallery_count) > 0 && event.gallery_prefix) {
                        const count = parseInt(event.gallery_count);
                        const prefix = event.gallery_prefix;
                        const extensions = ['jpg', 'jpeg', 'png'];
                        let images = '';
                        for (let i = 1; i <= count; i++) {
                            for (const ext of extensions) {
                                const fileName = `Events/${prefix}-${i}.${ext}`;
                                images += `<div class=\"gallery-image card\" style=\"display:none;\" onclick=\"openLightbox('${fileName}')\"><img src=\"${fileName}\" alt=\"Gallery ${i}\" onload=\"this.parentElement.style.display='flex'\" onerror=\"this.parentElement.style.display='none'\"></div>`;
                            }
                        }
                        if (!images.trim()) {
                            images = '<div class="gallery-placeholder">No gallery images found for this event.</div>';
                        }
                        // Add lightbox modal HTML
                        images += `
                        <div id=\"gallery-lightbox\" style=\"display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:9999;align-items:center;justify-content:center;\" onclick=\"closeLightbox()\">
                            <img id=\"gallery-lightbox-img\" src=\"\" style=\"max-width:90vw;max-height:90vh;border-radius:16px;box-shadow:0 4px 32px rgba(0,0,0,0.4);\">
                        </div>
                        `;
                        return images;
                    } else {
                        return '<div class="gallery-placeholder">No gallery images found for this event.</div>';
                    }
                })()}
            </div>
        </div>
    `;
    
    // Update page title
    document.title = `${event.title} - Asian Memory Project`;

    // Lightbox functions for gallery
    window.openLightbox = function(src) {
        const lightbox = document.getElementById('gallery-lightbox');
        const img = document.getElementById('gallery-lightbox-img');
        if (lightbox && img) {
            img.src = src;
            lightbox.style.display = 'flex';
        }
    }

    window.closeLightbox = function() {
        const lightbox = document.getElementById('gallery-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
        }
    }
}
