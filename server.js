const express = require("express");

const app = express();

app.use(express.json());

/* =====================================================
   DATABASE
===================================================== */

let players = {};
let parties = {};
let elections = {};
let wars = {};


/* =====================================================
   REGIONS
===================================================== */

const regions = [
    "Şimal",
    "Şərq",
    "Qərb",
    "Cənub"
];


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.send("⚔️ Rival Game Multiplayer Server işləyir!");

});


/* =====================================================
   LOGIN
===================================================== */

app.post("/api/login", (req, res) => {

    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {

        return res.status(400).json({
            error: "Ad yazılmalıdır"
        });

    }

    const cleanName = name.trim();
    const key = cleanName.toLowerCase();

    if (!players[key]) {

        players[key] = {

            name: cleanName,

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


/* =====================================================
   GET PLAYER
===================================================== */

app.get("/api/player/:name", (req, res) => {

    const key =
        decodeURIComponent(req.params.name)
        .trim()
        .toLowerCase();

    if (!players[key]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    res.json(players[key]);

});


/* =====================================================
   ALL PLAYERS
===================================================== */

app.get("/api/players", (req, res) => {

    res.json(players);

});


/* =====================================================
   UPDATE PLAYER
===================================================== */

app.post("/api/update", (req, res) => {

    const { name, data } = req.body;

    if (!name) {

        return res.status(400).json({
            error: "Oyunçu adı yoxdur"
        });

    }

    const key =
        String(name).trim().toLowerCase();

    if (!players[key]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    if (!data || typeof data !== "object") {

        return res.status(400).json({
            error: "Məlumat düzgün deyil"
        });

    }

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

            players[key][field] =
                data[field];

        }

    });

    res.json({

        success: true,

        player: players[key]

    });

});


/* =====================================================
   WORK
===================================================== */

app.post("/api/work", (req, res) => {

    const { name } = req.body;

    if (!name) {

        return res.status(400).json({
            error: "Ad yoxdur"
        });

    }

    const key =
        String(name).trim().toLowerCase();

    if (!players[key]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    const player =
        players[key];

    const income =
        10 + ((player.moneyStat || 0) * 0.5);

    player.money += income;

    res.json({

        success: true,

        money: player.money,

        income: income,

        player: player

    });

});


/* =====================================================
   RANKING
===================================================== */

app.get("/api/ranking", (req, res) => {

    const ranking =

        Object.values(players)

        .filter(player =>
            player.name.toLowerCase() !== "admin"
        )

        .map(player => {

            const total =

                (player.power || 0) +
                (player.stamina || 0) +
                (player.moneyStat || 0) +
                (player.training || 0);

            return {

                name: player.name,

                power: player.power || 0,

                stamina: player.stamina || 0,

                moneyStat:
                    player.moneyStat || 0,

                training:
                    player.training || 0,

                total: total

            };

        })

        .sort((a, b) =>
            b.total - a.total
        );

    res.json(ranking);

});


/* =====================================================
   CREATE PARTY
===================================================== */

app.post("/api/party/create", (req, res) => {

    const {
        name,
        partyName
    } = req.body;

    if (!name || !partyName) {

        return res.status(400).json({
            error:
                "Oyunçu və partiya adı lazımdır"
        });

    }

    const playerKey =
        String(name).trim().toLowerCase();

    if (!players[playerKey]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    const player =
        players[playerKey];

    if (player.party) {

        return res.status(400).json({
            error:
                "Sən artıq partiyadasan"
        });

    }

    const cleanPartyName =
        String(partyName).trim();

    if (cleanPartyName === "") {

        return res.status(400).json({
            error:
                "Partiya adı boş ola bilməz"
        });

    }

    const id =
        "party_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 10000);

    parties[id] = {

        id: id,

        name: cleanPartyName,

        leader: playerKey,

        members: [
            playerKey
        ],

        region: player.region

    };

    player.party = id;

    res.json({

        success: true,

        party: parties[id],

        player: player

    });

});


/* =====================================================
   GET PARTIES
===================================================== */

app.get("/api/parties", (req, res) => {

    res.json(parties);

});


/* =====================================================
   GET PARTY
===================================================== */

app.get("/api/party/:id", (req, res) => {

    const party =
        parties[req.params.id];

    if (!party) {

        return res.status(404).json({
            error: "Partiya tapılmadı"
        });

    }

    res.json(party);

});


/* =====================================================
   JOIN PARTY
===================================================== */

app.post("/api/party/join", (req, res) => {

    const {
        name,
        partyID
    } = req.body;

    const playerKey =
        name?.trim().toLowerCase();

    if (!playerKey) {

        return res.status(400).json({
            error: "Oyunçu adı yoxdur"
        });

    }

    if (!players[playerKey]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    const party =
        parties[partyID];

    if (!party) {

        return res.status(404).json({
            error: "Partiya tapılmadı"
        });

    }

    const player =
        players[playerKey];

    if (player.party) {

        return res.status(400).json({
            error:
                "Sən artıq partiyadasan"
        });

    }

    if (player.region !== party.region) {

        return res.status(400).json({
            error:
                "Bu partiya sənin bölgəndə deyil"
        });

    }

    if (!party.members.includes(playerKey)) {

        party.members.push(playerKey);

    }

    player.party = partyID;

    res.json({

        success: true,

        party: party,

        player: player

    });

});


/* =====================================================
   LEAVE PARTY
===================================================== */

app.post("/api/party/leave", (req, res) => {

    const { name } = req.body;

    const playerKey =
        name?.trim().toLowerCase();

    if (!playerKey || !players[playerKey]) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }

    const player =
        players[playerKey];

    if (!player.party) {

        return res.status(400).json({
            error: "Partiyada deyilsən"
        });

    }

    const partyID =
        player.party;

    const party =
        parties[partyID];

    if (party) {

        party.members =
            party.members.filter(
                id => id !== playerKey
            );

        if (party.leader === playerKey) {

            if (party.members.length > 0) {

                party.leader =
                    party.members[0];

            } else {

                delete parties[partyID];

            }

        }

    }

    player.party = null;

    res.json({

        success: true,

        player: player

    });

});


/* =====================================================
   START ELECTION
===================================================== */

app.post("/api/election/start", (req, res) => {

    const {
        admin,
        region
    } = req.body;

    if (
        !admin ||
        String(admin).toLowerCase() !== "admin"
    ) {

        return res.status(403).json({
            error:
                "Admin icazəsi lazımdır"
        });

    }

    if (!regions.includes(region)) {

        return res.status(400).json({
            error:
                "Bölgə düzgün deyil"
        });

    }

    finishExpiredElections();

    if (
        elections[region] &&
        !elections[region].finished
    ) {

        return res.status(400).json({
            error:
                "Bu bölgədə artıq seçki var"
        });

    }

    const start =
        Date.now();

    const end =
        start +
        (2 * 60 * 1000);

    elections[region] = {

        region: region,

        start: start,

        end: end,

        votes: {},

        voters: {},

        results: {},

        finished: false

    };

    res.json({

        success: true,

        election:
            elections[region]

    });

});


/* =====================================================
   GET ELECTIONS
===================================================== */

app.get("/api/elections", (req, res) => {

    finishExpiredElections();

    res.json(elections);

});


/* =====================================================
   GET ONE ELECTION
===================================================== */

app.get("/api/election/:region", (req, res) => {

    const region =
        decodeURIComponent(
            req.params.region
        );

    finishExpiredElections();

    if (!elections[region]) {

        return res.json({
            election: null
        });

    }

    res.json({

        election:
            elections[region]

    });

});


/* =====================================================
   VOTE
===================================================== */

app.post("/api/election/vote", (req, res) => {

    const {
        name,
        region,
        partyID
    } = req.body;

    const playerKey =
        name?.trim().toLowerCase();

    if (!playerKey) {

        return res.status(400).json({
            error:
                "Oyunçu adı yoxdur"
        });

    }

    if (!players[playerKey]) {

        return res.status(404).json({
            error:
                "Oyunçu tapılmadı"
        });

    }

    finishExpiredElections();

    const player =
        players[playerKey];

    const election =
        elections[region];

    if (!election) {

        return res.status(400).json({
            error:
                "Aktiv seçki yoxdur"
        });

    }

    if (election.finished) {

        return res.status(400).json({
            error:
                "Seçki artıq bitib"
        });

    }

    if (player.region !== region) {

        return res.status(403).json({
            error:
                "Yalnız yaşadığın bölgədə səs verə bilərsən"
        });

    }

    if (election.voters[playerKey]) {

        return res.status(400).json({
            error:
                "Sən artıq səs vermisən"
        });

    }

    const party =
        parties[partyID];

    if (!party) {

        return res.status(404).json({
            error:
                "Partiya tapılmadı"
        });

    }

    if (party.region !== region) {

        return res.status(400).json({
            error:
                "Bu partiya bu bölgədə iştirak etmir"
        });

    }

    election.votes[partyID] =
        (election.votes[partyID] || 0) + 1;

    election.voters[playerKey] =
        true;

    res.json({

        success: true,

        election: election

    });

});


/* =====================================================
   FINISH ELECTION
===================================================== */

function finishElection(region) {

    const election =
        elections[region];

    if (!election) {
        return;
    }

    if (election.finished) {
        return;
    }

    const totalVotes =
        Object.values(
            election.votes
        )
        .reduce(
            (sum, value) =>
                sum + value,
            0
        );

    const results = {};

    Object.keys(
        election.votes
    )
    .forEach(partyID => {

        if (totalVotes === 0) {

            results[partyID] = 0;

        } else {

            results[partyID] =
                Math.round(
                    (
                        election.votes[partyID] /
                        totalVotes
                    ) * 100
                );

        }

    });

    election.results =
        results;

    election.finished =
        true;

}


/* =====================================================
   AUTOMATIC ELECTION FINISH
===================================================== */

function finishExpiredElections() {

    Object.keys(elections)
        .forEach(region => {

            const election =
                elections[region];

            if (
                election &&
                !election.finished &&
                Date.now() >= election.end
            ) {

                finishElection(region);

            }

        });

}


/* =====================================================
   SIMPLE WAR SYSTEM
===================================================== */

app.post("/api/war/create", (req, res) => {

    const {
        name,
        target
    } = req.body;

    const attackerKey =
        name?.trim().toLowerCase();

    const targetKey =
        target?.trim().toLowerCase();

    if (
        !attackerKey ||
        !targetKey
    ) {

        return res.status(400).json({
            error:
                "Hücum edən və hədəf lazımdır"
        });

    }

    if (!players[attackerKey]) {

        return res.status(404).json({
            error:
                "Hücum edən oyunçu tapılmadı"
        });

    }

    if (!players[targetKey]) {

        return res.status(404).json({
            error:
                "Hədəf oyunçu tapılmadı"
        });

    }

    if (attackerKey === targetKey) {

        return res.status(400).json({
            error:
                "Özünə müharibə elan edə bilməzsən"
        });

    }

    const id =
        "war_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 10000);

    wars[id] = {

        id: id,

        attacker: attackerKey,

        defender: targetKey,

        attackerPower:
            players[attackerKey].power || 0,

        defenderPower:
            players[targetKey].power || 0,

        created:
            Date.now(),

        finished:
            false

    };

    res.json({

        success: true,

        war: wars[id]

    });

});


/* =====================================================
   GET WARS
===================================================== */

app.get("/api/wars", (req, res) => {

    res.json(wars);

});


/* =====================================================
   GET ONE WAR
===================================================== */

app.get("/api/war/:id", (req, res) => {

    const war =
        wars[req.params.id];

    if (!war) {

        return res.status(404).json({
            error:
                "Müharibə tapılmadı"
        });

    }

    res.json(war);

});


/* =====================================================
   SERVER
===================================================== */

const PORT = 3000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "⚔️ Rival Game Server işləyir!"
        );

        console.log(
            "Port: " + PORT
        );

        console.log(
            "http://localhost:" + PORT
        );

        console.log(
            "================================="
        );

    }
);
