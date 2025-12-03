let capture;
let faceImg;
let eyeImg1;
let eyeImg2;
let eyeImg3;
let eyeImg4;
let noseImg1;
let noseImg2;
let noseImg3;
let noseImg4;

// null 대신 번호로 관리
let selectedEyeNumber = 0;
let selectedNoseNumber = 0;

// 버튼 정보
let eyeBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let eyeBtn4 = { x: 0, y: 0, w: 35, h: 30 };

let noseBtn1 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn2 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn3 = { x: 0, y: 0, w: 35, h: 30 };
let noseBtn4 = { x: 0, y: 0, w: 35, h: 30 };

function setup() {
  createCanvas(640, 480);
  capture = createCapture(VIDEO)
  capture.hide()
  pixelDensity(1)

  faceImg = loadImage('face.png')
  eyeImg1 = loadImage('eye1.png')
  eyeImg2 = loadImage('eye2.png')
  eyeImg3 = loadImage('eye3.png')
  eyeImg4 = loadImage('eye4.png')
  
  noseImg1 = loadImage('nose1.png')
  noseImg2 = loadImage('nose2.png')
  noseImg3 = loadImage('nose3.png')
  noseImg4 = loadImage('nose4.png')
}

function draw() {
  background(215,240,249);

  let margin = 40;

  // -------------------------
  //    왼쪽 이모지 박스
  // -------------------------
  push();
  fill(220);
  rect(margin, margin, width/2 - 2*margin, height - margin*2);
  pop();
  
  push()
  imageMode(CENTER);
  image(faceImg,width/4,height*2/5,160,130)

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
  pop()

  // -------------------------
  //   오른쪽 파트
  // -------------------------
  textSize(15)
  text('눈썹', width/2, margin + 20)
  text('눈',width/2, margin + 120)
  text('코',width/2, margin + 220)
  text('입',width/2, margin + 320)

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
  

  drawButton(eyeImg1, eyeBtn1);
  drawButton(eyeImg2, eyeBtn2);
  drawButton(eyeImg3, eyeBtn3);
  drawButton(eyeImg4, eyeBtn4);
  
  drawButton(noseImg1, noseBtn1);
  drawButton(noseImg2, noseBtn2);
  drawButton(noseImg3, noseBtn3);
  drawButton(noseImg4, noseBtn4);
  
}

// -------------------------------
// 버튼 그리기 + 커지기
// -------------------------------
function drawButton(img, btn) {
  let hover = isMouseOver(btn);
  let scale = hover ? 1.3 : 1;

  let w = btn.w * scale;
  let h = btn.h * scale;

  image(img, btn.x - (w - btn.w)/2, btn.y - (h - btn.h)/2, w, h);
}

// -------------------------------
// 마우스 버튼 위에 있는지 체크
// -------------------------------
function isMouseOver(btn) {
  return mouseX >= btn.x &&
         mouseX <= btn.x + btn.w &&
         mouseY >= btn.y &&
         mouseY <= btn.y + btn.h;
}

// -------------------------------
// 클릭하면 선택 상태 바꾸기
// -------------------------------
function mousePressed() {
  if (isMouseOver(eyeBtn1)) {
    selectedEyeNumber = 1;   // null 대신 1
  }
  if (isMouseOver(eyeBtn2)) {
    selectedEyeNumber = 2;   // null 대신 2
  }
  if (isMouseOver(eyeBtn3)) {
    selectedEyeNumber = 3;   // null 대신 2
  }
  if (isMouseOver(eyeBtn4)) {
    selectedEyeNumber = 4;   // null 대신 2
  }
  
  if (isMouseOver(noseBtn1)) {
    selectedNoseNumber = 1;
  }
  if (isMouseOver(noseBtn2)) {
    selectedNoseNumber = 2;
  }
  if (isMouseOver(noseBtn3)) {
    selectedNoseNumber = 3;
  }
  if (isMouseOver(noseBtn4)) {
    selectedNoseNumber = 4;
  }
}

function mousePressed() {
  // eye1 버튼 클릭 처리
  if (isMouseOver(eyeBtn1)) {
    if (selectedEyeNumber === 1) {
      selectedEyeNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedEyeNumber = 1;   // 선택하기
    }
  }

  // eye2 버튼 클릭 처리
  if (isMouseOver(eyeBtn2)) {
    if (selectedEyeNumber === 2) {
      selectedEyeNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedEyeNumber = 2;   // 선택하기
    }
  }
  
  if (isMouseOver(eyeBtn3)) {
    if (selectedEyeNumber === 3) {
      selectedEyeNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedEyeNumber = 3;   // 선택하기
    }
  }


  if (isMouseOver(eyeBtn4)) {
    if (selectedEyeNumber === 4) {
      selectedEyeNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedEyeNumber = 4;   // 선택하기
    }
  }
  
  // 코 버튼
  if (isMouseOver(noseBtn1)) {
    if (selectedNoseNumber === 1) {
      selectedNoseNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedNoseNumber = 1;   // 선택하기
    }
  }

  // eye2 버튼 클릭 처리
  if (isMouseOver(noseBtn2)) {
    if (selectedNoseNumber === 2) {
      selectedNoseNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedNoseNumber = 2;   // 선택하기
    }
  }
  
  if (isMouseOver(noseBtn3)) {
    if (selectedNoseNumber === 3) {
      selectedNoseNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedNoseNumber = 3;   // 선택하기
    }
  }
  
  if (isMouseOver(noseBtn4)) {
    if (selectedNoseNumber === 4) {
      selectedNoseNumber = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedNoseNumber = 4;   // 선택하기
    }
  }
  
}


