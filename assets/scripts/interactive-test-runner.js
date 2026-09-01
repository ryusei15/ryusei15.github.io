(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  document.documentElement.classList.add("js-enabled");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  $$('[data-copy]').forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent);
        showToast("クリップボードにコピーしました");
      } catch {
        showToast("この環境ではコピーできませんでした");
      }
    });
  });

  const environment = $("#environment-data");
  if (environment) {
    const updateEnvironment = () => {
      const values = {
        viewport: `${window.innerWidth} × ${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        online: navigator.onLine ? "online" : "offline",
        language: navigator.language,
        colorScheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference"
      };
      Object.entries(values).forEach(([key, value]) => {
        const node = $(`[data-env="${key}"]`, environment);
        if (node) node.textContent = value;
      });
    };
    updateEnvironment();
    window.addEventListener("resize", updateEnvironment, { passive: true });
    window.addEventListener("online", updateEnvironment);
    window.addEventListener("offline", updateEnvironment);
  }

  const testForm = $("#test-form");
  if (testForm) {
    const output = $("#form-output");
    const updateOutput = () => {
      const values = Object.fromEntries(new FormData(testForm));
      output.textContent = JSON.stringify(values, null, 2);
    };
    testForm.addEventListener("input", updateOutput);
    testForm.addEventListener("change", updateOutput);
    testForm.addEventListener("reset", () => window.setTimeout(updateOutput));
    testForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!testForm.reportValidity()) return;
      updateOutput();
      showToast("検証用フォームの送信イベントを捕捉しました");
    });
    updateOutput();
  }

  const eventArea = $("#event-test-area");
  const eventLog = $("#event-log");
  if (eventArea && eventLog) {
    const record = (event) => {
      const item = document.createElement("li");
      const time = document.createElement("time");
      time.dateTime = new Date().toISOString();
      time.textContent = new Date().toLocaleTimeString();
      const target = event.target.closest("[data-event-name]");
      item.append(time, document.createTextNode(`${event.type} → ${target?.dataset.eventName || event.target.tagName.toLowerCase()}`));
      eventLog.prepend(item);
      while (eventLog.children.length > 30) eventLog.lastElementChild.remove();
    };
    ["click", "dblclick", "pointerenter", "pointerleave", "focusin", "focusout", "keydown", "input", "change"].forEach((type) => {
      eventArea.addEventListener(type, record, true);
    });
    $("#clear-log")?.addEventListener("click", () => eventLog.replaceChildren());
  }

  const draggable = $("#drag-source");
  const dropZone = $("#drop-zone");
  if (draggable && dropZone) {
    draggable.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", draggable.textContent.trim());
      event.dataTransfer.effectAllowed = "copy";
    });
    ["dragenter", "dragover"].forEach((type) => dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-over");
    }));
    ["dragleave", "drop"].forEach((type) => dropZone.addEventListener(type, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-over");
      if (type === "drop") {
        dropZone.textContent = `受け取り: ${event.dataTransfer.getData("text/plain")}`;
        showToast("dropイベントを検出しました");
      }
    }));
  }

  const dialog = $("#test-dialog");
  $("#open-dialog")?.addEventListener("click", () => dialog?.showModal());
  $("#close-dialog")?.addEventListener("click", () => dialog?.close("button"));
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("backdrop");
  });
})();
