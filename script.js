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

  const supabaseUrl = "https://bvvvlqbtwqetltdcvioie.supabase.co/rest/v1/";
  const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxqYnR3cWVo0bHRkY3Zpb2llLCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg2MjA1OTg3LCJleHAiOjIwMzk4ODE1ODd9.4ccII6MjA20TU5OTgzM30.d-leDFpzc6uxDvq47_FCOFqh0ztaL11oozm-z6T9N_M";

  let user = null;

  try {
    // Try display_name first
    let url = `${supabaseUrl}leaderboard_full_0208?display_name=ilike.*${encodeURIComponent(username)}*&select=*`;
    let res = await fetch(url, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
    });
    let data = await res.json();
    if (data.length) user = data[0];

    // Fallback to username field
    if (!user) {
      url = `${supabaseUrl}leaderboard_full_0208?username=ilike.*${encodeURIComponent(username)}*&select=*`;
      res = await fetch(url, {
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
      });
      data = await res.json();
      if (data.length) user = data[0];
    }

    if (!user) {
      statsBox.innerHTML = "<span style='color:#ff9494;'>User not found.</span>";
      return;
    }

    const rank = user.rank || "—";
    const level = user.level || "—";
    const xp = user.total_xp ? Number(user.total_xp).toLocaleString() : "—";

    const tweetText = encodeURIComponent(
      `My Union Testnet Stats:\n\n• Rank: #${rank}\n• Level: ${level}\n• Total XP: ${xp}\n\nCheck yours → union-stats.vercel.app`
    );
    const shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    statsBox.innerHTML = `
      <b>@${user.display_name || user.username}</b><br>
      <span style="color:#A9ECFD;">Rank:</span> #${rank}<br>
      <span style="color:#A9ECFD;">Level:</span> ${level}<br>
      <span style="color:#A9ECFD;">Total XP:</span> ${xp}<br>
      <a class="share-x-btn" href="${shareUrl}" target="_blank" rel="noopener">
        Share Your Stats on X
      </a>
    `;

  } catch (err) {
    statsBox.innerHTML = "<span style='color:#ff9494;'>Error fetching data.</span>";
    console.error("Fetch error:", err);
  }
};
