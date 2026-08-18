
function showErrorNotification(error_message) {
    const existing = document.getElementById('error-notification')
    if (existing) {
        existing.remove()
    }

    const notification = document.createElement('div')
    notification.id = 'error-notification'
    notification.setAttribute('role', 'alert')
    notification.setAttribute('aria-live', 'assertive')
    notification.className = 'fixed right-4 top-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] -translate-y-2 items-start gap-3 rounded-lg border border-red-200 bg-white p-4 text-red-900 opacity-0 shadow-xl ring-1 ring-black/5 transition-all duration-300 ease-out'

    const icon = document.createElement('span')
    icon.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = '!'

    const content = document.createElement('div')
    content.className = 'min-w-0 flex-1'

    const title = document.createElement('p')
    title.className = 'font-semibold'
    title.textContent = 'Something went wrong'

    const message = document.createElement('p')
    message.className = 'mt-1 break-words text-sm text-red-700'
    message.textContent = error_message || 'Please try again.'

    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xl leading-none text-red-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
    close.setAttribute('aria-label', 'Dismiss notification')
    close.textContent = 'x'
    close.addEventListener('click', () => dismissErrorNotification(notification))

    content.append(title, message)
    notification.append(icon, content, close)
    document.body.appendChild(notification)

    requestAnimationFrame(() => {
        notification.classList.add('translate-y-0', 'opacity-100')
    })

    window.clearTimeout(window.errorNotificationTimeout)
    window.errorNotificationTimeout = window.setTimeout(() => {
        dismissErrorNotification(notification)
    }, 5000)
}

function dismissErrorNotification(notification) {
    if (!notification || !notification.isConnected) {
        return
    }

    notification.classList.add('-translate-y-2', 'opacity-0')
    window.setTimeout(() => notification.remove(), 300)
}
