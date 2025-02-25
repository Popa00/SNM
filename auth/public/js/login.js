document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.status === 200) {
        localStorage.setItem('token', data.token);
        //se il login va a buon fine, reindirizza alla dashboard
        window.location.href = 'dashboard.html'; 
    } else {
        alert(data.msg);
    }
});
