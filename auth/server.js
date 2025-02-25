// server.js
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import path from 'path';
import User from './models/user.js';
import Playlist from './models/Playlist.js';
import { searchSong } from './public/js/spotifyService.js';    //CONTROLLARE QUA
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware per il parsing del corpo delle richieste
app.use(bodyParser.json());

// Configurazione per servire file statici
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Connessione a MongoDB
mongoose.connect('mongodb://localhost:27017/snm')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Rotte per registrazione
app.post('/register', async (req, res) => {
    const { email, username, password, musicPreferences, favoriteBands } = req.body;

    // Se i dati sono stringhe separate da virgole, dividili in array
    const musicPreferencesArray = typeof musicPreferences === 'string' ? musicPreferences.split(',').map(item => item.trim()) : musicPreferences;
    const favoriteBandsArray = typeof favoriteBands === 'string' ? favoriteBands.split(',').map(item => item.trim()) : favoriteBands;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'L\'utente esiste già' });
        }
        if (!musicPreferencesArray || musicPreferencesArray.length === 0) {
            return res.status(400).json({ msg: 'Le preferenze musicali sono obbligatorie' });
        }

        if (!favoriteBandsArray || favoriteBandsArray.length === 0) {
            return res.status(400).json({ msg: 'I gruppi musicali preferiti sono obbligatori' });
        }

        user = new User({ email, username, password, musicPreferences: musicPreferencesArray, favoriteBands: favoriteBandsArray });

        //cripta la password e salva l'utente
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        //token JWT
        const payload = { user: { id: user.id } };

        jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Rotte per login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(payload, 'secret', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Middleware per autenticazione
function auth(req, res, next) {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Token non valido' });
    }
}

// Creazione di una nuova playlist
app.post('/api/playlists', auth, async (req, res) => {
    const { name, description, tags, songs } = req.body;

    // Se i dati sono stringhe separate da virgole, dividili in array
    const playlistTagArray = typeof tags === 'string' ? tags.split(',').map(item => item.trim()) : tags;
    try {
        const newPlaylist = new Playlist({
            name,
            user: req.user.id,
            description,
            tags: playlistTagArray,
            songs
        });
        const playlist = await newPlaylist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Per visualizzare le playlist dell'utente
app.get('/api/playlists', auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({ user: req.user.id });
        res.json(playlists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Modifica playlist esistente
app.put('/api/playlists/:id', auth, async (req, res) => {
    const { name, description } = req.body;
    //debug
    //console.log("modifica playlist", {name, description});
    try {
        let playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist non trovata' });
        }

        // Verifica che la playlist appartenga all'utente loggato
        if (playlist.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Non autorizzato' });
        }

        // Aggiorna i campi della playlist
        playlist.name = name || playlist.name;
        playlist.description = description || playlist.description;

        await playlist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Cancellazione di una playlist
app.delete('/api/playlists/:id', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist non trovata' });
        }
        //verifico che la playlist appartenga all'utente loggato
        if (playlist.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Non autorizzato' });
        }
        //cancellazione effettiva playlist
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Playlist cancellata' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Carica i dati del profilo utente
app.get('/api/user-profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Modifica il profilo utente
app.put('/api/user-profile', auth, async (req, res) => {
    const { username, email, password, musicPreferences, favoriteBands } = req.body;

    try {
        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'Utente non trovato' });
        }

        // Aggiorna i campi
        user.username = username || user.username;
        user.email = email || user.email;
        user.musicPreferences = musicPreferences || user.musicPreferences;
        user.favoriteBands = favoriteBands || user.favoriteBands;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});


// Cancellazione dell'account utente
app.delete('/api/delete-account', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        //cancella tutte le playlist dell'utente
        await Playlist.deleteMany({user : userId});

        // Trova l'utente e lo elimina
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Utente non trovato' });
        }

        res.json({ msg: 'Account e playlist eliminati con successo' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }

});

//rotta per modificare stato playlist (pubblico o non)
app.put('/api/playlists/:id/public', auth, async (req, res) => {
    const { isPublic } = req.body;

    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist non trovata' });
        }

        // Verifica che la playlist appartenga all'utente
        if (playlist.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Non autorizzato' });
        }

        playlist.isPublic = isPublic;
        await playlist.save();

        res.json(playlist);
    } catch (err) {
        console.error('Errore nell\'aggiornamento dello stato pubblico della playlist:', err);
        res.status(500).send('Errore del server');
    }
});

// Ottenere playlist pubbliche
app.get('/api/public-playlists', async (req, res) => {
    const { query } = req.query;
    const regex = new RegExp(query, 'i');

    try {
        const playlists = await Playlist.find({ isPublic: true, $or: [{ name: regex }, { tags: regex }] });
        res.json(playlists);
    } catch (err) {
        console.error('Errore nella ricerca delle playlist pubbliche:', err);
        res.status(500).send('Errore del server');
    }
});

// Importare playlist pubblica
app.post('/api/playlists/import/:id', auth, async (req, res) => {
    try {
        const playlistToImport = await Playlist.findById(req.params.id);
        if (!playlistToImport || !playlistToImport.isPublic) {
            return res.status(404).json({ msg: 'Playlist non trovata o non pubblica.' });
        }

        const importedPlaylist = new Playlist({
            name: playlistToImport.name,
            description: playlistToImport.description,
            tags: playlistToImport.tags,
            songs: playlistToImport.songs,
            user: req.user.id
        });

        await importedPlaylist.save();
        res.json(importedPlaylist);
    } catch (err) {
        console.error('Errore nell\'importazione della playlist:', err);
        res.status(500).send('Errore del server');
    }
});


// Rotta per cercare e aggiungere una canzone a una playlist
app.post('/api/playlists/:id/add-song', auth, async (req, res) => {
    //const { songQuery } = req.body;  // La query di ricerca della canzone
    const song = req.body; 
    const playlistId = req.params.id;
    try {
        console.log('ID Playlist: ', playlistId);  //DEBUG
        
        //const song = await searchSong(songQuery);  // Cerca la canzone tramite l'API di Spotify

        console.log('Canzone trovata: ', song);  //DEBUG
        if (!song) {
            return res.status(404).json({ msg: 'Canzone non trovata' });
        }

        let playlist = await Playlist.findById(playlistId);
        console.log('Playlist trovata: ', playlist)  //DEBUG

        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist non trovata' });
        }

        // Verifica che la playlist appartenga all'utente loggato
        if (playlist.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Non autorizzato' });
        }

        // Aggiungi la canzone alla playlist come un singolo oggetto, non un array
        const songToAdd = {
            title: song.songTitle,
            artist: song.songArtist,
            album: song.album,
            duration: song.songDuration,
            releaseYear: song.songReleaseYear,
            previewUrl: song.songPreviewUrl
        };
        //console.log('Oggetto da aggiungere: ', ); // DEBUG
        // Aggiungi la canzone alla playlistsongToAdd
        playlist.songs.push(songToAdd);

        await playlist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Rotta per cercare canzoni tramite l'API di Spotify
app.get('/api/search-song', auth, async (req, res) => {
    const query = req.query.query;

    try {
        const songs = await searchSong(query);  // Ottieni fino a 20 risultati
        if (!songs || songs.length === 0) {
            return res.status(404).json({ msg: 'Nessuna canzone trovata' });
        }
        res.json(songs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

app.get('/api/search/playlists', auth, async (req, res) => {
    const { query, tags, song } = req.query;

    let searchCriteria = {
        isPublic: true
    };

    if (query) {
        searchCriteria.name = new RegExp(query, 'i');  // Cerca per nome della playlist
    }

    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        searchCriteria.tags = { $in: tagArray };  // Cerca per tag
    }

    if (song) {
        searchCriteria['songs.title'] = new RegExp(song, 'i');  // Cerca per canzone contenuta
    }

    try {
        const playlists = await Playlist.find(searchCriteria);
        res.json(playlists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Errore nel recupero delle playlist pubbliche.' });
    }
});

// Crea una nuova comunità
app.post('/api/community', auth, async (req, res) => {
    const { name, members } = req.body;

    try {
        const community = new Community({
            name,
            creator: req.user.id,
            members: [req.user.id, ...members]  // Aggiungi anche il creatore come membro
        });

        await community.save();
        res.json(community);
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore nella creazione della comunità.');
    }
});

// Uscire da una comunità
app.post('/api/community/:id/leave', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ msg: 'Comunità non trovata' });
        }

        // Rimuovi l'utente dalla lista dei membri
        community.members = community.members.filter(memberId => memberId.toString() !== req.user.id);

        await community.save();
        res.json({ msg: 'Sei uscito dalla comunità' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Errore del server');
    }
});

// Condivide una playlist con una comunità
app.post('/api/playlists/:id/share-with-community', auth, async (req, res) => {
    const { communityId } = req.body;  // L'ID della comunità con cui condividere la playlist
    const playlistId = req.params.id;  // L'ID della playlist

    try {
        const community = await Community.findById(communityId);
        const playlist = await Playlist.findById(playlistId);

        if (!community) {
            return res.status(404).json({ msg: 'Comunità non trovata' });
        }

        if (!playlist) {
            return res.status(404).json({ msg: 'Playlist non trovata' });
        }

        // Verifica che l'utente sia il proprietario della playlist
        if (playlist.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Non autorizzato' });
        }

        // Verifica che l'utente sia membro della comunità
        if (!community.members.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Non sei membro di questa comunità' });
        }

        // Aggiungi la comunità all'elenco delle comunità con cui la playlist è stata condivisa
        if (!playlist.sharedWithCommunities.includes(communityId)) {
            playlist.sharedWithCommunities.push(communityId);
            await playlist.save();
        }

        res.json(playlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Restituisce le playlist condivise con una comunità
app.get('/api/community/:id/playlists', auth, async (req, res) => {
    const communityId = req.params.id;

    try {
        const playlists = await Playlist.find({
            sharedWithCommunities: communityId  // Cerca le playlist condivise con la comunità
        }).populate('user', 'name');  // Popola l'utente creatore della playlist

        res.json(playlists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

//community
app.get('/api/community', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const community = await Community.find({ members: userId });
        res.json(community);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Errore del server');
    }
});

// Rotta per ottenere tutti gli utenti
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username');
        res.json(users); // Rispondi con gli utenti in formato JSON
    } catch (err) {
        console.error('Errore nel recupero degli utenti:', err);
        res.status(500).json({ error: 'Errore nel recupero degli utenti' });
    }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
