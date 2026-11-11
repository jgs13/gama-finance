import { App } from "@capacitor/app";

App.addListener("backButton", ({ canGoBack }) => {
  const modalOpen = Boolean(document.querySelector("#modal.open"));
  const route = window.history.state?.gamaFinanceRoute;
  const awayFromHome = Boolean(route && (route.scope !== "home" || route.view !== "home"));

  if (modalOpen || awayFromHome || canGoBack) {
    window.history.back();
    return;
  }

  App.minimizeApp();
});
