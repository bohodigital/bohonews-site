(() => {
  const key = "bohonews-theme";
  const choices = new Set(["system","light","dark"]);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const stored = choices.has(localStorage.getItem(key)) ? localStorage.getItem(key) : "system";

  function resolved(choice) {
    return choice === "system" ? (media.matches ? "dark" : "light") : choice;
  }

  function apply(choice) {
    const selected = choices.has(choice) ? choice : "system";
    const active = resolved(selected);
    document.documentElement.dataset.themeChoice = selected;
    document.documentElement.dataset.theme = active;
    document.documentElement.style.colorScheme = active;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = active === "dark" ? "#111212" : "#f3efe6";
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === selected));
    });
  }

  apply(stored);
  media.addEventListener("change", () => {
    if ((localStorage.getItem(key) || "system") === "system") apply("system");
  });
  window.addEventListener("DOMContentLoaded", () => {
    const date = document.querySelector("#edition-date");
    if (date) {
      const now = new Date();
      date.dateTime = now.toISOString().slice(0,10);
      date.textContent = new Intl.DateTimeFormat("en-US", {
        weekday:"long",month:"long",day:"numeric",year:"numeric"
      }).format(now);
    }
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.setItem(key,button.dataset.themeChoice);
        apply(button.dataset.themeChoice);
      });
    });
    apply(localStorage.getItem(key) || "system");
  });
})();
