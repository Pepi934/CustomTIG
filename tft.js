document.getElementById("btn-tft").addEventListener("click", () => {
    switchMode("tft");
});

function generateTFTTeams() {
    const players = [];
    const playerInputs = document.querySelectorAll('.player-input');

    playerInputs.forEach(input => {
        const name = input.querySelector('textarea').value.trim();
        const level = parseInt(input.querySelector('select').value, 10);
        if (name) players.push({ name, level });
    });

    if (players.length !== 8) {
        alert("Veuillez entrer exactement 8 joueurs.");
        return;
    }

    const pairs = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            pairs.push({
                team: [players[i], players[j]],
                total: players[i].level + players[j].level
            });
        }
    }

    const validSets = [];
    for (let a = 0; a < pairs.length; a++) {
        for (let b = a + 1; b < pairs.length; b++) {
            for (let c = b + 1; c < pairs.length; c++) {
                for (let d = c + 1; d < pairs.length; d++) {
                    const allPlayers = [
                        ...pairs[a].team,
                        ...pairs[b].team,
                        ...pairs[c].team,
                        ...pairs[d].team
                    ];
                    const names = allPlayers.map(p => p.name);
                    const uniqueNames = new Set(names);

                    if (uniqueNames.size === 8) {
                        const teams = [pairs[a], pairs[b], pairs[c], pairs[d]];
                        const variance = getLevelVariance(teams.map(t => t.total));
                        validSets.push({ teams, variance });
                    }
                }
            }
        }
    }

    if (validSets.length === 0) {
        alert("Impossible de créer des équipes équilibrées.");
        return;
    }

    validSets.sort((a, b) => a.variance - b.variance);
    const chosen = validSets[0].teams;

    const teamsDiv = document.querySelector(".teams");
    teamsDiv.innerHTML = "";

    chosen.forEach((teamObj, index) => {
        const div = document.createElement('div');
        div.classList.add('team');
        div.style.backgroundColor = '#2f3244';
        div.innerHTML = `<h2>Équipe ${index + 1} (Total: ${teamObj.total})</h2><ul>${teamObj.team.map(p => `<li>${p.name} (Niv: ${p.level})</li>`).join('')}</ul>`;
        teamsDiv.appendChild(div);
    });

    teamsDiv.style.display = 'flex';
    document.getElementById("reroll-button").style.display = "block";
}

function getLevelVariance(totals) {
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return totals.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0);
}