// ====== Service Worker - 后台推送通知 ======
const CACHE_NAME = 'mini-phone-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// 接收推送通知
self.addEventListener('push', event => {
    if (!event.data) return;
    let data = {};
    try {
        data = event.data.json();
    } catch(e) {
        data = { title: 'mini Phone', body: event.data.text() };
    }
    const title = data.title || 'mini Phone';
    const options = {
        body: data.body || '',
        icon: data.icon || 'icon-192.png',
        badge: 'icon-192.png',
        tag: data.tag || 'mini-phone-msg',
        data: { contactId: data.contactId, url: self.location.origin + self.location.pathname.replace('sw.js', '') },
        requireInteraction: false,
        silent: false
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// 点击通知
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const contactId = event.notification.data && event.notification.data.contactId;
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // 已有打开的窗口，聚焦并通知它
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    if (contactId) {
                        client.postMessage({ type: 'OPEN_CHAT', contactId: contactId });
                    }
                    return;
                }
            }
            // 没有打开的窗口，打开新窗口
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl + (contactId ? '#chat-' + contactId : ''));
            }
        })
    );
});

// 接收来自页面的消息（用于后台定时任务调度）
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, contactId, tag } = event.data;
        self.registration.showNotification(title || 'mini Phone', {
            body: body || '',
            icon: icon || 'icon-192.png',
            badge: 'icon-192.png',
            tag: tag || ('mini-msg-' + Date.now()),
            data: { contactId: contactId, url: event.data.url || '/' },
            requireInteraction: false
        });
    }
});
