
function showNotification(notification_message, type = 'error') {
    const notification_types = {
        error: {
            title: 'Something went wrong',
            fallback_message: 'Please try again.',
            icon: '!',
            role: 'alert',
            aria_live: 'assertive',
            container_classes: 'border-red-200 text-red-900',
            icon_classes: 'bg-red-100 text-red-600',
            message_classes: 'text-red-700',
            close_classes: 'text-red-500 hover:bg-red-50 hover:text-red-700 focus:ring-red-500'
        },
        success: {
            title: 'Operazione completata',
            fallback_message: 'Operazione completata con successo.',
            icon: '\u2713',
            role: 'status',
            aria_live: 'polite',
            container_classes: 'border-emerald-200 text-emerald-900',
            icon_classes: 'bg-emerald-100 text-emerald-700',
            message_classes: 'text-emerald-700',
            close_classes: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 focus:ring-emerald-500'
        }
    }
    const notification_type = notification_types[type] || notification_types.error
    const existing = document.getElementById('notification')
    if (existing) {
        existing.remove()
    }

    const notification = document.createElement('div')
    notification.id = 'notification'
    notification.setAttribute('role', notification_type.role)
    notification.setAttribute('aria-live', notification_type.aria_live)
    notification.className = `fixed right-4 top-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] -translate-y-2 items-start gap-3 rounded-lg border bg-white p-4 opacity-0 shadow-xl ring-1 ring-black/5 transition-all duration-300 ease-out ${notification_type.container_classes}`

    const icon = document.createElement('span')
    icon.className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold ${notification_type.icon_classes}`
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = notification_type.icon

    const content = document.createElement('div')
    content.className = 'min-w-0 flex-1'

    const title = document.createElement('p')
    title.className = 'font-semibold'
    title.textContent = notification_type.title

    const message = document.createElement('p')
    message.className = `mt-1 break-words text-sm ${notification_type.message_classes}`
    message.textContent = notification_message || notification_type.fallback_message

    const close = document.createElement('button')
    close.type = 'button'
    close.className = `ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xl leading-none transition focus:outline-none focus:ring-2 ${notification_type.close_classes}`
    close.setAttribute('aria-label', 'Dismiss notification')
    close.textContent = 'x'
    close.addEventListener('click', () => dismissNotification(notification))

    content.append(title, message)
    notification.append(icon, content, close)
    document.body.appendChild(notification)

    requestAnimationFrame(() => {
        notification.classList.add('translate-y-0', 'opacity-100')
    })

    window.clearTimeout(window.notificationTimeout)
    window.notificationTimeout = window.setTimeout(() => {
        dismissNotification(notification)
    }, 5000)
}

function showErrorNotification(error_message) {
    showNotification(error_message, 'error')
}

function showSuccessNotification(success_message) {
    showNotification(success_message, 'success')
}

function dismissNotification(notification) {
    if (!notification || !notification.isConnected) {
        return
    }

    notification.classList.add('-translate-y-2', 'opacity-0')
    window.setTimeout(() => notification.remove(), 300)
}

function dismissErrorNotification(notification) {
    dismissNotification(notification)
}
