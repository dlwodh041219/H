// avatar_sketch.js

let fontTemplate;      // komi 폰트
let scene = 0;         // 0: 아바타 선택, 1: 사람 이모지 선택, 2: 동물 이모지 선택
let humanCenter;
let animalCenter;
let avatarRadius = 110;

function preload() {
  fontTemplate = loadFont("komi.otf");
}

function setup() {
  createCanvas(640, 480);
  noCursor();  // 기본 마우스 숨기기

  humanCenter  = createVector(width / 2 - 140, height / 2 + 10);
  animalCenter = createVector(width / 2 + 140, height / 2 + 10);
}

function draw() {
  background(214, 240, 249);

  if (scene === 0) {
    drawAvatarSelect();
  } else if (scene === 1) {
    drawHumanEmojiPage();
  } else if (scene === 2) {
    drawAnimalEmojiPage();
  }

  // ===== 공통 손가락 커서 (이모지) =====
  push();
  textAlign(CENTER, CENTER);
  textFont("sans-serif");   // 이모지는 시스템 폰트
  textSize(40);
  noStroke();
  fill(0);
  text("👆", mouseX, mouseY);
  pop();
}

/* ========== 0단계: 아바타 선택 화면 ========== */

function drawAvatarSelect() {
  // 제목 (굵게)
  push();
  fill(0);
  noStroke();
  textFont(fontTemplate);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(26);
  text("당신의 아바타를 선택하세요!", width / 2, 60);
  textStyle(NORMAL);
  pop();

  let overHuman  = dist(mouseX, mouseY, humanCenter.x,  humanCenter.y)  < avatarRadius;
  let overAnimal = dist(mouseX, mouseY, animalCenter.x, animalCenter.y) < avatarRadius;

  drawAvatarCircle(humanCenter.x,  humanCenter.y,  avatarRadius, "👤", "사람", overHuman);
  drawAvatarCircle(animalCenter.x, animalCenter.y, avatarRadius, "🐾", "동물", overAnimal);
}

function drawAvatarCircle(cx, cy, r, icon, label, hovered) {
  // 바깥 흰 원
  push();
  ellipseMode(CENTER);
  noStroke();
  fill(255, 255, 255, hovered ? 255 : 235);
  ellipse(cx, cy, r * 2, r * 2);

  if (hovered) {
    noFill();
    stroke(0, 80);
    strokeWeight(3);
    ellipse(cx, cy, r * 2 + 6, r * 2 + 6);
  }
  pop();

  // 아이콘 이모지 (👤, 🐾)
  push();
  textAlign(CENTER, CENTER);
  textFont("sans-serif");   // 이모지용 폰트
  textSize(70);
  noStroke();
  fill(0);
  text(icon, cx, cy - 5);
  pop();

  // 아래 라벨 (굵게)
  push();
  textAlign(CENTER, TOP);
  textFont(fontTemplate);
  textStyle(BOLD);
  textSize(18);
  noStroke();
  fill(0);
  text(label, cx, cy + r + 10);
  textStyle(NORMAL);
  pop();
}

/* ========== 1단계: 사람 이모지 선택 화면 (임시) ========== */

function drawHumanEmojiPage() {
  background(214, 240, 249);
  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textStyle(BOLD);
  fill(0);
  textSize(24);
  text("사람 이모지 선택 화면 (나중에 구현)", width / 2, height / 2);
  textStyle(NORMAL);
  pop();
}

/* ========== 2단계: 동물 이모지 선택 화면 (임시) ========== */

function drawAnimalEmojiPage() {
  background(214, 240, 249);
  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textStyle(BOLD);
  fill(0);
  textSize(24);
  text("동물 이모지 선택 화면 (나중에 구현)", width / 2, height / 2);
  textStyle(NORMAL);
  pop();
}

/* ========== 클릭 처리 ========== */

function mousePressed() {
  if (scene === 0) {
    if (dist(mouseX, mouseY, humanCenter.x, humanCenter.y) < avatarRadius) {
      scene = 1; // 사람 이모지 선택 화면으로
    } else if (dist(mouseX, mouseY, animalCenter.x, animalCenter.y) < avatarRadius) {
      scene = 2; // 동물 이모지 선택 화면으로
    }
  } else {
    // 나중에 각 선택 화면에서 클릭 로직 추가
  }
}
