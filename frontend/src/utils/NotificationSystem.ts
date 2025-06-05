export type NotificationType = 'info' | 'success' | 'error'

export class NotificationSystem {
    private container: HTMLElement

    constructor(containerId = 'notifications') {
        const existing = document.getElementById(containerId)
        this.container = existing || document.createElement('div')
        if (!existing) {
            this.container.id = containerId
            this.container.className = 'notifications-container'
            document.body.appendChild(this.container)
        }
    }

    show(message: string, type: NotificationType = 'info', title?: string): void {
        const el = document.createElement('div')
        el.className = `notification ${type}`
        el.innerHTML = `${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>`
        this.container.appendChild(el)
        setTimeout(() => {
            el.classList.add('fade-out')
            el.addEventListener('transitionend', () => el.remove(), { once: true })
        }, 3000)
    }
}
