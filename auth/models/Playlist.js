// models/Playlist.js
import mongoose from 'mongoose';

const SongSchema = new mongoose.Schema({
    title: String,
    artist: String,
    genre: String,
    duration: Number,  // in millisecondi
    releaseYear: Number,
    previewUrl: String
})

const PlaylistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: [],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    songs: [SongSchema],

    sharedWithCommunities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }]
});

export default mongoose.model('Playlist', PlaylistSchema);
