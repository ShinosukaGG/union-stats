<script>
document.getElementById("search-btn").onclick = async function () {
  const userInput = document.getElementById("username-input").value.trim();
  const username = userInput.replace(/^@/, "").toLowerCase();
  const statsBox = document.getElementById("user-stats");

  if (!username) {
    statsBox.innerHTML = "<span style='color:red;'>Please enter a username.</span>";
    return;
  }

  statsBox.innerHTML = "Loading...";

  const SUPABASE_URL = "https://bvvvlqbtwqetltdcvioie.supabase.co/rest/v1/";
  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dmxqYnR3cWVo0bHRkY3Zpb2llLCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg2MjA1OTg3LCJleHAiOjIwMzk4ODE1ODd9.4ccII6MjA20TU5OTgzM30.d-leDFpzc6uxDvq47_FCOFqh0ztaL11oozm-z6T9N_M";

  let user = null;

  try {
    const headers = {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
    };

    // Try display_name first
    let url = `${SUPABASE_URL}leaderboard_full_0208?display_name=ilike.*${encodeURIComponent(username)}*&select=*`;
    let res = await fetch(url, { headers });
    let data = await res.json();
    if (data.length) user = data[0];

    // Fallback: try username
    if (!user) {
      url = `${SUPABASE_URL}leaderboard_full_0208?username=ilike.*${encodeURIComponent(username)}*&select=*`;
      res = await fetch(url, { headers });
      data = await res.json();
      if (data.length) user = data[0];
    }

    if (!user) {
      statsBox.innerHTML = `<span style='color:red;'>User not found.</span>`;
      return;
    }

    const rank = user.rank || "—";
    const level = user.level || "—";
    const xp = user.total_xp ? Number(user.total_xp).toLocaleString() : "—";

    statsBox.innerHTML = `
      <b>@${user.display_name || user.username}</b><br>
      Rank: #${rank}<br>
      Level: ${level}<br>
      Total XP: ${xp}
    `;

  } catch (err) {
    statsBox.innerHTML = `<span style='color:red;'>Error loading stats.</span>`;
    console.error("Fetch failed:", err);
  }
};
</script>
