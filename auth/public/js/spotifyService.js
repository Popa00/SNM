import fetch from 'node-fetch';
import qs from 'querystring';

// Credenziali dell'app Spotify
const clientId = 'your client id';
const clientSecret = 'your secret key';
let accessToken = '';

async function getSpotifyAccessToken() {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: qs.stringify({
                grant_type: 'client_credentials'
            })
        });

        if (!response.ok) {
            throw new Error(`Errore durante il recupero del token: ${response.statusText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        return accessToken;
    } catch (err) {
        console.error('Errore ottenendo il token di accesso Spotify:', err);
        throw err;
    }
}

export async function searchSong(query) {
    // Ottieni il token di accesso se non esiste già
    if (!accessToken) {
        await getSpotifyAccessToken();
    }

    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`;

    try {
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Errore durante la ricerca della canzone: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.tracks && data.tracks.items.length > 0) {
            return data.tracks.items.map(track => ({
                title: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                duration: track.duration_ms, // Durata in millisecondi
                releaseYear: new Date(track.album.release_date).getFullYear(),
                previewUrl: track.preview_url || '',
                genre: 'Sconosciuto'  //RICORDA POI DI IMPOSTARLO COME ARRAY
            }));
        } else {
            return [];
            alert("Canzone non trovata");
        }

    } catch (err) {
        console.error('Errore durante la ricerca della canzone:', err);
        throw err;
    }
}

export default searchSong
