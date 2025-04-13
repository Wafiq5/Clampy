import { logoutUser as authLogout } from './auth-utils.js';

class ClampyNavbar extends HTMLElement {
    connectedCallback() {
        const username = localStorage.getItem('username');
        const isLoggedIn = !!username;

        const authText = isLoggedIn ? username : "Login";
        const authLink = isLoggedIn ? "#" : "../HTML/login.html";
        const signupLink = isLoggedIn ? "" : "../HTML/signup.html";
        const connectLink = "";

        this.innerHTML = `
            <div class="navbar">
                <div class="navbar-brand-name">
                    <span class="brand-logo gradient-text">&lt;/<span class="brand-text"><a href="../HTML/index.html">Clampy</a></span>&gt;</span>
                    <span class="menu-toggle button"><img class="hamburger-menu" src="/ICONS/hamburger-menu.svg" alt=""></span>
                </div>
            
                <ul class="navbar-ul">
                    ${isLoggedIn ? `
                    <li class="navbar-li button user-dropdown">
                        <a href="#" class="user-status">${authText}</a>
                        <div class="dropdown-content">
                            <a href="#" id="logoutButton">Log Out</a>
                        </div>
                    </li>
                    ` : `
                    <li class="navbar-li button"><a href="${authLink}" class="user-status">${authText}</a></li>
                    `}
                    <li class="navbar-li button"><a href="${connectLink}">Connect with a team</a></li>
                </ul>
            </div>
        `;

        // Add logout functionality
        if (isLoggedIn) {
            const logoutButton = this.querySelector('#logoutButton');
            if (logoutButton) {
                logoutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    authLogout();
                    window.location.href = 'https://wafiq5.github.io/Clampy/HTML/login.html';
                });
            }
        }
    }
}
customElements.define('clampy-navbar', ClampyNavbar);