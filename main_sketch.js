let fontSurround;
let fontHand;
let img;

let phase = 1;           // 1: 첫 화면, 2: 템플릿 선택, 3: 게임, 4: QR
let selectedGame = null; // "animal" | "cooking" | "house"

let animal;
let cook;
let house;
let human;

function preload() {
  fontSurround = loadFont("surround.ttf");
  fontHand = loadFont("hand.ttf");
  img = loadImage("pen.jpeg");

  animal = loadImage("animal.png");
  cook   = loadImage("cook.png");
  house  = loadImage("house.png");
  human  = loadImage("human.png");
}

function setup() {
  createCanvas(640, 480);
  noCursor();
  console.log("✅ main setup 실행됨");
}

function draw() {
  if (phase === 1) {
    drawStartPage();
  } else if (phase === 2) {
    drawTemplatePage();
  } else if (phase === 3) {
    if (selectedGame === "animal")      drawAnimalGame();
    else if (selectedGame === "cooking") drawCookingGame();
    else if (selectedGame === "house")   drawHouseGame();
  } // else if (phase === 4) { drawQRPage(); // 나중에 구현}

  // 공통 커서 (손가락)
  push();
  textAlign(CENTER, CENTER);
  textSize(45);
  noStroke();
  fill(0);
  text("👆", mouseX, mouseY);
  pop();
}

/* ================== 첫 페이지 (원래 디자인) ================== */

function drawStartPage() {
  background(215, 240, 249);

  //"Emoji-Coreo"
  push();
  textFont(fontHand);
  fill(0);
  textSize(15);
  text("Emoji-Coreo", 485, 185);
  pop();

  // 체크표시 이미지
  push();
  rotate(radians(-10));
  image(img, 40, 80, 160, 110);
  pop();

  //"이모지 코레오"
  textSize(60);
  textAlign(CENTER);
  push();
  textFont(fontSurround);
  fill(247, 207, 99);
  stroke(0);
  strokeWeight(3);
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

  // 이모티콘 장식들 (처음 크기 그대로)
  push();
  translate(500, 268);
  rotate(radians(20));
  text("🐶", 0, 0);
  pop();

  push();
  translate(120, 300);
  rotate(radians(-30));
  text("😚", 0, 0);
  pop();

  push();
  translate(90, 415);
  rotate(radians(10));
  text("🔨", 0, 0);
  pop();

  push();
  translate(540, 435);
  rotate(radians(10));
  text("🏠", 0, 0);
  pop();

  push();
  translate(230, 245);
  rotate(radians(-10));
  text("👕", 0, 0);
  pop();

  push();
  translate(570, 345);
  rotate(radians(10));
  text("🥞", 0, 0);
  pop();
}

/* ================== 두 번째 페이지: 템플릿 선택 ================== */

function drawTemplatePage() {
  background(215, 240, 249);

  // 상단 제목 – 첫 페이지랑 같은 폰트
  push();
  textFont(fontSurround);
  textAlign(CENTER, CENTER);
  fill(0);
  stroke(255);
  strokeWeight(3);
  textSize(38);
  text("어떤 게임을 플레이 할까요?", width / 2, 55);
  pop();

  // 카드 설정
  const cardW = 180;
  const cardH = 320;
  const yCenter = 260;   // 조금 아래로 내려서 제목과 안 겹치게

  const x1 = 120;
  const x2 = width / 2;
  const x3 = width - 120;

  // 호버 체크
  const hover1 = isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH);
  const hover2 = isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH);
  const hover3 = isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH);

  // 카드 1: 동물 키우기
  drawTemplateCard(
    x1,
    yCenter,
    cardW,
    cardH,
    "두 손에 간식을 들고 강아지에게 내밀듯,\n두 손을 앞으로 쭉 뻗어주세요!",
    animal,
    "몽글몽글 동물 키우기",
    "귀여운 동물을 키우고 교감해보아요!",
    hover1
  );

  // 카드 2: 요리하기
  drawTemplateCard(
    x2,
    yCenter,
    cardW,
    cardH,
    "팬을 흔들어요.\n두 손을 좌우로 동시에 흔들기.",
    cook,
    "오늘은 내가 요리사",
    "직접 맛있는 음식을 요리하고 자랑해보세요!",
    hover2
  );

  // 카드 3: 집 짓기
  drawTemplateCard(
    x3,
    yCenter,
    cardW,
    cardH,
    "망치질!\n오른손만 위아래로 움직여 보세요.",
    house,
    "나만의 집 짓기",
    "나만의 집을 짓고 손님을 불러 집들이를 해보아요!",
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
// 카드 하나 그리기 (글씨 크기만 조절한 버전)
function drawTemplateCard(
  cx,
  cy,
  w,
  h,
  topText,
  iconImg,
  bottomTitle,
  bottomDesc,
  hovered
) {
  push();
  rectMode(CENTER);

  // 카드 뒤 파란 배경
  noStroke();
  fill(100, 130, 170, hovered ? 230 : 190);
  rect(cx, cy, w + 20, h + 20, 20);

  // 카드 본체
  fill(245);
  rect(cx, cy, w, h, 40);

  // ===== 상단 동작 설명 =====
  textAlign(CENTER, TOP);
  textFont(fontSurround);
  fill(0);
  textSize(11);                  // 13 → 11 로 축소
  text(topText, cx, cy - h / 2 + 25);

  // 사람 실루엣
  imageMode(CENTER);
  const humanY = cy - 30;
  image(human, cx, humanY, 90, 120);

  // 아이콘 (동물/요리/집)
  const iconY = cy + 70;
  image(iconImg, cx, iconY, 70, 70);

  // ===== 아래 제목 =====
  textAlign(CENTER, TOP);
  textFont(fontSurround);
  textSize(14);                  // 16 → 14
  fill(0);
  text(bottomTitle, cx, cy + h / 2 + 8);

  // ===== 아래 설명 =====
  textFont(fontSurround);
  textSize(10);                  // 12 → 10
  fill(40);
  text(bottomDesc, cx, cy + h / 2 + 30);

  pop();
}


/* ================== 클릭 처리 ================== */

function mousePressed() {
  // 1단계: START 화면 → 템플릿 화면으로 이동
  if (phase === 1) {
    if (mouseX < 495 && mouseX > 145 && mouseY < 410 && mouseY > 290) {
      phase = 2;   // 템플릿 선택 페이지로 이동
    }
  }

  // 2단계: 템플릿 선택 페이지 — 여기 코드가 들어감
  else if (phase === 2) {

    const cardW = 180;
    const cardH = 320;
    const yCenter = 260;
    const x1 = 120;
    const x2 = width / 2;
    const x3 = width - 120;

    // 카드 1: 동물 키우기
    if (isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH)) {
      selectedGame = "animal";
      setupAnimalGame();   // 호출됨
      phase = 3;
    }

    // 카드 2: 요리하기
    else if (isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH)) {
      selectedGame = "cooking";
      setupCookingGame();  // 호출됨
      phase = 3;
    }

    // 카드 3: 집 짓기
    else if (isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH)) {
      selectedGame = "house";
      setupHouseGame();    // 호출됨
      phase = 3;
    }
  }

  // (선택사항) phase===3일 때 개별 게임에서 mousePressed 필요하면 여기서 route 가능
}