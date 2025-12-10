// Dynamically load members from CSV and render to members.html
// Simple CSV parser that handles quoted fields with commas
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
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

fetch('team_members.csv')
  .then(response => response.text())
  .then(data => {
    const rows = parseCSV(data).filter(row => row.length && row.some(cell => cell.trim()));
    const headers = rows[0].map(h => h.trim());
    const members = rows.slice(1).map(row => {
      const member = {};
      headers.forEach((header, i) => {
        member[header] = row[i] ? row[i].trim() : '';
      });
      return member;
    });

    // Separate current and previous members by 'status' column
    const currentMembers = members.filter(m => m.status && m.status.toLowerCase() === 'current');
    const previousMembers = members.filter(m => m.status && m.status.toLowerCase() === 'previous');

    function sortMembers(members) {
      const director = members.filter(m => m.category && m.category.toLowerCase() === 'director');
      const musicians = members.filter(m => m.category && m.category.toLowerCase() === 'musicians');
      // Group all other categories together, then sort alphabetically within each group
      const otherCategories = [...new Set(members.map(m => m.category))]
        .filter(cat => cat && cat.toLowerCase() !== 'director' && cat.toLowerCase() !== 'musicians');
      let others = [];
      otherCategories.forEach(cat => {
        const group = members.filter(m => m.category === cat);
        group.sort((a, b) => a.name.localeCompare(b.name));
        others = others.concat(group);
      });
      // Alphabetical sorting is only applied within each group, not across all others
      director.sort((a, b) => a.name.localeCompare(b.name));
      musicians.sort((a, b) => a.name.localeCompare(b.name));
      return [...director, ...musicians, ...others];
    }

    // Render current members
    const currentList = document.getElementById('current-members-list');
    currentList.innerHTML = '';
    sortMembers(currentMembers).forEach(m => {
      const li = document.createElement('li');
      li.innerHTML = `${m.name} <span class="role">(${m.role})</span>`;
      currentList.appendChild(li);
    });

    // Render previous members
    const previousList = document.getElementById('previous-members-list');
    previousList.innerHTML = '';
    sortMembers(previousMembers).forEach(m => {
      const li = document.createElement('li');
      li.innerHTML = `${m.name} <span class="role">(${m.role})</span>`;
      previousList.appendChild(li);
    });
  });
