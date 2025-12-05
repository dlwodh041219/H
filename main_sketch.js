let fontStart;      
let fontTemplate; 
let img;
// let qrImg;

// phase: 1 = 시작 화면, 2 = 템플릿 선택, 3 = 이모지 커스텀, 4 = 각 게임 화면
let phase = 1;
let selectedGame = null;

let gameMode = "intro";
let gameIntroStartTime = 0;

let animalInited = false;
let cookingInited = false;
let houseInited = false;

let CARD_W = 170;
let CARD_H = 300;
let CARD_Y = 235;

function preload() {
  fontStart    = loadFont("Recipekorea.ttf");
  fontTemplate = loadFont("komi.otf");
  img          = loadImage("pen.jpeg");
  //qrImg        = loadImage("qr_sample.png");
}

function setup() {
  createCanvas(640, 480);
  noCursor();

  setupAvatar();
}

function draw() {
  if (phase === 1) {
    drawStartPage();
  } else if (phase === 2) {
    drawTemplatePage();
  } else if (phase === 3) {
    drawAvatarScene();
  } else if (phase === 4) {
    if (gameMode === "intro") {
      drawGamePage(); 

      // 자동으로 n초 뒤에 실제 게임으로 전환
      if (millis() - gameIntroStartTime > 1500) {
        gameMode = "play";
      }
    } else if (gameMode === "play") {
    if (selectedGame === "animal") {
      if (!animalInited) {
        initAnimalGame();      
        animalInited = true;
      }
      drawAnimalGame();

    } else if (selectedGame === "cooking") {
      if (!cookingInited) {
        initCookingGame();    
        cookingInited = true;
      }
      drawCookingGame();

    } else if (selectedGame === "house") {
      if (!houseInited) {
        initHouseGame();      
        houseInited = true;
      }
      drawHouseGame();

    } else {
      drawGamePage();
      }
    }
  } else if (phase === 5) {
    // ✅ QR 다운로드 페이지
    drawQRPage();
  }

  // 공통 커서
  push();
  textAlign(CENTER, CENTER);
  textSize(45);
  noStroke();
  fill(0);
  text("👆", mouseX, mouseY);
  pop();
}

// 1단계: 첫 페이지

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
  let btnLeft = 145;
  let btnRight = 495;
  let btnTop = 290;
  let btnBottom = 410;
  let hoverStart =
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

// 2단계: 템플릿 선택 페이지

function drawTemplatePage() {
  background(215, 240, 249);

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

  let cardW = CARD_W;
  let cardH = CARD_H;
  let yCenter = CARD_Y;

  let x1 = 110;
  let x2 = width / 2;
  let x3 = width - 110;

  let hover1 = isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH);
  let hover2 = isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH);
  let hover3 = isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH);

  // 카드 1: 동물 키우기 (🐶)
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
    13
  );

  // 카드 2: 요리하기 (🥞)
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

  // 카드 3: 집 짓기 (🏠)
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
  let baseTopSize   = 14;  // 기본 상단 설명 크기
  let baseTitleSize = 18;  // 제목 크기 (모든 카드 공통)
  let baseDescSize  = 13;  // 아래 설명 크기 (모든 카드 공통)

  // override가 있으면 그 값 사용, 없으면 기본값 14
  let topSize = topSizeOverride || baseTopSize;

  push();
  rectMode(CENTER);

  // 바깥 패널
  noStroke();
  fill(115, 124, 150, hovered ? 255 : 235);
  rect(cx, cy, w + 24, h + 32, 20);

  // 안쪽 카드
  fill(230, 230, 233);
  rect(cx, cy, w, h, 50);

  // 상단 동작 설명
  textAlign(CENTER, TOP);
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(topSize);                 // ★ 카드별 상단 설명 크기
  text(topText, cx, cy - h / 2 + 24);

  // 사람 실루엣 (👤)
  let humanY = cy - 20;
  push();
  textAlign(CENTER, CENTER);
  textSize(72);
  textFont("sans-serif");
  text("👤", cx, humanY);
  pop();

  // 아이콘 (게임별 이모지) 
  let iconY = cy + 70;
  push();
  textAlign(CENTER, CENTER);
  textSize(56);
  textFont("sans-serif");
  text(icon, cx, iconY);
  pop();

  // 아래 제목
  textAlign(CENTER, TOP);
  textFont(fontTemplate);
  textStyle(BOLD);
  textSize(baseTitleSize);           // ★ 항상 18pt
  fill(0);
  text(bottomTitle, cx, cy + h / 2 + 26);

  // 아래 설명 
  textStyle(NORMAL);
  textFont(fontTemplate);
  textSize(baseDescSize);            // ★ 항상 13pt
  fill(40);
  text(bottomDesc, cx, cy + h / 2 + 52);

  pop();
}

// 3단계: 각 게임 페이지 (임시 UI)
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

function mousePressed() {
  // 1단계: START 화면 → 템플릿 화면으로 이동
  if (phase === 1) {
    if (mouseX < 495 && mouseX > 145 && mouseY < 410 && mouseY > 290) {
      phase = 2;
    }
  }
  // 2단계: 템플릿 선택 페이지 — 카드 클릭
  else if (phase === 2) {
    let cardW = CARD_W;
    let cardH = CARD_H;
    let yCenter = CARD_Y;
    let x1 = 110;
    let x2 = width / 2;
    let x3 = width - 110;

    if (isInsideCard(mouseX, mouseY, x1, yCenter, cardW, cardH)) {
      selectedGame = "animal";
      phase = 3;
      scene = 0;
    } else if (isInsideCard(mouseX, mouseY, x2, yCenter, cardW, cardH)) {
      selectedGame = "cooking";
      phase = 3;
      scene = 0;
    } else if (isInsideCard(mouseX, mouseY, x3, yCenter, cardW, cardH)) {
      selectedGame = "house";
      phase = 3;
      scene = 0;
    }
  }
  // 3단계: 이모지 선택
  else if (phase === 3) {
    if (scene === 0) {
      // 아바타(사람/동물) 선택 화면
      mousePressedAvatar();
    } else if (scene === 1) {
      // 사람 이모지 커스터마이징 화면
      mousePressedHumanEmoji();
    } else if (scene === 2) {
      // 동물 이모지 커스터마이징 화면 (나중에 구현)
      mousePressedAnimalEmoji();
    }
  }

  if (phase === 5) {
    let btnX = width / 2;
    let btnY = height - 70;
    let btnW = 220;
    let btnH = 50;

    let hovering =
      mouseX > btnX - btnW / 2 &&
      mouseX < btnX + btnW / 2 &&
      mouseY > btnY - btnH / 2 &&
      mouseY < btnY + btnH / 2;

    if (hovering) {
      resetAllState()
    }
  }
}

function resetAllState() {
  // 1) 화면 단계 기본값
  phase = 1;
  selectedGame = null;
  gameMode = "intro";

  // 2) 각 게임 init 플래그
  animalInited = false;
  cookingInited = false;
  houseInited = false;

  // 3) 동물 키우기 자원 정리
  if (typeof animalVideo !== "undefined" && animalVideo) {
    animalVideo.stop();
    animalVideo = null;
  }
  if (typeof animalHandsfree !== "undefined" && animalHandsfree && animalHandsfree.stop) {
    animalHandsfree.stop();
  }

  // 4) 요리하기 자원 정리
  if (typeof cookVideo !== "undefined" && cookVideo) {
    cookVideo.stop();
    cookVideo = null;
  }
  if (typeof cookBodyPose !== "undefined" && cookBodyPose && cookBodyPose.detectStop) {
    cookBodyPose.detectStop();
  }
  if (typeof cookTracker !== "undefined" && cookTracker && cookTracker.stop) {
    cookTracker.stop();
  }

  // 5) 집 짓기 자원 정리
  if (typeof houseVideo !== "undefined" && houseVideo) {
    houseVideo.stop();
    houseVideo = null;
  }
  if (typeof houseBodyPose !== "undefined" && houseBodyPose && houseBodyPose.detectStop) {
    houseBodyPose.detectStop();
  }

  // 6) 아바타 / 이모지 관련 전역 변수 리셋 (stage2_avatar.js에 있는 애들)
  if (typeof scene !== "undefined") {
    scene = 0;          // 다시 '아바타 선택 화면'부터
  }
  if (typeof humanEmojiStep !== "undefined") {
    humanEmojiStep = 1; // 사람 이모지 커스터마이징 1단계부터
  }
  if (typeof humanComposedImg !== "undefined") {
    humanComposedImg = null;  // 합성된 이모지 초기화
  }

  // 선택 상태들 0으로 리셋
  if (typeof selectedEyeNumber !== "undefined")  selectedEyeNumber = 0;
  if (typeof selectedNoseNumber !== "undefined") selectedNoseNumber = 0;
  if (typeof selectedMouthNum !== "undefined")   selectedMouthNum = 0;
  if (typeof selectedBrowNum !== "undefined")    selectedBrowNum = 0;

  // 머리/악세사리 선택 변수들도 쓰고 있다면 같이 0으로
  if (typeof selectedHairNum !== "undefined") selectedHairNum = 0;
  if (typeof selectedAccNum  !== "undefined") selectedAccNum  = 0;
}

function goToQR() {
  if (animalVideo) animalVideo.stop();
  if (animalHandsfree) animalHandsfree.stop && animalHandsfree.stop();

  if (cookVideo) cookVideo.stop();
  if (cookBodyPose && cookBodyPose.detectStop) cookBodyPose.detectStop();
  if (cookTracker && cookTracker.stop) cookTracker.stop();

  if (houseVideo) houseVideo.stop();
  if (houseBodyPose && houseBodyPose.detectStop) houseBodyPose.detectStop();

  gameMode = "intro";  // 다시 게임으로 안 돌아가게
  phase    = 5;        // QR 단계로 이동
}