document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    // Carica i dati dell'utente
    async function loadUserData() {
        try {
            const res = await fetch('/api/user-profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const user = await res.json();
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('musicPreferences').value = user.musicPreferences.join(', ');
            document.getElementById('favoriteBands').value = user.favoriteBands.join(', ');
        } catch (err) {
            console.error(err);
            alert('Errore nel caricamento dei dati utente.');
        }
    }

    // Salva le modifiche al profilo
    document.getElementById('profileForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const musicPreferences = document.getElementById('musicPreferences').value.split(',').map(p => p.trim());
        const favoriteBands = document.getElementById('favoriteBands').value.split(',').map(b => b.trim());

        try {
            const res = await fetch('/api/user-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, musicPreferences, favoriteBands })
            });

            if (res.ok) {
                alert('Profilo aggiornato con successo!');
                window.location.href = 'dashboard.html';  // Reindirizza alla dashboard
            } else {
                const errorData = await res.json();
                alert(`Errore nel salvataggio del profilo: ${errorData.msg}`);
            }
        } catch (err) {
            console.error(err);
            alert('Errore nel salvataggio del profilo.');
        }
    });

    loadUserData();  // Carica i dati dell'utente all'inizio
});
