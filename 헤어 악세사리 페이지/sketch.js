let faceImg;
let hairImg1;
let hairImg2;
let hairImg3;
let hairImg4;
let hairImg5;
let hairImg6;
let hairImg7;
let hairImg8;

let selectedHairNum = 0;

let hairBtn1 = { x: 0, y: 0, w: 32, h: 29 };
let hairBtn2 = { x: 0, y: 0, w: 33, h: 29 };
let hairBtn3 = { x: 0, y: 0, w: 35, h: 35 };
let hairBtn4 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn5 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn6 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn7 = { x: 0, y: 0, w: 35, h: 30 };
let hairBtn8 = { x: 0, y: 0, w: 35, h: 30 };

function setup(){
  createCanvas(640, 480);
  faceImg = loadImage('face.png');
  hairImg1 = loadImage('hair1.png');
  hairImg2 = loadImage('hair8.png');
  hairImg3 = loadImage('hair3.png');
  hairImg4 = loadImage('hair4.png');
  hairImg5 = loadImage('hair5.png');
  hairImg6 = loadImage('hair6.png');
  hairImg7 = loadImage('hair7.png');
  hairImg8 = loadImage('hair2.png');
}

function draw(){
  background(215,240,249);
  
  let margin = 40;
  
  push();
  fill(220);
  rect(margin,margin,width/2-2*margin,height-margin*2);
  pop()
  
  push()
  imageMode(CENTER);
  image(faceImg,width/4,height*2/5,210,170)
  
   // 선택된 이미지가 있으면 그리기
  let faceCenterX = width / 4;
  let faceCenterY = 245;

  let hairWidth = 230;  // 얼굴 너비와 맞게
  let hairHeight = 235; // 머리 높이 설정
  let hairOffsetY = -55; 
  
  if (selectedHairNum === 1) {
  image(hairImg1, faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else if (selectedHairNum === 2) {
  image(hairImg2, faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else 
  if (selectedHairNum === 3) {
  image(hairImg3, faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);

} else if (selectedHairNum === 4) {
  image(hairImg4,faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else if (selectedHairNum === 5) {
  image(hairImg5,faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else if (selectedHairNum === 6) {
  image(hairImg6,faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else if (selectedHairNum === 7) {
  image(hairImg7,faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
} else if (selectedHairNum === 8) {
  image(hairImg8,faceCenterX, faceCenterY + hairOffsetY, hairWidth, hairHeight);
}
  
  pop()
  // 오른쪽 파트 
  textSize(15)
  text('헤어', width/2, margin + 20)
  // text('눈',width/2, margin + 120)
  text('악세사리',width/2, margin + 227)
  // text('입',width/2, margin + 320)
  
  let intervalY = (height - 2*margin) / 4;
  let intervalX = (width/2) / 4;

  // 기본 얼굴들 반복 출력
  for (let i = 0; i <= width - margin; i += intervalX) {
    for (let j = 0; j <= height - margin; j += intervalY) {
      image(faceImg, width/2 + i, 2*margin + j,80,60);
    }
  }
  
  // 헤어 버튼 위치 설정
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
  
  drawButton(hairImg1, hairBtn1);
  drawButton(hairImg2, hairBtn2);
  drawButton(hairImg3, hairBtn3);
  drawButton(hairImg4, hairBtn4);
  drawButton(hairImg5, hairBtn5);
  drawButton(hairImg6, hairBtn6);
  drawButton(hairImg7, hairBtn7);
  drawButton(hairImg8, hairBtn8);
}

function drawButton(img, btn) {
  let hover = isMouseOver(btn);
  let scale = hover ? 3.3:2.8;

  let w = btn.w * scale;
  let h = btn.h * scale;
  
  image(img, btn.x - (w - btn.w)/2, btn.y - (h - btn.h)/2, w, h);

}

function isMouseOver(btn) {
  return mouseX >= btn.x &&
         mouseX <= btn.x + btn.w &&
         mouseY >= btn.y &&
         mouseY <= btn.y + btn.h;
}

function mousePressed(){
  if (isMouseOver(hairBtn1)) {
    selectedHairNum = 1;   // null 대신 1
  }
  if (isMouseOver(hairBtn2)) {
    selectedHairNum = 2;   // null 대신 2
  }
  if (isMouseOver(hairBtn3)) {
    selectedHairNum = 3;   // null 대신 2
  }
  if (isMouseOver(hairBtn4)) {
     selectedEyeNumber = 4;   // null 대신 2
  }
  if (isMouseOver(hairBtn5)) {
    selectedHairNum = 5;   // null 대신 1
  }
  if (isMouseOver(hairBtn6)) {
    selectedHairNum = 6;   // null 대신 2
  }
  if (isMouseOver(hairBtn7)) {
    selectedHairNum = 7;   // null 대신 2
  }
  if (isMouseOver(hairBtn8)) {
     selectedEyeNumber = 8;   // null 대신 2
  }
}

function mousePressed(){
   if (isMouseOver(hairBtn1)) {
    if (selectedHairNum === 1) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 1;   // 선택하기
    }
  }

  if (isMouseOver(hairBtn2)) {
    if (selectedHairNum === 2) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 2;   // 선택하기
    }
  }
  
  if (isMouseOver(hairBtn3)) {
    if (selectedHairNum === 3) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 3;   // 선택하기
    }
  }


  if (isMouseOver(hairBtn4)) {
    if (selectedHairNum === 4) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 4;   // 선택하기
    }
  }
   if (isMouseOver(hairBtn5)) {
    if (selectedHairNum === 5) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 5;   // 선택하기
    }
  }

  if (isMouseOver(hairBtn6)) {
    if (selectedHairNum === 6) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 6;   // 선택하기
    }
  }
  
  if (isMouseOver(hairBtn7)) {
    if (selectedHairNum === 7) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 7;   // 선택하기
    }
  }


  if (isMouseOver(hairBtn8)) {
    if (selectedHairNum === 8) {
      selectedHairNum = 0;   // 이미 선택된 버튼 → 해제
    } else {
      selectedHairNum = 8;   // 선택하기
    }
  }
  
}