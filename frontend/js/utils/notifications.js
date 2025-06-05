class NotificationSystem {
    constructor(containerId = 'notifications') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = containerId;
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', title = '') {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.innerHTML = `
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        `;
        this.container.appendChild(notif);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notif.classList.add('fade-out');
            notif.addEventListener('transitionend', () => notif.remove(), { once: true });
        }, 3000);
    }
}

if (typeof window !== 'undefined') {
    window.NotificationSystem = NotificationSystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
