document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    // Se non c'è un token, reindirizza l'utente alla pagina di login
    if (!token) {
        window.location.href = 'login.html';
    }

    const playlistsContainer = document.getElementById('playlists');
    const editModal = document.getElementById('editModal');
    const editPlaylistName = document.getElementById('editPlaylistName');
    const editPlaylistDescription = document.getElementById('editPlaylistDescription');
    //const editPlaylistTag = document.getElementById('editPlaylistTag')
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    let playlists = [];  // Inizializza come array vuoto

    // Funzione per caricare le playlist dell'utente
    async function loadPlaylists() {
        try {
            const res = await fetch('/api/playlists', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            playlists = await res.json();

            playlistsContainer.innerHTML = '';

            playlists.forEach(playlist => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${playlist.name}</strong>
                        <p>${playlist.description || ""}</p>
                        <button class="edit-btn" data-id="${playlist._id}">Modifica</button>
                        <button class="delete-btn" data-id="${playlist._id}">Elimina</button>
                        <input type="checkbox" class="public-flag" data-id="${playlist._id}" ${playlist.isPublic ? 'checked' : ''}> Rendi pubblica
                    </div>
                `;
                playlistsContainer.appendChild(li);
            });

            //listener per i pulsanti di modifica
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', openEditModal);
            });

            //listener per i pulsanti di eliminazione
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', deletePlaylist);
            });
            //listener per il flag di visibilità pubblica
            document.querySelectorAll('.public-flag').forEach(flag => {
                flag.addEventListener('change', togglePublicFlag);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // Funzione per modificare lo stato pubblico della playlist
    async function togglePublicFlag(e) {
        const playlistId = e.target.getAttribute('data-id');
        const isPublic = e.target.checked;

        try {
            const res = await fetch(`/api/playlists/${playlistId}/public`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isPublic })
            });

            if (!res.ok) {
                alert('Errore nell\'aggiornamento della playlist.');
            }
        } catch (err) {
            console.error('Errore nell\'aggiornamento dello stato pubblico: ', err);
        }
    }

    // Funzione per aprire il modale di modifica/creazione
    function openEditModal(e) {
        const playlistId = e.target.getAttribute('data-id');
        if (playlistId) {
            const playlistElement = e.target.closest('li').querySelector('strong');
            const descriptionElement = e.target.closest('li').querySelector('p');

            // Pre-popola il modale con i dati esistenti della playlist
            editPlaylistName.value = playlistElement.innerText;
            editPlaylistDescription.value = descriptionElement.innerText || "";
            saveChangesBtn.setAttribute('data-id', playlistId); // Setta l'id per modificare
        } else {
            // Se è una nuova playlist, resettare i campi
            editPlaylistName.value = '';
            editPlaylistDescription.value = '';
            saveChangesBtn.removeAttribute('data-id'); // Nessun id = nuova playlist
        }

        // Mostra il modale
        editModal.style.display = 'block';
    }

    // Funzione per salvare modifiche o creare una nuova playlist
    saveChangesBtn.addEventListener('click', async function () {
        const playlistId = this.getAttribute('data-id');
        const updatedName = editPlaylistName.value;
        const updatedDescription = editPlaylistDescription.value;
        const updatedTags = document.getElementById('editPlaylistTag').value.split(',').map(tag => tag.trim());

        if (!updatedName) {
            alert('Il nome della playlist è obbligatorio.');
            return;
        }

        if (updatedDescription.length === 0 || !updatedDescription[0]) {
            alert('Devi inserire una descrizione per la playlist.');
            return;
        }

        if (updatedTags.length === 0 || !updatedTags[0]) {
            alert('Devi inserire almeno un tag per la playlist.');
            return;
        }

        const url = playlistId ? `/api/playlists/${playlistId}` : '/api/playlists'; // Differenzia creazione e modifica
        const method = playlistId ? 'PUT' : 'POST'; // POST per creazione, PUT per modifica

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: updatedName, description: updatedDescription, tags: updatedTags })
            });

            if (res.ok) {
                loadPlaylists(); // Ricarica le playlist aggiornate
                editModal.style.display = 'none'; // Nascondi il modale
            } else {
                /* console.error('Errore nel salvataggio delle modifiche'); */
                const errorData = await res.json();
                alert(`Errore nel salvataggio: ${errorData.msg || 'Errore sconosciuto'}`); // Mostra un messaggio di errore più dettagliato
                console.error('Errore nel salvataggio delle modifiche', errorData);
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Funzione per cancellare una playlist
    async function deletePlaylist(e) {
        const playlistId = e.target.getAttribute('data-id');
        try {
            const res = await fetch(`/api/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                loadPlaylists(); // Ricarica le playlist aggiornate
            } else {
                //GESTIONE ERRORI 400 E 500
                if (res.status >= 400 && res.status < 500) {
                    alert('Errore: Parametri non validi o mancanti.');
                } else if (res.status >= 500) {
                    alert('Errore del server. Riprova più tardi.');
                }
                /* console.error('Errore nella cancellazione della playlist'); */
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Bottone per creare una nuova playlist
    document.getElementById('createPlaylistBtn').addEventListener('click', function () {
        // Resetta i campi del modale per la creazione di una nuova playlist
        document.getElementById('editPlaylistName').value = '';
        document.getElementById('editPlaylistDescription').value = '';
        document.getElementById('editPlaylistTag').value = '';
        document.getElementById('saveChangesBtn').removeAttribute('data-id'); // Nessun id perché è una nuova playlist

        // Mostra il modale
        document.getElementById('editModal').style.display = 'block';
    });

    // Funzione per effettuare il logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('token');
        window.location.href = 'index.html'; // Reindirizza alla homepage
    });

    // Bottone per eliminare l'account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', function () {
        const confirmation = confirm("Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.");
        if (confirmation) {
            deleteAccount();
        }
    });

    // Bottone per modificare l'account
    const editProfileBtn = document.getElementById('editProfileBtn');
    editProfileBtn.addEventListener('click', function () {
        window.location.href = 'profile.html'; // Reindirizza alla pagina di modifica del profilo
    });


    // Funzione per eliminare l'account
    async function deleteAccount() {
        try {
            const res = await fetch('/api/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                alert('Account eliminato con successo.');
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            } else {
                const data = await res.json();
                //GESTIONE ERRORI 400 E 500
                if (res.status >= 400 && res.status < 500) {
                    alert('Errore: Parametri non validi o mancanti.');
                } else if (res.status >= 500) {
                    alert('Errore del server. Riprova più tardi.');
                }
                /* alert(`Errore nella cancellazione dell'account: ${data.msg}`); */
            }
        } catch (err) {
            console.error(err);
            alert('Errore del server. Riprova più tardi.');
        }
    }

    // Form per ricerca playlist pubbliche
    document.getElementById('searchPublicPlaylistForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const query = document.getElementById('searchPlaylistQuery').value;

        if (!query) {
            alert('Inserisci una query di ricerca.');
            return;
        }

        try {
            const res = await fetch(`/api/public-playlists?query=${query}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const playlists = await res.json();
            const resultsContainer = document.getElementById('publicPlaylistResults');
            resultsContainer.innerHTML = ''; // Svuota i risultati precedenti

            playlists.forEach(playlist => {
                const playlistElement = document.createElement('div');
                playlistElement.innerHTML = `
                <h3>${playlist.name}</h3>
                <p>${playlist.description}</p>
                <p><strong>Tags:</strong> ${playlist.tags.join(', ')}</p>
                <button class="import-playlist-btn" data-id="${playlist._id}">Importa Playlist</button>
            `;
                resultsContainer.appendChild(playlistElement);
            });

            //listener per i pulsanti di importazione
            document.querySelectorAll('.import-playlist-btn').forEach(button => {
                button.addEventListener('click', importPlaylist);
            });
        } catch (err) {
            console.error('Errore nella ricerca delle playlist pubbliche:', err);
        }
    });

    // Funzione per importare una playlist pubblica
    async function importPlaylist(e) {
        const playlistId = e.target.getAttribute('data-id');

        try {
            const res = await fetch(`/api/playlists/import/${playlistId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                alert('Playlist importata con successo!');
                loadPlaylists(); // Ricarica le playlist
            } else {
                //GESTIONE ERRORI 400 E 500
                if (res.status >= 400 && res.status < 500) {
                    alert('Errore: Parametri non validi o mancanti.');
                } else if (res.status >= 500) {
                    alert('Errore del server. Riprova più tardi.');
                }
                /* alert('Errore nell\'importazione della playlist.'); */
            }
        } catch (err) {
            console.error('Errore nell\'importazione della playlist:', err);
        }
    }


    // Funzione per aprire il modale di aggiunta canzoni
    function openAddSongModal(e) {
        const playlistId = e.target.getAttribute('data-id');
        const songQuery = prompt('Inserisci il nome della canzone o dell\'artista per cercarla su Spotify:');

        if (songQuery) {
            addSongToPlaylist(playlistId, songQuery);
        }
    }

    // Funzione per aggiungere una canzone alla playlist
    async function list(playlistId, songQuery) {
        try {
            const res = await fetch(`/api/playlists/${playlistId}/add-song`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songQuery })
            });

            if (res.ok) {
                const playlist = await res.json();
                console.log('Canzone aggiunta con successo:', playlist);
            } else {
                const errorText = await res.text();  // Recupera la risposta come testo se non è JSON
                alert(`Errore: ${errorText}`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Funzione per cercare canzoni su Spotify
    async function searchSpotify(query) {
        document.getElementById('searchSongForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            const query = document.getElementById('searchInput').value;

            if (!query) {
                alert('Inserisci una query di ricerca.');
                return;
            }

            try {
                const res = await fetch(`/api/search-song?query=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error('Errore durante la ricerca delle canzoni');
                }
                const songs = await res.json();
                console.log("Risultati trovati", songs);

                displaySearchResults(songs);  // Assicurati che sia un array
            } catch (err) {
                console.error('Errore durante la ricerca: ', err);
                alert('Errore durante la ricerca delle canzoni')
            }
        });
    }
    // Aggiungi un listener al bottone di ricerca
    searchBtn.addEventListener('click', async function () {
        const query = searchInput.value;
        if (query) {
            if (playlists.length === 0) {
                await loadPlaylists();
            }
            searchSpotify(query);  // Effettua la ricerca solo se c'è una query
        } else {
            alert('Inserisci il nome di una canzone o di un artista.');
        }
    });

    // Funzione per mostrare i risultati della ricerca
    function displaySearchResults(songs) {

        searchResults.innerHTML = '';  // Resetta i risultati precedenti

        if (!Array.isArray(playlists) || playlists.length === 0) {
            alert('Non hai ancora creato playlist.');
            return;
        }
        // Controlla se `songs` è un array
        if (!Array.isArray(songs)) {
            console.error('La variabile songs non è un array:', songs);
            alert('Errore: nessun risultato trovato o risposta non valida.');
            return;
        }
        songs.forEach(song => {
            const songDiv = document.createElement('div');
            songDiv.classList.add('song-item');

            // Crea un'opzione di selezione per la playlist
            const selectPlaylist = document.createElement('select');
            playlists.forEach(playlist => {
                const option = document.createElement('option');
                option.value = playlist._id;
                option.text = playlist.name;

                selectPlaylist.appendChild(option);
            });

            // Crea il bottone per aggiungere la canzone alla playlist
            const addButton = document.createElement('button');
            addButton.textContent = 'Aggiungi';
            addButton.addEventListener('click', function () {
                const selectedPlaylistId = selectPlaylist.value;
                const songId = Math.floor(Math.random() * 1000000);
                const songQuery = 'Canzone da cercare';
                const songTitle = song.title;
                const songArtist = song.artist;
                const songAlbum = song.album;
                const songDuration = song.duration;
                const songReleaseYear = song.releaseYear;
                const songPreviewUrl = song.previewUrl;

                addSongToPlaylist(selectedPlaylistId, songId, songQuery, songTitle, songArtist, songAlbum, songDuration, songReleaseYear, songPreviewUrl);
            });

            songDiv.innerHTML = `
            <p><strong>${song.title}</strong> - ${song.artist}</p>
            <p>Album: ${song.album} | Anno: ${song.releaseYear} | Durata: ${(song.duration / 1000 / 60).toFixed(2)} minuti</p>
        `;
            songDiv.appendChild(selectPlaylist);
            songDiv.appendChild(addButton);

            searchResults.appendChild(songDiv);
        });
    }

    // Funzione per aggiungere una canzone alla playlist selezionata
    /*async function addSongToPlaylist(playlistId, song) {
        try {
            const res = await fetch(`/api/playlists/${playlistId}/add-song`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ songQuery: `${song.title} ${song.artist}` })
            });
    
            if (res.ok) {
                alert('Canzone aggiunta con successo!');
            } else {
                const errorData = await res.json();
                alert(`Errore nell'aggiunta della canzone: ${errorData.msg}`);
            }
        } catch (err) {
            console.error(err);
        }
    }*/


    // Carica le playlist al caricamento della pagina
    loadPlaylists();
});
async function addSongToPlaylist(playlistId, songId, songQuery, songTitle, songArtist, songAlbum, songDuration, songReleaseYear, songPreviewUrl) {
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`/api/playlists/${playlistId}/add-song`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },

            //body: JSON.stringify({ songQuery })
            body: JSON.stringify({
                songId: songId,
                songQuery: songQuery,
                songTitle: songTitle,
                songArtist: songArtist,
                songAlbum: songAlbum,
                songDuration: songDuration,
                songPreviewUrl: songPreviewUrl,
                songReleaseYear: songReleaseYear
            })
        });

        if (res.ok) {
            const playlist = await res.json();
            console.log('Canzone aggiunta con successo:', playlist);
            alert("Canzone aggiunta con successo");
        } else {
            const error = await res.json();
            alert(`Errore: ${error.msg}`);
        }
    } catch (err) {
        console.error('Errore durante l\'aggiunta della canzone:', err);
    }
}


