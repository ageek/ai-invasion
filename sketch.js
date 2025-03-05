// Define global variables
let player;
let enemies = [];
let bullets = [];
let explosions = [];
let playerParticles = [];
let stars = [];
let score = 0;
let gameState = "start";
let lastShot = 0;
let shotDelay = 10;
let enemyTimer = 0;
let enemySpawnRate = 60;
let leftPressed = false;
let rightPressed = false;
let multiplier = 1;
let lastKillTime = 0;
let killStreak = 0;
let floatingTexts = [];
let gameOver = false;
let spacePressed = false;  // New variable to track space bar
let level = 1;
let particles = [];       // Explosion particles
let powerups = [];       // Powerup items
let playerPowerUp = 0;   // Current power-up state
let powerupTimer = 0;    // Timer for power-up duration
let enemyTypes = ['basic', 'hunter', 'boss'];
let nextBossScore = 50;  // Score threshold for boss appearance
let screenShake = 0;
let playerShield = 0;
let timeSlowFactor = 1;
let bossWarning = 0;
let currentPowerUpType = null;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;  // Load high score from storage
let enemiesDefeatedInLevel = 0;
let enemiesRequiredForLevel = 10; // Base number of enemies to defeat per level
let levelStartTime = 0;
let powerUpEffects = {
  speed: {
    active: false,
    timer: 0,
    duration: 300,
    particles: []
  },
  shield: {
    active: false,
    timer: 0,
    duration: 300,
    health: 3
  },
  spread: {
    active: false,
    timer: 0,
    duration: 300,
    angle: 0
  },
  time: {
    active: false,
    timer: 0,
    duration: 300,
    slowFactor: 0.5
  }
};
let levelCompleteTimer = 0;
let isLevelTransitioning = false;

// Add level configuration object
const levelConfig = {
  1: {
    enemySpeed: 2,
    spawnRate: 60,
    hunterChance: 0.2,
    powerupChance: 0.002,
    enemiesRequired: 10,
    bossHealth: 10
  },
  2: {
    enemySpeed: 2.5,
    spawnRate: 50,
    hunterChance: 0.3,
    powerupChance: 0.003,
    enemiesRequired: 15,
    bossHealth: 15
  },
  3: {
    enemySpeed: 3,
    spawnRate: 40,
    hunterChance: 0.4,
    powerupChance: 0.004,
    enemiesRequired: 20,
    bossHealth: 20
  },
  4: {
    enemySpeed: 3.5,
    spawnRate: 35,
    hunterChance: 0.5,
    powerupChance: 0.005,
    enemiesRequired: 25,
    bossHealth: 25
  },
  5: {
    enemySpeed: 4,
    spawnRate: 30,
    hunterChance: 0.6,
    powerupChance: 0.006,
    enemiesRequired: 30,
    bossHealth: 30
  }
};

// Player class for the spaceship
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 50;
    this.speed = 5;
    this.rotation = 0;
    this.radius = 20; // Add radius for collision detection
  }

  draw() {
    push();
    // Add slight bobbing motion
    translate(this.x, this.y + sin(frameCount * 0.05) * 5);
    rotate(this.rotation);
    fill(255); // White color for spaceship
    // Draw spaceship shape
    beginShape();
    vertex(0, -25);    // Top
    vertex(-20, 10);   // Bottom left
    vertex(-10, 0);    // Left wing
    vertex(0, 10);     // Bottom center
    vertex(10, 0);     // Right wing
    vertex(20, 10);    // Bottom right
    endShape(CLOSE);
    // Add cockpit detail
    fill(100); // Gray
    ellipse(0, -10, 10, 10);
    pop();
  }

  moveLeft() {
    this.x -= this.speed;
    if (this.x < 25) this.x = 25; // Keep within canvas
    this.rotation = -PI / 10;     // Tilt left
  }

  moveRight() {
    this.x += this.speed;
    if (this.x > width - 25) this.x = width - 25; // Keep within canvas
    this.rotation = PI / 10;                      // Tilt right
  }

  stopMoving() {
    this.rotation = 0; // Reset tilt when not moving
  }

  shoot() {
    bullets.push(new Bullet(this.x, this.y - 25));
  }
}

// Enemy class for opponents
class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = type === 'boss' ? 40 : 20;
    this.health = type === 'boss' ? levelConfig[level].bossHealth : 1;
    this.speed = type === 'hunter' ? 
      levelConfig[level].enemySpeed * 1.5 : 
      levelConfig[level].enemySpeed;
    this.rotation = 0;
    this.pulsePhase = random(TWO_PI);
    this.isAggressive = type === 'hunter' ? random() < 0.2 : false;
  }

  draw() {
    push();
    translate(this.x, this.y);
    this.rotation += 0.02;
    rotate(this.rotation);
    
    // Glowing effect
    let pulse = sin(frameCount * 0.1 + this.pulsePhase);
    let glowSize = map(pulse, -1, 1, 0.8, 1.2);
    
    switch(this.type) {
      case 'basic':
        this.drawBasicEnemy(glowSize);
        break;
      case 'hunter':
        this.drawHunterEnemy(glowSize);
        break;
      case 'boss':
        this.drawBossEnemy(glowSize);
        break;
    }
    
    pop();
  }

  drawBasicEnemy(glowSize) {
    // AI Core glow
    fill(0, 150, 255, 50);
    ellipse(0, 0, this.radius * 2.5 * glowSize);
    
    // Main body
    fill(20);
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = i * TWO_PI / 6;
      let r = this.radius;
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    
    // Core and details
    fill(0, 150, 255);
    ellipse(0, 0, this.radius * 0.8);
    fill(255);
    let eyeSize = this.radius * 0.3;
    rect(-eyeSize/2, -eyeSize/2, eyeSize, eyeSize);
  }

  drawHunterEnemy(glowSize) {
    // Hunter glow
    fill(255, 0, 100, 50);
    ellipse(0, 0, this.radius * 2.5 * glowSize);
    
    // Main body
    fill(20);
    beginShape();
    for (let i = 0; i < 3; i++) {
      let angle = i * TWO_PI / 3;
      let r = this.radius;
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    
    // Core
    fill(255, 0, 100);
    ellipse(0, 0, this.radius * 0.8);
  }

  drawBossEnemy(glowSize) {
    // Boss glow
    fill(255, 50, 0, 50);
    ellipse(0, 0, this.radius * 2.5 * glowSize);
    
    // Main body
    fill(40);
    beginShape();
    for (let i = 0; i < 8; i++) {
      let angle = i * TWO_PI / 8;
      let r = this.radius;
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    
    // Core
    fill(255, 50, 0);
    ellipse(0, 0, this.radius * 1.2);
    
    // Health bar
    push();
    translate(-this.radius, -this.radius - 10);
    fill(100);
    rect(0, 0, this.radius * 2, 5);
    fill(255, 50, 0);
    rect(0, 0, (this.radius * 2) * (this.health / 10), 5);
    pop();
  }

  moveDown() {
    if (this.type === 'hunter' && this.isAggressive) {
      // Only aggressive hunters chase the player
      let angle = atan2(player.y - this.y, player.x - this.x);
      this.x += cos(angle) * this.speed;
      this.y += sin(angle) * this.speed;
    } else {
      // All other enemies (including non-aggressive hunters) move straight down
      this.y += this.speed;
    }
  }
}

// Modify the PowerUp class
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.rotation = 0;
    this.type = random(['speed', 'shield', 'spread', 'time']);
    this.color = {
      speed: [0, 255, 150],      // Neon Green
      shield: [50, 150, 255],    // Bright Blue
      spread: [255, 150, 0],     // Orange
      time: [180, 0, 255]        // Purple
    }[this.type];
    this.pulsePhase = random(TWO_PI);
  }

  draw() {
    push();
    translate(this.x, this.y);
    this.rotation += 0.05;
    rotate(this.rotation);
    
    // Outer glow
    let pulse = sin(frameCount * 0.1 + this.pulsePhase);
    let glowSize = map(pulse, -1, 1, 0.8, 1.2);
    fill(...this.color, 30);
    ellipse(0, 0, this.radius * 3 * glowSize);
    fill(...this.color, 50);
    ellipse(0, 0, this.radius * 2.5 * glowSize);
    
    // Main body
    fill(...this.color);
    beginShape();
    for (let i = 0; i < 4; i++) {
      let angle = i * TWO_PI / 4;
      vertex(cos(angle) * this.radius, sin(angle) * this.radius);
    }
    endShape(CLOSE);

    // Power-up icon with better visibility
    push();
    rotate(-this.rotation);
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    let icon = {
      speed: "⚡",
      shield: "🛡️",
      spread: "⭐",
      time: "⌛"
    }[this.type];
    text(icon, 0, 0);
    pop();
    
    pop();
  }

  moveDown() {
    this.y += 2;
  }
}

// Bullet class for projectiles
class Bullet {
  constructor(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 10;
    this.speed = 10;
    this.angle = angle;
  }

  draw() {
    fill(255); // White
    rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
  }

  moveUp() {
    this.x += this.speed * sin(this.angle);
    this.y -= this.speed * cos(this.angle);
  }
}

// Particle class for effects (explosions and exhaust)
class Particle {
  constructor(x, y, vx = random(-2, 2), vy = random(-2, 2), color = [255, 255, 0]) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.alpha = 255;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5; // Fade out
  }

  draw() {
    noStroke();
    fill(...this.color, this.alpha);
    ellipse(this.x, this.y, 5);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

// Explosion class for enemy destruction effect
class Explosion {
  constructor(x, y) {
    this.particles = [];
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(x, y));
    }
  }

  update() {
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => !p.isDead());
  }

  draw() {
    this.particles.forEach(p => p.draw());
  }

  isDead() {
    return this.particles.length === 0;
  }
}

// Setup function to initialize the game
function setup() {
  createCanvas(800, 600);
  frameRate(60);

  // Initialize starfield
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.5, 2)
    });
  }
}

// Draw function for game loop
function draw() {
  push();
  applyScreenShake();
  background(0); // Black space background

  // Draw and update stars
  stars.forEach(star => {
    fill(255);
    noStroke();
    ellipse(star.x, star.y, star.size);
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  });

  if (gameState === "start") {
    // Cyberpunk-style title screen
    let titleY = height/2 - 50;
    
    // Glitch effect
    if (random() < 0.1) {
      titleY += random(-5, 5);
    }
    
    // Title glow
    fill(0, 150, 255, 50);
    textSize(64);
    textAlign(CENTER);
    text("AI INVASION", width/2, titleY + 2);
    
    // Main title
    fill(255);
    textSize(60);
    text("AI INVASION", width/2, titleY);
    
    // Subtitle
    fill(0, 150, 255);
    textSize(20);
    text("DEFEND HUMANITY FROM ROGUE AI", width/2, titleY + 50);
    
    // Call to action
    if (frameCount % 60 < 30) {
      fill(255);
      textSize(16);
      text("PRESS ANY KEY TO START", width/2, height/2 + 100);
    }
    
    // Social tag
    textSize(14);
    text("Share your score on X/Twitter with #AIInvasionGame", width/2, height - 30);
  } else if (gameState === "playing") {
    // Game logic

    // Player movement
    if (leftPressed) {
      player.moveLeft();
    } else if (rightPressed) {
      player.moveRight();
    } else {
      player.stopMoving();
    }

    player.draw();

    // Player exhaust particles
    if (leftPressed || rightPressed) {
      if (frameCount % 5 === 0) {
        playerParticles.push(new Particle(player.x, player.y + 25, 0, 2));
      }
    }

    // Update and draw exhaust particles
    playerParticles.forEach(p => {
      p.update();
      p.draw();
    });
    playerParticles = playerParticles.filter(p => !p.isDead());

    // Update and draw bullets
    bullets.forEach(bullet => {
      bullet.moveUp();
      bullet.draw();
    });
    bullets = bullets.filter(bullet => bullet.y > 0);

    // Update and draw enemies
    enemies.forEach(enemy => {
      enemy.moveDown();
      enemy.draw();
      // Only check for collision with player
      if (dist(enemy.x, enemy.y, player.x, player.y) < (enemy.radius + player.radius)) {
        gameState = "gameover";
      }
    });

    // Add this after the enemies.forEach loop to clean up off-screen enemies
    enemies = enemies.filter(enemy => enemy.y <= height);

    // Collision detection
    for (let i = bullets.length - 1; i >= 0; i--) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        let bullet = bullets[i];
        let enemy = enemies[j];
        if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.radius) {
          bullets.splice(i, 1);
          enemies.splice(j, 1);
          enemiesDefeatedInLevel++;
          explosions.push(new Explosion(enemy.x, enemy.y));
          // Update kill streak
          if (frameCount - lastKillTime < 60) {
            killStreak++;
            multiplier = min(killStreak, 10);
          } else {
            killStreak = 1;
            multiplier = 1;
          }
          lastKillTime = frameCount;
          score += 1 * multiplier;
          
          // Create floating score text with proper color array
          floatingTexts.push({
            x: enemy.x,
            y: enemy.y,
            text: `+${1 * multiplier}x!`,
            life: 30,
            color: [0, 255, 150]  // Default color as array
          });
          break;
        }
      }
    }

    // Update and draw explosions
    explosions.forEach(explosion => {
      explosion.update();
      explosion.draw();
    });
    explosions = explosions.filter(explosion => !explosion.isDead());

    // Spawn new enemies
    enemyTimer++;
    if (enemyTimer >= levelConfig[level].spawnRate) {
      let type = random() < levelConfig[level].hunterChance ? 'hunter' : 'basic';
      enemies.push(new Enemy(random(width), 0, type));
      enemyTimer = 0;
    }

    // Spawn boss when reaching score threshold
    if (score >= nextBossScore && !enemies.some(e => e.type === 'boss')) {
      bossWarning = 50;
      setTimeout(() => {
        enemies.push(new Enemy(width/2, 0, 'boss'));
        screenShake = 10;
      }, 1000);
      nextBossScore += 50;
    }
    
    // Random power-up spawn
    if (random() < levelConfig[level].powerupChance) {
      powerups.push(new PowerUp(random(width), 0));
    }
    
    // Update and draw power-ups
    powerups.forEach((powerup, index) => {
      powerup.moveDown();
      powerup.draw();
      
      // Check collision with player
      if (dist(powerup.x, powerup.y, player.x, player.y) < (powerup.radius + player.radius)) {
        // Deactivate current power-up
        if (currentPowerUpType) {
          powerUpEffects[currentPowerUpType].active = false;
        }
        
        // Activate new power-up
        currentPowerUpType = powerup.type;
        powerUpEffects[powerup.type].active = true;
        powerUpEffects[powerup.type].timer = frameCount + powerUpEffects[powerup.type].duration;
        
        // Power-up collection effect
        screenShake = 5;
        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(
            powerup.x,
            powerup.y,
            random(-3, 3),
            random(-3, 3),
            powerup.color
          ));
        }
        
        // Show power-up text
        floatingTexts.push({
          x: player.x,
          y: player.y - 30,
          text: powerup.type.toUpperCase() + " ACTIVATED!",
          life: 60,
          color: powerup.color
        });
        
        powerups.splice(index, 1);
      }
    });
    
    // Remove off-screen power-ups
    powerups = powerups.filter(p => p.y <= height);
    
    // Apply power-up effects
    handlePowerUpEffects();

    // Display score and high score
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text("Score: " + score, 10, 30);
    text("High Score: " + highScore, 10, 60);

    // Display multiplier
    if (multiplier > 1) {
      fill(0, 150, 255);
      textSize(24);
      textAlign(RIGHT);
      text(`${multiplier}x`, width - 10, 30);
    }

    // Display level info
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text("Level: " + level, 10, 90);
    
    // Level progress bar
    let progress = enemiesDefeatedInLevel / levelConfig[level].enemiesRequired;
    fill(100);
    rect(10, 100, 200, 10);
    fill(0, 255, 150);
    rect(10, 100, 200 * progress, 10);

    // Check for level completion
    if (enemiesDefeatedInLevel >= levelConfig[level].enemiesRequired && !isLevelTransitioning) {
      isLevelTransitioning = true;
      levelCompleteTimer = frameCount + 180;
    }

    // Handle level transition
    if (isLevelTransitioning) {
      showLevelComplete();
    }

    // Update and draw floating texts
    updateFloatingTexts();
    drawFloatingTexts();

    // Boss warning effect
    if (bossWarning > 0) {
      let alpha = map(bossWarning, 50, 0, 255, 0);
      fill(255, 0, 0, alpha);
      rect(0, 0, width, height);
      bossWarning--;
    }
  } else if (gameState === "gameover") {
    // Update high score if current score is higher
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);  // Save to storage
    }
    
    // Game over screen
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER);
    text("Game Over", width / 2, height / 2 - 40);
    fill(255);
    textSize(20);
    text("Final Score: " + score, width / 2, height / 2);
    if (score >= highScore) {
      fill(255, 215, 0);  // Gold color for new high score
      text("New High Score!", width / 2, height / 2 + 30);
    } else {
      fill(255);
      text("High Score: " + highScore, width / 2, height / 2 + 30);
    }
    text("You were hit by an enemy ship!", width / 2, height / 2 + 60);
    text("Press 'R' to restart", width / 2, height / 2 + 90);
  }
  pop();
}

// Handle key presses
function keyPressed() {
  if (gameState === "start") {
    // Start game with any key
    gameState = "playing";
    player = new Player();
    enemies = [];
    bullets = [];
    explosions = [];
    playerParticles = [];
    floatingTexts = [];
    powerups = [];
    currentPowerUpType = null;
    score = 0;
    enemyTimer = 0;
  } else if (gameState === "gameover" && (key === 'r' || key === 'R')) {  // Check for 'R' key
    // Restart game only with 'R' key
    gameState = "playing";
    player = new Player();
    enemies = [];
    bullets = [];
    explosions = [];
    playerParticles = [];
    floatingTexts = [];
    powerups = [];
    currentPowerUpType = null;
    score = 0;
    enemyTimer = 0;
  }

  if (gameState === "playing") {
    if (keyCode === LEFT_ARROW) {
      leftPressed = true;
    } else if (keyCode === RIGHT_ARROW) {
      rightPressed = true;
    } else if (key === ' ') {
      if (frameCount - lastShot >= shotDelay) {
        if (currentPowerUpType === 'spread') {
          let angles = [-0.3, -0.15, 0, 0.15, 0.3];  // 5-way spread
          angles.forEach(angle => {
            bullets.push(new Bullet(player.x, player.y - 25, angle));
          });
        } else {
          player.shoot();
        }
        lastShot = frameCount;
      }
    }
  }
}

// Handle key releases
function keyReleased() {
  if (keyCode === LEFT_ARROW) {
    leftPressed = false;
  } else if (keyCode === RIGHT_ARROW) {
    rightPressed = false;
  }
}

// Add this new function to handle floating text updates
function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let text = floatingTexts[i];
    text.y -= 2; // Float upward
    text.life -= 1;
    if (text.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// Add this function to draw floating texts
function drawFloatingTexts() {
  floatingTexts.forEach(floatingText => {
    let alpha = map(floatingText.life, 0, 30, 0, 255);
    fill(floatingText.color[0], floatingText.color[1], floatingText.color[2], alpha);
    textAlign(CENTER);
    textSize(16);
    text(floatingText.text, floatingText.x, floatingText.y);
  });
}

// Add this function for screen shake
function applyScreenShake() {
  if (screenShake > 0) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
    screenShake *= 0.9;
  }
}

// Replace the showLevelComplete function with this version
function showLevelComplete() {
  if (!isLevelTransitioning) {
    isLevelTransitioning = true;
    levelCompleteTimer = frameCount + 180; // 3 seconds at 60fps
  }
  
  // Show level complete screen
  fill(0, 255, 150);
  textSize(40);
  textAlign(CENTER);
  text("Level " + level + " Complete!", width/2, height/2 - 40);
  
  // Show stats
  textSize(20);
  text("Enemies Defeated: " + enemiesDefeatedInLevel, width/2, height/2);
  text("Score: " + score, width/2, height/2 + 30);
  
  // Check if display time is over
  if (frameCount >= levelCompleteTimer) {
    level++;
    enemiesDefeatedInLevel = 0;
    enemySpawnRate = levelConfig[level].spawnRate;
    isLevelTransitioning = false;
  }
}

// Add this function to handle power-up effects
function handlePowerUpEffects() {
  if (powerUpEffects.speed.active) {
    // Speed boost effect
    shotDelay = 5;
    fill(0, 255, 150, 30);
    ellipse(player.x, player.y, player.radius * 4);
    
    // Speed trails
    if (frameCount % 2 === 0) {
      playerParticles.push(new Particle(
        player.x + random(-10, 10),
        player.y + random(-10, 10),
        0, 2,
        [0, 255, 150]
      ));
    }
  }

  if (powerUpEffects.shield.active) {
    // Shield effect
    push();
    translate(player.x, player.y);
    rotate(frameCount * 0.02);
    for (let i = 0; i < 3; i++) {
      let angle = (i * TWO_PI / 3) + frameCount * 0.02;
      fill(50, 150, 255, 100);
      ellipse(
        cos(angle) * player.radius * 1.5,
        sin(angle) * player.radius * 1.5,
        10, 10
      );
    }
    pop();
    
    // Shield aura
    fill(50, 150, 255, 30);
    ellipse(player.x, player.y, player.radius * 3);
  }

  if (powerUpEffects.spread.active) {
    // Spread shot effect
    fill(255, 150, 0, 30);
    arc(player.x, player.y - 25, player.radius * 3, player.radius * 3, -PI * 0.3, -PI * 0.7, PIE);
  }

  if (powerUpEffects.time.active) {
    // Time slow effect
    fill(180, 0, 255, 10);
    rect(0, 0, width, height);
    
    // Time particles
    if (frameCount % 10 === 0) {
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(
          random(width),
          random(height),
          0, 1,
          [180, 0, 255]
        ));
      }
    }
  }
}