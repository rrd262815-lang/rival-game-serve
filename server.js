const express = require("express");

const app = express();

app.use(express.json());

/* ================= DATABASE ================= */

let players = {};

/* ================= HOME ================= */

app.get("/", (req, res) => {
    res.send("Rival Game Multiplayer Server işləyir! ⚔️");
});

/* ================= LOGIN ================= */

app.post("/api/login", (req, res) => {

    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            error: "Ad yazılmalıdır"
        });
    }

    const key = name.trim().toLowerCase();

    if (!players[key]) {

        players[key] = {
            name: name.trim(),

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

/* ================= GET PLAYER ================= */

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

    const { name } = req.body;

    const key = name.toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
        });
    }

    const player = players[key];

    const income =
        10 + (player.moneyStat * 0.5);

    player.money += income;

    res.json({
        success: true,
        money: player.money,
        income: income
    });

});

/* ================= UPDATE PLAYER ================= */

app.post("/api/update", (req, res) => {

    const { name, data } = req.body;

    const key = name.toLowerCase();

    if (!players[key]) {
        return res.status(404).json({
            error: "Oyunçu tapılmadı"
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

/* ================= RANKING ================= */

app.get("/api/ranking", (req, res) => {

    const ranking = Object.values(players)
        .map(player => {

            const total =
                player.power +
                player.stamina +
                player.moneyStat +
                player.training;

            return {
                name: player.name,
                power: player.power,
                stamina: player.stamina,
                moneyStat: player.moneyStat,
                training: player.training,
                total: total
            };

        })
        .sort((a, b) => b.total - a.total);

    res.json(ranking);

});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Rival Game Multiplayer Server başladı!"
    );

});
