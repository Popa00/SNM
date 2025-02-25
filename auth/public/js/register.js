document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const musicPreferences = document.getElementById('musicPreferences').value;
    const favoriteBands = document.getElementById('favoriteBands').value;

    const res = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password, musicPreferences, favoriteBands })
    });

    const data = await res.json();
    if (res.status === 200) {
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
    } else {
        alert(data.msg);
    }
});
