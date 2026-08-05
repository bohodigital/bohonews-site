interface CelebrationOptions {
  title?: string;
  message: string;
}

export function showGameCelebration({ title = "You did it!", message }: CelebrationOptions): void {
  document.querySelector("[data-game-celebration]")?.remove();
  const celebration = document.createElement("section");
  celebration.className = "game-celebration";
  celebration.dataset.gameCelebration = "true";
  celebration.setAttribute("role", "dialog");
  celebration.setAttribute("aria-modal", "false");
  celebration.setAttribute("aria-labelledby", "game-celebration-title");

  const confetti = document.createElement("div");
  confetti.className = "game-celebration__confetti";
  confetti.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 42; index++) {
    const piece = document.createElement("i");
    piece.style.setProperty("--confetti-x", `${(index * 37) % 100}%`);
    piece.style.setProperty("--confetti-delay", `${(index % 9) * -0.11}s`);
    piece.style.setProperty("--confetti-duration", `${1.7 + (index % 7) * 0.16}s`);
    piece.style.setProperty("--confetti-drift", `${((index * 23) % 80) - 40}px`);
    piece.style.setProperty("--confetti-color", ["#a52b3a", "#f1c75b", "#1f6b4f", "#80b3d7", "#a98bc4"][index % 5]);
    confetti.append(piece);
  }

  const card = document.createElement("div");
  card.className = "game-celebration__card";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Officially impressive";
  const heading = document.createElement("h2");
  heading.id = "game-celebration-title";
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.textContent = message;
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "game-button";
  dismiss.textContent = "Take the victory lap";
  dismiss.addEventListener("click", () => celebration.remove());
  card.append(eyebrow, heading, copy, dismiss);
  celebration.append(confetti, card);
  document.body.append(celebration);
  dismiss.focus({ preventScroll: true });
}
