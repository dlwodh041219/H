let fontStart;      // 첫 페이지 폰트 (Recipekorea)
let fontTemplate;   // 템플릿 페이지 폰트 (komi)
let img;

// 화면 단계: 1 = 시작 화면, 2 = 템플릿 선택, 3 = 각 게임 화면
let phase = 1;
let selectedGame = null;

let gameMode = "intro";
let gameIntroStartTime = 0;

// 템플릿 카드 공통 크기/위치
const CARD_W = 170;
const CARD_H = 300;
const CARD_Y = 235;   // 카드들을 더 위로 올림

function preload() {
  fontStart    = loadFont("Recipekorea.ttf");
  fontTemplate = loadFont("komi.otf");
  img          = loadImage("pen.jpeg");
}

function setup() {
  createCanvas(640, 480);
  noCursor();
}

function draw() {
  if (phase === 1) {
    drawStartPage();
  } else if (phase === 2) {
    drawTemplatePage();
  } else if (phase === 3) {
    if (gameMode === "intro") {
      drawGamePage(); 

      // 자동으로 n초 뒤에 실제 게임으로 전환
      if (millis() - gameIntroStartTime > 1500) { // 1.5초 정도
        gameMode = "play";
      }

    } else if (gameMode === "play") {
      if (selectedGame === "animal") {
        drawAnimalGame();
      } else if (selectedGame === "cooking") {
        drawCookingGame();
      } else if (selectedGame === "house") {
        drawHouseGame();
      } else {
        drawGamePage(); // 혹시 selectedGame이 null일 때 대비
      }
    }
  }

  // 공통 커서 (손가락)
  push();
  textAlign(CENTER, CENTER);
  textSize(45);
  noStroke();
  fill(0);
  text("👆", mouseX, mouseY);
  pop();
}

/* ================== 1단계: 첫 페이지 ================== */

function drawStartPage() {
  background(215, 240, 249);

  //"Emoji-Coreo"
  push();
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(15);
  text("Emoji-Coreo", 485, 185);
  pop();

  // 체크표시 이미지
  push();
  rotate(radians(-10));
  image(img, 40, 80, 160, 110);
  pop();

  //"이모지 코레오"
  textAlign(CENTER);
  push();
  textFont(fontStart);
  fill(247, 207, 99);
  stroke(0);
  strokeWeight(3);
  textSize(60);
  text("이모지 코레오", width / 2, 150);

  //"나만의"
  textSize(35);
  fill(62, 133, 201);
  push();
  rotate(radians(-25));
  text("나만의", 50, 125);
  pop();

  // START 버튼 범위
  const btnLeft = 145;
  const btnRight = 495;
  const btnTop = 290;
  const btnBottom = 410;
  const hoverStart =
    mouseX < btnRight && mouseX > btnLeft &&
    mouseY < btnBottom && mouseY > btnTop;

  // 그림자
  fill(0, 100);
  noStroke();
  if (hoverStart) {
    ellipse(width / 2 + 5, 350 + 7, 370, 140);
  } else {
    ellipse(width / 2 + 5, 350 + 7, 350, 120);
  }

  // 본 도형
  fill(190);
  if (hoverStart) {
    ellipse(width / 2, 350, 370, 140);
  } else {
    ellipse(width / 2, 350, 350, 120);
  }

  //"START!"
  stroke(0);
  strokeWeight(1);
  fill(230, 164, 174);
  if (hoverStart) {
    textSize(80);
    text("START!", width / 2, 373);
  } else {
    textSize(60);
    text("START!", width / 2, 365);
  }
  pop();

  // 이모티콘 장식들 (크게 유지)
  push();
  translate(500, 268);
  rotate(radians(20));
  noStroke();
  textSize(40);
  text("🐶", 0, 0);
  pop();

  push();
  translate(120, 300);
  rotate(radians(-30));
  textSize(40);
  text("😚", 0, 0);
  pop();

  push();
  translate(90, 415);
  rotate(radians(10));
  textSize(40);
  text("🔨", 0, 0);
  pop();

  push();
  translate(540, 435);
  rotate(radians(10));
  textSize(40);
  text("🏠", 0, 0);
  pop();

  push();
  translate(230, 245);
  rotate(radians(-10));
  textSize(40);
  text("👕", 0, 0);
  pop();

  push();
  translate(570, 345);
  rotate(radians(10));
  textSize(40);
  text("🥞", 0, 0);
  pop();
}

/* ================== 2단계: 템플릿 선택 페이지 ================== */

function drawTemplatePage() {
  background(215, 240, 249);

  // 상단 제목 — 더 위로, 굵게, 윤곽선 없음
  push();
  textFont(fontTemplate);
  textAlign(CENTER, CENTER);
  fill(0);
  noStroke();
  textStyle(BOLD);
  textSize(40);
  text("어떤 게임을 플레이 할까요?", width / 2, 35);
  textStyle(NORMAL);
  pop();

  const cardW = CARD_W;
  const cardH = CARD_H;
  const yCenter = CARD_Y;

  // 카드 간격 조금 더 넓게
  const x1 = 110;
  const x2 = width / 2;
  const x3 = width - 110;

  const hover1 = isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH);
  const hover2 = isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH);
  const hover3 = isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH);

  // 카드 1: 동물 키우기 (🐶) — 상단 설명만 13pt
  drawTemplateCard(
    x1,
    yCenter,
    cardW,
    cardH,
    "두 손에 간식을 들고 강아지에게 내밀듯,\n두 손을 앞으로 쭉 뻗어주세요!",
    "🐶",
    "몽글몽글 동물 키우기",
    "귀여운 동물을 키우고\n교감해보아요!",
    hover1,
    13               // ★ 상단 설명 크기 override
  );

  // 카드 2: 요리하기 (🥞) — 상단 설명 14pt (기본값)
  drawTemplateCard(
    x2,
    yCenter,
    cardW,
    cardH,
    "팬을 흔들어요.\n두 손을 좌우로 동시에 흔들기.",
    "🥞",
    "오늘은 내가 요리사",
    "직접 맛있는 음식을\n요리하고 자랑해보세요!",
    hover2
  );

  // 카드 3: 집 짓기 (🏠) — 상단 설명 14pt (기본값)
  drawTemplateCard(
    x3,
    yCenter,
    cardW,
    cardH,
    "망치질!\n오른손만 위아래로 움직여 보세요.",
    "🏠",
    "나만의 집 짓기",
    "나만의 집을 짓고 손님을 불러\n집들이를 해보아요!",
    hover3
  );
}

// 카드 영역 체크
function isInsideCard(mx, my, cx, cy, w, h) {
  return (
    mx > cx - w / 2 &&
    mx < cx + w / 2 &&
    my > cy - h / 2 &&
    my < cy + h / 2
  );
}

// 카드 하나 그리기
function drawTemplateCard(
  cx,
  cy,
  w,
  h,
  topText,
  icon,           // 문자열(이모지)
  bottomTitle,
  bottomDesc,
  hovered,
  topSizeOverride // 상단 설명 폰트 크기만 카드별로 조정 (옵션)
) {
  const baseTopSize   = 14;  // 기본 상단 설명 크기
  const baseTitleSize = 18;  // 제목 크기 (모든 카드 공통)
  const baseDescSize  = 13;  // 아래 설명 크기 (모든 카드 공통)

  // override가 있으면 그 값 사용, 없으면 기본값 14
  const topSize = topSizeOverride || baseTopSize;

  push();
  rectMode(CENTER);

  // 바깥 패널
  noStroke();
  fill(115, 124, 150, hovered ? 255 : 235);
  rect(cx, cy, w + 24, h + 32, 20);

  // 안쪽 카드
  fill(230, 230, 233);
  rect(cx, cy, w, h, 50);

  // ===== 상단 동작 설명 =====
  textAlign(CENTER, TOP);
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(topSize);                 // ★ 카드별 상단 설명 크기
  text(topText, cx, cy - h / 2 + 24);

  // ===== 사람 실루엣 (👤) =====
  const humanY = cy - 20;
  push();
  textAlign(CENTER, CENTER);
  textSize(72);
  textFont("sans-serif");
  text("👤", cx, humanY);
  pop();

  // ===== 아이콘 (게임별 이모지) =====
  const iconY = cy + 70;
  push();
  textAlign(CENTER, CENTER);
  textSize(56);
  textFont("sans-serif");
  text(icon, cx, iconY);
  pop();

  // ===== 아래 제목 =====
  textAlign(CENTER, TOP);
  textFont(fontTemplate);
  textStyle(BOLD);
  textSize(baseTitleSize);           // ★ 항상 18pt
  fill(0);
  text(bottomTitle, cx, cy + h / 2 + 26);

  // ===== 아래 설명 =====
  textStyle(NORMAL);
  textFont(fontTemplate);
  textSize(baseDescSize);            // ★ 항상 13pt
  fill(40);
  text(bottomDesc, cx, cy + h / 2 + 52);

  pop();
}

/* ================== 3단계: 각 게임 페이지 (임시) ================== */

function drawGamePage() {
  background(240);
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(28);

  let label = "";
  if (selectedGame === "animal") label = "동물 키우기 게임 시작!";
  else if (selectedGame === "cooking") label = "요리하기 게임 시작!";
  else if (selectedGame === "house") label = "집 짓기 게임 시작!";
  else label = "게임이 선택되지 않았습니다.";

  text(label, width / 2, height / 2);
}

/* ================== 클릭 처리 ================== */

function mousePressed() {
  // 1단계: START 화면 → 템플릿 화면으로 이동
  if (phase === 1) {
    if (mouseX < 495 && mouseX > 145 && mouseY < 410 && mouseY > 290) {
      phase = 2;
    }
  }
  // 2단계: 템플릿 선택 페이지 — 카드 클릭
  else if (phase === 2) {
    const cardW = CARD_W;
    const cardH = CARD_H;
    const yCenter = CARD_Y;
    const x1 = 110;
    const x2 = width / 2;
    const x3 = width - 110;

    if (isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH)) {
      selectedGame = "animal";
      setupAnimalGame();
      gameMode = "intro";          
      gameIntroStartTime = millis();
      phase = 3;
    } else if (isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH)) {
      selectedGame = "cooking";
      gameMode = "intro";          
      gameIntroStartTime = millis();
      setupCookingGame();
      phase = 3;
    } else if (isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH)) {
      selectedGame = "house";
      gameMode = "intro";          
      gameIntroStartTime = millis();
      setupHouseGame();
      phase = 3;
    }
  }
}