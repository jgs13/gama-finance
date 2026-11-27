import { App } from "@capacitor/app";

App.addListener("backButton", ({ canGoBack }) => {
  const assistant = document.querySelector("#assistantPanel");
  if (assistant && !assistant.hidden) {
    document.querySelector("#assistantClose")?.click();
    return;
  }

  const dialog = document.querySelector("#recordDialog");
  if (dialog?.open) {
    dialog.close();
    return;
  }

  const auth = document.querySelector("#authGate");
  if (auth && !auth.hidden) {
    auth.hidden = true;
    return;
  }

  const workspace = document.querySelector("#workspace");
  if (workspace && !workspace.hidden) {
    const active = document.querySelector(".screen.active");
    if (active && active.id !== "screen-overview") {
      document.querySelector('[data-view="overview"]')?.click();
      return;
    }
    document.querySelector("#backHome")?.click();
    return;
  }

  if (canGoBack) {
    window.history.back();
    return;
  }

  App.minimizeApp();
});
