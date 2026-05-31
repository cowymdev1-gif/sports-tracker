// ============================================================
// NBAlive.js
// NBA Playoffs 2026 = live data from balldontlie.io
// NBA Regular Season = completed, no live fetch needed
// Everything else lives in basketballmock.js
// ============================================================

const API_KEY = "c2c68599-643d-4291-992f-60fa5ed143f5";

const BASE_URL = "https://api.balldontlie.io/v1";

async function bdlFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: API_KEY }
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

// ============================================================
// ASSIGN ROUND NAME BASED ON GAME DATE
// NBA 2026 playoff schedule (approximate):
//   First Round:            Apr 18 – May 10
//   Conference Semifinals:  May 10 – May 28
//   Conference Finals:      May 28 – Jun 10
//   NBA Finals:             Jun 10 – Jun 30
// ============================================================
function getRoundFromDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();

  if (month === 4 || (month === 5 && day <= 9)) return "First Round";
  if (month === 5 && day <= 27) return "Conference Semifinals";
  if ((month === 5 && day >= 28) || (month === 6 && day <= 9)) return "Conference Finals";
  return "NBA Finals";
}

// ============================================================
// FETCH LIVE NBA PLAYOFF GAMES
// ============================================================
async function fetchNBAPlayoffGames() {
  const data = await bdlFetch(
    `/games?start_date=2026-04-18&end_date=2026-06-30&per_page=100`
  );
  return data.data.filter(g => g.postseason === true);
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
    round: getRoundFromDate(game.date), // ← date-based round, not from API
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
      description: "The 2026 NBA Playoffs featuring the best teams from the Eastern and Western Conferences.",
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

  const regularSeason = BASKETBALL_DATA.find(c => c.id === "nba-2025-regular");
  const restOfMock = BASKETBALL_DATA.filter(c => c.id !== "nba-2025-regular");

  const combined = [];
  if (livePlayoffs) combined.push(livePlayoffs);
  if (regularSeason) combined.push(regularSeason);
  combined.push(...restOfMock);

  return combined;
}

window.getBasketballData = getBasketballData;