document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    // Se non c'è un token, reindirizza l'utente alla pagina di login
    if (!token) {
        alert('Token di autenticazione non trovato, per favore effettua il login.');
        window.location.href = 'login.html';
        return;
    }


    // Pulsante per tornare alla dashboard
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Event listener per il pulsante di creazione nuova playlist
    document.getElementById('createPlaylistForm').addEventListener('submit', function (event) {
        event.preventDefault();
        createNewPlaylist(token);
    });

    // Event listener per la barra di ricerca delle playlist pubbliche
    document.getElementById('searchPublicPlaylistsForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const query = document.getElementById('searchPublicPlaylistsInput').value;
        const tags = document.getElementById('searchTagsInput').value;
        const song = document.getElementById('searchSongInput').value;
        searchPublicPlaylists(query, tags, song, token);
    });

    loadUserPlaylists(token);
});

// Funzione per caricare le playlist dell'utente
async function loadUserPlaylists(token) {
    try {
        const res = await fetch('/api/playlists', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const playlists = await res.json();
            const userPlaylists = document.getElementById('userPlaylists');
            userPlaylists.innerHTML = '';

            playlists.forEach(playlist => {
                const li = document.createElement('li');
                li.textContent = playlist.name;
                li.addEventListener('click', () => {
                    displayPlaylistDetails(playlist);
                });
                userPlaylists.appendChild(li);
            });
        } else {
            alert('Errore nel caricamento delle playlist.');
        }
    } catch (err) {
        console.error('Errore:', err);
    }
}

// Funzione per creare una nuova playlist (nome, descrizione, tag)
async function createNewPlaylist(token) {
    const playlistName = document.getElementById('playlistName').value;
    const playlistDescription = document.getElementById('playlistDescription').value;
    const playlistTags = document.getElementById('playlistTags').value.split(',').map(tag => tag.trim());

    if (playlistName && playlistDescription && playlistTags.length > 0) {
        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: playlistName,
                    description: playlistDescription,
                    tags: playlistTags
                })
            });

            if (res.ok) {
                loadUserPlaylists();  // Ricarica le playlist
                document.getElementById('createPlaylistForm').reset();  // Resetta il form
            } else {
                alert('Errore nella creazione della playlist.');
            }
        } catch (err) {
            console.error('Errore:', err);
        }
    } else {
        alert('Devi compilare tutti i campi per creare la playlist.');
    }
}

// Funzione per cercare playlist pubbliche
async function searchPublicPlaylists(query, tags, song, token) {
    const searchParams = new URLSearchParams();
    if (query) searchParams.append('query', query);
    if (tags) searchParams.append('tags', tags);
    if (song) searchParams.append('song', song);

    try {
        const res = await fetch(`/api/search/playlists?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const playlists = await res.json();
            const searchResults = document.getElementById('publicPlaylists');
            searchResults.innerHTML = '';

            playlists.forEach(playlist => {
                const li = document.createElement('li');
                li.textContent = playlist.name;
                li.addEventListener('click', () => {
                    displayPlaylistDetails(playlist, false); // Mostra i dettagli delle playlist pubbliche
                });
                searchResults.appendChild(li);
            });

            document.getElementById('searchResults').style.display = 'block';
        } else {
            alert('Errore nella ricerca delle playlist pubbliche.');
        }
    } catch (err) {
        console.error('Errore:', err);
    }
}

// Funzione per visualizzare i dettagli della playlist
function displayPlaylistDetails(playlist, isOwner = true) {
    const playlistInfo = document.getElementById('playlistInfo');

    playlistInfo.innerHTML = `
        <h3>${playlist.name}</h3>
        <p>${playlist.description || 'Nessuna descrizione'}</p>
        <p>Tag: ${playlist.tags.join(', ') || 'Nessun tag'}</p>
        <ul>
            ${playlist.songs.map(song => `<li>${song.title} - ${song.artist}</li>`).join('')}
        </ul>
    `;
    const songList = document.getElementById('songList');
        
    
    /*//DEBUG
    playlist.songs.forEach(song => {
        console.log(song);  // Stampa ogni canzone per verificare i campi disponibili
    
        const songTitle = song.title || 'Titolo sconosciuto';
        const songArtist = song.artist || 'Artista sconosciuto';
        
        const songItem = document.createElement('li');
        songItem.textContent = `${songTitle} - ${songArtist}`;
        songList.appendChild(songItem);
    });//FINE DEBUG*/


    // Mostra i pulsanti modifica e cancella solo per le playlist dell'utente
    const editButton = document.getElementById('editPlaylist');
    const deleteButton = document.getElementById('deletePlaylist');

    if (isOwner) {
        editButton.style.display = 'block';
        deleteButton.style.display = 'block';

        editButton.onclick = () => editPlaylist(playlist);
        deleteButton.onclick = () => deletePlaylist(playlist._id);
    } else {
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
    }
}

// Funzione per modificare una playlist
async function editPlaylist(playlist) {
    const newName = prompt('Modifica il nome della playlist:', playlist.name);
    if (newName && newName !== playlist.name) {
        try {
            const res = await fetch(`/api/playlists/${playlist._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                loadUserPlaylists();
            } else {
                alert('Errore nella modifica della playlist.');
            }
        } catch (err) {
            console.error('Errore:', err);
        }
    }
}

// Funzione per cancellare una playlist
async function deletePlaylist(playlistId) {
    if (confirm('Sei sicuro di voler cancellare questa playlist?')) {
        try {
            const res = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                loadUserPlaylists();
            } else {
                alert('Errore nella cancellazione della playlist.');
            }
        } catch (err) {
            console.error('Errore:', err);
        }
    }
}
