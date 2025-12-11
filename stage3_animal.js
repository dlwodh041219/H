// ====== 전역 ======
let animalBodyPose;
let animalPoses = [];
let animalCurrentPose = null;
let animalHandsfree;
let animalGuideImgs = {};   // ⭐ 단계별 가이드 이미지 저장용
let animalGuideLoaded = false; // 로딩 완료 여부


// 단계
let animalCurrentStep = 1;
let animalStepDone = false;

//가이드 이미지
let showAnimalGuide = true;
let animalGuideStartTime = 0;
let animalGuideIndex = 0;        // 현재 가이드 이미지 번호
let animalLastGuideSwitch = 0;   // 마지막으로 이미지 바꾼 시각
let ANIMAL_GUIDE_INTERVAL = 2500; // 이미지 전환 간격(2.5초)


// 기준선
let animalHeadY, animalChestY;

// 스무딩
let animalSmoothPoints = {};
let ANIMAL_SMOOTHING = 0.6;
let ANIMAL_BASE_MIN_CONF = 0.15;

// 1단계: 안아주기(양팔 벌리기)
let animalHoldStartTime = null;
let ANIMAL_HOLD_DURATION = 3000; // 3초

// 2단계: 밥주기(Handsfree)
let animalFood = { x: 500, y: 130, r: 50, visible: true };
let animalBowl = { x: 320, y: 400, r: 60, visible: true };

// 3단계: 쓰다듬기
let animalWaveState = "DOWN";
let animalWaveCount = 0;
let ANIMAL_REQUIRED_WAVES = 3;

// 4단계: 동물과 놀아주기
let animalSwingState = "WAIT_UP";
let animalSwingCount = 0;
let animalSwingTimer = 0;
let ANIMAL_SWING_MAX_FRAMES = 30;

let animalQRBtn = { x: 0, y: 0, w: 0, h: 0 };
let animalSkipBtn = { x: 0, y: 0, w: 0, h: 0 };
let animalBackBtn = { x: 0, y: 0, w: 0, h: 0 };
let animalGoToQRTriggered = false;

let animalLastSkipTime = 0;
let ANIMAL_SKIP_COOLDOWN = 800;

let puppyImgs = [];
// let animalGuideImgs = {}

// function preload(){
//   animalGuideImgs = {
//   1: [ 
//     loadImage('Hug.png') 
//   ],
//   2: [ 
//     loadImage('Feed1.png'), 
//     loadImage('Feed2.png') 
//   ],
//   3: [ 
//     loadImage('tap1.png'), 
//     loadImage('tap2.png') 
//   ],
//   4: [ 
//     loadImage('Play1.png'), 
//     loadImage('Play2.png') 
//   ],
// };
// }


// ================== 초기화 (메인에서 호출) ==================
function initAnimalGame() {

  // ★ 카메라는 stage2_avatar.js 의 전역 video를 재사용
  //    (setup()에서 initFaceMesh()가 이미 video를 만들어놨다고 가정)
  if (!video) {
    // 혹시 모를 안전장치 (없으면 만들어줌)
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
  }

  // BodyPose (MoveNet, 좌우반전)  ★ detectStart에 video 사용
  animalBodyPose = ml5.bodyPose(
    "MoveNet",
    { flipped: true },
    () => {
      console.log("Animal BodyPose ready");
      animalBodyPose.detectStart(video, animalGotPoses);  // ★ animalVideo → video
    }
  );

  // Handsfree
  if (!animalHandsfree) {
    animalHandsfree = new Handsfree({ hands: true, maxNumHands: 2 });
  }
  animalHandsfree.start();

  console.log("ml5 version:", ml5.version);

  // 단계 초기화
  animalCurrentStep = 1;
  animalStepDone = false;

  animalSmoothPoints = {};
  animalHeadY = null;
  animalChestY = null;

  animalFood = { x: 500, y: 100, r: 50, visible: false }; // 1단계 끝나고 보이게
  animalBowl = { x: 320, y: 400, r: 60, visible: false };

  animalWaveState = "DOWN";
  animalWaveCount = 0;

  animalSwingState = "WAIT_UP";
  animalSwingCount = 0;
  animalSwingTimer = 0;

  animalDoneTime = null;
  animalGoToQRTriggered = false;

  puppyImgs[0] = loadImage('puppy1.png');
  puppyImgs[1] = loadImage('puppy2.png');
  puppyImgs[2] = loadImage('puppy3.png');
  puppyImgs[3] = loadImage('puppy4.png');


}

// BodyPose 콜백
function animalGotPoses(results) {
  animalPoses = results || [];
  animalCurrentPose = animalPoses[0] || null;

  if (animalCurrentPose) {
    animalUpdateBodyHeights();
    markActivity();
  }
}

// 특정 관절 + 스무딩
function animalGetPart(name, minConf = ANIMAL_BASE_MIN_CONF) {
  if (!animalCurrentPose || !animalCurrentPose.keypoints) {
    return animalSmoothPoints[name] || null;
  }

  let raw = animalCurrentPose.keypoints.find((k) => k.name === name);
  let prev = animalSmoothPoints[name];

  if (!raw) return prev || null;

  let c = raw.confidence !== undefined ? raw.confidence : raw.score;
  let sx, sy;

  if (!prev) {
    sx = raw.x;
    sy = raw.y;
  } else {
    sx = lerp(prev.x, raw.x, ANIMAL_SMOOTHING);
    sy = lerp(prev.y, raw.y, ANIMAL_SMOOTHING);
  }

  let smoothed = { x: sx, y: sy, confidence: c };
  animalSmoothPoints[name] = smoothed;

  if (c < minConf && !prev) return null;
  return smoothed;
}

function animalUpdateBodyHeights() {
  let nose = animalGetPart("nose");
  let ls = animalGetPart("left_shoulder");
  let rs = animalGetPart("right_shoulder");

  if (nose) animalHeadY = nose.y;
  if (ls && rs) animalChestY = (ls.y + rs.y) / 2;
}


// ================== 메인 draw에서 호출 ==================
function drawAnimalGame() {
  background(255);

  // ★ 캠 + 이모지 아바타 풀스크린 (stage2_avatar.js의 함수)
  drawFaceFullScreen();

  // //가이드 이미지
  // drawAnimalGuide();
  // if(showAnimalGuide) return;

  // 이하 로직은 그대로 유지 (포즈/단계 판정)
  if (animalCurrentStep === 1) {
    animalDrawKeypoints();
    animalStepDone = animalDetectOpenArms();
  } else if (animalCurrentStep === 2) {
    animalDrawObjects();
    let { left, right } = animalGetHandCenters();

    if (left) animalCheckCollision(left);
    if (right) animalCheckCollision(right);

    if (!animalFood.visible && !animalBowl.visible) animalStepDone = true;
  } else if (animalCurrentStep === 3) {
    animalDrawKeypoints();
    animalDetectWave();
  } else if (animalCurrentStep === 4) {
    animalDrawKeypoints();
    animalPlayWithAnimal();
  }

  animalDrawUI();

  push();
  resetMatrix();
  drawAnimalStepImage();
  pop();

  // 단계 완료 시 다음 단계로
  if (animalStepDone) {
    animalCurrentStep++;
    animalStepDone = false;

     if (animalCurrentStep >= 1 && animalCurrentStep <= 4) {
      showAnimalGuide = true;
      animalGuideIndex = 0;
      animalLastGuideSwitch = millis();
    }

  // showAnimalGuide = true;
  // animalGuideStartTime = millis();

  // animalGuideIndex = 0;
  // animalLastGuideSwitch = millis();

  // // 가이드 이미지 표시 초기화
  // showAnimalGuide = true;
  // animalGuideStartTime = millis();

    if (animalCurrentStep === 2) {
      animalFood.visible = true;
      animalBowl.visible = true;
    }
    if (animalCurrentStep === 3) {
      animalWaveState = "DOWN";
      animalWaveCount = 0;
    }
    if (animalCurrentStep === 4) {
      animalSwingState = "WAIT_UP";
      animalSwingCount = 0;
      animalSwingTimer = 0;
    }
  }
}


// ================== 동물 가이드 이미지 로더 ==================
function loadAnimalGuideImgs() {
  animalGuideImgs = {
    1: [
      loadImage('Hug.png')
    ],
    2: [
      loadImage('Feed1.png'),
      loadImage('Feed2.png')
    ],
    3: [
      loadImage('tap1.png'),
      loadImage('tap2.png')
    ],
    4: [
      loadImage('Play1.png'),
      loadImage('Play2.png')
    ],
  };

  animalGuideLoaded = true;
}


function drawAnimalGame() {
  background(255);

  // ★ 캠 + 이모지 아바타 풀스크린 (stage2_avatar.js의 함수)
  drawFaceFullScreen();

  // ⭐ 가이드 이미지 먼저 그리기
  if (animalGuideLoaded) {
    drawAnimalGuide();
    if (showAnimalGuide) {
      // 가이드 나오는 동안은 아래 단계 로직은 잠깐 멈춤
      return;
    }
  }
}
//단계별 가이드 이미지 표시
function drawAnimalGuide() {
  if (!showAnimalGuide) return;

  // 현재 단계의 이미지 배열 가져오기
  let group = animalGuideImgs[animalCurrentStep];
  if (!group || group.length === 0) {
    showAnimalGuide = false;
    return;
  }

  // 현재 표시할 이미지
  let img = group[animalGuideIndex];
  if (!img) return;

  // 화면 가운데 표시
  let w = 350;
  let h = (img.height / img.width) * w;

  push();
  resetMatrix();
  imageMode(CENTER);
  image(img, width / 2, height / 2, w, h);
  pop();

  // 2.5초마다 다음 이미지로 자동 전환
  if (millis() - animalLastGuideSwitch > ANIMAL_GUIDE_INTERVAL) {
    animalGuideIndex++;
    animalLastGuideSwitch = millis();

    // 배열 끝이면 가이드 종료
    if (animalGuideIndex >= group.length) {
      showAnimalGuide = false;
    }
  }
}



// ====================== 단계별 강아지 이미지 표시 ======================
function drawAnimalStepImage() {
  // 단계: 1~4만 그림
  let index = animalCurrentStep - 1;
  if (index < 0 || index > 3) return;

  let img = puppyImgs[index];
  if (!img) return; // 이미지 아직 로드 안 됐으면 스킵

  let w = 150;
  let h = (img.height / img.width) * w;

  let x = width - w - 20;    // 우측 하단
  let y = height - h - 20;

  // 흰 배경 박스
  fill(255);
  noStroke();
  rect(x - 10, y - 10, w + 20, h + 20, 12);

  // 이미지 출력
  image(img, x, y, w, h);

  // 제목
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(12)
  text("진행 상황", x + 73, y);
}



// ================== 1단계: 안아주기 (양팔 크게 벌리고 3초 유지) ==================
function animalDetectOpenArms() {
  if (!animalCurrentPose) return false;

  let ls = animalGetPart("left_shoulder");
  let rs = animalGetPart("right_shoulder");
  let lw = animalGetPart("left_wrist");
  let rw = animalGetPart("right_wrist");
  let le = animalGetPart("left_elbow");
  let re = animalGetPart("right_elbow");

  if (!ls || !rs || !lw || !rw || !le || !re) {
    animalHoldStartTime = null;
    return false;
  }

  let shoulderWidth = dist(ls.x, ls.y, rs.x, rs.y);
  let wristDist = dist(lw.x, lw.y, rw.x, rw.y);
  let elbowDist = dist(le.x, le.y, re.x, re.y);

  let chestTopY = Math.min(ls.y, rs.y);
  let chestBottomY = chestTopY + shoulderWidth * 1.3;

  let wristsAtChestHeight =
    lw.y > chestTopY &&
    lw.y < chestBottomY &&
    rw.y > chestTopY &&
    rw.y < chestBottomY;

  let armsWideEnough = wristDist > shoulderWidth * 2.3;
  let elbowsWide = elbowDist > shoulderWidth * 1.6;

  let postureOK = armsWideEnough && elbowsWide && wristsAtChestHeight;

  if (postureOK) {
    if (animalHoldStartTime === null) animalHoldStartTime = millis();
    let elapsed = millis() - animalHoldStartTime;

    fill(0, 0, 0, 150);
    rect(0, height - 80, width, 80);
    fill(255);
    textSize(18);
    text(
      "유지 시간: " + (elapsed / 1000).toFixed(1) + "초 / 3초",
      width / 2,
      height - 40
    );

    if (elapsed >= ANIMAL_HOLD_DURATION) return true;
  } else {
    animalHoldStartTime = null;
  }

  return false;
}


// ================== 2단계: 밥주기 (Handsfree) ==================
function animalDrawObjects() {
  push();
  textSize(100);
  textFont("sans-serif");
  if (animalFood.visible) text("🥕", animalFood.x, animalFood.y);
  if (animalBowl.visible) text("🥣", animalBowl.x, animalBowl.y);
  pop();
}

function animalCheckCollision(hand) {
  // 당근부터 터치
  if (animalFood.visible) {
    if (dist(hand.x, hand.y, animalFood.x, animalFood.y) < animalFood.r) {
      animalFood.visible = false;
      console.log("당근 터치!");
    }
    return;
  }

  // 당근이 사라진 뒤에야 그릇 터치
  if (!animalFood.visible && animalBowl.visible) {
    if (dist(hand.x, hand.y, animalBowl.x, animalBowl.y) < animalBowl.r) {
      animalBowl.visible = false;
      console.log("그릇 터치!");
    }
  }
}

function animalGetHandCenters() {
  if (
    !animalHandsfree ||
    !animalHandsfree.data ||
    !animalHandsfree.data.hands ||
    !animalHandsfree.data.hands.multiHandLandmarks
  )
    return { right: null, left: null };

  let landmarks = animalHandsfree.data.hands.multiHandLandmarks;
  let handedness = animalHandsfree.data.hands.multiHandedness;
  let right = null,
    left = null;

  if (landmarks.length > 0) {
    markActivity();
  }

  for (let h = 0; h < landmarks.length; h++) {
    let lx = map(landmarks[h][0].x, 0, 1, 0, width);
    let ly = map(landmarks[h][0].y, 0, 1, 0, height);

    // 손 좌표도 좌우 반전
    lx = width - lx;

    let label = handedness[h].label;
    if (label === "Right") right = { x: lx, y: ly };
    if (label === "Left") left = { x: lx, y: ly };
  }
  return { right, left };
}


// ================== 3단계: 쓰담쓰담 (머리 위로 손 왕복) ==================
function animalDetectWave() {
  if (!animalCurrentPose) return;

  let rw = animalGetPart("right_wrist");
  let lw = animalGetPart("left_wrist");
  let nose = animalGetPart("nose");
  if (!rw || !lw || !nose) return;

  animalHeadY = nose.y;
  let handAboveHead = rw.y < animalHeadY + 30 || lw.y < animalHeadY + 30;

  if (animalWaveState === "DOWN") {
    if (handAboveHead) animalWaveState = "UP";
  } else if (animalWaveState === "UP") {
    if (!handAboveHead) {
      animalWaveState = "DOWN";
      animalWaveCount++;
      console.log("손 왕복 횟수:", animalWaveCount);
    }
  }

  if (animalWaveCount >= ANIMAL_REQUIRED_WAVES) animalStepDone = true;
}


// ================== 4단계: 동물과 놀기 (양손 위↔아래 도끼질 느낌) ==================
function animalPlayWithAnimal() {
  if (!animalCurrentPose) return;

  let lw = animalGetPart("left_wrist");
  let rw = animalGetPart("right_wrist");
  let ls = animalGetPart("left_shoulder");
  let rs = animalGetPart("right_shoulder");

  if (!lw || !rw || !ls || !rs) return;

  let chestY = (ls.y + rs.y) / 2;
  let upMargin = 20;
  let downMargin = 20;

  let handsUp = lw.y < chestY - upMargin && rw.y < chestY - upMargin;
  let handsDown = lw.y > chestY + downMargin && rw.y > chestY + downMargin;

  if (animalSwingState === "WAIT_UP") {
    if (handsUp) {
      animalSwingState = "READY_DOWN";
      animalSwingTimer = 0;
    }
  } else if (animalSwingState === "READY_DOWN") {
    animalSwingTimer++;
    if (handsDown && animalSwingTimer < ANIMAL_SWING_MAX_FRAMES) {
      animalSwingCount++;
      console.log("동물과 놀아주기 완료:", animalSwingCount);
      animalSwingState = "WAIT_UP";
      animalSwingTimer = 0;
    }
    if (animalSwingTimer > ANIMAL_SWING_MAX_FRAMES * 2) {
      animalSwingState = "WAIT_UP";
      animalSwingTimer = 0;
    }
  }

  if (animalSwingCount >= 3) animalStepDone = true;
}


// ================== 디버그용 키포인트 표시 ==================
function animalDrawKeypoints() {
  if (!animalCurrentPose || !animalCurrentPose.keypoints) return;
  for (let kp of animalCurrentPose.keypoints) {
    if (kp.confidence > 0.3) {
      fill(0, 0, 255);
      noStroke();
      ellipse(kp.x, kp.y, 8, 8);
    }
  }

  if (animalHeadY) {
    stroke(255, 0, 0);
    strokeWeight(1);
    line(0, animalHeadY, width, animalHeadY);
    noStroke();
  }
}

function mousePressedAnimalGame() {
  // 🔹 BACK 버튼 먼저 처리
  if (
    mouseX > animalBackBtn.x &&
    mouseX < animalBackBtn.x + animalBackBtn.w &&
    mouseY > animalBackBtn.y &&
    mouseY < animalBackBtn.y + animalBackBtn.h
  ) {
    console.log("[Animal] BACK 버튼 클릭");

    // ✅ 1) 동물게임 1~4단계 중일 때
    if (animalCurrentStep >= 1 && animalCurrentStep <= 4) {

      if (animalCurrentStep === 1) {
        // 👉 stage 3의 1단계에서 BACK = stage 2 이모지 2단계로
        if (typeof backToAvatarFromGame === "function") {
          backToAvatarFromGame();
        }
      } else {
        // 👉 2,3,4 단계에서 BACK = 이전 동물 단계로
        animalCurrentStep--;

        if (animalCurrentStep === 1) resetAnimalStep1();
        else if (animalCurrentStep === 2) resetAnimalStep2();
        else if (animalCurrentStep === 3) resetAnimalStep3();

        console.log("[Animal] BACK → 이전 동물 단계:", animalCurrentStep);
      }

    // ✅ 2) 완료 상태 (currentStep > 4)
    } else if (animalCurrentStep > 4) {
      // stage 3의 완성단계에서 BACK = 4단계로
      animalCurrentStep = 4;
      resetAnimalStep4();
      console.log("[Animal] BACK (완료 화면) → 4단계로 되돌리기");
    }

    return; // BACK 처리 끝
  }

  // 🔹 여기서부터는 기존 SKIP / QR 로직 그대로
  if (animalCurrentStep <= 4) {
    if (millis() - animalLastSkipTime < ANIMAL_SKIP_COOLDOWN) {
      console.log("[Animal] SKIP 쿨타임 중, 무시");
      return;
    }

    if (
      mouseX > animalSkipBtn.x &&
      mouseX < animalSkipBtn.x + animalSkipBtn.w &&
      mouseY > animalSkipBtn.y &&
      mouseY < animalSkipBtn.y + animalSkipBtn.h
    ) {
      console.log("[Animal] SKIP 버튼 클릭 → 다음 단계로");
      animalLastSkipTime = millis();
      animalForceNextStep();
    }
    return;
  }

  if (
    mouseX > animalQRBtn.x &&
    mouseX < animalQRBtn.x + animalQRBtn.w &&
    mouseY > animalQRBtn.y &&
    mouseY < animalQRBtn.y + animalQRBtn.h
  ) {
    if (!animalGoToQRTriggered && typeof goToQR === "function") {
      animalGoToQRTriggered = true;
      console.log("[Animal] QR 저장 버튼 클릭 → goToQR()");
      goToQR();
    }
  }
}

function animalForceNextStep() {
  // 1단계 → 2단계로 SKIP할 때
  if (animalCurrentStep === 1) {
    // 밥주기 단계로 넘어가면서 당근/그릇을 보이게!
    animalCurrentStep = 2;
    animalStepDone = false;

    animalFood.visible = true;
    animalBowl.visible = true;

    console.log("[Animal] SKIP: 1 → 2 (밥주기 시작, 당근/그릇 활성화)");
    return;
  }

  // 2단계 → 3단계 SKIP할 때
  if (animalCurrentStep === 2) {
    // 밥주기 건너뛰면 당근/그릇 다 치우기
    animalFood.visible = false;
    animalBowl.visible = false;

    animalCurrentStep = 3;
    animalStepDone = false;

    console.log("[Animal] SKIP: 2 → 3 (밥주기 건너뜀)");
    return;
  }

  // 3단계 → 4단계 SKIP
  if (animalCurrentStep === 3) {
    animalCurrentStep = 4;
    animalStepDone = false;
    console.log("[Animal] SKIP: 3 → 4 (쓰다듬기 건너뜀)");
    return;
  }

  // 4단계 → 완료 상태(5) SKIP
  if (animalCurrentStep === 4) {
    animalCurrentStep = 5;    // 완료 화면
    animalStepDone = false;
    console.log("[Animal] SKIP: 4 → 5 (완료로)");
    return;
  }
}


// ================== 동물 단계별 리셋 함수 ==================
function resetAnimalStep1() {
  // 안아주기(양팔 벌리기)
  animalHoldStartTime = null;
  animalStepDone = false;
}

function resetAnimalStep2() {
  // 밥 주기 (당근 + 그릇 다시 보이게)
  animalFood.visible = true;
  animalBowl.visible = true;
  animalStepDone = false;
}

function resetAnimalStep3() {
  // 쓰다듬기
  animalWaveState = "DOWN";
  animalWaveCount = 0;
  animalStepDone = false;
}

function resetAnimalStep4() {
  // 동물과 놀기
  animalSwingState = "WAIT_UP";
  animalSwingCount = 0;
  animalSwingTimer = 0;
  animalStepDone = false;
}


// ================== UI ==================
function animalDrawUI() {
  fill(0, 180);
  rect(0, 0, width, 60);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);

  // ✅ 완료 상태일 때
  if (animalCurrentStep > 4) {
    let desc = "🎉 동물 키우기 완료! 행복한 시간을 보내세요!🎉";
    text(desc, width / 2, 30);

    let btnW = 80;
    let btnH = 30;
    let rightCenterX = width - btnW / 2 - 20; // QR
    let centerY      = 30;
    let leftCenterX  = btnW / 2 + 20;         // BACK

    // QR 버튼 영역 저장
    animalQRBtn.x = rightCenterX - btnW / 2;
    animalQRBtn.y = centerY - btnH / 2;
    animalQRBtn.w = btnW;
    animalQRBtn.h = btnH;

    // BACK 버튼 영역 저장
    animalBackBtn.x = leftCenterX - btnW / 2;
    animalBackBtn.y = centerY - btnH / 2;
    animalBackBtn.w = btnW;
    animalBackBtn.h = btnH;

    // BACK 버튼
    let backHover =
      mouseX > animalBackBtn.x &&
      mouseX < animalBackBtn.x + animalBackBtn.w &&
      mouseY > animalBackBtn.y &&
      mouseY < animalBackBtn.y + animalBackBtn.h;

    push();
    rectMode(CORNER);
    noStroke();
    fill(backHover ? color(250,210,120) : color(230,190,140));
    rect(animalBackBtn.x, animalBackBtn.y, btnW, btnH, 8);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("< 이전", leftCenterX, centerY);
    pop();

    // QR 버튼
    let qrHover =
      mouseX > animalQRBtn.x &&
      mouseX < animalQRBtn.x + animalQRBtn.w &&
      mouseY > animalQRBtn.y &&
      mouseY < animalQRBtn.y + animalQRBtn.h;

    push();
    rectMode(CORNER);
    noStroke();
    fill(qrHover ? color(230, 164, 174) : color(200, 150, 160));
    rect(animalQRBtn.x, animalQRBtn.y, btnW, btnH, 10);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("QR 저장 >", rightCenterX, centerY);
    pop();

    return;
  }

  // ✅ 진행 중 단계(1~4)
  let desc = "";
  if (animalCurrentStep === 1)
    desc = "1단계) 안아주기: 양팔을 크게 3초 간 벌리세요!";
  else if (animalCurrentStep === 2)
    desc = "2단계) 밥 주기: 손으로 당근과 그릇을 차례로 터치하세요!";
  else if (animalCurrentStep === 3)
    desc = `3단계) 쓰다듬기: 오른손을 머리 위아래로 3회 움직이세요! (${animalWaveCount}/${ANIMAL_REQUIRED_WAVES})`;
  else if (animalCurrentStep === 4)
    desc = `4단계) 놀아주기: 양팔을 위아래로 3회 움직이세요! (${animalSwingCount}/3)`;

  text(desc, width / 2, 30);

  // 오른쪽 위 SKIP 버튼
  let btnW = 80;
  let btnH = 30;
  let skipCenterX = width - btnW / 2 - 20;
  let centerY = 30;

  animalSkipBtn.x = skipCenterX - btnW / 2;
  animalSkipBtn.y = centerY - btnH / 2;
  animalSkipBtn.w = btnW;
  animalSkipBtn.h = btnH;

  // 왼쪽 BACK 버튼
  let backCenterX = btnW / 2 + 20;

  animalBackBtn.x = backCenterX - btnW / 2;
  animalBackBtn.y = centerY - btnH / 2;
  animalBackBtn.w = btnW;
  animalBackBtn.h = btnH;

  let hoveringSkip =
    mouseX > animalSkipBtn.x &&
    mouseX < animalSkipBtn.x + animalSkipBtn.w &&
    mouseY > animalSkipBtn.y &&
    mouseY < animalSkipBtn.y + animalSkipBtn.h;

  let hoveringBack =
    mouseX > animalBackBtn.x &&
    mouseX < animalBackBtn.x + animalBackBtn.w &&
    mouseY > animalBackBtn.y &&
    mouseY < animalBackBtn.y + animalBackBtn.h;

  // BACK
  push();
  rectMode(CORNER);
  noStroke();
  fill(hoveringBack ? color(250,210,120) : color(230,190,140));
  rect(animalBackBtn.x, animalBackBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("< 이전", backCenterX, centerY);
  pop();

  // SKIP
  push();
  rectMode(CORNER);
  noStroke();
  fill(hoveringSkip ? color(250, 210, 120) : color(230, 190, 140));
  rect(animalSkipBtn.x, animalSkipBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("SKIP >", skipCenterX, centerY);
  pop();
}