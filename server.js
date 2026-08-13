const express = require("express");

const app = express();

app.use(express.json());

/* =========================
   CORS
========================= */

app.use((req, res, next) => {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});


/* =========================
   DATABASE
========================= */

let players = {};
let parties = {};
let elections = {};
let wars = {};


/* =========================
   REGIONS
========================= */

const regions = [
    "Şimal",
    "Şərq",
    "Qərb",
    "Cənub"
];


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.send("⚔️ Rival Game Multiplayer Server işləyir!");

});


/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {

    const { name } = req.body;

    if (!name || name.trim() === "") {

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


/* =========================
   GET PLAYER
========================= */

app.get("/api/player/:name", (req, res) => {

    const key =
        decodeURIComponent(
            req.params.name
        ).toLowerCase();


    if (!players[key]) {

        return res.status(404).json({

            error: "Oyunçu tapılmadı"

        });

    }


    res.json(players[key]);

});


/* =========================
   ALL PLAYERS
========================= */

app.get("/api/players", (req, res) => {

    res.json(players);

});


/* =========================
   WORK
========================= */

app.post("/api/work", (req, res) => {

    const { name } = req.body;

    if (!name) {

        return res.status(400).json({
            error: "Ad yoxdur"
        });

    }


    const key =
        name.toLowerCase();


    if (!players[key]) {

        return res.status(404).json({

            error: "Oyunçu tapılmadı"

        });

    }


    const player =
        players[key];


    const income =
        10 +
        (player.moneyStat * 0.5);


    player.money += income;


    res.json({

        success: true,

        money: player.money,

        income: income,

        player: player

    });

});


/* =========================
   UPDATE PLAYER
========================= */

app.post("/api/update", (req, res) => {

    const { name, data } = req.body;


    if (!name) {

        return res.status(400).json({
            error: "Ad yoxdur"
        });

    }


    const key =
        name.toLowerCase();


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


    players[key] = {

        ...players[key],

        ...data

    };


    res.json({

        success: true,

        player: players[key]

    });

});


/* =========================
   RANKING
========================= */

app.get("/api/ranking", (req, res) => {

    const ranking =
        Object.values(players)

        .filter(player =>
            player.name.toLowerCase() !== "admin"
        )

        .map(player => {

            const total =
                Number(player.power || 0) +
                Number(player.stamina || 0) +
                Number(player.moneyStat || 0) +
                Number(player.training || 0);


            return {

                name: player.name,

                power: player.power,

                stamina: player.stamina,

                moneyStat: player.moneyStat,

                training: player.training,

                total: total

            };

        })


        .sort((a, b) =>
            b.total - a.total
        );


    res.json(ranking);

});


/* =========================
   PARTIES
========================= */

app.get("/api/parties", (req, res) => {

    res.json(parties);

});


/* =========================
   CREATE PARTY
========================= */

app.post("/api/party/create", (req, res) => {

    const { name, partyName } = req.body;


    if (!name || !partyName) {

        return res.status(400).json({

            error: "Məlumat çatışmır"

        });

    }


    const key =
        name.toLowerCase();


    const player =
        players[key];


    if (!player) {

        return res.status(404).json({

            error: "Oyunçu tapılmadı"

        });

    }


    if (player.party) {

        return res.status(400).json({

            error: "Sən artıq partiyadasan"

        });

    }


    const id =
        "party_" +
        Date.now();


    parties[id] = {

        id: id,

        name: partyName.trim(),

        leader: key,

        members: [key],

        region: player.region

    };


    player.party = id;


    res.json({

        success: true,

        party: parties[id],

        player: player

    });

});


/* =========================
   JOIN PARTY
========================= */

app.post("/api/party/join", (req, res) => {

    const { name, partyID } = req.body;


    const key =
        name.toLowerCase();


    const player =
        players[key];


    const party =
        parties[partyID];


    if (!player || !party) {

        return res.status(404).json({

            error: "Oyunçu və ya partiya tapılmadı"

        });

    }


    if (player.party) {

        return res.status(400).json({

            error: "Artıq partiyadasan"

        });

    }


    if (player.region !== party.region) {

        return res.status(400).json({

            error:
                "Bu partiya sənin bölgəndə yaradılmayıb"

        });

    }


    player.party = partyID;

    party.members.push(key);


    res.json({

        success: true,

        player: player,

        party: party

    });

});


/* =========================
   ELECTIONS
========================= */

app.get("/api/elections", (req, res) => {

    res.json(elections);

});


/* =========================
   START ELECTION
========================= */

app.post("/api/election/start", (req, res) => {

    const { region } = req.body;


    if (!regions.includes(region)) {

        return res.status(400).json({

            error: "Bölgə düzgün deyil"

        });

    }


    if (
        elections[region] &&
        !elections[region].finished &&
        elections[region].end > Date.now()
    ) {

        return res.status(400).json({

            error:
                "Bu bölgədə artıq seçki var"

        });

    }


    elections[region] = {

        region: region,

        start: Date.now(),

        end:
            Date.now() +
            (2 * 60 * 1000),

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


/* =========================
   VOTE
========================= */

app.post("/api/election/vote", (req, res) => {

    const {
        name,
        region,
        partyID
    } = req.body;


    const key =
        name.toLowerCase();


    const player =
        players[key];


    const election =
        elections[region];


    const party =
        parties[partyID];


    if (!player) {

        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });

    }


    if (!election || election.finished) {

        return res.status(400).json({
            error: "Aktiv seçki yoxdur"
        });

    }


    if (Date.now() >= election.end) {

        finishElection(region);

        return res.status(400).json({
            error: "Seçki bitib"
        });

    }


    if (player.region !== region) {

        return res.status(400).json({

            error:
                "Yalnız yaşadığın bölgədə səs verə bilərsən"

        });

    }


    if (!party || party.region !== region) {

        return res.status(400).json({

            error:
                "Bu partiya bu bölgədə iştirak etmir"

        });

    }


    if (election.voters[key]) {

        return res.status(400).json({

            error:
                "Artıq səs vermisən"

        });

    }


    election.votes[partyID] =
        (election.votes[partyID] || 0) + 1;


    election.voters[key] = true;


    res.json({

        success: true,

        election: election

    });

});


/* =========================
   FINISH ELECTION
========================= */

function finishElection(region) {

    const election =
        elections[region];


    if (!election)
        return;


    if (election.finished)
        return;


    let totalVotes = 0;


    Object.values(election.votes)
        .forEach(vote => {

            totalVotes += vote;

        });


    const results = {};


    Object.keys(election.votes)
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


/* =========================
   ELECTION CHECK
========================= */

app.get("/api/election/:region", (req, res) => {

    const region =
        decodeURIComponent(
            req.params.region
        );


    const election =
        elections[region];


    if (!election) {

        return res.json({
            election: null
        });

    }


    if (
        !election.finished &&
        Date.now() >= election.end
    ) {

        finishElection(region);

    }


    res.json({

        election: election

    });

});


/* =========================
   TRAVEL
========================= */

app.post("/api/travel", (req, res) => {

    const {
        name,
        region
    } = req.body;


    const key =
        name.toLowerCase();


    const player =
        players[key];


    if (!player) {

        return res.status(404).json({

            error:
                "Oyunçu tapılmadı"

        });

    }


    if (!regions.includes(region)) {

        return res.status(400).json({

            error:
                "Bölgə düzgün deyil"

        });

    }


    if (player.region === region) {

        return res.status(400).json({

            error:
                "Artıq bu bölgədəsən"

        });

    }


    if (player.money < 20) {

        return res.status(400).json({

            error:
                "Səyahət üçün 20 pul lazımdır"

        });

    }


    player.money -= 20;

    player.region = region;


    res.json({

        success: true,

        player: player

    });

});


/* =========================
   WARS
========================= */

app.get("/api/wars", (req, res) => {

    res.json(wars);

});


/* =========================
   CREATE WAR
========================= */

app.post("/api/war/create", (req, res) => {

    const {
        name,
        target
    } = req.body;


    const key =
        name.toLowerCase();


    const attacker =
        players[key];


    if (!attacker) {

        return res.status(404).json({

            error:
                "Oyunçu tapılmadı"

        });

    }


    if (!target) {

        return res.status(400).json({

            error:
                "Hədəf göstərilməyib"

        });

    }


    const warID =
        "war_" +
        Date.now();


    wars[warID] = {

        id: warID,

        attacker: key,

        target: target,

        attackerPower:
            attacker.power,

        active: true,

        start: Date.now()

    };


    res.json({

        success: true,

        war:
            wars[warID]

    });

});


/* =========================
   ADMIN UPDATE
========================= */

app.post("/api/admin/update", (req, res) => {

    const {
        playerName,
        data
    } = req.body;


    const key =
        playerName.toLowerCase();


    if (!players[key]) {

        return res.status(404).json({

            error:
                "Oyunçu tapılmadı"

        });

    }


    players[key] = {

        ...players[key],

        ...data

    };


    res.json({

        success: true,

        player:
            players[key]

    });

});


/* =========================
   ADMIN ACCOUNT
========================= */

players["admin"] = {

    name: "Admin",

    money: 999999,

    power: 999,

    stamina: 999,

    moneyStat: 999,

    training: 999,

    region: "Şimal",

    party: null

};


/* =========================
   SERVER
========================= */

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        "⚔️ Rival Game Multiplayer Server başladı!"
    );

});
