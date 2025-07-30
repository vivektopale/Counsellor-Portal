const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const contactForm = document.getElementById('contactForm');
const homePage = document.getElementById('homePage');
const loginPage = document.getElementById('loginPage');
const registrationPage = document.getElementById('registrationPage');
const usernameDisplay = document.getElementById('usernameDisplay');
const contactMessages = document.getElementById('contactMessages');

let loggedInUserEmail = null;

// Handle registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, email, password }),
  });

  const data = await response.json();
  alert(data.message);
});

// Handle login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (response.status === 200) {
    loggedInUserEmail = email;
    usernameDisplay.textContent = data.user.username;
    homePage.style.display = 'block';
    loginPage.style.display = 'none';
    registrationPage.style.display = 'none';
  } else {
    alert(data.message);
  }
});

// Handle contact form submission
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const contactMessage = document.getElementById('contactMessage').value;

  const response = await fetch('/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loggedInUserEmail, contactData: contactMessage }),
  });

  const data = await response.json();
  contactMessages.innerHTML = '';
  data.contacts.forEach((message) => {
    const li = document.createElement('li');
    li.textContent = message;
    contactMessages.appendChild(li);
  });

  document.getElementById('contactMessage').value = '';
});