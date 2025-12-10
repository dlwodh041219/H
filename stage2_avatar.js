//------------------------------------------------------
// 기존 전역 상태 + FaceMesh 추가
//------------------------------------------------------

let scene = 0;         // 0: 아바타 선택, 1: 사람 이모지 선택, 2: 동물 이모지 선택
let humanCenter;
let animalCenter;
let avatarRadius = 110;
let humanComposedImg = null;

// 사람 이모지 커스터마이징용 변수들
let humanEmojiStep = 1;

let faceImg;
let eyeImg1, eyeImg2, eyeImg3, eyeImg4; 
let noseImg1, noseImg2, noseImg3, noseImg4;
let mouthImg1, mouthImg2, mouthImg3, mouthImg4;
let browImg1, browImg2, browImg3, browImg4;

let hairImg1, hairImg2, hairImg3, hairImg4, hairImg5, hairImg6, hairImg7, hairImg8;
let accImg1, accImg2, accImg3, accImg4;
let glassImg1, glassImg2, glassImg3, glassImg4;

// 선택 상태 (0이면 아무것도 선택 안 됨)
let selectedEyeNumber = 0;
let selectedNoseNumber = 0;
let selectedMouthNum = 0;
let selectedBrowNum = 0;
let selectedHairNum = 0;
let selectedAccNum  = 0;
let selectedGlassNum = 0;
let humanFaceRegion = { x: 0, y: 0, w: 0, h: 0 };

// 버튼 정보
let humanNextStepBtn = { x: 0, y: 0, w: 130, h: 40 };
let animalNextBtn = { x: 0, y: 0, w: 130, h: 40 };
let humanBackBtn = { x: 0, y: 0, w: 0, h: 0 };

let eyeBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let noseBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let mouthBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let mouthBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let browBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let browBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let browBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let browBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let hairBtn1 = { x: 0, y: 0, w: 32, h: 29 };
let hairBtn2 = { x: 0, y: 0, w: 33, h: 29 };
let hairBtn3 = { x: 0, y: 0, w: 35, h: 35 };
let hairBtn4 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn5 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn6 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn7 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn8 = { x: 0, y: 0, w: 35, h: 30 };

let accBtn1  = { x: 0, y: 0, w: 33, h: 30 };
let accBtn2  = { x: 0, y: 0, w: 33, h: 30 };
let accBtn3  = { x: 0, y: 0, w: 35, h: 30 };
let accBtn4  = { x: 0, y: 0, w: 31, h: 30 };
let glassBtn1 = { x: 0, y: 0, w: 33, h: 30 };
let glassBtn2 = { x: 0, y: 0, w: 33, h: 30 };
let glassBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let glassBtn4 = { x: 0, y: 0, w: 31, h: 30 };

let humanEmojiAssetsLoaded = false;

//------------------------------------------------------
// FaceMesh + 카메라 전역 (새로 추가된 부분)
//------------------------------------------------------

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
let faceMeshReady = false;

// fontTemplate, phase, gameMode, gameIntroStartTime 등은
// main 스케치에서 전역으로 이미 있다고 가정

//------------------------------------------------------
// 아바타 초기 위치
//------------------------------------------------------
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

//------------------------------------------------------
// scene 0: 아바타 선택 화면
//------------------------------------------------------

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
  
  let backW = 80;
  let backH = 34;
  let backX = 42;
  let backY = 23;

  let hovering =
    mouseX > backX - backW / 2 &&
    mouseX < backX + backW / 2 &&
    mouseY > backY - backH / 2 &&
    mouseY < backY + backH / 2;

  push();
  rectMode(CENTER);
  stroke(0);
  strokeWeight(1.5);
  fill(hovering ? color(250, 210, 120) : color(230, 190, 140));
  rect(backX, backY, backW, backH, 10);

  fill(0);
  noStroke();
  textFont(fontTemplate);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("< 이전", backX, backY);
  pop();
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

//------------------------------------------------------
// scene 1: 사람 이모지 선택 화면
//------------------------------------------------------

function loadHumanEmojiAssets() {
  if (humanEmojiAssetsLoaded) return;

  faceImg  = loadImage('emojiImage/face.png');

  eyeImg1  = loadImage('emojiImage/eye1.png');
  eyeImg2  = loadImage('emojiImage/eye2.png');
  eyeImg3  = loadImage('emojiImage/eye3.png');
  eyeImg4  = loadImage('emojiImage/eye4.png');

  noseImg1 = loadImage('emojiImage/nose1.png');
  noseImg2 = loadImage('emojiImage/nose2.png');
  noseImg3 = loadImage('emojiImage/nose3.png');
  noseImg4 = loadImage('emojiImage/nose4.png');

  mouthImg1 = loadImage('emojiImage/mouth1.png');
  mouthImg2 = loadImage('emojiImage/mouth2.png');
  mouthImg3 = loadImage('emojiImage/mouth3.png');
  mouthImg4 = loadImage('emojiImage/mouth4.png');

  browImg1 = loadImage('emojiImage/lash1.png');
  browImg2 = loadImage('emojiImage/brow2.png');
  browImg3 = loadImage('emojiImage/brow3.png');
  browImg4 = loadImage('emojiImage/brow4.png');

  hairImg1 = loadImage('emojiImage/hair1.png');
  hairImg2 = loadImage('emojiImage/hair2.png');
  hairImg3 = loadImage('emojiImage/hair3.png');
  hairImg4 = loadImage('emojiImage/hair4.png');
  hairImg5 = loadImage('emojiImage/hair5.png');
  hairImg6 = loadImage('emojiImage/hair6.png');
  hairImg7 = loadImage('emojiImage/hair7.png');
  hairImg8 = loadImage('emojiImage/hair8.png');

  accImg1 = loadImage('emojiImage/acc1.png');
  accImg2 = loadImage('emojiImage/acc2.png');
  accImg3 = loadImage('emojiImage/acc3.png');
  accImg4 = loadImage('emojiImage/acc4.png');
  glassImg1 = loadImage('emojiImage/acc5.png');
  glassImg2 = loadImage('emojiImage/acc6.png');
  glassImg3 = loadImage('emojiImage/acc7.png');
  glassImg4 = loadImage('emojiImage/acc8.png');
  
  humanEmojiAssetsLoaded = true;
}

function drawHumanEmojiPage() {
  loadHumanEmojiAssets();
  background(215, 240, 249);

  // ★ FaceMesh 초기화 (카메라 + 모델 로딩)
  initFaceMesh();

  let margin = 40;

  // 🔹 공통 Back 버튼 위치 설정
  humanBackBtn.w = 80;
  humanBackBtn.h = 34;
  humanBackBtn.x = margin;
  humanBackBtn.y = margin - humanBackBtn.h / 2;

  // 상단 바: 제목 + '다음 단계 >' 버튼
  push();
  fill(0);
  noStroke();
  textFont(fontTemplate);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(24);

  let titleText =
    humanEmojiStep === 1 ? "이모지 커스텀 1단계" : "이모지 커스텀 2단계";
  text(titleText, width / 2, margin);
  pop();
  
  // 왼쪽 위 Back 버튼 그리기
  let overBack = isMouseOver(humanBackBtn);
  push();
  rectMode(CORNER);
  stroke(0);
  strokeWeight(1.5);
  fill(overBack ? color(250,210,120) : color(230,190,140));
  rect(humanBackBtn.x, humanBackBtn.y, humanBackBtn.w, humanBackBtn.h, 10);

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  textSize(14);
  text("< 이전", humanBackBtn.x + humanBackBtn.w/2, humanBackBtn.y + humanBackBtn.h/2);
  pop();

  humanNextStepBtn.w = 130;
  humanNextStepBtn.h = 38;
  humanNextStepBtn.x = width - humanNextStepBtn.w - margin;
  humanNextStepBtn.y = margin - humanNextStepBtn.h / 2;

  if (humanEmojiStep === 1) {
    // 1단계: "다음 단계 >" (모든 부위 선택되어야 활성)
    let ready = isHumanStep1Complete();
    let over  = isMouseOver(humanNextStepBtn);

    push();
    rectMode(CORNER);
    stroke(0);
    strokeWeight(1.5);
    if (!ready) {
      fill(200);                             // 비활성(회색)
    } else if (over) {
      fill(255, 230, 160);                   // 활성 + hover
    } else {
      fill(245, 215, 140);                   // 활성 기본
    }
    rect(
      humanNextStepBtn.x,
      humanNextStepBtn.y,
      humanNextStepBtn.w,
      humanNextStepBtn.h,
      10
    );

    fill(ready ? 0 : 120);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont(fontTemplate);
    textSize(16);
    text(
      "다음 단계 >",
      humanNextStepBtn.x + humanNextStepBtn.w / 2,
      humanNextStepBtn.y + humanNextStepBtn.h / 2
    );
    pop();

  } else if (humanEmojiStep === 2) {
    // 2단계: "게임 시작 >" (항상 눌러도 됨)
    let over = isMouseOver(humanNextStepBtn);

    push();
    rectMode(CORNER);
    stroke(0);
    strokeWeight(1.5);
    fill(over ? color(255,230,160) : color(245,215,140));
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
  }

  // 1단계 / 2단계 화면 분기
  if (humanEmojiStep === 1) {
    drawHumanEmojiStep1(margin);
  } else if (humanEmojiStep === 2) {
    drawHumanEmojiStep2(margin);
  }
}

function drawHumanEmojiStep1(margin) {
  humanFaceRegion.x = margin;
  humanFaceRegion.y = margin * 2;
  humanFaceRegion.w = width / 2 - 2 * margin;
  humanFaceRegion.h = height - margin * 3;

  // 왼쪽 얼굴 영역 배경
  push();
  fill(220);
  noStroke();
  rect(humanFaceRegion.x, humanFaceRegion.y, humanFaceRegion.w, humanFaceRegion.h);
  pop();

  // ★ 카메라 + FaceMesh 이모지 (1단계에서도 얼굴 따라다님)
  if (video) {
    drawFacePanelWithCamera(
      humanFaceRegion.x,
      humanFaceRegion.y,
      humanFaceRegion.w,
      humanFaceRegion.h
    );
  } else {
    // 카메라 초기화 전/실패 시 예전 고정 이모지 로직 유지 (fallback)
    push();
    imageMode(CENTER);
    image(faceImg, width / 4, height * 2 / 5, 160, 130);
    
    if (selectedEyeNumber === 1) {
      image(eyeImg1, width/4, height*2/5, 60, 45);
    } else if (selectedEyeNumber === 2) {
      image(eyeImg2, width/4, height*2/5, 60, 45);
    } else if (selectedEyeNumber === 3) {
      image(eyeImg3, width/4, height*2/5, 60, 45);
    } else if (selectedEyeNumber === 4) {
      image(eyeImg4, width/4, height*2/5, 60, 45);
    }
    
    if (selectedNoseNumber === 1){
      image(noseImg1, width/4,210,60,45);
    } else if(selectedNoseNumber ===2){
      image(noseImg2, width/4, 210, 60, 45);
    } else if(selectedNoseNumber === 3){
      image(noseImg3, width/4, 210, 60, 45);
    } else if(selectedNoseNumber === 4){
      image(noseImg4, width/4, 210, 60, 45);
    }
    
    if (selectedMouthNum === 1){
      image(mouthImg1, width/4, 230,60,45);
    } else if (selectedMouthNum === 2){
      image(mouthImg2, width/4,230,60,45);
    } else if (selectedMouthNum === 3){
      image(mouthImg3,width/4,230,60,45);
    } else if (selectedMouthNum === 4){
      image(mouthImg4,width/4,230,50,35);
    }
    
    if (selectedBrowNum === 1){
      image(browImg1, width/4,180,60,45);
    } else if (selectedBrowNum === 2){
      image(browImg2, width/4,180,60,45);
    } else if (selectedBrowNum === 3){
      image(browImg3,width/4,180,60,45);
    } else if (selectedBrowNum === 4){
      image(browImg4,width/4,180,60,45);
    }
    pop();
  }

  // 오른쪽 파츠 라벨
  push();
  let intervalX = (width/2) / 4;
  let intervalY = (height - 2*margin) / 4;

  textFont(fontTemplate)
  textSize(15);
  fill(0);
  noStroke();
  text('눈썹', width/2 - 18, margin + intervalY - 22)
  text('눈',width/2 - 18, margin + intervalY - 22 + 100)
  text('코',width/2 - 18, margin + intervalY - 22 + 200)
  text('입',width/2 - 18, margin + intervalY - 22 + 300)
  pop();

  // 기본 얼굴들 반복 출력
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width/2 + i, 2*margin + j,80,60);
    }
  }

  // 눈 버튼 위치 설정
  eyeBtn1.x = width/2+23;
  eyeBtn1.y = 2*margin + intervalY +15;

  eyeBtn2.x = width/2 + intervalX + 23;
  eyeBtn2.y = 2*margin + intervalY + 15;
  
  eyeBtn3.x = width/2 + intervalX*2 + 23;
  eyeBtn3.y = 2*margin + intervalY + 15;
  
  eyeBtn4.x = width/2 + intervalX*3 + 23;
  eyeBtn4.y = 2*margin + intervalY + 15;
  
  // 코 버튼 위치
  noseBtn1.x = width/2+23;
  noseBtn1.y = 2*margin + intervalY*2 +25;

  noseBtn2.x = width/2 + intervalX + 23;
  noseBtn2.y = 2*margin + intervalY*2 + 25;
  
  noseBtn3.x = width/2 + intervalX*2 + 23;
  noseBtn3.y = 2*margin + intervalY*2 + 25;
  
  noseBtn4.x = width/2 + intervalX*3 + 23;
  noseBtn4.y = 2*margin + intervalY*2 + 25;
  
  // 입 버튼 위치
  mouthBtn1.x = width/2 + 23
  mouthBtn1.y = 2*margin + intervalY*3 +30;

  mouthBtn2.x = width/2 + intervalX + 23;
  mouthBtn2.y = 2*margin + intervalY*3 + 30;
  
  mouthBtn3.x = width/2 + intervalX*2 + 23;
  mouthBtn3.y = 2*margin + intervalY*3 + 30;
  
  mouthBtn4.x = width/2 + intervalX*3 + 23;
  mouthBtn4.y = 2*margin + intervalY*3 + 30;
  
  // 눈썹 버튼 위치
  browBtn1.x = width/2 + 23
  browBtn1.y = 2*margin + 10;

  browBtn2.x = width/2 + intervalX + 23;
  browBtn2.y = 2*margin + 10;
  
  browBtn3.x = width/2 + intervalX*2 + 23;
  browBtn3.y = 2*margin + 10;
  
  browBtn4.x = width/2 + intervalX*3 + 23;
  browBtn4.y = 2*margin + 10;
  

  drawButton(eyeImg1, eyeBtn1);
  drawButton(eyeImg2, eyeBtn2);
  drawButton(eyeImg3, eyeBtn3);
  drawButton(eyeImg4, eyeBtn4);
  
  drawButton(noseImg1, noseBtn1);
  drawButton(noseImg2, noseBtn2);
  drawButton(noseImg3, noseBtn3);
  drawButton(noseImg4, noseBtn4);
  
  drawButton(mouthImg1, mouthBtn1);
  drawButton(mouthImg2, mouthBtn2);
  drawButton(mouthImg3, mouthBtn3);
  drawButton(mouthImg4, mouthBtn4);
  
  drawButton(browImg1, browBtn1);
  drawButton(browImg2, browBtn2);
  drawButton(browImg3, browBtn3);
  drawButton(browImg4, browBtn4);
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
  humanFaceRegion.x = margin;
  humanFaceRegion.y = margin * 2;
  humanFaceRegion.w = width / 2 - 2 * margin;
  humanFaceRegion.h = height - margin * 3;

  // 왼쪽 영역 배경
  push();
  fill(220);
  noStroke();
  rect(humanFaceRegion.x, humanFaceRegion.y, humanFaceRegion.w, humanFaceRegion.h);
  pop();

  // ★ 2단계에서도 FaceMesh 기반 이모지 + 헤어/악세사리 따라다니도록
  if (video) {
    drawFacePanelWithCamera(
      humanFaceRegion.x,
      humanFaceRegion.y,
      humanFaceRegion.w,
      humanFaceRegion.h
    );
  } else {
    // 카메라 없을 때는 기존 정지 이미지 + 헤어/악세사리 그대로
    push();
    imageMode(CENTER);
    let faceCenterX = width / 4;
    let faceCenterY = height * 2 / 5;

    if (humanComposedImg) {
      let targetW = 210;
      let ratio = humanComposedImg.height / humanComposedImg.width;
      let targetH = targetW * ratio;
      image(humanComposedImg, faceCenterX, faceCenterY, targetW, targetH);
    } else {
      image(faceImg, faceCenterX, faceCenterY, 210, 170);
    }

    let hairWidth  = 200;
    let hairHeight = 200;

    // 헤어
    if (selectedHairNum === 1)      image(hairImg1, faceCenterX, faceCenterY + 10, hairWidth, hairHeight);
    else if (selectedHairNum === 2) image(hairImg2, faceCenterX, faceCenterY + 5 , hairWidth, hairHeight);
    else if (selectedHairNum === 3) image(hairImg3, faceCenterX, faceCenterY, hairWidth, hairHeight);
    else if (selectedHairNum === 4) image(hairImg4, faceCenterX, faceCenterY, hairWidth, hairHeight);
    else if (selectedHairNum === 5) image(hairImg5, faceCenterX, faceCenterY + 3, hairWidth, hairHeight);
    else if (selectedHairNum === 6) image(hairImg6, faceCenterX, faceCenterY, hairWidth, hairHeight);
    else if (selectedHairNum === 7) image(hairImg7, faceCenterX, faceCenterY, hairWidth, hairHeight);
    else if (selectedHairNum === 8) image(hairImg8, faceCenterX, faceCenterY, hairWidth, hairHeight);

    // 악세사리
    if (selectedAccNum === 1)      image(accImg1, faceCenterX, faceCenterY, 200, 200);
    else if (selectedAccNum === 2) image(accImg2, faceCenterX, faceCenterY, 200, 200);
    else if (selectedAccNum === 3) image(accImg3, faceCenterX, faceCenterY , 200, 200);
    else if (selectedAccNum === 4) image(accImg4, faceCenterX, faceCenterY , 200, 200);

    // 안경
    if (selectedGlassNum === 1) {
      image(glassImg1,faceCenterX, faceCenterY+5, 200, 200)
    } else if (selectedGlassNum ===2 ){
      image(glassImg2, faceCenterX + 0.5, faceCenterY+5, 200, 200)
    } else if (selectedGlassNum ===3){
      image(glassImg3, faceCenterX, faceCenterY+5, 230, 235)
    } else if (selectedGlassNum === 4 ){
      image(glassImg4,faceCenterX, faceCenterY+5, 230, 235)
    }

    pop();
  }

  // 오른쪽 파트: 버튼 배치
  push();
  let intervalY = (height - 2 * margin) / 4;
  let intervalX = (width / 2) / 4;

  textFont(fontTemplate)
  textSize(15);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(0);
  text('헤어', width/2 - 18, margin + intervalY - 26);
  text('소품', width/2 - 18, margin + intervalY - 26 + 200);
  text('안경',width/2 - 18, margin + intervalY - 26 + 300);
  pop();

  // 기본 얼굴들 반복 출력 (배경 장식용)
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width / 2 + i, 2 * margin + j, 80, 60);
    }
  }

  // --- 헤어 버튼 위치 ---
  let intervalX2 = (width / 2) / 4;
  let intervalY2 = (height - 2 * margin) / 4;

  hairBtn1.x = width/2+23;
  hairBtn1.y = 2*margin+15;

  hairBtn2.x = width/2 + intervalX2 + 23;
  hairBtn2.y = 2*margin+15;
  
  hairBtn3.x = width/2 + intervalX2*2 + 23;
  hairBtn3.y = 2*margin + 15;
  
  hairBtn4.x = width/2 + intervalX2*3 + 23;
  hairBtn4.y = 2*margin + 15;
  
  hairBtn5.x = width/2+23;
  hairBtn5.y = 2*margin+ intervalY2 + 15;

  hairBtn6.x = width/2 + intervalX2 + 23;
  hairBtn6.y = 2*margin+intervalY2 + 15;
  
  hairBtn7.x = width/2 + intervalX2*2 + 23;
  hairBtn7.y = 2*margin +intervalY2 + 15;
  
  hairBtn8.x = width/2 + intervalX2*3 + 23;
  hairBtn8.y = 2*margin +intervalY2 + 15;

  // --- 악세사리 버튼 ---
  accBtn1.x = width/2+24;
  accBtn1.y = 2*margin+ intervalY2*2 + 15;

  accBtn2.x = width/2 + intervalX2 + 23;
  accBtn2.y = 2*margin+ intervalY2*2 + 15;
  
  accBtn3.x = width/2 + intervalX2*2 + 23;
  accBtn3.y = 2*margin + intervalY2*2 + 15;
  
  accBtn4.x = width/2 + intervalX2*3 + 24;
  accBtn4.y = 2*margin + intervalY2*2 + 15;
  
  // 안경 버튼
  glassBtn1.x = width/2+24;
  glassBtn1.y = 2*margin+ intervalY2*3 + 15;

  glassBtn2.x = width/2 + intervalX2 + 23;
  glassBtn2.y = 2*margin+ intervalY2*3 + 15;
  
  glassBtn3.x = width/2 + intervalX2*2 + 23;
  glassBtn3.y = 2*margin + intervalY2*3 + 15;
  
  glassBtn4.x = width/2 + intervalX2*3 + 24;
  glassBtn4.y = 2*margin + intervalY2*3 + 15;

  // 버튼 이미지 그리기
  drawButton(hairImg1, hairBtn1, 2.8);
  drawButton(hairImg2, hairBtn2, 2.8);
  drawButton(hairImg3, hairBtn3, 2.8);
  drawButton(hairImg4, hairBtn4, 2.8);
  drawButton(hairImg5, hairBtn5, 2.8);
  drawButton(hairImg6, hairBtn6, 2.8);
  drawButton(hairImg7, hairBtn7, 2.8);
  drawButton(hairImg8, hairBtn8, 2.8);

  drawButton(accImg1, accBtn1, 2.8);
  drawButton(accImg2, accBtn2, 2.8);
  drawButton(accImg3, accBtn3, 2.8);
  drawButton(accImg4, accBtn4, 2.8);

  drawButton(glassImg1, glassBtn1, 2.8);
  drawButton(glassImg2, glassBtn2, 2.8);
  drawButton(glassImg3, glassBtn3, 2.8);
  drawButton(glassImg4, glassBtn4, 2.8);
}

// 버튼 그리기 + 커지기
function drawButton(img, btn, baseScale = 1) {
  let hover = isMouseOver(btn);
  let scale = baseScale * (hover ? 1.3 : 1);

  let w = btn.w * scale;
  let h = btn.h * scale;

  image(img, btn.x - (w - btn.w)/2, btn.y - (h - btn.h)/2, w, h);
}

// 마우스 버튼 위에 있는지 체크
function isMouseOver(btn) {
  return mouseX >= btn.x &&
         mouseX <= btn.x + btn.w &&
         mouseY >= btn.y &&
         mouseY <= btn.y + btn.h;
}

//------------------------------------------------------
// scene 2: 동물 이모지 선택 화면 (임시)
//------------------------------------------------------
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
    fill(255, 230, 160);         // hover 색
  } else {
    fill(245, 215, 140);         // 기본 색
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

//------------------------------------------------------
// 마우스 입력 (아바타/사람/동물)
//------------------------------------------------------
function mousePressedAvatar() {
  if (scene === 0) {
    // 🔹 먼저 BACK 버튼 처리 (phase 2로)
    let backW = 80;
    let backH = 34;
    let backX = 40;
    let backY = 23;

    let overBack =
      mouseX > backX - backW / 2 &&
      mouseX < backX + backW / 2 &&
      mouseY > backY - backH / 2 &&
      mouseY < backY + backH / 2;

    if (overBack) {
      phase = 2; // 템플릿 선택 화면으로
      return;
    }

    // 아바타 선택
    if (dist(mouseX, mouseY, humanCenter.x, humanCenter.y) < avatarRadius) {
      scene = 1; // 사람 이모지 선택 화면으로
    } else if (dist(mouseX, mouseY, animalCenter.x, animalCenter.y) < avatarRadius) {
      scene = 2; // 동물 이모지 선택 화면으로
    }
  } else {
    // 나중에 각 선택 화면에서 클릭 로직 추가
  }
}

function mousePressedHumanEmoji() {
  // 공통: ← 이전 버튼
  if (isMouseOver(humanBackBtn)) {
    if (humanEmojiStep === 1) {
      // 1단계에서 ← 누르면 아바타 선택 화면으로
      scene = 0;
    } else if (humanEmojiStep === 2) {
      // 2단계에서 ← 누르면 1단계로만 돌아감 (선택 값 유지)
      humanEmojiStep = 1;
    }
    return;
  }

  // ============================
  // 1단계: 눈/코/입/눈썹 + "다음 단계 >"
  // ============================
  if (humanEmojiStep === 1) {
    // 눈 버튼
    if (isMouseOver(eyeBtn1)) {
      selectedEyeNumber = (selectedEyeNumber === 1) ? 0 : 1;
    } else if (isMouseOver(eyeBtn2)) {
      selectedEyeNumber = (selectedEyeNumber === 2) ? 0 : 2;
    } else if (isMouseOver(eyeBtn3)) {
      selectedEyeNumber = (selectedEyeNumber === 3) ? 0 : 3;
    } else if (isMouseOver(eyeBtn4)) {
      selectedEyeNumber = (selectedEyeNumber === 4) ? 0 : 4;
    }

    // 코 버튼
    if (isMouseOver(noseBtn1)) {
      selectedNoseNumber = (selectedNoseNumber === 1) ? 0 : 1;
    } else if (isMouseOver(noseBtn2)) {
      selectedNoseNumber = (selectedNoseNumber === 2) ? 0 : 2;
    } else if (isMouseOver(noseBtn3)) {
      selectedNoseNumber = (selectedNoseNumber === 3) ? 0 : 3;
    } else if (isMouseOver(noseBtn4)) {
      selectedNoseNumber = (selectedNoseNumber === 4) ? 0 : 4;
    }

    // 입 버튼
    if (isMouseOver(mouthBtn1)) {
      selectedMouthNum = (selectedMouthNum === 1) ? 0 : 1;
    } else if (isMouseOver(mouthBtn2)) {
      selectedMouthNum = (selectedMouthNum === 2) ? 0 : 2;
    } else if (isMouseOver(mouthBtn3)) {
      selectedMouthNum = (selectedMouthNum === 3) ? 0 : 3;
    } else if (isMouseOver(mouthBtn4)) {
      selectedMouthNum = (selectedMouthNum === 4) ? 0 : 4;
    }

    // 눈썹 버튼
    if (isMouseOver(browBtn1)) {
      selectedBrowNum = (selectedBrowNum === 1) ? 0 : 1;
    } else if (isMouseOver(browBtn2)) {
      selectedBrowNum = (selectedBrowNum === 2) ? 0 : 2;
    } else if (isMouseOver(browBtn3)) {
      selectedBrowNum = (selectedBrowNum === 3) ? 0 : 3;
    } else if (isMouseOver(browBtn4)) {
      selectedBrowNum = (selectedBrowNum === 4) ? 0 : 4;
    }

    // "다음 단계 >" 버튼
    if (isMouseOver(humanNextStepBtn) && isHumanStep1Complete()) {
      captureHumanEmoji();   // 기존 캡쳐 로직 유지
      humanEmojiStep = 2;    // 2단계로 이동
    }

    return; // 1단계 처리 끝
  }

  // ============================
  // 2단계: 헤어/소품/안경 + "게임 시작 >"
  // ============================
  if (humanEmojiStep === 2) {
    // 헤어 버튼
    if (isMouseOver(hairBtn1)) {
      selectedHairNum = (selectedHairNum === 1) ? 0 : 1;
    } else if (isMouseOver(hairBtn2)) {
      selectedHairNum = (selectedHairNum === 2) ? 0 : 2;
    } else if (isMouseOver(hairBtn3)) {
      selectedHairNum = (selectedHairNum === 3) ? 0 : 3;
    } else if (isMouseOver(hairBtn4)) {
      selectedHairNum = (selectedHairNum === 4) ? 0 : 4;
    } else if (isMouseOver(hairBtn5)) {
      selectedHairNum = (selectedHairNum === 5) ? 0 : 5;
    } else if (isMouseOver(hairBtn6)) {
      selectedHairNum = (selectedHairNum === 6) ? 0 : 6;
    } else if (isMouseOver(hairBtn7)) {
      selectedHairNum = (selectedHairNum === 7) ? 0 : 7;
    } else if (isMouseOver(hairBtn8)) {
      selectedHairNum = (selectedHairNum === 8) ? 0 : 8;
    }

    // 소품(악세사리) 버튼
    if (isMouseOver(accBtn1)) {
      selectedAccNum = (selectedAccNum === 1) ? 0 : 1;
    } else if (isMouseOver(accBtn2)) {
      selectedAccNum = (selectedAccNum === 2) ? 0 : 2;
    } else if (isMouseOver(accBtn3)) {
      selectedAccNum = (selectedAccNum === 3) ? 0 : 3;
    } else if (isMouseOver(accBtn4)) {
      selectedAccNum = (selectedAccNum === 4) ? 0 : 4;
    }

    // 안경 버튼
    if (isMouseOver(glassBtn1)) {
      selectedGlassNum = (selectedGlassNum === 1) ? 0 : 1;
    } else if (isMouseOver(glassBtn2)) {
      selectedGlassNum = (selectedGlassNum === 2) ? 0 : 2;
    } else if (isMouseOver(glassBtn3)) {
      selectedGlassNum = (selectedGlassNum === 3) ? 0 : 3;
    } else if (isMouseOver(glassBtn4)) {
      selectedGlassNum = (selectedGlassNum === 4) ? 0 : 4;
    }

    // "게임 시작 >" 버튼 → 기존 stage4 넘어가는 로직 유지
    if (isMouseOver(humanNextStepBtn)) {
      phase = 4;              // main_sketch.js 전역
      gameMode = "intro";
      gameIntroStartTime = millis();
    }

    return; // 2단계 처리 끝
  }
}


function mousePressedAnimalEmoji() {
  // "게임 시작" 버튼 클릭 → stage4로 넘어가기 (기존 로직 유지)
  if (isMouseOver(animalNextBtn)) {
    phase = 4;              // main_sketch.js의 전역 변수
    gameMode = "intro";
    gameIntroStartTime = millis();
  }
}

//------------------------------------------------------
// FaceMesh 초기화 + 그리기 (새로 추가된 핵심 부분)
//------------------------------------------------------

// 카메라 + FaceMesh 모델 초기화
function initFaceMesh() {
  if (video) return; // 이미 초기화 됨

  // 카메라
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // FaceMesh 모델 로딩 후 detectStart
  faceMesh = ml5.faceMesh(faceOptions, () => {
    faceMeshReady = true;
    faceMesh.detectStart(video, gotFaces);
  });
}

function gotFaces(results) {
  faces = results;
}

// 사람 얼굴 패널 안에 카메라 + 이모지 얼굴 그리기
function drawFacePanelWithCamera(panelX, panelY, panelW, panelH) {
  if (!video || !faceMeshReady) return;

  if (video.width === 0 || video.height === 0) return;

  // 세로 기준으로 스케일, 4:3 비율 유지
  let s = panelH / height;
  let centerX = panelX + panelW / 2;
  let centerY = panelY + panelH / 2;

  push();
  drawingContext.save();

  // 패널 영역 안으로만 클리핑
  drawingContext.beginPath();
  drawingContext.rect(panelX, panelY, panelW, panelH);
  drawingContext.clip();

  // 패널 중앙 기준 좌표계
  translate(centerX, centerY);
  scale(s);
  translate(-width / 2, -height / 2);

  // 좌우 반전(거울 효과)
  translate(width, 0);
  scale(-1, 1);

  // 배경 비디오
  image(video, 0, 0, width, height);

  // 선택한 이모지 얼굴 + 헤어/악세사리
  drawEmojiFace();

  drawingContext.restore();
  pop();
}

// stage2_avatar.js 안, drawFacePanelWithCamera 옆에 추가
function drawFaceFullScreen() {
  push();
  if (!video || !faceMeshReady) return;
  if (video.width === 0 || video.height === 0) return;

  push();
  // 거울처럼 좌우 반전
  translate(width, 0);
  scale(-1, 1);

  image(video, 0, 0, width, height);
  drawEmojiFace();   // ★ 여기서 선택된 눈/코/입/헤어/악세/안경까지 모두 얼굴에 붙음

  pop();
  pop();
}

// FaceMesh 기반으로 선택된 PNG 파츠를 한 얼굴처럼 코 기준으로 붙이기
function drawEmojiFace() {
  if (!faces || faces.length === 0) {
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
    smoothPoints = current.map(p => [p[0], p[1]]);
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

  let leftEye  = avg([362, 263, 386, 374]);
  let rightEye = avg([133, 33, 159, 145]);
  let nose     = pt(1);

  if (!leftEye || !rightEye || !nose) return;

  let eyeDist = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y);
  let dx = leftEye.x - rightEye.x;
  let dy = leftEye.y - rightEye.y;
  let angle = atan2(dy, dx);

  let BASE_EYE_DIST = 60;
  let SCALE_GAIN    = 1.4;
  let scaleFactor   = (eyeDist / BASE_EYE_DIST) * SCALE_GAIN;

  let FACE_W   = 190;
  let FACE_H   = 160;
  let PART_W   = 85;
  let PART_H   = 65;

  let EYE_OFFSET_Y   = -5;
  let NOSE_OFFSET_Y  = 23;
  let MOUTH_OFFSET_Y = 53;
  let BROW_OFFSET_Y  = -25;

  // ★ 전체 이모지가 너무 위에 붙어 있으면 이 값을 줄이거나 음수로
  //   (기존 18이었다면 ↓ 정도로 조정해봐)
  let GLOBAL_SHIFT_Y = 8;

  // ★ 헤어가 특히 위에 있으면 이 값도 조금 올려준다 (위로 +, 아래로 -)
  //   기존 -10 이었다면 -2 ~ 0 정도가 무난
  let HAIR_OFFSET_Y = -10;

  let ACC_W = 200;
  let ACC_H = 200;
  let ACC_OFFSET_Y = 0;

  let GLASS_OFFSET_Y = 8; // 기존 5였다면 살짝 더 아래

  noStroke();

  push();
  translate(nose.x, nose.y);
  rotate(angle);
  scale(scaleFactor);

  // 코 기준에서 전체를 약간 위로 이동하는 값 (줄이면 전체가 아래로 감)
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
  let nosePng = null;
  if (selectedNoseNumber === 1) nosePng = noseImg1;
  else if (selectedNoseNumber === 2) nosePng = noseImg2;
  else if (selectedNoseNumber === 3) nosePng = noseImg3;
  else if (selectedNoseNumber === 4) nosePng = noseImg4;

  if (nosePng) {
    image(nosePng, 0, NOSE_OFFSET_Y, PART_W, PART_H);
  }

  // 입
  let mouthImgSel = null;
  if (selectedMouthNum === 1) mouthImgSel = mouthImg1;
  else if (selectedMouthNum === 2) mouthImgSel = mouthImg2;
  else if (selectedMouthNum === 3) mouthImgSel = mouthImg3;
  else if (selectedMouthNum === 4) mouthImgSel = mouthImg4;

  if (mouthImgSel) {
    image(mouthImgSel, 0, MOUTH_OFFSET_Y, PART_W, PART_H);
  }

  // 눈썹
  let browImgSel = null;
  if (selectedBrowNum === 1) browImgSel = browImg1;
  else if (selectedBrowNum === 2) browImgSel = browImg2;
  else if (selectedBrowNum === 3) browImgSel = browImg3;
  else if (selectedBrowNum === 4) browImgSel = browImg4;

  if (browImgSel) {
    image(browImgSel, 0, BROW_OFFSET_Y, PART_W, PART_H);
  }

  // ★ 헤어 (이 오프셋이 캠 화면에서 위/아래 위치를 결정)
  if (selectedHairNum === 1 && hairImg1)      image(hairImg1, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 2 && hairImg2) image(hairImg2, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 3 && hairImg3) image(hairImg3, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 4 && hairImg4) image(hairImg4, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 5 && hairImg5) image(hairImg5, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 6 && hairImg6) image(hairImg6, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 7 && hairImg7) image(hairImg7, 0, HAIR_OFFSET_Y, 200, 200);
  else if (selectedHairNum === 8 && hairImg8) image(hairImg8, 0, HAIR_OFFSET_Y, 200, 200);

  // 소품
  if (selectedAccNum === 1 && accImg1)      image(accImg1, 0, ACC_OFFSET_Y, ACC_W, ACC_H);
  else if (selectedAccNum === 2 && accImg2) image(accImg2, 0, ACC_OFFSET_Y, ACC_W, ACC_H);
  else if (selectedAccNum === 3 && accImg3) image(accImg3, 0, ACC_OFFSET_Y, ACC_W, ACC_H);
  else if (selectedAccNum === 4 && accImg4) image(accImg4, 0, ACC_OFFSET_Y, ACC_W, ACC_H);

  // 안경
  if (selectedGlassNum === 1 && glassImg1) {
    image(glassImg1, 0, GLASS_OFFSET_Y, 200, 200);
  } else if (selectedGlassNum === 2 && glassImg2) {
    image(glassImg2, 0, GLASS_OFFSET_Y, 200, 200);
  } else if (selectedGlassNum === 3 && glassImg3) {
    image(glassImg3, 0, GLASS_OFFSET_Y, 230, 235);
  } else if (selectedGlassNum === 4 && glassImg4) {
    image(glassImg4, 0, GLASS_OFFSET_Y, 230, 235);
  }

  pop();

  imageMode(CORNER);
}

//------------------------------------------------------
// 얼굴 캡쳐 (기존 로직 그대로 유지 - 카메라 없을 때용)
//------------------------------------------------------
function captureHumanEmoji() {
  // 1단계에서 얼굴을 그리던 위치/크기 기준으로 캡쳐
  let faceCenterX = width / 4;
  let faceCenterY = height * 2 / 5 - 5;

  // 얼굴 이미지(160x130)보다 조금 여유 있게 잡기
  let captureW = 200;   // 가로
  let captureH = 260;   // 세로

  humanComposedImg = get(
    faceCenterX - captureW / 2,
    faceCenterY - captureH / 2,
    captureW,
    captureH
  );
}
