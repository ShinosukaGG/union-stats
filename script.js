// ====== Secure: Load config from window.ENV ======
const supabaseUrl = window.ENV?.SUPABASE_URL || "";
const apiKey = window.ENV?.SUPABASE_KEY || "";

// ====== Level stats (static for graph) ======
const levelStats = {
  "1": { count: 67227, totalXp: 816120 },
  "2": { count: 65181, totalXp: 3958460 },
  "3": { count: 83009, totalXp: 7786806 },
  "4": { count: 62302, totalXp: 9146350 },
  "5": { count: 47586, totalXp: 12031584 },
  "6": { count: 33283, totalXp: 17543330 },
  "7": { count: 34388, totalXp: 22788095 },
  "8": { count: 3550, totalXp: 2973385 },
  "9": { count: 708, totalXp: 718170 },
  "10": { count: 58, totalXp: 71500 }
};

// Responsive header
function adjustHeader() {
  const header = document.querySelector('header .header-inner');
  if(window.innerWidth < 700) {
    header.style.flexDirection = "column-reverse";
    header.style.alignItems = "flex-start";
  } else {
    header.style.flexDirection = "row";
    header.style.alignItems = "center";
  }
}
window.addEventListener("resize", adjustHeader);
window.addEventListener("DOMContentLoaded", adjustHeader);

// Search & stats fetch
document.getElementById("search-btn").onclick = async function() {
  const usernameRaw = document.getElementById("username-input").value.trim();
  const username = usernameRaw.replace(/^@/, "");
  const statsBox = document.getElementById("user-stats");
  if (!username) {
    statsBox.innerHTML = "<span style='color:#ff9494;'>Please enter a username.</span>";
    statsBox.classList.add("visible");
    return;
  }
  statsBox.innerHTML = "<span style='color:#A9ECFD;'>Loading...</span>";
  statsBox.classList.add("visible");

  // 1. Try display_name ilike
  let user = null;
  let url = `${supabaseUrl}leaderboard_full_0208?display_name=ilike.*${encodeURIComponent(username)}*&select=*`;
  let res = await fetch(url, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
  });
  if (res.ok) {
    let data = await res.json();
    if (data.length) user = data[0];
  }
  // 2. Try username ilike if not found
  if (!user) {
    url = `${supabaseUrl}leaderboard_full_0208?username=ilike.*${encodeURIComponent(username)}*&select=*`;
    res = await fetch(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    });
    if (res.ok) {
      let data = await res.json();
      if (data.length) user = data[0];
    }
  }
  if (!user) {
    statsBox.innerHTML = "<span style='color:#ff9494;'>User not found.</span>";
    return;
  }

  // Mindshare S1
  let mindshareS1 = "—";
  url = `${supabaseUrl}yaps_season_one?username=eq.${encodeURIComponent(user.username)}&select=jsonInput`;
  res = await fetch(url, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }});
  if (res.ok) {
    const data = await res.json();
    if (data.length && data[0].jsonInput) {
      try {
        const j = JSON.parse(data[0].jsonInput);
        mindshareS1 = j.mindshare ? (j.mindshare * 100).toFixed(2) : "0.00";
      } catch {}
    }
  }
  // Mindshare S0
  let mindshareS0 = "—";
  url = `${supabaseUrl}yaps_season_zero?username=eq.${encodeURIComponent(user.username)}&select=jsonInput`;
  res = await fetch(url, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }});
  if (res.ok) {
    const data = await res.json();
    if (data.length && data[0].jsonInput) {
      try {
        const j = JSON.parse(data[0].jsonInput);
        mindshareS0 = j.mindshare ? (j.mindshare * 100).toFixed(2) : "0.00";
      } catch {}
    }
  }

  // Construct tweet text for X share
  const shareText = encodeURIComponent(
    `My Union Testnet Stats:\n\n• Rank: #${user.rank || "—"}\n• Level: ${user.level || "—"}\n• Total XP: ${user.total_xp ? Number(user.total_xp).toLocaleString() : "—"}\n• Mindshare S1: ${mindshareS1}\n• Mindshare S0: ${mindshareS0}\n\nCheck your stats: union-stats.vercel.app`
  );
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  statsBox.innerHTML = `
    <b>@${user.display_name || user.username}</b> <br>
    <span style="color:#A9ECFD;">Rank:</span> #${user.rank || "—"}<br>
    <span style="color:#A9ECFD;">Level:</span> ${user.level || "—"} <br>
    <span style="color:#A9ECFD;">Total XP:</span> ${user.total_xp ? Number(user.total_xp).toLocaleString() : "—"}<br>
    <span style="color:#A9ECFD;">Mindshare S1:</span> ${mindshareS1}<br>
    <span style="color:#A9ECFD;">Mindshare S0:</span> ${mindshareS0}
    <br>
    <a id="share-x-btn" class="share-x-btn" href="${shareUrl}" target="_blank" rel="noopener">
      Share Your Stats on X
    </a>
  `;
  statsBox.classList.add("visible");
};

// Render horizontal bar graph: Level 1-10, 'Lv X', big milestones
function renderLevelStatsBarGraph() {
  const graphLabels = [];
  const usersPerLevel = [];
  for (let lvl = 10; lvl >= 1; lvl--) {
    graphLabels.push(`Lv ${lvl}`);
    usersPerLevel.push(levelStats[lvl+""]?.count || 0);
  }

  const barCtx = document.createElement("canvas");
  barCtx.height = 480;
  document.getElementById("levels-bar-graph").innerHTML = "";
  document.getElementById("levels-bar-graph").appendChild(barCtx);

  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: graphLabels,
      datasets: [{
        label: "Number of Users",
        data: usersPerLevel,
        backgroundColor: "rgba(169,236,253,0.67)",
        borderColor: "#A9ECFD",
        borderWidth: 2,
        borderRadius: 7
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      layout: { padding: { left: 45, right: 14, top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          min: 0,
          max: 100000,
          ticks: {
            stepSize: 25000,
            color: "#A9ECFD",
            font: { family: 'JetBrains Mono', size: 14 },
            callback: function(value) {
              // Format large numbers (25,000 etc)
              return value.toLocaleString();
            }
          },
          grid: { color: "rgba(169,236,253,0.08)" }
        },
        y: {
          ticks: {
            color: "#A9ECFD",
            font: { family: 'JetBrains Mono', size: 15 }
          },
          grid: { color: "rgba(169,236,253,0.06)" }
        }
      }
    }
  });
}
window.addEventListener("DOMContentLoaded", renderLevelStatsBarGraph);
