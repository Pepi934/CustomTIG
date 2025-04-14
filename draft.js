document.getElementById("btn-draft").addEventListener("click", () => {
    switchMode("draft");
});

function switchMode(mode) {
    document.querySelectorAll(".mode-button").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-" + mode).classList.add("active");

    const playersContainer = document.getElementById("players");
    playersContainer.innerHTML = "";

    const numberOfPlayers = mode === "tft" ? 8 : 10;

    for (let i = 1; i <= numberOfPlayers; i++) {
        const playerInput = document.createElement("div");
        playerInput.classList.add("player-input");
        playerInput.innerHTML = `
            <textarea placeholder="Nom du joueur ${i}"></textarea>
            <select>
                ${[...Array(11).keys()].map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
        `;
        playersContainer.appendChild(playerInput);
    }

    document.querySelector(".teams").style.display = "none";
    document.getElementById("reroll-button").style.display = "none";
    document.getElementById("generate-button").onclick = mode === "tft" ? generateTFTTeams : generateDraftTeams;
}

function generateDraftTeams() {
    const players = [];
    const playerInputs = document.querySelectorAll('.player-input');

    playerInputs.forEach(input => {
        const name = input.querySelector('textarea').value.trim();
        const level = parseInt(input.querySelector('select').value, 10);
        if (name) players.push({ name, level });
    });

    if (players.length !== 10) {
        alert("Veuillez entrer les noms et niveaux de 10 joueurs.");
        return;
    }

    const combinations = getCombinations(players, 5);
    let validTeams = [];

    combinations.forEach(blueTeam => {
        const redTeam = players.filter(p => !blueTeam.includes(p));
        const blueLevel = blueTeam.reduce((sum, p) => sum + p.level, 0);
        const redLevel = redTeam.reduce((sum, p) => sum + p.level, 0);
        const diff = Math.abs(blueLevel - redLevel);

        if (diff <= 1) {
            validTeams.push({ blueTeam, redTeam, blueLevel, redLevel });
        }
    });

    if (validTeams.length === 0) {
        alert("Impossible de répartir les joueurs avec une différence de niveau maximale de 1. Essayez à nouveau.");
        return;
    }

    const chosen = validTeams[Math.floor(Math.random() * validTeams.length)];
    const blueList = `<div class='team' id='blue-side'><h2>Blue Side: ${chosen.blueLevel}</h2><ul>` +
        chosen.blueTeam.map(p => `<li>${p.name} (Niv: ${p.level})</li>`).join('') + '</ul></div>';
    const redList = `<div class='team' id='red-side'><h2>Red Side: ${chosen.redLevel}</h2><ul>` +
        chosen.redTeam.map(p => `<li>${p.name} (Niv: ${p.level})</li>`).join('') + '</ul></div>';

    const teamsDiv = document.querySelector(".teams");
    teamsDiv.innerHTML = blueList + redList;
    teamsDiv.style.display = "flex";
    document.getElementById("reroll-button").style.display = "block";
}

function getCombinations(arr, n) {
    const result = [];
    function helper(start, combo) {
        if (combo.length === n) {
            result.push(combo);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            helper(i + 1, combo.concat([arr[i]]));
        }
    }
    helper(0, []);
    return result;
}

// Initialise par défaut
switchMode("draft");