let token
document.addEventListener('DOMContentLoaded', function () {
    token = localStorage.getItem('token');

    // Se non c'è un token, reindirizza l'utente alla pagina di login
    if (!token) {
        window.location.href = 'login.html';
    }

    // Carica gli utenti disponibili per la comunità
    loadAvailableUsers();

    // Carica le comunità create dall'utente
    loadUserCommunities();

    // Gestisci la creazione di una nuova comunità
    document.getElementById('createCommunityForm').addEventListener('submit', function (event) {
        event.preventDefault();
        createCommunity();
    });

    // Gestisci la condivisione della playlist
    document.getElementById('sharePlaylistBtn').addEventListener('click', function () {
        const playlistId = document.getElementById('playlistSelect').value;
        const communityId = document.getElementById('communityDetails').dataset.communityId;
        sharePlaylistWithCommunity(communityId, playlistId);
    });
     // Gestisci l'uscita dalla comunità
     document.getElementById('leaveCommunityBtn').addEventListener('click', function () {
        const communityId = document.getElementById('communityDetails').dataset.communityId;
        leaveCommunity(communityId);
    });
});

// Funzione per caricare gli utenti disponibili da aggiungere alla comunità
/* async function loadAvailableUsers() {
    try {
        const res = await fetch('/api/users', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const users = await res.json();
        const userSelect = document.getAll;

        // Popola la lista degli utenti
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user._id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Errore nel caricamento degli utenti:', err);
    }
} */

// Funzione per caricare gli utenti disponibili da aggiungere alla comunità
async function loadAvailableUsers() {
    try {
        const res = await fetch('/api/users', {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error('Errore nella risposta del server');
        }

        const users = await res.json();
        console.log("stampa users: ", users); //DEBUG
        const userSelect = document.getElementById('addMembers');

        // Popola la lista degli utenti
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user._id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Errore nel caricamento degli utenti:', err);
    }
}
// Funzione per creare una nuova comunità
async function createCommunity() {
    const communityName = document.getElementById('communityName').value;
    /*const members = Array.from(document.getElementById('addMembers').selectedOptions).map(option => option.value);*/

    try {
        const res = await fetch('/api/community', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: communityName,
                members: members
            })
        });

        if (res.ok) {
            loadUserCommunities();  // Ricarica le comunità
        } else {
            alert('Errore durante la creazione della comunità.');
        }
    } catch (err) {
        console.error('Errore:', err);
    }
}

// Funzione per caricare le comunità create dall'utente
async function loadUserCommunities() {
    try {
        const res = await fetch('/api/community', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const communities = await res.json();
        const communityList = document.getElementById('communityList');
        communityList.innerHTML = '';  // Resetta la lista delle comunità

        // Popola la lista delle comunità
        communities.forEach(community => {
            const li = document.createElement('li');
            li.textContent = community.name;
            li.addEventListener('click', () => displayCommunityDetails(community));
            communityList.appendChild(li);
        });
    } catch (err) {
        console.error('Errore nel caricamento delle comunità:', err);
    }
}

// Funzione per visualizzare i dettagli della comunità e condividere playlist
function displayCommunityDetails(community) {
    const communityDetails = document.getElementById('communityDetails');
    const membersList = document.getElementById('communityMembers');

    // Mostra i membri della comunità
    membersList.innerHTML = '';
    community.members.forEach(member => {
        const li = document.createElement('li');
        li.textContent = member.name;
        membersList.appendChild(li);
    });

    // Carica le playlist dell'utente per condividerle
    loadUserPlaylists();

    // Imposta l'ID della comunità nel dataset
    communityDetails.dataset.communityId = community._id;
    communityDetails.style.display = 'block';  // Mostra la sezione
}

// Funzione per caricare le playlist dell'utente per condividerle
async function loadUserPlaylists() {
    try {
        const res = await fetch('/api/user/playlists', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const playlists = await res.json();
        const playlistSelect = document.getElementById('playlistSelect');
        playlistSelect.innerHTML = '';  // Resetta la lista delle playlist

        // Popola la lista delle playlist
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist._id;
            option.textContent = playlist.name;
            playlistSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Errore nel caricamento delle playlist:', err);
    }
}

// Funzione per condividere una playlist con una comunità
async function sharePlaylistWithCommunity(communityId, playlistId) {
    try {
        const res = await fetch(`/api/community/${communityId}/share-playlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ playlistId })
        });

        if (res.ok) {
            alert('Playlist condivisa con successo!');
        } else {
            alert('Errore durante la condivisione della playlist.');
        }
    } catch (err) {
        console.error('Errore nella condivisione della playlist:', err);
    }
}
// Funzione per uscire da una comunità
async function leaveCommunity(communityId) {
    try {
        const res = await fetch(`/api/community/${communityId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            alert('Sei uscito dalla comunità.');
            loadUserCommunities();  // Ricarica le comunità aggiornate
        } else {
            alert('Errore durante l\'uscita dalla comunità.');
        }
    } catch (err) {
        console.error('Errore durante l\'uscita dalla comunità:', err);
    }
}