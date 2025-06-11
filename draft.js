// Écouteur d'événement pour le bouton "Custom Draft"
document.getElementById("btn-draft").addEventListener("click", () => {
    switchMode("draft");
});

// L'écouteur d'événement pour le bouton "Relancer" a été supprimé.

/**
 * Affiche une notification temporaire.
 * @param {string} message Le message à afficher.
 * @param {number} [duration=3000] La durée d'affichage.
 */
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.opacity = 1; }, 10);

    setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, duration);
}

/**
 * Change le mode de jeu.
 * @param {string} mode Le mode à activer ('draft' or 'tft').
 */
function switchMode(mode) {
    document.querySelectorAll(".mode-button").forEach(btn => btn.classList.remove("active"));
    document.getElementById("btn-" + mode).classList.add("active");

    const playersContainer = document.getElementById("players");
    playersContainer.innerHTML = "";

    const numberOfPlayers = mode === "tft" ? 8 : 10;
    const gridCols = mode === "tft" ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)';
    playersContainer.style.gridTemplateColumns = gridCols;

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
    document.getElementById("draft-links").style.display = "none";
    // La ligne pour cacher le bouton relancer peut être supprimée si le bouton n'existe plus dans le HTML
    // document.getElementById("reroll-button").style.display = "none";
    document.getElementById("generate-button").onclick = mode === "tft" ? generateTFTTeams : generateDraftTeams;
}

/**
 * Génère jusqu'à 3 propositions d'équipes pour le mode Draft et les liens de draftlol.
 */
async function generateDraftTeams() {
    const players = [];
    const playerInputs = document.querySelectorAll('.player-input');

    playerInputs.forEach(input => {
        const name = input.querySelector('textarea').value.trim();
        const level = parseInt(input.querySelector('select').value, 10);
        if (name) players.push({ name, level });
    });

    if (players.length !== 10) {
        showNotification("Veuillez entrer les noms et niveaux de 10 joueurs.");
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
            const blueTeamNames = blueTeam.map(p => p.name).sort().join(',');
            validTeams.push({ blueTeam, redTeam, blueLevel, redLevel, id: blueTeamNames });
        }
    });

    const uniqueValidTeams = Array.from(new Map(validTeams.map(team => [team.id, team])).values());

    if (uniqueValidTeams.length === 0) {
        showNotification("Impossible de trouver des équipes équilibrées. Essayez d'autres niveaux.");
        return;
    }

    const shuffledTeams = uniqueValidTeams.sort(() => 0.5 - Math.random());
    
    const propositionsToShow = shuffledTeams.slice(0, 3);

    if (propositionsToShow.length < 3 && propositionsToShow.length > 0) {
        showNotification(`Seulement ${propositionsToShow.length} proposition(s) unique(s) ont pu être générée(s).`);
    }

    const teamsDiv = document.querySelector(".teams");
    teamsDiv.innerHTML = ''; // On vide les résultats précédents

    propositionsToShow.forEach((chosen, index) => {
        const propositionHtml = `
            <div class="proposition-container">
                <h3>Proposition ${index + 1}</h3>
                <div class="proposition-teams">
                    <div class='team' id='blue-side'>
                        <h2>Blue Side (Total: ${chosen.blueLevel})</h2>
                        <ul>${chosen.blueTeam.map(p => `<li>${p.name} (Niv: ${p.level})</li>`).join('')}</ul>
                    </div>
                    <div class='team' id='red-side'>
                        <h2>Red Side (Total: ${chosen.redLevel})</h2>
                        <ul>${chosen.redTeam.map(p => `<li>${p.name} (Niv: ${p.level})</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        `;
        teamsDiv.innerHTML += propositionHtml;
    });

    teamsDiv.style.display = "flex";
    
    // La ligne qui affichait le bouton "Relancer" a été supprimée.
    // document.getElementById("reroll-button").style.display = "inline-block";

    await generateDraftLinks();
}

/**
 * Appelle l'API de draftlol.dawe.gg pour créer une draft et affiche les liens.
 */
async function generateDraftLinks() {
    const draftLinksContainer = document.getElementById("draft-links");
    const linksContent = document.getElementById("links-content");
    const copyButton = document.getElementById("copy-links-button");

    linksContent.innerHTML = '<p>Génération des liens de draft en cours...</p>';
    draftLinksContainer.style.display = "block";
    copyButton.style.display = 'none';

    try {
        const response = await fetch('https://draftlol.dawe.gg/api/v1/draft', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({})
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        const { id, blueToken, redToken } = data;

        const specLink = `https://draftlol.dawe.gg/${id}`;
        const blueLink = `https://draftlol.dawe.gg/${id}/${blueToken}`;
        const redLink = `https://draftlol.dawe.gg/${id}/${redToken}`;
        
        linksContent.innerHTML = `
            <div><strong>Équipe Bleue:</strong> <input type="text" value="${blueLink}" readonly onclick="this.select()"></div>
            <div><strong>Équipe Rouge:</strong> <input type="text" value="${redLink}" readonly onclick="this.select()"></div>
            <div><strong>Spectateurs:</strong> <input type="text" value="${specLink}" readonly onclick="this.select()"></div>
        `;
        
        const allLinksText = `Liens de Draft:\nÉquipe Bleue: ${blueLink}\nÉquipe Rouge: ${redLink}\nSpectateurs: ${specLink}`;
        
        copyButton.style.display = 'inline-block';
        copyButton.onclick = () => {
            const textarea = document.createElement('textarea');
            textarea.value = allLinksText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = 0;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showNotification('Liens copiés dans le presse-papiers !');
            } catch (err) {
                console.error('Erreur lors de la copie:', err);
                showNotification('Impossible de copier les liens.');
            }
            document.body.removeChild(textarea);
        };

    } catch (error) {
        console.error("Impossible de générer les liens de draft:", error);
        linksContent.innerHTML = "<p>Erreur lors de la génération des liens. Le service externe est peut-être indisponible.</p>";
        copyButton.style.display = 'none';
    }
}

/**
 * Génère toutes les combinaisons possibles d'un tableau.
 * @param {Array} arr Le tableau source.
 * @param {number} n La taille de chaque combinaison.
 * @returns {Array<Array>} Un tableau de toutes les combinaisons.
 */
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

// Initialise le mode par défaut au chargement de la page
switchMode("draft");