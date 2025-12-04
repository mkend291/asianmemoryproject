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
        if (values.length >= 10 && values[0] === targetId) {
            return {
                id: values[0],
                title: values[1],
                subtitle: values[2],
                date: values[3],
                location: values[4],
                team_members: values[5],
                youtube_videos: values[6],
                description: values[7],
                links: JSON.parse(values[8]),
                cover_image: values[9]
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
    
    container.innerHTML = `
        ${youtubeHTML}
        
        <h1 class="event-detail-title">${event.title}</h1>
        <p class="event-detail-subtitle">${event.subtitle}</p>
        

        <div class="event-info-grid">
            ${event.date !== 'TBD' ? (() => {
                // Format date as 'Month Day, Year'
                let formattedDate = event.date;
                // Try to parse date if in DD-MMM-YY or similar format
                const dateObj = new Date(event.date);
                if (!isNaN(dateObj.getTime())) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    formattedDate = dateObj.toLocaleDateString('en-US', options);
                }
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
                    <p>${event.location}</p>
                </div>
            ` : ''}
            
            ${event.team_members !== 'TBD' ? `
                <div class="event-info-item">
                    <h3>Team Members</h3>
                    <p>${event.team_members}</p>
                </div>
            ` : ''}
            
            ${event.description ? `
                <div class="event-info-item">
                    <h3>Description</h3>
                    <p>${event.description}</p>
                </div>
            ` : ''}
        </div>

        <div class="event-links-section">
            <h2>Event Resources</h2>
            <div class="event-links-grid">
                ${linksHTML}
            </div>
        </div>
    `;
    
    // Update page title
    document.title = `${event.title} - Asian Memory Project`;
}
