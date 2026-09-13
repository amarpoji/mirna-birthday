const gameScreen = document.querySelector("#gameScreen");
const birthdayPage = document.querySelector("#birthdayPage");
const gameCanvas = document.querySelector("#gameCanvas");
const gameOverlay = document.querySelector("#gameOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startGameBtn = document.querySelector("#startGameBtn");
const scoreText = document.querySelector("#score");
const bestScoreText = document.querySelector("#bestScore");
const targetScoreText = document.querySelector("#targetScore");
const confettiLayer = document.querySelector("#confettiLayer");
const toast = document.querySelector("#toast");
const giftStep = document.querySelector("#giftStep");
const cakeStep = document.querySelector("#cakeStep");
const finalStep = document.querySelector("#finalStep");
const openGiftBtn = document.querySelector("#openGiftBtn");
const nextWishBtn = document.querySelector("#nextWishBtn");

const confettiColors = ["#f5c7c7", "#a43046", "#d7a84c", "#9dc7d8", "#315247", "#fffaf5"];
const targetScore = 10;
let toastTimer;
let animationId;
let bestScore = Number(localStorage.getItem("mirnaBestScore") || 0);
let score = 0;
let running = false;
let unlocked = bestScore >= targetScore;
let lastTime = 0;
let pipeTimer = 0;
const ctx = gameCanvas.getContext("2d");
const mirnaImage = new Image();
mirnaImage.src = "assets/flower-seat.png";

const player = {
  x: 92,
  y: 260,
  radius: 31,
  velocity: 0
};

const game = {
  gravity: 0.00105,
  flap: -0.42,
  pipeSpeed: 0.15,
  pipeGap: 205,
  pipeWidth: 76,
  spawnEvery: 1650,
  ground: 64,
  pipes: []
};

targetScoreText.textContent = targetScore;
bestScoreText.textContent = bestScore;

if (unlocked) {
  overlayTitle.textContent = "Unlocked!";
  overlayText.textContent = "You reached the birthday surprise. 生日快乐!";
  startGameBtn.textContent = "Open the wish page";
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 3400);
}

function fireConfetti(amount = 70) {
  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDelay = `${Math.random() * 260}ms`;
    piece.style.setProperty("--drift", `${Math.random() * 220 - 110}px`);
    confettiLayer.append(piece);
    window.setTimeout(() => piece.remove(), 1700);
  }
}

function resetGame() {
  score = 0;
  scoreText.textContent = score;
  player.y = 260;
  player.velocity = 0;
  game.pipes = [];
  pipeTimer = 0;
  lastTime = performance.now();
}

function startGame() {
  if (unlocked) {
    showBirthdayPage();
    return;
  }

  resetGame();
  player.velocity = game.flap;
  running = true;
  gameOverlay.classList.add("hidden");
  window.cancelAnimationFrame(animationId);
  animationId = window.requestAnimationFrame(updateGame);
}

function flap() {
  if (!running) {
    startGame();
    return;
  }

  player.velocity = game.flap;
}

function spawnPipe() {
  const margin = 92;
  const maxTop = gameCanvas.height - game.ground - game.pipeGap - margin;
  const topHeight = margin + Math.random() * Math.max(20, maxTop - margin);
  game.pipes.push({
    x: gameCanvas.width + game.pipeWidth,
    topHeight,
    passed: false
  });
}

function updateGame(now) {
  const delta = Math.min(now - lastTime, 32);
  lastTime = now;
  pipeTimer += delta;

  if (pipeTimer >= game.spawnEvery) {
    spawnPipe();
    pipeTimer = 0;
  }

  player.velocity += game.gravity * delta;
  player.y += player.velocity * delta;

  game.pipes.forEach((pipe) => {
    pipe.x -= game.pipeSpeed * delta;
    if (!pipe.passed && pipe.x + game.pipeWidth < player.x - player.radius) {
      pipe.passed = true;
      score += 1;
      scoreText.textContent = score;
      if (score > bestScore) {
        bestScore = score;
        bestScoreText.textContent = bestScore;
        localStorage.setItem("mirnaBestScore", String(bestScore));
      }
      if (score >= targetScore) {
        unlockWishPage();
      }
    }
  });

  game.pipes = game.pipes.filter((pipe) => pipe.x > -game.pipeWidth);

  drawGame();

  if (running && hasCollision()) {
    endGame();
    return;
  }

  if (running) {
    animationId = window.requestAnimationFrame(updateGame);
  }
}

function hasCollision() {
  const ceilingHit = player.y - player.radius <= 0;
  const groundHit = player.y + player.radius >= gameCanvas.height - game.ground;

  if (ceilingHit || groundHit) {
    return true;
  }

  return game.pipes.some((pipe) => {
    const inPipeX = player.x + player.radius > pipe.x && player.x - player.radius < pipe.x + game.pipeWidth;
    const lowerPipeTop = pipe.topHeight + game.pipeGap;
    const inPipeY = player.y - player.radius < pipe.topHeight || player.y + player.radius > lowerPipeTop;
    return inPipeX && inPipeY;
  });
}

function endGame() {
  running = false;
  window.cancelAnimationFrame(animationId);
  overlayTitle.textContent = "Try again";
  overlayText.textContent = `You scored ${score}. Reach ${targetScore} to unlock the birthday wish.`;
  startGameBtn.textContent = "Play again";
  gameOverlay.classList.remove("hidden");
}

function unlockWishPage() {
  running = false;
  unlocked = true;
  window.cancelAnimationFrame(animationId);
  overlayTitle.textContent = "Unlocked!";
  overlayText.textContent = "You reached the birthday surprise. 生日快乐!";
  startGameBtn.textContent = "Open the wish page";
  gameOverlay.classList.remove("hidden");
  fireConfetti(120);
}

function showBirthdayPage() {
  birthdayPage.classList.remove("locked");
  birthdayPage.classList.add("unlocked");
  gameScreen.style.display = "none";
  giftStep.classList.add("active");
  cakeStep.classList.remove("active", "blown");
  finalStep.classList.remove("active");
  showToast("Birthday surprise unlocked.");
  birthdayPage.scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawGame() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  drawSky();
  drawPipes();
  drawPlayer();
  drawGround();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, gameCanvas.height);
  gradient.addColorStop(0, "#bfe8f0");
  gradient.addColorStop(0.58, "#fff2d7");
  gradient.addColorStop(1, "#f7c9ca");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  for (let index = 0; index < 5; index += 1) {
    const x = (index * 112 + performance.now() * 0.012) % 540 - 80;
    const y = 72 + index * 44;
    ctx.beginPath();
    ctx.ellipse(x, y, 44, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 28, y + 4, 34, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipes() {
  game.pipes.forEach((pipe) => {
    const lowerY = pipe.topHeight + game.pipeGap;
    drawFlowerGate(pipe.x, 0, pipe.topHeight, true);
    drawFlowerGate(pipe.x, lowerY, gameCanvas.height - game.ground - lowerY, false);
  });
}

function drawFlowerGate(x, y, height, isTop) {
  ctx.fillStyle = "#315247";
  ctx.fillRect(x, y, game.pipeWidth, height);
  ctx.fillStyle = "#243f37";
  ctx.fillRect(x + 8, y, game.pipeWidth - 16, height);

  const capY = isTop ? y + height - 18 : y;
  ctx.fillStyle = "#a43046";
  ctx.fillRect(x - 8, capY, game.pipeWidth + 16, 18);

  ctx.fillStyle = "#f5c7c7";
  for (let petal = 0; petal < 5; petal += 1) {
    const flowerX = x + 16 + petal * 13;
    const flowerY = isTop ? capY - 9 : capY + 27;
    ctx.beginPath();
    ctx.arc(flowerX, flowerY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.velocity * 0.42);
  ctx.fillStyle = "rgba(164, 48, 70, 0.24)";
  ctx.beginPath();
  ctx.ellipse(-4, 7, player.radius + 8, player.radius + 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.clip();

  if (mirnaImage.complete) {
    ctx.drawImage(mirnaImage, 210, 500, 170, 170, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
  } else {
    ctx.fillStyle = "#f5c7c7";
    ctx.fillRect(-player.radius, -player.radius, player.radius * 2, player.radius * 2);
  }

  ctx.restore();

  ctx.strokeStyle = "#fffdf8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGround() {
  const groundY = gameCanvas.height - game.ground;
  ctx.fillStyle = "#315247";
  ctx.fillRect(0, groundY, gameCanvas.width, game.ground);
  ctx.fillStyle = "#d7a84c";
  ctx.fillRect(0, groundY, gameCanvas.width, 8);
  ctx.fillStyle = "rgba(255, 250, 245, 0.3)";
  for (let x = -20; x < gameCanvas.width + 20; x += 34) {
    ctx.beginPath();
    ctx.arc(x + ((performance.now() * 0.03) % 34), groundY + 28, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

startGameBtn.addEventListener("click", startGame);
gameCanvas.addEventListener("click", flap);
gameCanvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  flap();
}, { passive: false });

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !birthdayPage.classList.contains("unlocked")) {
    event.preventDefault();
    flap();
  }
});

mirnaImage.addEventListener("load", drawGame);
drawGame();

openGiftBtn.addEventListener("click", () => {
  giftStep.classList.add("opening");
  fireConfetti(42);
  window.setTimeout(() => {
    giftStep.classList.remove("active", "opening");
    cakeStep.classList.add("active");
  }, 650);
});

nextWishBtn.addEventListener("click", () => {
  cakeStep.classList.add("blown");
  window.setTimeout(() => {
    cakeStep.classList.remove("active");
    finalStep.classList.add("active");
    fireConfetti(70);
  }, 720);
});
