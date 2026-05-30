// ============================================================
// NBAlive.js
// Fetches live NBA Regular Season data from balldontlie.io
// Mock data for everything else lives in basketballmock.js
// ============================================================

const API_KEY = "c2c68599-643d-4291-992f-60fa5ed143f5"; // ← paste your key here

const BASE_URL = "https://api.balldontlie.io/v1";

// ============================================================
// HELPER: fetch from the API with your key attached
// ============================================================
async function bdlFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: API_KEY }
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

// ============================================================
// HELPER: build a "YYYY-MM-DD" string from a Date object
// ============================================================
function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

// ============================================================
// FETCH LIVE NBA GAMES
// Gets games from 14 days ago through 7 days ahead
// Filters out playoff games — regular season only
// ============================================================
async function fetchNBAGames() {
  const start = new Date();
  start.setDate(start.getDate() - 14);

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const data = await bdlFetch(
    `/games?start_date=${toDateStr(start)}&end_date=${toDateStr(end)}&per_page=100`
  );

  const games = data.data.filter(g => g.postseason === false); // regular season only
  return games;
}

// ============================================================
// CONVERT: API game object → your app's Match format
// ============================================================
function apiGameToMatch(game) {
  let status = "upcoming";
  if (game.status === "Final") {
    status = "completed";
  } else if (game.period > 0 && game.time && game.time !== "") {
    status = "live";
  }

  const homeId = game.home_team.abbreviation.toLowerCase();
  const awayId = game.visitor_team.abbreviation.toLowerCase();

  return {
    id: `api-${game.id}`,
    homeTeam: homeId,
    awayTeam: awayId,
    dateTime: game.date,
    venue: null,
    homeScore: game.home_team_score || null,
    awayScore: game.visitor_team_score || null,
    round: "Regular Season",
    status: status
  };
}

// ============================================================
// BUILD LIVE NBA REGULAR SEASON COMPETITION OBJECT
// ============================================================
async function buildNBARegularSeason() {
  try {
    const games = await fetchNBAGames();

    const teamsMap = new Map();
    games.forEach(game => {
      const homeId = game.home_team.abbreviation.toLowerCase();
      const awayId = game.visitor_team.abbreviation.toLowerCase();
      if (!teamsMap.has(homeId)) {
        teamsMap.set(homeId, { id: homeId, name: game.home_team.full_name });
      }
      if (!teamsMap.has(awayId)) {
        teamsMap.set(awayId, { id: awayId, name: game.visitor_team.full_name });
      }
    });

    const teams = Array.from(teamsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const matches = games.map(apiGameToMatch);

    return {
      id: "nba-2025-regular",
      name: "NBA Regular Season 2025–26",
      sport: "basketball",
      category: "NBA",
      status: "ongoing",
      dateStart: "2025-10-22",
      dateEnd: "2026-04-13",
      description: "The 79th NBA season featuring all 30 teams competing across the Eastern and Western Conferences for playoff seeding.",
      watchLink: null,
      teams: teams,
      matches: matches,
      bracket: null
    };

  } catch (error) {
    console.error("Failed to fetch live NBA data:", error);

    // Fall back to the mock NBA regular season entry if API fails
    return BASKETBALL_DATA.find(c => c.id === "nba-2025-regular");
  }
}

// ============================================================
// MAIN: getBasketballData()
// Called by competitions.html and detail.html
// Combines live NBA entry with everything else from mock file
// ============================================================
async function getBasketballData() {
  const liveNBA = await buildNBARegularSeason();
  const mockWithoutNBA = BASKETBALL_DATA.filter(c => c.id !== "nba-2025-regular");
  return [liveNBA, ...mockWithoutNBA];
}

window.getBasketballData = getBasketballData;