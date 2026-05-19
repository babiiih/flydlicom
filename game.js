const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 588;
const STORAGE_KEY = "flybird-best-score";
const birdSprites = Array.from({ length: 5 }, (_, index) => {
  const image = new Image();
  image.src = `./assets/bird-frame-${index}.png`;
  return image;
});
const backgroundLogo = new Image();
backgroundLogo.src = "./assets/background-logo.png";
const game = {
  status: "ready",
  frame: 0,
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  speed: 2.65,
  gravity: 0.38,
  jump: -7.25,
  pipes: [],
  clouds: [
    { x: 12, y: 394, s: 1.1 },
    { x: 142, y: 410, s: 0.9 },
    { x: 246, y: 389, s: 1.15 },
    { x: 347, y: 401, s: 0.95 },
  ],
  bird: {
    x: 128,
    y: 270,
    r: 34,
    width: 116,
    height: 102,
    vy: 0,
    rotation: 0,
  },
};

bestEl.textContent = game.best;

function resetGame() {
  game.status = "ready";
  game.frame = 0;
  game.score = 0;
  game.speed = 2.65;
  game.pipes = [];
  game.bird.x = 128;
  game.bird.y = 270;
  game.bird.vy = 0;
  game.bird.rotation = 0;
  scoreEl.textContent = "0";
  overlay.classList.remove("hidden");
  overlay.querySelector("h2").textContent = "Flybird";
  overlayText.textContent = "Klik / tap / spasi untuk mulai terbang.";
  startButton.textContent = "Mulai";
  pauseButton.textContent = "Pause";
}

function startGame() {
  if (game.status === "playing") return;
  if (game.status === "gameover" || game.status === "ready") {
    game.frame = 0;
    game.score = 0;
    game.speed = 2.65;
    game.pipes = [];
    game.bird.y = 270;
    game.bird.vy = 0;
    scoreEl.textContent = "0";
  }
  game.status = "playing";
  overlay.classList.add("hidden");
  pauseButton.textContent = "Pause";
  flap();
}

function flap() {
  if (game.status === "ready" || game.status === "gameover") {
    startGame();
    return;
  }
  if (game.status !== "playing") return;
  game.bird.vy = game.jump;
}

function togglePause() {
  if (game.status === "playing") {
    game.status = "paused";
    overlay.classList.remove("hidden");
    overlay.querySelector("h2").textContent = "Pause";
    overlayText.textContent = "Tekan lanjut untuk meneruskan game.";
    startButton.textContent = "Lanjut";
    pauseButton.textContent = "Lanjut";
  } else if (game.status === "paused") {
    game.status = "playing";
    overlay.classList.add("hidden");
    pauseButton.textContent = "Pause";
  }
}

function spawnPipe() {
  const minTop = 96;
  const maxTop = 326;
  const gap = Math.max(162, 188 - Math.floor(game.score / 5) * 4);
  const topHeight = minTop + Math.random() * (maxTop - minTop);
  game.pipes.push({
    x: WIDTH + 40,
    top: topHeight,
    gap,
    width: 124,
    counted: false,
  });
}

function gameOver() {
  game.status = "gameover";
  game.best = Math.max(game.best, game.score);
  localStorage.setItem(STORAGE_KEY, String(game.best));
  bestEl.textContent = game.best;
  overlay.classList.remove("hidden");
  overlay.querySelector("h2").textContent = "Game Over";
  overlayText.textContent = `Skor kamu ${game.score}. Klik restart untuk coba lagi.`;
  startButton.textContent = "Restart";
}

function update() {
  game.frame += 1;
  animateClouds();

  if (game.status !== "playing") return;

  if (game.frame % 104 === 0) spawnPipe();
  game.speed = Math.min(4.25, 2.65 + game.score * 0.035);

  const bird = game.bird;
  bird.vy += game.gravity;
  bird.y += bird.vy;
  bird.rotation = Math.max(-0.55, Math.min(1.1, bird.vy / 10));

  if (bird.y - bird.r < 0 || bird.y + bird.r > GROUND_Y) {
    gameOver();
    return;
  }

  for (const pipe of game.pipes) {
    pipe.x -= game.speed;
    if (!pipe.counted && pipe.x + pipe.width < bird.x - bird.r) {
      pipe.counted = true;
      game.score += 1;
      scoreEl.textContent = game.score;
    }
    if (hitsPipe(pipe)) {
      gameOver();
      return;
    }
  }

  game.pipes = game.pipes.filter((pipe) => pipe.x + pipe.width > -30);
}

function hitsPipe(pipe) {
  const bird = game.bird;
  const birdLeft = bird.x - 42;
  const birdRight = bird.x + 40;
  const birdTop = bird.y - 32;
  const birdBottom = bird.y + 34;
  const pipeLeft = pipe.x;
  const pipeRight = pipe.x + pipe.width;

  if (birdRight < pipeLeft || birdLeft > pipeRight) return false;

  const inGap = birdTop > pipe.top && birdBottom < pipe.top + pipe.gap;
  return !inGap;
}

function animateClouds() {
  for (const cloud of game.clouds) {
    cloud.x -= 0.16 * cloud.s;
    if (cloud.x < -130) cloud.x = WIDTH + 42;
  }
}

function draw() {
  drawSky();
  drawCity();
  drawCloudBank();
  drawPipes();
  drawGround();
  drawBird();
  requestAnimationFrame(loop);
}

function loop() {
  update();
  draw();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  gradient.addColorStop(0, "#1cb7f5");
  gradient.addColorStop(0.58, "#25a7df");
  gradient.addColorStop(1, "#a3eff9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBackgroundLogo();
}

function drawBackgroundLogo() {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.translate(WIDTH / 2, 194);
  ctx.rotate(-0.08);
  if (backgroundLogo.complete && backgroundLogo.naturalWidth > 0) {
    ctx.drawImage(backgroundLogo, -150, -96, 300, 196);
  } else {
    drawVectorLogo(0, 0, 1.15);
  }
  ctx.restore();
}

function drawVectorLogo(cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-92, -4);
  ctx.quadraticCurveTo(-58, -62, 2, -62);
  ctx.lineTo(104, -62);
  ctx.quadraticCurveTo(120, -62, 118, -50);
  ctx.lineTo(30, -14);
  ctx.lineTo(0, -38);
  ctx.lineTo(-58, 19);
  ctx.lineTo(-78, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(92, 4);
  ctx.quadraticCurveTo(58, 62, -2, 62);
  ctx.lineTo(-104, 62);
  ctx.quadraticCurveTo(-120, 62, -118, 50);
  ctx.lineTo(-30, 14);
  ctx.lineTo(0, 38);
  ctx.lineTo(58, -19);
  ctx.lineTo(78, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-22, -22, 44, 44);
  ctx.restore();
}

function drawCity() {
  ctx.save();
  ctx.globalAlpha = 0.42;
  const buildings = [
    [0, 455, 23, 112],
    [31, 476, 36, 91],
    [78, 443, 42, 124],
    [137, 466, 31, 101],
    [187, 448, 48, 119],
    [257, 438, 34, 129],
    [310, 460, 45, 107],
    [371, 449, 41, 118],
  ];
  for (const [x, y, w, h] of buildings) {
    ctx.fillStyle = "#4ea4c7";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#b6e7f2";
    for (let yy = y + 12; yy < y + h - 8; yy += 19) {
      for (let xx = x + 7; xx < x + w - 7; xx += 14) {
        ctx.fillRect(xx, yy, 7, 6);
      }
    }
  }
  ctx.restore();
}

function drawCloudBank() {
  ctx.fillStyle = "#e9fbff";
  for (const cloud of game.clouds) {
    drawCloud(cloud.x, cloud.y, cloud.s);
  }
  ctx.fillStyle = "#bff2fb";
  ctx.fillRect(0, 418, WIDTH, 20);
}

function drawCloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x + 8 * s, y + 22 * s, 28 * s, Math.PI, Math.PI * 2);
  ctx.arc(x + 38 * s, y + 10 * s, 34 * s, Math.PI, Math.PI * 2);
  ctx.arc(x + 78 * s, y + 18 * s, 31 * s, Math.PI, Math.PI * 2);
  ctx.arc(x + 109 * s, y + 27 * s, 22 * s, Math.PI, Math.PI * 2);
  ctx.lineTo(x + 132 * s, y + 50 * s);
  ctx.lineTo(x - 20 * s, y + 50 * s);
  ctx.closePath();
  ctx.fill();
}

function drawPipes() {
  if (game.pipes.length === 0 && game.status !== "playing") {
    drawPipe(26, 0, 124, 154, true);
    drawPipe(26, 356, 124, GROUND_Y - 356, false);
    drawPipe(WIDTH - 134, 0, 124, 326, true);
    drawPipe(WIDTH - 110, 490, 92, GROUND_Y - 490, false);
    return;
  }

  for (const pipe of game.pipes) {
    drawPipe(pipe.x, 0, pipe.width, pipe.top, true);
    drawPipe(pipe.x, pipe.top + pipe.gap, pipe.width, GROUND_Y - pipe.top - pipe.gap, false);
  }
}

function drawPipe(x, y, width, height, upsideDown) {
  const capH = 60;
  const capY = upsideDown ? y + height - capH : y;
  const bodyY = upsideDown ? y : y + capH;
  const bodyH = Math.max(0, height - capH);
  const bodyW = 86;
  const bodyX = x + (width - bodyW) / 2;

  ctx.fillStyle = "#02050c";
  ctx.fillRect(bodyX - 6, bodyY - 4, bodyW + 12, bodyH + 8);

  const bodyGradient = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  bodyGradient.addColorStop(0, "#061665");
  bodyGradient.addColorStop(0.14, "#0e38d4");
  bodyGradient.addColorStop(0.25, "#58a4ff");
  bodyGradient.addColorStop(0.34, "#a6d2ff");
  bodyGradient.addColorStop(0.43, "#245eff");
  bodyGradient.addColorStop(0.76, "#0927b2");
  bodyGradient.addColorStop(1, "#021053");
  ctx.fillStyle = bodyGradient;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillRect(bodyX + 13, bodyY, 7, bodyH);
  ctx.fillStyle = "rgba(4,14,81,0.54)";
  ctx.fillRect(bodyX + bodyW - 13, bodyY, 7, bodyH);

  drawPipeCap(x, capY, width, capH);
  drawPipeLogo(x + width / 2, capY + capH / 2);
}

function drawPipeCap(x, y, width, height) {
  ctx.fillStyle = "#02050c";
  ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
  const capGradient = ctx.createLinearGradient(x, 0, x + width, 0);
  capGradient.addColorStop(0, "#071567");
  capGradient.addColorStop(0.16, "#0b39d5");
  capGradient.addColorStop(0.31, "#73b6ff");
  capGradient.addColorStop(0.42, "#1d5fff");
  capGradient.addColorStop(0.78, "#0929b8");
  capGradient.addColorStop(1, "#03145d");
  ctx.fillStyle = capGradient;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillRect(x + 13, y + 8, 7, height - 16);
  ctx.fillStyle = "rgba(1,8,51,0.46)";
  ctx.fillRect(x + width - 17, y + 8, 8, height - 16);
}

function drawPipeLogo(cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15);
  ctx.fillStyle = "#f8fdff";
  ctx.beginPath();
  ctx.moveTo(-25, 2);
  ctx.quadraticCurveTo(-7, -17, 25, -10);
  ctx.quadraticCurveTo(6, 12, -25, 2);
  ctx.fill();
  ctx.strokeStyle = "#d4ecff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#1746db";
  ctx.beginPath();
  ctx.arc(3, -2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#082d11";
  ctx.fillRect(0, GROUND_Y - 8, WIDTH, 10);
  ctx.fillStyle = "#7cfc1d";
  ctx.fillRect(0, GROUND_Y, WIDTH, 18);
  ctx.fillStyle = "#36ad0f";
  for (let x = -((game.frame * game.speed) % 32); x < WIDTH + 32; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + 22, GROUND_Y);
    ctx.lineTo(x + 8, GROUND_Y + 18);
    ctx.lineTo(x - 14, GROUND_Y + 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#f5d04e";
  ctx.fillRect(0, GROUND_Y + 18, WIDTH, 20);
  ctx.fillStyle = "#754b14";
  ctx.fillRect(0, GROUND_Y + 38, WIDTH, 14);
}

function drawBird() {
  const { x, y, rotation, width, height } = game.bird;
  const frameIndex = game.status === "playing" ? Math.floor(game.frame / 7) % birdSprites.length : 0;
  const sprite = birdSprites[frameIndex];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(-10, 47, 38, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprite.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
  } else {
    drawFallbackBird(width, height);
  }

  ctx.restore();
}

function drawFallbackBird(width, height) {
  ctx.fillStyle = "#3be5df";
  ctx.fillRect(-width / 2, -height / 6, width * 0.68, height * 0.4);
  ctx.fillStyle = "#0e55ff";
  ctx.fillRect(-width * 0.1, -height * 0.35, width * 0.42, height * 0.42);
  ctx.fillStyle = "#fff";
  ctx.fillRect(-width * 0.44, -height * 0.34, width * 0.58, height * 0.16);
  ctx.fillStyle = "#ffa424";
  ctx.fillRect(width * 0.22, -height * 0.05, width * 0.25, height * 0.11);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", resetGame);
pauseButton.addEventListener("click", togglePause);
canvas.addEventListener("pointerdown", flap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
  if (event.code === "KeyP") togglePause();
});

resetGame();
loop();
