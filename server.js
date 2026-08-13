const express = require("express");
const app = express();

app.use(express.json());

const players = {};
const parties = {};
const elections = {};

const regions = ["Şimal", "Şərq", "Qərb", "Cənub"];

app.get("/", (req, res) => {
    res.send("Rival Game Multiplayer Server işləyir! ⚔️");
});

/* ================= LOGIN ================= */

app.post("/api/login", (req, res) => {

    const name = String(req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({
            error: "Ad yazılmalıdır"
        });
    }

    const key = name.toLowerCase();

    if (!players[key]) {
        players[key] = {
            name: name,
            money: 100,
            power: 0,
            stamina: 0,
            moneyStat: 0,
            training: 0,
            region: "Şimal",
            party: null
        };
    }

    res.json({
        success: true,
        player: players[key]
    });
});

/* ================= PLAYER ================= */

app.get("/api/player/:name", (req, res) => {

    const key = req.params.name.toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    res.json(players[key]);
});

/* ================= ALL PLAYERS ================= */

app.get("/api/players", (req, res) => {
    res.json(players);
});

/* ================= WORK ================= */

app.post("/api/work", (req, res) => {

    const key = String(req.body.name || "").toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    const player = players[key];

    const income = 10 + player.moneyStat * 0.5;

    player.money += income;

    res.json({
        success: true,
        player: player,
        money: player.money,
        income: income
    });
});

/* ================= UPDATE PLAYER ================= */

app.post("/api/update", (req, res) => {

    const key = String(req.body.name || "").toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    const data = req.body.data || {};

    const allowed = [
        "money",
        "power",
        "stamina",
        "moneyStat",
        "training",
        "region",
        "party"
    ];

    allowed.forEach(field => {
        if (data[field] !== undefined) {
            players[key][field] = data[field];
        }
    });

    res.json({
        success: true,
        player: players[key]
    });
});

/* ================= RANKING ================= */

app.get("/api/ranking", (req, res) => {

    const ranking = Object.keys(players)
        .map(key => {

            const p = players[key];

            return {
                key: key,
                name: p.name,
                power: p.power,
                stamina: p.stamina,
                moneyStat: p.moneyStat,
                training: p.training,
                total:
                    p.power +
                    p.stamina +
                    p.moneyStat +
                    p.training
            };

        })
        .sort((a, b) => b.total - a.total);

    res.json(ranking);
});

/* ================= PARTIES ================= */

app.get("/api/parties", (req, res) => {
    res.json(parties);
});

app.post("/api/party", (req, res) => {

    const { name, partyName } = req.body;

    const key = String(name || "").toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    if (players[key].party) {
        return res.status(400).json({
            error: "Sən artıq partiyadasan!"
        });
    }

    if (!partyName || !partyName.trim()) {
        return res.status(400).json({
            error: "Partiyanın adını yaz!"
        });
    }

    const id = "party_" + Date.now();

    parties[id] = {
        name: partyName.trim(),
        leader: key,
        members: [key],
        region: players[key].region
    };

    players[key].party = id;

    res.json({
        success: true,
        party: parties[id],
        player: players[key]
    });
});

/* ================= ELECTIONS ================= */

app.get("/api/elections", (req, res) => {
    res.json(elections);
});

app.post("/api/election/start", (req, res) => {

    const { region } = req.body;

    if (!regions.includes(region)) {
        return res.status(400).json({
            error: "Bölgə səhvdir"
        });
    }

    if (
        elections[region] &&
        !elections[region].finished
    ) {
        return res.status(400).json({
            error: "Bu bölgədə artıq seçki var!"
        });
    }

    elections[region] = {
        start: Date.now(),
        end: Date.now() + 120000,
        votes: {},
        voters: {},
        results: {},
        finished: false
    };

    res.json({
        success: true,
        election: elections[region]
    });
});

/* ================= VOTE ================= */

app.post("/api/vote", (req, res) => {

    const { name, region, partyID } = req.body;

    const key = String(name || "").toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    const election = elections[region];

    if (!election) {
        return res.status(400).json({
            error: "Aktiv seçki yoxdur"
        });
    }

    if (Date.now() >= election.end) {
        finishElection(region);

        return res.status(400).json({
            error: "Seçki artıq bitib"
        });
    }

    if (election.voters[key]) {
        return res.status(400).json({
            error: "Sən artıq səs vermisən!"
        });
    }

    const party = parties[partyID];

    if (!party) {
        return res.status(400).json({
            error: "Partiya tapılmadı"
        });
    }

    if (party.region !== region) {
        return res.status(400).json({
            error: "Bu partiya bu bölgəyə aid deyil"
        });
    }

    if (players[key].region !== region) {
        return res.status(400).json({
            error: "Yalnız yaşadığın bölgədə səs verə bilərsən"
        });
    }

    election.votes[partyID] =
        (election.votes[partyID] || 0) + 1;

    election.voters[key] = true;

    res.json({
        success: true
    });
});

/* ================= FINISH ELECTION ================= */

function finishElection(region) {

    const election = elections[region];

    if (!election || election.finished) {
        return;
    }

    let totalVotes = 0;

    Object.values(election.votes).forEach(v => {
        totalVotes += v;
    });

    const results = {};

    Object.keys(election.votes).forEach(id => {

        results[id] =
            totalVotes === 0
                ? 0
                : Math.round(
                    election.votes[id] /
                    totalVotes *
                    100
                );

    });

    election.results = results;
    election.finished = true;
}

/* ================= AUTO FINISH ================= */

setInterval(() => {

    regions.forEach(region => {

        const e = elections[region];

        if (
            e &&
            !e.finished &&
            Date.now() >= e.end
        ) {
            finishElection(region);
        }

    });

}, 1000);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        "Rival Game Multiplayer Server başladı!"
    );
});
