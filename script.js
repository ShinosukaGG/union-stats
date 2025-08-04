// === Config ===
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxxYnR3cWV0bHRkY3Zpb2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjM4MzMsImV4cCI6MjA2OTU5OTgzM30.d-leDFpzc6uxDvq47_FC0Fqh0ztaL11Oozm-z6T9N_M';
const SUPABASE_URL = 'https://bvvlqbtwqetltdcvioie.supabase.co/rest/v1';

const levelStats = {
  "1": { count: 67227 },
  "2": { count: 65181 },
  "3": { count: 83009 },
  "4": { count: 62302 },
  "5": { count: 47586 },
  "6": { count: 33283 },
  "7": { count: 34388 },
  "8": { count: 3550 },
  "9": { count: 708 },
  "10": { count: 58 }
};

// Util: fallback pfp
function getFallbackPfp(username) {
  const seed = encodeURIComponent(username || 'uniontester');
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}`;
}

// Percentile logic
function calculatePercentile(rank, stats) {
  const total = Object.values(stats).reduce((acc, l) => acc + l.count, 0);
  if (!rank || isNaN(rank) || rank < 1) return null;
  return ((rank - 1) / total * 100).toFixed(2);
}

// Supabase fetch logic
async function fetchUserFromLeaderboard(username) {
  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
  const queries = [
    `display_name=ilike.${username}`,
    `username=ilike.${username}`,
    `display_name=ilike.%${username}%`,
    `username=ilike.%${username}%`
  ];
  for (const query of queries) {
    const res = await fetch(`${SUPABASE_URL}/leaderboard_full_0208?${query}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length) {
        return data.find(d =>
          (d.display_name || '').toLowerCase() === username.toLowerCase() ||
          (d.username || '').toLowerCase() === username.toLowerCase()
        ) || data[0];
      }
    }
  }
  return null;
}

// Chart render logic
function renderBarGraph(stats) {
  const ctx = document.getElementById('levelChart').getContext('2d');
  const levels = Object.keys(stats).reverse();
  const values = levels.map(lvl => stats[lvl].count);
  const labels = levels.map(lvl => `Lvl ${lvl}`);

  if (window.levelChartInstance) window.levelChartInstance.destroy();
  window.levelChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        borderRadius: 9,
        backgroundColor: 'rgba(169,236,253,0.90)',
        borderColor: '#A9ECFD',
        borderWidth: 2,
        maxBarThickness: 28
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false }},
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#333' },
          ticks: {
            color: '#A9ECFD',
            stepSize: 25000,
            callback: val => val.toLocaleString()
          }
        },
        y: {
          grid: { color: '#222' },
          ticks: { color: '#A9ECFD' }
        }
      }
    }
  });
}

// === Main event handler ===
document.getElementById('view-stats').addEventListener('click', async () => {
  const usernameInput = document.getElementById('username');
  let username = usernameInput.value.trim().replace(/^@/, '');
  const errorDiv = document.getElementById('landing-error');
  errorDiv.textContent = '';
  if (!username) {
    usernameInput.classList.add('uts-input-error');
    errorDiv.textContent = 'Please enter a username.';
    return;
  }
  usernameInput.classList.remove('uts-input-error');
  errorDiv.textContent = '';

  // Loading state
  document.getElementById('view-stats').textContent = 'Loading...';
  document.getElementById('view-stats').disabled = true;

  const user = await fetchUserFromLeaderboard(username);

  document.getElementById('view-stats').textContent = 'View Your Stats';
  document.getElementById('view-stats').disabled = false;

  if (!user) {
    errorDiv.textContent = "❌ User not found. Please check the username!";
    return;
  }

  // Hide landing, show dashboard
  document.getElementById('landing').style.display = 'none';
  document.getElementById('main-content').style.display = 'flex';

  // Build card
  let json = {};
  try {
    json = typeof user.jsonInput === 'string' ? JSON.parse(user.jsonInput) : user.jsonInput || {};
  } catch {}

  const uname = user.username || user.display_name || username;
  const pfp = json.pfp || user.pfp || getFallbackPfp(uname);

  document.getElementById('user-pfp').src = pfp;
  document.getElementById('user-username').textContent = '@' + uname;

  // Top X %
  const rank = user.rank || json.rank;
  const topX = calculatePercentile(rank, levelStats);
  document.getElementById('user-top-x').textContent = topX ? topX : '--';
  document.getElementById('user-top-x-desc').textContent = topX
    ? `You are among the Top ${topX}% Union Testers`
    : 'Percentile unavailable';

  // --- REMOVE old stat blocks if present ---
  const oldRows = document.querySelectorAll('.uts-stat-row, .uts-stats-list, .uts-stats-dynamic');
  oldRows.forEach(node => node && node.remove());

  // --- CREATE a styled stat block dynamically ---
  const statsParent = document.querySelector('.uts-card-details');

  // Build stat values
  const userLevel = json.level || user.level || '-';
  const userTitle = json.title || user.title || '-';
  const userXP = json.total_xp || user.total_xp || '-';

  // Create wrapper
  const statDiv = document.createElement('div');
  statDiv.style.width = '100%';
  statDiv.style.margin = '18px 0 0 0';
  statDiv.style.display = 'flex';
  statDiv.style.flexDirection = 'column';
  statDiv.style.gap = '8px';

  // Level row
  const row1 = document.createElement('div');
  row1.style.display = 'flex';
  row1.style.justifyContent = 'flex-start';
  row1.style.alignItems = 'center';
  row1.style.fontFamily = "'JetBrains Mono', monospace";
  row1.style.fontSize = '1.07rem';
  row1.innerHTML = `<span style="color:#377c92;font-weight:700;min-width:65px;letter-spacing:0.04em;text-align:right;display:inline-block;">Level:</span>
    <span style="color:#23272f;font-family:'Supermolot',monospace;font-weight:900;font-size:1.11rem;padding-left:24px;letter-spacing:0.01em;text-align:left;">${userLevel}</span>`;

  // Title row
  const row2 = document.createElement('div');
  row2.style.display = 'flex';
  row2.style.justifyContent = 'flex-start';
  row2.style.alignItems = 'center';
  row2.style.fontFamily = "'JetBrains Mono', monospace";
  row2.style.fontSize = '1.07rem';
  row2.innerHTML = `<span style="color:#377c92;font-weight:700;min-width:65px;letter-spacing:0.04em;text-align:right;display:inline-block;">Title:</span>
    <span style="color:#23272f;font-family:'Supermolot',monospace;font-weight:900;font-size:1.11rem;padding-left:24px;letter-spacing:0.01em;text-align:left;">${userTitle}</span>`;

  // XP row
  const row3 = document.createElement('div');
  row3.style.display = 'flex';
  row3.style.justifyContent = 'flex-start';
  row3.style.alignItems = 'center';
  row3.style.fontFamily = "'JetBrains Mono', monospace";
  row3.style.fontSize = '1.07rem';
  row3.innerHTML = `<span style="color:#377c92;font-weight:700;min-width:65px;letter-spacing:0.04em;text-align:right;display:inline-block;">Total XP:</span>
    <span style="color:#23272f;font-family:'Supermolot',monospace;font-weight:900;font-size:1.11rem;padding-left:24px;letter-spacing:0.01em;text-align:left;">${userXP}</span>`;

  statDiv.appendChild(row1);
  statDiv.appendChild(row2);
  statDiv.appendChild(row3);

  // Inject at the end of .uts-card-details
  statsParent.appendChild(statDiv);

  // Share button
  const shareBtn = document.getElementById('share-x-btn');
  shareBtn.style.display = 'block';
  shareBtn.onclick = () => {
    const tweet = `The Union Tester Stats are finally here! 📊⚡️

See your XP, title, and percentile among thousands of testers.

View your stats at: https://union-statistics.vercel.app

My Stats are 👇`;
    const data = `Level: ${userLevel}, Title: ${userTitle}\nXP: ${userXP}${topX ? `\nI am Top ${topX}%\n` : ''}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet + '\n' + data)}&url=https://x.com/Shinosuka_eth/status/1952291198124823006`;
    window.open(url, '_blank');
  };

  // Chart
  renderBarGraph(levelStats);
});

// Enter key triggers stats
document.getElementById('username').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('view-stats').click();
});
