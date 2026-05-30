// ============================================================
// NBAlive.js
// NBA Playoffs 2026 = live data from balldontlie.io
// NBA Regular Season = completed, no live fetch needed
// Everything else lives in basketballmock.js
// ============================================================

const API_KEY = "c2c68599-643d-4291-992f-60fa5ed143f5"; // ← paste your key here

const BASE_URL = "https://api.balldontlie.io/v1";

async function bdlFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: API_KEY }
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

// ============================================================
// FETCH LIVE NBA PLAYOFF GAMES
// Gets all postseason games from April 18 onwards
// ============================================================
async function fetchNBAPlayoffGames() {
  const data = await bdlFetch(
    `/games?start_date=2026-04-18&end_date=2026-06-30&per_page=100`
  );
  const games = data.data.filter(g => g.postseason === true);
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
    round: game.round || "Playoffs",
    status: status
  };
}

// ============================================================
// BUILD LIVE NBA PLAYOFFS 2026 COMPETITION OBJECT
// ============================================================
async function buildNBAPlayoffs2026() {
  try {
    const games = await fetchNBAPlayoffGames();

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
      id: "nba-2026-playoffs",
      name: "NBA Playoffs 2026",
      sport: "basketball",
      category: "NBA",
      status: "ongoing",
      dateStart: "2026-04-18",
      dateEnd: "2026-06-19",
      description: "The 2026 NBA Playoffs. The New York Knicks represent the East. The Western Conference Finals Game 7 between OKC Thunder and San Antonio Spurs is tonight.",
      watchLink: null,
      teams: teams,
      matches: matches,
      bracket: null
    };

  } catch (error) {
    console.error("Failed to fetch live NBA playoff data:", error);
    return null;
  }
}

// ============================================================
// MAIN: getBasketballData()
// ============================================================
async function getBasketballData() {
  const livePlayoffs = await buildNBAPlayoffs2026();

  // NBA Regular Season is done — use the mock entry as-is
  const regularSeason = BASKETBALL_DATA.find(c => c.id === "nba-2025-regular");

  // Everything else from mock file except the regular season
  const restOfMock = BASKETBALL_DATA.filter(c => c.id !== "nba-2025-regular");

  // Put live playoffs first, then regular season, then everything else
  const combined = [];
  if (livePlayoffs) combined.push(livePlayoffs);
  if (regularSeason) combined.push(regularSeason);
  combined.push(...restOfMock);

  return combined;
}

window.getBasketballData = getBasketballData;