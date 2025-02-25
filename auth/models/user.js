// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    musicPreferences: {
        type: [String], // Array di stringhe per salvare le preferenze musicali
        default: [],     // Inizializza come array vuoto 
        required: true
    },
    favoriteBands: {
        type: [String], // Array di stringhe per i gruppi musicali preferiti
        default: [],     // Inizializza come array vuoto 
        required: true
    }
});

export default mongoose.model('User', UserSchema);
