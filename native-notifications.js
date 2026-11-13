const STORAGE_KEY = "gama-finance-family-v2";
const IDS_KEY = "gama-finance-notification-ids";
const OVERDUE_KEY = "gama-finance-overdue-notified";
const REMINDERS = [7, 3, 1, 0];

const isAndroidApp = () => Boolean(window.Capacitor?.isNativePlatform?.());
const localDate = (value, offset = 0) => {
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day + offset, 9, 0, 0, 0);
  return date;
};
const dateKey = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const hashId = value => {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % 2000000000 + 1;
};
const readProfiles = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.profiles?.length) return saved.profiles;
  } catch {}
  return [];
};
const collectItems = () => {
  const items = [];
  for (const profile of readProfiles()) {
    const owner = profile.name || "Família";
    const data = profile.data || {};
    for (const bill of Array.isArray(data.bills) ? data.bills : []) {
      if (bill.status === "paid" || !bill.due || !bill.id) continue;
      items.push({ id: String(bill.id), owner, name: bill.name || "Conta", amount: bill.amount, due: bill.due, kind: "Conta" });
    }
    for (const card of Array.isArray(data.cards) ? data.cards : []) {
      if (card.invoiceStatus === "paid" || !card.invoiceDue || !card.id || !(Number(card.invoiceAmount) > 0)) continue;
      const kind = card.productType === "loan" ? "Parcela" : card.productType === "wallet" ? "Cobrança" : "Fatura";
      items.push({ id: String(card.id), owner, name: card.name || "Crédito", amount: card.invoiceAmount, due: card.invoiceDue, kind });
    }
  }
  return items;
};
const setStatus = message => {
  const node = document.getElementById("dueNotificationStatus");
  if (node) node.textContent = message;
};
let pluginPromise;
const getPlugin = async () => {
  if (!pluginPromise) pluginPromise = import("@capacitor/local-notifications").then(module => module.LocalNotifications);
  return pluginPromise;
};
const scheduleReminders = async () => {
  if (!isAndroidApp()) return;
  const plugin = await getPlugin();
  const permission = await plugin.checkPermissions();
  if (permission.display !== "granted") return;
  const previous = JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
  if (previous.length) await plugin.cancel({ notifications: previous.map(id => ({ id })) });
  const alreadyNotified = new Set(JSON.parse(localStorage.getItem(OVERDUE_KEY) || "[]"));
  const now = new Date();
  const notifications = [];
  const nextIds = [];
  for (const item of collectItems()) {
    const due = new Date(item.due + "T00:00:00");
    if (Number.isNaN(due.getTime())) continue;
    const overdueDays = Math.floor((new Date(dateKey(now) + "T00:00:00") - due) / 86400000);
    const overdueKey = item.id + "|" + item.due;
    if (overdueDays >= 1) {
      if (!alreadyNotified.has(overdueKey)) {
        const id = hashId(overdueKey + "|overdue");
        notifications.push({
          id, title: "Vencimento em atraso",
          body: item.name + " — " + item.kind.toLowerCase() + " vencida há " + overdueDays + " dia(s). Valor: " + Number(item.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + ".",
          schedule: { at: new Date(Date.now() + 60000), allowWhileIdle: true },
          extra: { gamaFinanceReminder: true, itemId: item.id, due: item.due, owner: item.owner }
        });
        nextIds.push(id);
        alreadyNotified.add(overdueKey);
      }
      continue;
    }
    for (const days of REMINDERS) {
      const at = localDate(item.due, -days);
      if (at <= now) {
        if (days === 0 && dateKey(now) === item.due) at.setTime(Date.now() + 60000);
        else continue;
      }
      const id = hashId(item.id + "|" + item.due + "|" + days);
      const when = days === 0 ? "vence hoje" : "vence em " + days + " dia(s)";
      notifications.push({
        id,
        title: days === 0 ? "Vencimento hoje" : "Vencimento se aproximando",
        body: item.name + " — " + when + ". Valor: " + Number(item.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + ".",
        schedule: { at, allowWhileIdle: true },
        extra: { gamaFinanceReminder: true, itemId: item.id, due: item.due, owner: item.owner }
      });
      nextIds.push(id);
    }
    const overdueAt = localDate(item.due, 1);
    if (overdueAt > now) {
      const id = hashId(item.id + "|" + item.due + "|overdue");
      notifications.push({
        id, title: "Conta vencida",
        body: item.name + " continua pendente. Valor: " + Number(item.amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + ".",
        schedule: { at: overdueAt, allowWhileIdle: true },
        extra: { gamaFinanceReminder: true, itemId: item.id, due: item.due, owner: item.owner, overdue: true }
      });
      nextIds.push(id);
    }
  }
  if (notifications.length) await plugin.schedule({ notifications });
  localStorage.setItem(IDS_KEY, JSON.stringify(nextIds));
  localStorage.setItem(OVERDUE_KEY, JSON.stringify([...alreadyNotified]));
  setStatus("Notificações ativadas neste celular. " + notifications.length + " alerta(s) agendado(s).");
};
const enable = async () => {
  if (!isAndroidApp()) {
    setStatus("A ativação de alertas em segundo plano está disponível no aplicativo Android instalado.");
    return;
  }
  try {
    const plugin = await getPlugin();
    let permission = await plugin.checkPermissions();
    if (permission.display !== "granted") permission = await plugin.requestPermissions();
    if (permission.display !== "granted") {
      setStatus("Permissão de notificações não concedida. Ative-a nas configurações do Android.");
      return;
    }
    await scheduleReminders();
  } catch (error) {
    setStatus("Não foi possível ativar: " + (error?.message || "verifique a versão instalada do aplicativo."));
  }
};
window.GamaFinanceNotifications = { enable, refresh: scheduleReminders };
document.getElementById("enableDueNotifications")?.addEventListener("click", enable);
window.addEventListener("gama-finance-state-updated", scheduleReminders);
window.addEventListener("focus", scheduleReminders);
document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleReminders(); });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleReminders, { once: true });
else scheduleReminders();
