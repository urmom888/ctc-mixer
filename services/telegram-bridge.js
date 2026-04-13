/**
 * Telegram Mini App Bridge
 * Enables communication between the mixer frontend and Telegram Bot via WebApp API.
 */
export function isTelegramWebApp() {
    return !!window.Telegram?.WebApp?.initData;
}
export function getTelegramWebApp() {
    return window.Telegram?.WebApp ?? null;
}
export function initTelegramWebApp() {
    const tg = getTelegramWebApp();
    if (!tg)
        return;
    tg.ready();
    tg.expand();
    // Apply Telegram theme if in dark mode
    if (tg.colorScheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }
}
export function sendToTelegram(msg) {
    const tg = getTelegramWebApp();
    if (!tg)
        return;
    try {
        tg.sendData(JSON.stringify(msg));
    }
    catch {
        // sendData may fail if not opened from a bot keyboard button
        console.warn("Telegram sendData failed — not in bot context");
    }
}
export function getTelegramUser() {
    const tg = getTelegramWebApp();
    if (!tg?.initDataUnsafe?.user)
        return null;
    const u = tg.initDataUnsafe.user;
    return { id: u.id, name: u.first_name };
}
export function getStartParam() {
    return getTelegramWebApp()?.initDataUnsafe?.start_param ?? null;
}
export function closeTelegramApp() {
    getTelegramWebApp()?.close();
}
