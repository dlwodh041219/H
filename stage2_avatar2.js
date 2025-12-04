/********************************************************
 * 전역 상태
 ********************************************************/

// ----- 공통 폰트 -----
let fontTemplate = "sans-serif";

// ----- 씬 관리 -----
// 0: 아바타 선택, 1: 사람 이모지 선택, 2: 동물 이모지 선택, 3: FaceMesh 트래킹
let scene = 0;

let humanCenter;
let animalCenter;
let avatarRadius = 110;

// 사람 이모지 커스터마이징용 변수들
let humanEmojiStep = 1;   // 지금은 안 써도 되지만 그대로 둠

// PNG 자산
let faceImg;
let eyeImg1, eyeImg2, eyeImg3, eyeImg4;
let noseImg1, noseImg2, noseImg3, noseImg4;
let mouthImg1, mouthImg2, mouthImg3, mouthImg4;
let browImg1, browImg2, browImg3, browImg4;

// 선택 상태 (0이면 아무것도 선택 안 됨)
let selectedEyeNumber = 0;
let selectedNoseNumber = 0;
let selectedMouthNum = 0;
let selectedBrowNum = 0;

// 버튼 정보
let humanNextStepBtn = { x: 0, y: 0, w: 130, h: 40 };
let animalNextBtn    = { x: 0, y: 0, w: 130, h: 40 };

let eyeBtn1   = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn2   = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn3   = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn4   = { x: 0, y: 0, w: 35, h: 30 };

let noseBtn1  = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn2  = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn3  = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn4  = { x: 0, y: 0, w: 35, h: 30 };

let mouthBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let browBtn1  = { x: 0, y: 0, w: 35, h: 30 };
let browBtn2  = { x: 0, y: 0, w: 35, h: 30 };
let browBtn3  = { x: 0, y: 0, w: 35, h: 30 };
let browBtn4  = { x: 0, y: 0, w: 35, h: 30 };

let humanEmojiAssetsLoaded = false;  // 지금은 사용 안 하지만 남겨둠

// ----- FaceMesh + 카메라 -----
let faceMesh;
let video;
let faces = [];
let smoothPoints = null;
let SMOOTH_FACTOR = 0; // 0이면 즉각 반응

let faceOptions = {
  maxFaces: 1,
  refineLandmarks: false,
  flipHorizontal: false
};

/********************************************************
 * preload / setup / draw
 ********************************************************/

function preload() {
  // FaceMesh 모델 준비
  faceMesh = ml5.faceMesh(faceOptions);

  // PNG (현재 폴더 기준 이름들)
  faceImg  = loadImage("face.png");

  eyeImg1  = loadImage("eye1.png");
  eyeImg2  = loadImage("eye2.png");
  eyeImg3  = loadImage("eye3.png");
  eyeImg4  = loadImage("eye4.png");

  noseImg1 = loadImage("nose1.png");
  noseImg2 = loadImage("nose2.png");
  noseImg3 = loadImage("nose3.png");
  noseImg4 = loadImage("nose4.png");

  mouthImg1 = loadImage("mouth1.png");
  mouthImg2 = loadImage("mouth2.png");
  mouthImg3 = loadImage("mouth3.png");
  mouthImg4 = loadImage("mouth4.png");

  browImg1 = loadImage("brow1.png");
  browImg2 = loadImage("brow2.png");
  browImg3 = loadImage("brow3.png");
  browImg4 = loadImage("brow4.png");
}

function setup() {
  createCanvas(640, 480);

  // 카메라
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // FaceMesh 시작
  faceMesh.detectStart(video, gotFaces);

  // 아바타 위치 세팅
  setupAvatar();

  textAlign(CENTER, CENTER);
}

function draw() {
  // scene 0~2 : 아바타/이모지 선택 화면
  if (scene === 0 || scene === 1 || scene === 2) {
    drawAvatarScene();
    return;
  }

  // scene 3 : FaceMesh 트래킹 풀스크린
  if (scene === 3) {
    background(0);

    push();
    // 거울처럼 좌우 반전
    translate(width, 0);
    scale(-1, 1);

    image(video, 0, 0, width, height);
    drawEmojiFace(); // 선택된 PNG 파츠 얼굴을 코 기준으로 트래킹

    pop();
  }
}

function gotFaces(results) {
  faces = results;
}

/********************************************************
 * 0~2번 씬 : 아바타/이모지 선택
 ********************************************************/

function setupAvatar() {
  humanCenter  = createVector(width / 2 - 140, height / 2 + 10);
  animalCenter = createVector(width / 2 + 140, height / 2 + 10);
}

function drawAvatarScene() {
  background(214, 240, 249);

  if (scene === 0) {
    drawAvatarSelect();
  } else if (scene === 1) {
    drawHumanEmojiPage();
  } else if (scene === 2) {
    drawAnimalEmojiPage();
  }
}

// ----- scene 0: 아바타 선택 화면 -----
function drawAvatarSelect() {
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

/********************************************************
 * scene 1: 사람 이모지 선택 화면
 *  - 왼쪽: 실시간 캠 + FaceMesh + 선택 이모지 얼굴
 *  - 오른쪽: 파츠 선택 UI
 ********************************************************/

function drawHumanEmojiPage() {
  background(215, 240, 249);

  let margin = 40;

  // 상단 바: 제목
  push();
  fill(0);
  noStroke();
  textFont(fontTemplate);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  textSize(24);
  text("이모지 커스텀", margin, margin);
  textStyle(NORMAL);
  pop();

  // 오른쪽 상단 버튼: 항상 "게임 시작 >"
  humanNextStepBtn.w = 130;
  humanNextStepBtn.h = 38;
  humanNextStepBtn.x = width - humanNextStepBtn.w - margin;
  humanNextStepBtn.y = margin - humanNextStepBtn.h / 2;

  let over = isMouseOver(humanNextStepBtn);

  push();
  rectMode(CORNER);
  stroke(0);
  strokeWeight(1.5);
  if (over) {
    fill(255, 230, 160);   // hover
  } else {
    fill(245, 215, 140);   // 기본
  }
  rect(
    humanNextStepBtn.x,
    humanNextStepBtn.y,
    humanNextStepBtn.w,
    humanNextStepBtn.h,
    10
  );

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textSize(16);
  text(
    "게임 시작 >",
    humanNextStepBtn.x + humanNextStepBtn.w / 2,
    humanNextStepBtn.y + humanNextStepBtn.h / 2
  );
  pop();

  // 왼쪽: 실시간 캠 + 이모지 얼굴 미리보기
  // 오른쪽: 파츠 선택 UI
  drawHumanEmojiStep1(margin);
}

function drawHumanEmojiStep1(margin) {
  // --- 왼쪽 캠 + 이모지 패널 영역 ---
  let panelX = margin
  let panelY = margin * 2
  let panelW = width / 2 - 2 * margin
  let panelH = height - margin * 3

  // 패널 배경
  push()
  noStroke()
  fill(220)
  rect(panelX, panelY, panelW, panelH)
  pop()

  // ============================
  // 왼쪽: 정비율 캠 + 이모지 얼굴 (좌우반전, 양옆 크롭)
  // ============================
  if (video && video.width > 0 && video.height > 0) {
    // 전체 캔버스(640x480) 기준으로 세로에 맞춰 축소
    let s = panelH / height          // 높이에 맞춰서만 스케일 → 4:3 유지
    let scaledW = width * s          // 스케일된 비디오 가로
    // 패널 중앙 기준 위치
    let centerX = panelX + panelW / 2
    let centerY = panelY + panelH / 2

    push()
    drawingContext.save()

    // 패널 밖은 잘라내기 (양옆 크롭)
    drawingContext.beginPath()
    drawingContext.rect(panelX, panelY, panelW, panelH)
    drawingContext.clip()

    // 패널 중앙으로 이동 후, 전체 비디오/이모지 스케일 + 좌우반전
    translate(centerX, centerY)
    scale(s)
    // 원본(0,0) 기준으로 가운데 오도록 이동
    translate(-width / 2, -height / 2)
    // 거울처럼 좌우 반전
    translate(width, 0)
    scale(-1, 1)

    // 여기서부터는 scene 3이랑 동일한 좌표계 (640x480 기준)
    image(video, 0, 0, width, height)
    drawEmojiFace()  // 같은 변환 아래에서 그리니까 캠과 정확히 정렬됨

    drawingContext.restore()
    pop()
  }

  // ============================
  // 오른쪽 파츠 선택 UI (이전 로직 그대로)
  // ============================

  textSize(15)
  text("눈썹", width / 2, margin + 20)
  text("눈",   width / 2, margin + 120)
  text("코",   width / 2, margin + 220)
  text("입",   width / 2, margin + 320)

  let intervalY = (height - 2 * margin) / 4
  let intervalX = (width / 2) / 4

  // 배경용 기본 얼굴들
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width / 2 + i, 2 * margin + j, 80, 60)
    }
  }

  // 눈 버튼
  eyeBtn1.x = width / 2 + 23
  eyeBtn1.y = 2 * margin + intervalY + 10

  eyeBtn2.x = width / 2 + intervalX + 23
  eyeBtn2.y = 2 * margin + intervalY + 10

  eyeBtn3.x = width / 2 + intervalX * 2 + 23
  eyeBtn3.y = 2 * margin + intervalY + 10

  eyeBtn4.x = width / 2 + intervalX * 3 + 23
  eyeBtn4.y = 2 * margin + intervalY + 10

  // 코 버튼
  noseBtn1.x = width / 2 + 23
  noseBtn1.y = 2 * margin + intervalY * 2 + 20

  noseBtn2.x = width / 2 + intervalX + 23
  noseBtn2.y = 2 * margin + intervalY * 2 + 20

  noseBtn3.x = width / 2 + intervalX * 2 + 23
  noseBtn3.y = 2 * margin + intervalY * 2 + 20

  noseBtn4.x = width / 2 + intervalX * 3 + 23
  noseBtn4.y = 2 * margin + intervalY * 2 + 20

  // 입 버튼
  mouthBtn1.x = width / 2 + 23
  mouthBtn1.y = 2 * margin + intervalY * 3 + 30

  mouthBtn2.x = width / 2 + intervalX + 23
  mouthBtn2.y = 2 * margin + intervalY * 3 + 30

  mouthBtn3.x = width / 2 + intervalX * 2 + 23
  mouthBtn3.y = 2 * margin + intervalY * 3 + 30

  mouthBtn4.x = width / 2 + intervalX * 3 + 23
  mouthBtn4.y = 2 * margin + intervalY * 3 + 30

  // 눈썹 버튼
  browBtn1.x = width / 2 + 23
  browBtn1.y = 2 * margin + 10

  browBtn2.x = width / 2 + intervalX + 23
  browBtn2.y = 2 * margin + 10

  browBtn3.x = width / 2 + intervalX * 2 + 23
  browBtn3.y = 2 * margin + 10

  browBtn4.x = width / 2 + intervalX * 3 + 23
  browBtn4.y = 2 * margin + 10

  // 파츠 버튼 그리기
  drawButton(eyeImg1, eyeBtn1)
  drawButton(eyeImg2, eyeBtn2)
  drawButton(eyeImg3, eyeBtn3)
  drawButton(eyeImg4, eyeBtn4)

  drawButton(noseImg1, noseBtn1)
  drawButton(noseImg2, noseBtn2)
  drawButton(noseImg3, noseBtn3)
  drawButton(noseImg4, noseBtn4)

  drawButton(mouthImg1, mouthBtn1)
  drawButton(mouthImg2, mouthBtn2)
  drawButton(mouthImg3, mouthBtn3)
  drawButton(mouthImg4, mouthBtn4)

  drawButton(browImg1, browBtn1)
  drawButton(browImg2, browBtn2)
  drawButton(browImg3, browBtn3)
  drawButton(browImg4, browBtn4)
}


function isHumanStep1Complete() {
  return (
    selectedEyeNumber !== 0 &&
    selectedNoseNumber !== 0 &&
    selectedMouthNum !== 0 &&
    selectedBrowNum !== 0
  );
}

function drawHumanEmojiStep2(margin) {
  background(215, 240, 249);

  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textStyle(BOLD);
  fill(0);
  textSize(22);
  text("이모지 커스텀 2단계 화면 (나중에 구현)", width / 2, height / 2);
  textStyle(NORMAL);
  pop();
}

// 버튼 그리기 + 커지기
function drawButton(img, btn) {
  let hover = isMouseOver(btn);
  let scale = hover ? 1.3 : 1;

  let w = btn.w * scale;
  let h = btn.h * scale;

  image(img, btn.x - (w - btn.w) / 2, btn.y - (h - btn.h) / 2, w, h);
}

// 마우스 버튼 위에 있는지 체크
function isMouseOver(btn) {
  return (
    mouseX >= btn.x &&
    mouseX <= btn.x + btn.w &&
    mouseY >= btn.y &&
    mouseY <= btn.y + btn.h
  );
}

/********************************************************
 * scene 2: 동물 이모지 선택 (임시)
 ********************************************************/

function drawAnimalEmojiPage() {
  background(214, 240, 249);

  let margin = 40;

  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textStyle(BOLD);
  fill(0);
  textSize(24);
  text("동물 이모지 선택 화면 (나중에 구현)", width / 2, height / 2);
  textStyle(NORMAL);
  pop();

  animalNextBtn.w = 130;
  animalNextBtn.h = 38;
  animalNextBtn.x = width - animalNextBtn.w - margin;
  animalNextBtn.y = margin - animalNextBtn.h / 2;

  let over = isMouseOver(animalNextBtn);

  push();
  rectMode(CORNER);
  stroke(0);
  strokeWeight(1.5);
  if (over) {
    fill(255, 230, 160);
  } else {
    fill(245, 215, 140);
  }
  rect(
    animalNextBtn.x,
    animalNextBtn.y,
    animalNextBtn.w,
    animalNextBtn.h,
    10
  );

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textSize(16);
  text(
    "게임 시작 >",
    animalNextBtn.x + animalNextBtn.w / 2,
    animalNextBtn.y + animalNextBtn.h / 2
  );
  pop();
}

/********************************************************
 * 마우스 입력
 ********************************************************/

function mousePressed() {
  if (scene === 0) {
    mousePressedAvatar();
  } else if (scene === 1) {
    mousePressedHumanEmoji();
  } else if (scene === 2) {
    mousePressedAnimalEmoji();
  }
}

function mousePressedAvatar() {
  if (scene === 0) {
    if (dist(mouseX, mouseY, humanCenter.x, humanCenter.y) < avatarRadius) {
      scene = 1;    // 사람 이모지 커스텀
    } else if (dist(mouseX, mouseY, animalCenter.x, animalCenter.y) < avatarRadius) {
      scene = 2;    // 동물 (임시)
    }
  }
}

function mousePressedHumanEmoji() {
  // 눈 버튼
  if (isMouseOver(eyeBtn1)) {
    selectedEyeNumber = selectedEyeNumber === 1 ? 0 : 1;
  } else if (isMouseOver(eyeBtn2)) {
    selectedEyeNumber = selectedEyeNumber === 2 ? 0 : 2;
  } else if (isMouseOver(eyeBtn3)) {
    selectedEyeNumber = selectedEyeNumber === 3 ? 0 : 3;
  } else if (isMouseOver(eyeBtn4)) {
    selectedEyeNumber = selectedEyeNumber === 4 ? 0 : 4;
  }

  // 코 버튼
  if (isMouseOver(noseBtn1)) {
    selectedNoseNumber = selectedNoseNumber === 1 ? 0 : 1;
  } else if (isMouseOver(noseBtn2)) {
    selectedNoseNumber = selectedNoseNumber === 2 ? 0 : 2;
  } else if (isMouseOver(noseBtn3)) {
    selectedNoseNumber = selectedNoseNumber === 3 ? 0 : 3;
  } else if (isMouseOver(noseBtn4)) {
    selectedNoseNumber = selectedNoseNumber === 4 ? 0 : 4;
  }

  // 입 버튼
  if (isMouseOver(mouthBtn1)) {
    selectedMouthNum = selectedMouthNum === 1 ? 0 : 1;
  } else if (isMouseOver(mouthBtn2)) {
    selectedMouthNum = selectedMouthNum === 2 ? 0 : 2;
  } else if (isMouseOver(mouthBtn3)) {
    selectedMouthNum = selectedMouthNum === 3 ? 0 : 3;
  } else if (isMouseOver(mouthBtn4)) {
    selectedMouthNum = selectedMouthNum === 4 ? 0 : 4;
  }

  // 눈썹 버튼
  if (isMouseOver(browBtn1)) {
    selectedBrowNum = selectedBrowNum === 1 ? 0 : 1;
  } else if (isMouseOver(browBtn2)) {
    selectedBrowNum = selectedBrowNum === 2 ? 0 : 2;
  } else if (isMouseOver(browBtn3)) {
    selectedBrowNum = selectedBrowNum === 3 ? 0 : 3;
  } else if (isMouseOver(browBtn4)) {
    selectedBrowNum = selectedBrowNum === 4 ? 0 : 4;
  }

  // 오른쪽 위 "게임 시작 >" 버튼 → 풀스크린 트래킹으로
  if (isMouseOver(humanNextStepBtn)) {
    scene = 3;
  }
}

function mousePressedAnimalEmoji() {
  if (isMouseOver(animalNextBtn)) {
    scene = 3;
  }
}

/********************************************************
 * FaceMesh + 선택 이모지 병합 얼굴 그리기
 ********************************************************/

// 선택한 PNG 파츠를 한 얼굴처럼 코 기준으로 따라가게
function drawEmojiFace() {
  if (faces.length === 0) {
    smoothPoints = null;
    return;
  }

  let face = faces[0];
  let keypoints = face.keypoints;
  if (!keypoints || keypoints.length <= 386) return;

  let current = [];
  for (let i = 0; i < keypoints.length; i++) {
    current[i] = [keypoints[i].x, keypoints[i].y];
  }

  if (!smoothPoints) {
    smoothPoints = current.map(function (p) { return [p[0], p[1]]; });
  } else {
    for (let i = 0; i < current.length; i++) {
      smoothPoints[i][0] = lerp(
        smoothPoints[i][0],
        current[i][0],
        1 - SMOOTH_FACTOR
      );
      smoothPoints[i][1] = lerp(
        smoothPoints[i][1],
        current[i][1],
        1 - SMOOTH_FACTOR
      );
    }
  }

  let pt = function (idx) {
    if (!smoothPoints[idx]) return null;
    return createVector(smoothPoints[idx][0], smoothPoints[idx][1]);
  };

  let avg = function (indices) {
    let sx = 0;
    let sy = 0;
    let cnt = 0;
    for (let i = 0; i < indices.length; i++) {
      let p = pt(indices[i]);
      if (p) {
        sx += p.x;
        sy += p.y;
        cnt++;
      }
    }
    if (cnt === 0) return null;
    return createVector(sx / cnt, sy / cnt);
  };

  // 왼쪽/오른쪽 눈, 코 위치
  let leftEye  = avg([362, 263, 386, 374]);
  let rightEye = avg([133, 33, 159, 145]);
  let nose     = pt(1);

  if (!leftEye || !rightEye || !nose) return;

  let eyeDist = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y);

  let dx = leftEye.x - rightEye.x;
  let dy = leftEye.y - rightEye.y;
  let angle = atan2(dy, dx);

  // 크기 (직전 버전과 동일)
  let BASE_EYE_DIST = 60;
  let SCALE_GAIN    = 1.4;
  let scaleFactor   = (eyeDist / BASE_EYE_DIST) * SCALE_GAIN;

  let FACE_W   = 190;
  let FACE_H   = 160;
  let PART_W   = 85;
  let PART_H   = 65;

  let EYE_OFFSET_Y   = -20;
  let NOSE_OFFSET_Y  = 15;
  let MOUTH_OFFSET_Y = 50;
  let BROW_OFFSET_Y  = -45;

  // 코 기준에서 전체 이모지 얼굴을 위로 살짝 올리는 양
  // 값 키우면 더 위로 올라감
  let GLOBAL_SHIFT_Y = 18;

  noStroke();

  push();
  translate(nose.x, nose.y);
  rotate(angle);
  scale(scaleFactor);

  // 얼굴 축 방향으로 전체를 위로 이동
  translate(0, -GLOBAL_SHIFT_Y);

  imageMode(CENTER);

  // 얼굴 베이스
  if (faceImg) {
    image(faceImg, 0, 0, FACE_W, FACE_H);
  }

  // 눈
  let eyeImg = null;
  if (selectedEyeNumber === 1) eyeImg = eyeImg1;
  else if (selectedEyeNumber === 2) eyeImg = eyeImg2;
  else if (selectedEyeNumber === 3) eyeImg = eyeImg3;
  else if (selectedEyeNumber === 4) eyeImg = eyeImg4;

  if (eyeImg) {
    image(eyeImg, 0, EYE_OFFSET_Y, PART_W, PART_H);
  }

  // 코
  let noseImg = null;
  if (selectedNoseNumber === 1) noseImg = noseImg1;
  else if (selectedNoseNumber === 2) noseImg = noseImg2;
  else if (selectedNoseNumber === 3) noseImg = noseImg3;
  else if (selectedNoseNumber === 4) noseImg = noseImg4;

  if (noseImg) {
    image(noseImg, 0, NOSE_OFFSET_Y, PART_W, PART_H);
  }

  // 입
  let mouthImg = null;
  if (selectedMouthNum === 1) mouthImg = mouthImg1;
  else if (selectedMouthNum === 2) mouthImg = mouthImg2;
  else if (selectedMouthNum === 3) mouthImg = mouthImg3;
  else if (selectedMouthNum === 4) mouthImg = mouthImg4;

  if (mouthImg) {
    image(mouthImg, 0, MOUTH_OFFSET_Y, PART_W, PART_H);
  }

  // 눈썹
  let browImg = null;
  if (selectedBrowNum === 1) browImg = browImg1;
  else if (selectedBrowNum === 2) browImg = browImg2;
  else if (selectedBrowNum === 3) browImg = browImg3;
  else if (selectedBrowNum === 4) browImg = browImg4;

  if (browImg) {
    image(browImg, 0, BROW_OFFSET_Y, PART_W, PART_H);
  }

  pop();

  imageMode(CORNER);
}
