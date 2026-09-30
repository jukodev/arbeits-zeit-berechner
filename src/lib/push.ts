import type { Settings } from "../db/database";

type PushMessage = { at: string; message: string };
const endpointKey = "azb-push-endpoint";
const pendingCancelKey = "azb-push-pending-cancel";

function config(settings: Settings) {
	const base = settings.pushBackendUrl.trim().replace(/\/+$/, "");
	if (!base || !settings.pushToken.trim()) throw new Error("Push-Server und Token in den Einstellungen eintragen.");
	if (new URL(base).protocol !== "https:" && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base))
		throw new Error("Der Push-Server muss HTTPS verwenden.");
	return { base, token: settings.pushToken.trim() };
}

async function request(settings: Settings, path: string, method: string, body?: unknown) {
	const { base, token } = config(settings);
	const response = await fetch(`${base}/api/push/${path}`, {
		method,
		headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok) throw new Error(`Push-Server: ${response.status}`);
	return response.json();
}

function decodeVapid(key: string): Uint8Array<ArrayBuffer> {
	const padded = key.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(key.length / 4) * 4, "=");
	const raw = atob(padded);
	return Uint8Array.from(raw, char => char.charCodeAt(0));
}

export async function enablePush(settings: Settings): Promise<void> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
		throw new Error("Push wird auf diesem Gerät nicht unterstützt.");
	// On iOS this call must start directly from the button gesture.
	const permission = await Notification.requestPermission();
	if (permission !== "granted") throw new Error("Mitteilungen wurden nicht erlaubt.");
	const registration = await navigator.serviceWorker.ready;
	const { publicKey } = await request(settings, "config", "GET") as { publicKey: string };
	let subscription = await registration.pushManager.getSubscription();
	if (!subscription) subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true, applicationServerKey: decodeVapid(publicKey),
	});
	localStorage.setItem(endpointKey, subscription.endpoint);
}

export async function schedulePush(settings: Settings, messages: PushMessage[]): Promise<void> {
	if (!messages.length) return;
	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) throw new Error("Push-Mitteilungen zuerst in den Einstellungen aktivieren.");
	await request(settings, "schedule", "PUT", { subscription: subscription.toJSON(), messages });
	localStorage.setItem(endpointKey, subscription.endpoint);
}

export async function cancelPush(settings: Settings): Promise<void> {
	const endpoint = localStorage.getItem(endpointKey);
	if (!endpoint) return;
	localStorage.setItem(pendingCancelKey, endpoint);
	await retryPushCancellation(settings);
}

export async function retryPushCancellation(settings: Settings): Promise<void> {
	const endpoint = localStorage.getItem(pendingCancelKey);
	if (!endpoint) return;
	await request(settings, "schedule", "DELETE", { endpoint });
	localStorage.removeItem(pendingCancelKey);
}

export function buildPushTimes(finalTime: Date, now = new Date()): PushMessage[] {
	return [120, 60, 30, 10, 5, 0].map(minutes => {
		const at = new Date(finalTime.getTime() - minutes * 60_000);
		const message = minutes === 0
			? "Wochenlimit erreicht. Bitte jetzt ausstempeln."
			: `Noch ${minutes < 60 ? `${minutes} Minuten` : `${minutes / 60} ${minutes === 60 ? "Stunde" : "Stunden"}`} bis zur letzten Stempelzeit.`;
		return { at: at.toISOString(), message };
	}).filter(item => new Date(item.at) > now);
}
