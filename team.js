// Load and display team members from CSV
document.addEventListener('DOMContentLoaded', function() {
    loadTeamMembers();
});

async function loadTeamMembers() {
    try {
        const response = await fetch('team_members.csv');
        // Ensure UTF-8 encoding is used
        const csvText = await response.text();
        const teamMembers = parseCSV(csvText);
        displayTeamMembers(teamMembers);
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

function parseCSV(csvText) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    // Handle multi-line quoted fields
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
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
    
    const members = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 4) {
            const member = {
                name: values[0],
                role: values[1],
                category: values[2],
                bio: values[3].replace(/^"|"$/g, ''), // Remove surrounding quotes
                image: values[4] || '' // Optional image path
            };
            // Filter out Unknown category
            if (member.category !== 'Unknown' && member.name && member.name !== '[Placeholder]') {
                members.push(member);
            }
        }
    }
    
    return members;
}

// Helper function to properly parse CSV lines
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
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

function displayTeamMembers(members) {
    // Group members by category
    const categories = {};
    const categoryOrder = ['Director', 'Musicians', 'Poet', 'Designers'];
    
    members.forEach(member => {
        if (!categories[member.category]) {
            categories[member.category] = [];
        }
        categories[member.category].push(member);
    });
    
    // Sort members alphabetically by last name within each category
    Object.keys(categories).forEach(category => {
        categories[category].sort((a, b) => {
            const aLastName = a.name.split(' ').pop();
            const bLastName = b.name.split(' ').pop();
            return aLastName.localeCompare(bLastName);
        });
    });
    
    const container = document.getElementById('team-container');
    container.innerHTML = '';
    
    // Display categories in order
    categoryOrder.forEach(categoryName => {
        if (categories[categoryName] && categories[categoryName].length > 0) {
            const categorySection = createCategorySection(categoryName, categories[categoryName]);
            container.appendChild(categorySection);
        }
    });
}

function createCategorySection(categoryName, members) {
    const section = document.createElement('div');
    section.className = 'team-category';
    
    const title = document.createElement('h3');
    title.className = 'category-title';
    title.textContent = categoryName;
    section.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = members.length === 1 ? 'team-grid team-grid-single' : 'team-grid';
    
    members.forEach(member => {
        const card = createFlipCard(member);
        grid.appendChild(card);
    });
    
    section.appendChild(grid);
    return section;
}
function createFlipCard(member) {
    const flipCard = document.createElement('div');
    flipCard.className = 'flip-card';
    
    // Use actual image if available, otherwise use placeholder
    let imageUrl;
    if (member.image && member.image.trim() !== '') {
        imageUrl = member.image;
    } else {
        // Fallback to placeholder
        const encodedName = encodeURIComponent(member.name.replace(/ /g, '+'));
        imageUrl = `https://via.placeholder.com/300x400/7B2CBF/ffffff?text=${encodedName}`;
    }
    
    // Convert newlines in bio to <br> tags with double breaks for paragraphs
    const bioWithBreaks = member.bio.replace(/\n/g, '<br><br>');
    
    flipCard.innerHTML = `
        <div class="flip-card-inner">
            <div class="flip-card-front">
                <img src="${imageUrl}" alt="${member.name}">
                <div class="member-name">${member.name}</div>
            </div>
            <div class="flip-card-back">
                <h3>${member.name}</h3>
                <p class="member-role">${member.role}</p>
                <p class="member-bio">${bioWithBreaks}</p>
            </div>
        </div>
    `;
    
    return flipCard;
}
