let animationId;
let loopActivo = false; // ✅ <--- Agrega esta línea si no la tienes
let spawnTimeoutId = null;
let velocidadEnemigoBase = 2;
const game = document.getElementById("game");
const player = document.getElementById("player");
const sprite = document.getElementById("sprite");
const vidaBarra = document.getElementById("vidaBarra");
const mensajeFinal = document.getElementById("mensajeFinal");

// 🎵 Referencias de audio
const bgMusic = document.getElementById("bgMusic");
const soundJump = document.getElementById("soundJump");
const soundSlash = document.getElementById("soundSlash");
const soundDeath = document.getElementById("soundDeath");

let posX = (game.clientWidth - player.clientWidth) / 2;
let ultimaDireccion = "right";
let posY = 0;
let jumping = false;
let currentAction = "idle";
let health = 10;
let movingLeft = false;
let movingRight = false;
let gameOver = false;

function setSprite(action) {
  if (gameOver) return;
  if (currentAction === action) return;
  currentAction = action;

  // Guardar última dirección cuando se mueve
  if (action === "left") {
    ultimaDireccion = "left";
    sprite.src = "walk_left.gif";
  } else if (action === "right") {
    ultimaDireccion = "right";
    sprite.src = "walk_right.gif";
  } else if (action === "jump") {
    sprite.src = "jump.png";
  } else if (action === "dead") {
    sprite.src = "death.png";
  } else {
    // Quieto: mostrar idle mirando en la última dirección
    sprite.src = (ultimaDireccion === "left") ? "idle_left.png" : "idle.png";
  }
}


function updatePlayerPosition() {
  player.style.left = posX + "px";
  player.style.bottom = (40 + posY) + "px";
}

function moveLoop() {
  if (gameOver || loopActivo) return; // 🛑 Evita que arranquen múltiples loops
  loopActivo = true;

  function loopInterno() {
    if (gameOver) {
      loopActivo = false; // 🔴 Detenemos la bandera cuando el juego termina
      return;
    }

    const maxRight = game.clientWidth - player.clientWidth;

    if (movingLeft) {
      posX -= 6;
      if (posX < 0) posX = 0;
      if (!jumping) setSprite("left");
    } else if (movingRight) {
      posX += 6;
      if (posX > maxRight) posX = maxRight;
      if (!jumping) setSprite("right");
    } else {
      if (!jumping) setSprite("idle");
    }

    updatePlayerPosition();
    checkCollisions();

    animationId = requestAnimationFrame(loopInterno);
  }

  loopInterno(); // 🚀 Inicia el loop
}



moveLoop();

function jump() {
  if (jumping || gameOver) return;
  jumping = true;
  setSprite("jump");

  soundJump.currentTime = 0;
  soundJump.play();

  let up = setInterval(() => {
    posY += 12;
    updatePlayerPosition();
    if (posY >= 190) {
      clearInterval(up);
      let down = setInterval(() => {
        posY -= 6;
        if (posY <= 0) {
          posY = 0;
          jumping = false;
          clearInterval(down);
          if (movingLeft) setSprite("left");
          else if (movingRight) setSprite("right");
          else setSprite("idle");
        }
        updatePlayerPosition();
      }, 16);
    }
  }, 16);
}

let enemigosDerrotados = 0;

let highScore = localStorage.getItem("highScore") || 0;

const enemigosTexto = document.getElementById("enemigosTexto");

function slashAttack() {
  if (gameOver) return;

  const arma = document.createElement("div");
  arma.className = "laser";

  const offset = ultimaDireccion === "left" ? -10 : 90;
  arma.style.left = (posX + offset) + "px";
  arma.style.bottom = (40 + posY + 30) + "px";
  game.appendChild(arma);

  let x = posX + offset;
  const velocidad = ultimaDireccion === "left" ? -8 : 8;

  const intervalo = setInterval(() => {
    x += velocidad;
    arma.style.left = x + "px";

    const enemigos = document.querySelectorAll(".enemy");
    for (let enemy of enemigos) {
      if (enemy.dataset.dead === "false" && checkHit(arma, enemy)) {
        let hp = parseInt(enemy.dataset.hp);
        if (isNaN(hp)) hp = 1;

        hp -= 1;
        enemy.dataset.hp = hp;

        // Actualizar barra de vida visual
const hpMax = parseInt(enemy.dataset.hpMax);
const barra = enemy.querySelector(".enemy-health");
if (barra && hp >= 0) {
  const porcentaje = (hp / hpMax) * 100;
  barra.style.width = porcentaje + "%";
}
        if (hp <= 0) {
       enemy.dataset.dead = "true";
enemy.style.opacity = 0; // Aplica el desvanecimiento a todo el contenedor (imagen + barra)
enemigosDerrotados++;
// 🚀 Aumentar velocidad cada 6 enemigos
if (enemigosDerrotados % 6 === 0) {
  velocidadEnemigoBase += 0.5;
  if (velocidadEnemigoBase > 20) velocidadEnemigoBase = 10;

  console.log("Velocidad aumentada a:", velocidadEnemigoBase);
}
enemigosTexto.textContent = enemigosDerrotados;
setTimeout(() => enemy.remove(), 500);

        }

        clearInterval(intervalo); // Arma desaparece tras el primer impacto
        arma.remove();
        return;
      }
    }

    if (x < -50 || x > game.clientWidth + 50) {
      clearInterval(intervalo);
      arma.remove();
    }
  }, 16);

  soundSlash.currentTime = 0;
  soundSlash.play();
}


function checkHit(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return (
    r1.left < r2.right &&
    r1.right > r2.left &&
    r1.top < r2.bottom &&
    r1.bottom > r2.top
  );
}

function checkCollisions() {
  const playerRect = player.getBoundingClientRect();

  document.querySelectorAll(".enemy").forEach(enemy => {
    if (enemy.dataset.dead === "true") return;

    const enemyRect = enemy.getBoundingClientRect();

    if (
      playerRect.left < enemyRect.right &&
      playerRect.right > enemyRect.left &&
      playerRect.bottom > enemyRect.top &&
      playerRect.top < enemyRect.bottom
    ) {
    enemy.dataset.dead = "true";
enemy.style.opacity = 0; // ✅ Aplica a todo el enemigo (imagen + barra)
setTimeout(() => {
  if (enemy.parentNode) enemy.remove();
}, 500);


      health = Math.max(0, health - 1);
      vidaBarra.style.width = (health * 10) + "%";

      if (health <= 0) {
        endGame();
      }
    }
  });
}

function endGame() {
  gameOver = true;
  setSprite("dead");

  soundDeath.play();  // 🔊 Reproduce sonido de muerte
  bgMusic.pause();    // 🛑 Detiene música

  mensajeFinal.style.display = "block";
}

function spawnEnemy() {
  if (gameOver) return;

// ⚔️ Lista de enemigos
const enemigosConfig = [
  { imagen: "enemigo 1.gif", sonido: "enemySound1", vida: 2, altura: 100, ancho: 120 },
  { imagen: "enemy2.gif", sonido: "enemySound2", vida: 2, altura: 90, ancho: 80 },
  { imagen: "enemy3.png", sonido: "enemySound3", vida: 2, altura: 90, ancho: 90 },
  { imagen: "enemy4.gif", sonido: "enemySound4", vida: 2, altura: 130, ancho: 130 },
  { imagen: "enemy5.gif", sonido: "enemySound5", vida: 2, altura: 90, ancho:80 },
  { imagen: "enemy6.gif", sonido: "enemySound6", vida: 2, altura: 100, ancho:90 },
  { imagen: "Javier.gif", sonido: "enemySound7", vida: 4, altura: 100, ancho:100,   saltadorMovil: true    },
   { imagen: "vaquero.gif", sonido: "enemySound8", vida: 2, altura: 90, ancho:99,   saltadorMovil: true  },
  { imagen: "enemy9.gif", sonido: "enemySound9", vida: 3, altura: 105, ancho:90 },
    {imagen: "barril.gif", sonido: "enemySound10", vida: 3,altura: 100, ancho: 100,  caeDelCielo: true},
    { imagen: "calabaza.gif",sonido: "enemySoundDisparador", vida: 3,  altura: 110, ancho: 90,  disparador: true  },
     { imagen: "noob de lava.gif", sonido: "enemySound11", vida: 3, altura: 90, ancho:90 },
         {imagen: "auto2.png", sonido: "enemySound12", vida: 5,altura: 98, ancho: 90,}
];


  // 👾 Selección aleatoria
  const tipo = Math.floor(Math.random() * enemigosConfig.length);
  const config = enemigosConfig[tipo];

  const enemy = document.createElement("div");
enemy.classList.add("enemy");
enemy.dataset.dead = "false";
enemy.dataset.hp = config.vida;
enemy.dataset.hpMax = config.vida;

// Crear barra de vida
const barraVida = document.createElement("div");
barraVida.className = "enemy-health";
enemy.appendChild(barraVida);

  // Tamaño individual
enemy.style.width = config.ancho + "px";
enemy.style.height = config.altura + "px";
enemy.style.bottom = "40px";

  const img = document.createElement("img");
  img.src = config.imagen;
  img.style.width = "100%";
  img.style.height = "100%";
  enemy.appendChild(img);

  const fromLeft = Math.random() < 0.5;
  let x = fromLeft ? 0 : game.clientWidth - 50;
  enemy.style.left = x + "px";

  if (!fromLeft) enemy.classList.add("flipped");

  game.appendChild(enemy);
  if (config.saltadorMovil) {
  let y = 40;
  let vy = 0;
  const gravedad = -0.7;
  const saltoFuerte = 18;
  const speed = fromLeft ? velocidadEnemigoBase : -velocidadEnemigoBase;

  const movimientoSaltador = setInterval(() => {
    if (enemy.dataset.dead === "true" || gameOver || !game.contains(enemy)) {
      clearInterval(movimientoSaltador);
      return;
    }

    // Mover horizontal
    x += speed;
    enemy.style.left = x + "px";

    // Mover vertical (salto)
    vy += gravedad;
    y += vy;

    if (y <= 40) {
      y = 40;
      vy = saltoFuerte;
    }

    enemy.style.bottom = y + "px";

    // Desaparece si sale del área de juego
    if (x < -50 || x > game.clientWidth + 50) {
      enemy.remove();
      clearInterval(movimientoSaltador);
    }
  }, 30);
}


  // 🎵 Reproducir sonido
  const sonido = document.getElementById(config.sonido);
  sonido.currentTime = 0;
  sonido.play();

  if (config.disparador) {
  const intervaloDisparo = setInterval(() => {
    if (enemy.dataset.dead === "true" || gameOver || !game.contains(enemy)) {
      clearInterval(intervaloDisparo);
      return;
    }

    const bala = document.createElement("div");
    bala.className = "enemy-bullet";

    // Posición inicial de la bala
    const direccion = fromLeft ? 1 : -1;
    const balaX = parseFloat(enemy.style.left) + (fromLeft ? config.ancho : 0) - 10;
    bala.style.left = balaX + "px";
    bala.style.bottom = parseFloat(enemy.style.bottom) + config.altura / 2 + "px";

    game.appendChild(bala);

    // Movimiento de la bala
    const intervaloBala = setInterval(() => {
      let x = parseFloat(bala.style.left);
      x += direccion * 5;
      bala.style.left = x + "px";

      // Colisión con el jugador
      if (checkHit(bala, player)) {
        bala.remove();
        clearInterval(intervaloBala);

        health = Math.max(0, health - 1);
        vidaBarra.style.width = (health * 10) + "%";

        if (health <= 0) {
          endGame();
        }
        return;
      }

      if (x < -20 || x > game.clientWidth + 20) {
        bala.remove();
        clearInterval(intervaloBala);
      }
    }, 30);
  }, 2000); // Dispara cada 2 segundos
}

  
  if (config.caeDelCielo) {
  const margen = game.clientWidth * 0.2; // evita esquinas
  let x = margen + Math.random() * (game.clientWidth - config.ancho - 2 * margen);
  let y = game.clientHeight;

  const direccion = Math.random() < 0.5 ? -1 : 1;
  const speed = direccion * velocidadEnemigoBase;

  // ⛔ Mostrar círculo de advertencia
  const warning = document.createElement("div");
  warning.className = "warning-circle";
  warning.style.left = x + "px";
  game.appendChild(warning);

  // Posicionar enemigo pero sin moverlo aún
  enemy.style.left = x + "px";
  enemy.style.bottom = y + "px";
  game.appendChild(enemy); // 👈 Agregar el enemigo al DOM

  // 🎵 Reproducir sonido
  const sonido = document.getElementById(config.sonido);
  sonido.currentTime = 0;
  sonido.play();

  // Esperar 1.5s antes de que empiece a caer
  setTimeout(() => {
    if (warning.parentNode) warning.remove();

    const gravedad = -2;
    let vy = 0;

    const caidaCielo = setInterval(() => {
      if (enemy.dataset.dead === "true" || gameOver || !game.contains(enemy)) {
        clearInterval(caidaCielo);
        return;
      }

      vy += gravedad;
      y += vy;

      if (y <= 40) {
        y = 40;
        vy = 0;
      }

      x += speed;
      enemy.style.bottom = y + "px";
      enemy.style.left = x + "px";

      if (x < -50 || x > game.clientWidth + 50) {
        enemy.remove();
        clearInterval(caidaCielo);
      }

    }, 30);

    // Eliminación de emergencia
    setTimeout(() => {
      if (game.contains(enemy) && enemy.dataset.dead === "false") {
        enemy.remove();
      }
    }, 10000);
  }, 1500); // Tiempo de advertencia

  return; // ⚠️ Detiene el flujo aquí para no ejecutar lógica de enemigos normales
}


const speed = fromLeft ? velocidadEnemigoBase : -velocidadEnemigoBase;

  const interval = setInterval(() => {
    if (enemy.dataset.dead === "true" || gameOver) {
      clearInterval(interval);
      return;
    }

    x += speed;
    enemy.style.left = x + "px";

    if (x < -50 || x > game.clientWidth + 50) {
      enemy.remove();
      clearInterval(interval);
    }
  }, 30);
}


function iniciarSpawnEnemigos() {
  // 📈 Determina cuántos enemigos aparecen según la dificultad
  let cantidad = 1;

  if (velocidadEnemigoBase >= 3) cantidad = 2;
  if (velocidadEnemigoBase >= 5) cantidad = 3;
  if (velocidadEnemigoBase >= 7) cantidad = 4;

  // 🧟‍♂️ Llama varias veces a spawnEnemy()
  for (let i = 0; i < cantidad; i++) {
    spawnEnemy();
  }

  // Calcula próximo intervalo
  let siguiente = Math.max(800, intervaloAparicion - (velocidadEnemigoBase * 150));
  spawnTimeoutId = setTimeout(iniciarSpawnEnemigos, siguiente);
}
let intervaloAparicion = 2500; // o el valor base que desees en milisegundos

moveLoop();             // Inicia el movimiento del jugador
iniciarSpawnEnemigos(); // Inicia la aparición dinámica de enemigos



// Botones
document.getElementById("btnLeft").addEventListener("mousedown", () => movingLeft = true);
document.getElementById("btnLeft").addEventListener("mouseup", () => movingLeft = false);
document.getElementById("btnLeft").addEventListener("touchstart", e => { e.preventDefault(); movingLeft = true; });
document.getElementById("btnLeft").addEventListener("touchend", () => movingLeft = false);

document.getElementById("btnRight").addEventListener("mousedown", () => movingRight = true);
document.getElementById("btnRight").addEventListener("mouseup", () => movingRight = false);
document.getElementById("btnRight").addEventListener("touchstart", e => { e.preventDefault(); movingRight = true; });
document.getElementById("btnRight").addEventListener("touchend", () => movingRight = false);

// Teclado
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") movingLeft = true;
  if (e.key === "ArrowRight") movingRight = true;
  if (e.key === " " || e.key === "ArrowUp") jump();
  if (e.key === "x") slashAttack();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") movingLeft = false;
  if (e.key === "ArrowRight") movingRight = false;
});

// Esperar la primera interacción del usuario para iniciar música
function iniciarMusica() {
  bgMusic.play();
  document.removeEventListener("click", iniciarMusica);
  document.removeEventListener("keydown", iniciarMusica);
}

// Se activa al hacer clic o presionar una tecla
document.addEventListener("click", iniciarMusica);
document.addEventListener("keydown", iniciarMusica);


updatePlayerPosition();

document.getElementById("btnReiniciar").addEventListener("click", reiniciarJuego);

function reiniciarJuego() {
  clearTimeout(spawnTimeoutId);
  cancelAnimationFrame(animationId);
  loopActivo = false; // ✅ Reinicia la bandera del loop

  gameOver = false;
  health = 10;
  posX = (game.clientWidth - player.clientWidth) / 2;
  posY = 0;
  ultimaDireccion = "right";
  jumping = false;
  currentAction = "idle";
  movingLeft = false;
  movingRight = false;
  velocidadEnemigoBase = 2;
  enemigosDerrotados = 0;
  enemigosTexto.textContent = "0";
  vidaBarra.style.width = "100%";

  document.querySelectorAll(".enemy").forEach(e => e.remove());
  mensajeFinal.style.display = "none";
  updatePlayerPosition();

  bgMusic.currentTime = 0;
  bgMusic.play();

  setTimeout(() => setSprite("idle"), 50);

  iniciarSpawnEnemigos();
  moveLoop(); // ✅ Se ejecutará una sola vez ahora
}

