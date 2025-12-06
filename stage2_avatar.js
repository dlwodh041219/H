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

// scene 0: 아바타 선택 화면

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

// scene 1: 사람 이모지 선택 화면

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

  let margin = 40;

  // 상단 바: 제목 + '다음 단계 >' 버튼
  push();
  fill(0);
  noStroke();
  textFont(fontTemplate);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  textSize(24);

  let titleText =
    humanEmojiStep === 1 ? "이모지 커스텀 1단계" : "이모지 커스텀 2단계";
  text(titleText, margin, margin); // 왼쪽 상단 제목
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
  }else if (humanEmojiStep === 2) {
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

  push();
  fill(220);
  rect(humanFaceRegion.x, humanFaceRegion.y, humanFaceRegion.w, humanFaceRegion.h);
  pop();

  // 얼굴 + 선택된 부위 그리기
  push();
  imageMode(CENTER);
  image(faceImg, width / 4, height * 2 / 5, 160, 130);
  
    // 선택된 이미지가 있으면 그리기
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
  pop()

  push();
  // 오른쪽 파트
  textFont(fontTemplate)
  textSize(15);
  fill(0);
  text('눈썹', width/2, margin + 30)
  text('눈',width/2, margin + 130)
  text('코',width/2, margin + 230)
  text('입',width/2, margin + 330)
  pop();

  let intervalY = (height - 2*margin) / 4;
  let intervalX = (width/2) / 4;

  // 기본 얼굴들 반복 출력
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width/2 + i, 2*margin + j,80,60);
    }
  }

  // 눈 버튼 위치 설정
  eyeBtn1.x = width/2+23;
  eyeBtn1.y = 2*margin + intervalY +10;

  eyeBtn2.x = width/2 + intervalX + 23;
  eyeBtn2.y = 2*margin + intervalY + 10;
  
  eyeBtn3.x = width/2 + intervalX*2 + 23;
  eyeBtn3.y = 2*margin + intervalY + 10;
  
  eyeBtn4.x = width/2 + intervalX*3 + 23;
  eyeBtn4.y = 2*margin + intervalY + 10;
  
  // 코 버튼 위치
  noseBtn1.x = width/2+23;
  noseBtn1.y = 2*margin + intervalY*2 +20;

  noseBtn2.x = width/2 + intervalX + 23;
  noseBtn2.y = 2*margin + intervalY*2 + 20;
  
  noseBtn3.x = width/2 + intervalX*2 + 23;
  noseBtn3.y = 2*margin + intervalY*2 + 20;
  
  noseBtn4.x = width/2 + intervalX*3 + 23;
  noseBtn4.y = 2*margin + intervalY*2 + 20;
  
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

  push();
  fill(220);
  rect(humanFaceRegion.x, humanFaceRegion.y, humanFaceRegion.w, humanFaceRegion.h);
  pop();

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
    // 혹시 캡쳐 안 된 경우 대비용 (디버깅용)
    image(faceImg, faceCenterX, faceCenterY, 210, 170);
  }

  let hairWidth  = 200;
  let hairHeight = 200;
  let hairOffsetY = -55; 

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

  // glass
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

  // 오른쪽 파트: 버튼 배치
  push();
  textFont(fontTemplate)
  textSize(15);
  textAlign(LEFT, CENTER);
  fill(0);
  text('헤어', width / 2, margin + 20);
  text('악세사리', width / 2, margin + 227);
  pop();

  let intervalY = (height - 2 * margin) / 4;
  let intervalX = (width / 2) / 4;

  // 기본 얼굴들 반복 출력 (배경 장식용)
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width / 2 + i, 2 * margin + j, 80, 60);
    }
  }

  // --- 헤어 버튼 위치 ---
  hairBtn1.x = width/2+23;
  hairBtn1.y = 2*margin+15;

  hairBtn2.x = width/2 + intervalX + 23;
  hairBtn2.y = 2*margin+15;
  
  hairBtn3.x = width/2 + intervalX*2 + 23;
  hairBtn3.y = 2*margin + 15;
  
  hairBtn4.x = width/2 + intervalX*3 + 23;
  hairBtn4.y = 2*margin + 15;
  
  hairBtn5.x = width/2+23;
  hairBtn5.y = 2*margin+ intervalY + 10;

  hairBtn6.x = width/2 + intervalX + 23;
  hairBtn6.y = 2*margin+intervalY + 10;
  
  hairBtn7.x = width/2 + intervalX*2 + 23;
  hairBtn7.y = 2*margin +intervalY + 10;
  
  hairBtn8.x = width/2 + intervalX*3 + 23;
  hairBtn8.y = 2*margin +intervalY + 10;

  // --- 악세사리 버튼 ---
  accBtn1.x = width/2+24;
  accBtn1.y = 2*margin+ intervalY*2 + 15;

  accBtn2.x = width/2 + intervalX + 23;
  accBtn2.y = 2*margin+ intervalY*2 + 15;
  
  accBtn3.x = width/2 + intervalX*2 + 23;
  accBtn3.y = 2*margin + intervalY*2 + 15;
  
  accBtn4.x = width/2 + intervalX*3 + 24;
  accBtn4.y = 2*margin + intervalY*2 + 15;
  
  // glass
  glassBtn1.x = width/2+24;
  glassBtn1.y = 2*margin+ intervalY*3 + 15;

  glassBtn2.x = width/2 + intervalX + 23;
  glassBtn2.y = 2*margin+ intervalY*3 + 15;
  
  glassBtn3.x = width/2 + intervalX*2 + 23;
  glassBtn3.y = 2*margin + intervalY*3 + 15;
  
  glassBtn4.x = width/2 + intervalX*3 + 24;
  glassBtn4.y = 2*margin + intervalY*3 + 15;

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

// scene 2: 동물 이모지 선택 화면 (임시)
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

function mousePressedAvatar() {
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

function mousePressedHumanEmoji() {
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

  if (
    humanEmojiStep === 1 &&
    isMouseOver(humanNextStepBtn) &&
    isHumanStep1Complete()
  ) {
    captureHumanEmoji();
    humanEmojiStep = 2;
  }
  else if (humanEmojiStep === 2) {
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

    // 악세사리 버튼(나중에 이미지 연결하면 같이 사용)
    if (isMouseOver(accBtn1)) {
      selectedAccNum = (selectedAccNum === 1) ? 0 : 1;
    } else if (isMouseOver(accBtn2)) {
      selectedAccNum = (selectedAccNum === 2) ? 0 : 2;
    } else if (isMouseOver(accBtn3)) {
      selectedAccNum = (selectedAccNum === 3) ? 0 : 3;
    } else if (isMouseOver(accBtn4)) {
      selectedAccNum = (selectedAccNum === 4) ? 0 : 4;
    }
    
    // glass
    if (isMouseOver(glassBtn1)) {
      selectedGlassNum = (selectedGlassNum === 1) ? 0 : 1;
    }else if (isMouseOver(glassBtn2)) {
      selectedGlassNum = (selectedGlassNum === 2) ? 0 : 2;
    }else if (isMouseOver(glassBtn3)) {
      selectedGlassNum = (selectedGlassNum === 3) ? 0 : 3;
    }else if (isMouseOver(glassBtn4)) {
      selectedGlassNum = (selectedGlassNum === 4) ? 0 : 4;
    }

    // "게임 시작" 버튼 클릭 → stage3로 넘어가기
    if (humanEmojiStep === 2 && isMouseOver(humanNextStepBtn)) {
    phase = 4;              // main_sketch.js의 전역 변수
    gameMode = "intro";
    gameIntroStartTime = millis();
    }
  }
}

function mousePressedAnimalEmoji() {
  // "게임 시작" 버튼 클릭 → stage3로 넘어가기
  if (isMouseOver(animalNextBtn)) {
    phase = 4;              // main_sketch.js의 전역 변수
    gameMode = "intro";
    gameIntroStartTime = millis();
  }
}

function captureHumanEmoji() {
  // 1단계에서 얼굴을 그리던 위치/크기 기준으로 캡쳐
  let faceCenterX = width / 4;
  let faceCenterY = height * 2 / 5 - 5;

  // 얼굴 이미지(160x130)보다 조금 여유 있게 잡기
  let captureW = 200;   // 가로
  let captureH = 260;   // 세로 (땋은 머리까지 포함하고 싶으면 더 크게/작게 조절)

  humanComposedImg = get(
    faceCenterX - captureW / 2,
    faceCenterY - captureH / 2,
    captureW,
    captureH
  );
}