/** @type {HTMLCanvasElement}*/

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const xCenter = canvas.width / 2;
const yCenter = canvas.height / 2;

const friction = 0.97;
const audioHit = new Audio("./sounds/hit.wav");
const audioExplosion = new Audio("./sounds/exploration.wav");
const scoreEl = document.getElementById("scoreEl");
const bgContainer = document.querySelector(".bg-container");
const startGameBtn = document.getElementById("start-game-btn");
const finalScoreEl = document.getElementById("final-score");

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
        this.velocity.x *= friction;
        this.velocity.y *= friction;
    }
}

let player;
let projectiles;
let enemies;
let particles;
let score;

function init() {
    player = new Player(xCenter, yCenter, 20, "white");
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.textContent = 0;
    finalScoreEl.textContent = 0;
}

function spawnEnemies() {
    setInterval(() => {
        radius = Math.random() * 26 + 4;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(yCenter - y, xCenter - x);
        const velocity = { x: Math.cos(angle), y: Math.sin(angle) };
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1300);
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            setTimeout(() => {
                particles.splice(index, 1);
            }, 0);
        } else {
            particle.update();
        }
    });
    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.y + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });
    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();
        // enemy hit player
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            bgContainer.style.display = "block";
            finalScoreEl.textContent = score;
        }
        projectiles.forEach((projectile, projectileIndex) => {
            // hit enemy
            const dist = Math.hypot(
                projectile.x - enemy.x,
                projectile.y - enemy.y
            );
            if (dist - enemy.radius - projectile.radius < 1) {
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(
                        new Particle(
                            projectile.x,
                            projectile.y,
                            Math.random() * 2,
                            enemy.color,
                            {
                                x: (Math.random() - 0.5) * Math.random() * 6,
                                y: (Math.random() - 0.5) * Math.random() * 6,
                            }
                        )
                    );
                }
                if (enemy.radius - 10 > 5) {
                    score += 100;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10,
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    score += 250;
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
                scoreEl.textContent = score;
                audioExplosion.play();
            }
        });
    });
}

window.addEventListener("click", (event) => {
    const angle = Math.atan2(event.y - yCenter, event.x - xCenter);
    const velocity = { x: Math.cos(angle) * 5, y: Math.sin(angle) * 5 };
    projectiles.push(new Projectile(xCenter, yCenter, 5, "white", velocity));
    audioHit.play();
});

startGameBtn.addEventListener("click", () => {
    init();
    animate();
    spawnEnemies();
    bgContainer.style.display = "none";
});
