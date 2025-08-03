// ====== Level stats for bar graph ======
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

// ====== Responsive header adjustment ======
function adjustHeader() {
  const header = document.querySelector('header .header-inner');
  if (window.innerWidth < 700) {
    header.style.flexDirection = "column-reverse";
    header.style.alignItems = "flex-start";
  } else {
    header.style.flexDirection = "row";
    header.style.alignItems = "center";
  }
}
window.addEventListener("resize", adjustHeader);
window.addEventListener("DOMContentLoaded", () => {
  adjustHeader();
  renderLevelStatsBarGraph();
});

// ====== Fetch and show user stats ======
document.getElementById("search-btn").onclick = async function () {
  const userInput = document.getElementById("username-input").value.trim();
  const username = userInput.replace(/^@/, "").toLowerCase();
  const statsBox = document.getElementById("user-stats");

  if (!username) {
    statsBox.innerHTML = "<span style='color:#ff9494;'>Please enter a username.</span>";
    statsBox.classList.add("visible");
    return;
  }

  statsBox.innerHTML = "<span style='color:#A9ECFD;'>Loading...</span>";
  statsBox.classList.add("visible");

  const supabaseUrl = window.ENV?.SUPABASE_URL || "";
  const apiKey = window.ENV?.SUPABASE_KEY || "";

  let user = null;

  // First try display_name
  let url = `${supabaseUrl}leaderboard_full_0208?display_name=ilike.*${encodeURIComponent(username)}*&select=*`;
  let res = await fetch(url, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
  });
  let data = await res.json();
  if (data.length) {
    user = data[0];
  }

  // If not found, try username field
  if (!user) {
    url = `${supabaseUrl}leaderboard_full_0208?username=ilike.*${encodeURIComponent(username)}*&select=*`;
    res = await fetch(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    });
    data = await res.json();
    if (data.length) {
      user = data[0];
    }
  }

  // Final fallback
  if (!user) {
    statsBox.innerHTML = "<span style='color:#ff9494;'>User not found.</span>";
    return;
  }

  // Fetch mindshare (season 0 & 1)
  const getMindshare = async (season) => {
    let url = `${supabaseUrl}yaps_season_${season}?username=eq.${encodeURIComponent(user.username)}&select=jsonInput`;
    let res = await fetch(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    });
    let val = "—";
    if (res.ok) {
      const d = await res.json();
      if (d.length && d[0].jsonInput) {
        try {
          const j = JSON.parse(d[0].jsonInput);
          val = j.mindshare ? (j.mindshare * 100).toFixed(2) : "0.00";
        } catch (e) {}
      }
    }
    return val;
  };

  const mindshareS1 = await getMindshare("one");
  const mindshareS0 = await getMindshare("zero");

  const rank = user.rank || "—";
  const level = user.level || "—";
  const xp = user.total_xp ? Number(user.total_xp).toLocaleString() : "—";

  // X share link
  const tweetText = encodeURIComponent(
    `My Union Testnet Stats:\n\n• Rank: #${rank}\n• Level: ${level}\n• Total XP: ${xp}\n• Mindshare S1: ${mindshareS1}\n• Mindshare S0: ${mindshareS0}\n\nCheck yours → union-stats.vercel.app`
  );
  const shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  statsBox.innerHTML = `
    <b>@${user.display_name || user.username}</b> <br>
    <span style="color:#A9ECFD;">Rank:</span> #${rank}<br>
    <span style="color:#A9ECFD;">Level:</span> ${level} <br>
    <span style="color:#A9ECFD;">Total XP:</span> ${xp}<br>
    <span style="color:#A9ECFD;">Mindshare S1:</span> ${mindshareS1}<br>
    <span style="color:#A9ECFD;">Mindshare S0:</span> ${mindshareS0}<br>
    <a id="share-x-btn" class="share-x-btn" href="${shareUrl}" target="_blank" rel="noopener">
      Share Your Stats on X
    </a>
  `;
};

// ====== Render bar graph of users per level ======
function renderLevelStatsBarGraph() {
  const graphLabels = [];
  const usersPerLevel = [];

  for (let lvl = 10; lvl >= 1; lvl--) {
    graphLabels.push(`Lv ${lvl}`);
    usersPerLevel.push(levelStats[lvl + ""]?.count || 0);
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
      indexAxis: 'y',
      responsive: true,
      layout: { padding: { left: 45, right: 14, top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100000,
          ticks: {
            stepSize: 25000,
            color: "#A9ECFD",
            font: { family: 'JetBrains Mono', size: 14 },
            callback: function (value) {
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
