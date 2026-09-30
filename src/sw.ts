/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<string | { url: string; revision: string | null }> };
const cacheName = "azb-static-v2";
const precacheUrls = self.__WB_MANIFEST.map(entry => typeof entry === "string" ? entry : entry.url);
self.addEventListener("install", event => {
	event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(precacheUrls)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
	event.waitUntil(Promise.all([
		caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("azb-static-") && key !== cacheName).map(key => caches.delete(key)))),
		self.clients.claim(),
	]));
});
self.addEventListener("fetch", event => {
	if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
	event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(async error => {
		if (event.request.mode === "navigate") return await caches.match("/index.html") || Promise.reject(error);
		throw error;
	})));
});
self.addEventListener("push", event => {
	let data: { title?: string; body?: string; url?: string } = {};
	try { data = event.data?.json() ?? {}; } catch { /* Use default message. */ }
	event.waitUntil(self.registration.showNotification(data.title || "Arbeitszeit", {
		body: data.body || "Bitte Arbeitszeit prüfen.",
		icon: "/pwa-192x192.svg",
		data: { url: data.url || "/" },
	}));
});
self.addEventListener("notificationclick", event => {
	event.notification.close();
	const url = new URL((event.notification.data as { url?: string })?.url || "/", self.location.origin);
	if (url.origin !== self.location.origin) return;
	event.waitUntil(self.clients.openWindow(url.href));
});
