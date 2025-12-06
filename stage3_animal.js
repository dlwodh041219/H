let animalVideo;
let animalBodyPose;
let animalPoses = [];
let animalCurrentPose = null;
let animalHandsfree;

// 단계
let animalCurrentStep = 1;
let animalStepDone = false;

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
let animalGoToQRTriggered = false;

let animalLastSkipTime = 0;         
let ANIMAL_SKIP_COOLDOWN = 800;

// ================== 초기화 (메인에서 호출) ==================
function initAnimalGame() {

  // 카메라
  animalVideo = createCapture(VIDEO);
  animalVideo.size(640, 480);
  animalVideo.hide();

  // BodyPose (MoveNet, 좌우반전)
  animalBodyPose = ml5.bodyPose("MoveNet", { flipped: true }, () => {
    console.log("Animal BodyPose ready");
    animalBodyPose.detectStart(animalVideo, animalGotPoses);
  });

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
}

// BodyPose 콜백
function animalGotPoses(results) {
  animalPoses = results || [];
  animalCurrentPose = animalPoses[0] || null;

  if (animalCurrentPose) animalUpdateBodyHeights();
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

  if (animalVideo) {
    // 영상도 좌우반전 (BodyPose flipped:true와 일치)
    push();
    translate(width, 0);
    scale(-1, 1);
    image(animalVideo, 0, 0, width, height);
    pop();
  }

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

  // 단계 완료 시 다음 단계로
  if (animalStepDone) {
    animalCurrentStep++;
    animalStepDone = false;

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
  if (animalCurrentStep <= 4) {
    // 🔹 SKIP 쿨타임 체크
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
      animalForceNextStep();
    }
    return;
  }

  // 완료 상태일 때는 QR 버튼
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
  // 현재 단계에 따라 약간 정리
  if (animalCurrentStep === 2) {
    // 밥주기 건너뛰면 당근/그릇 다 치우기
    animalFood.visible = false;
    animalBowl.visible = false;
  }

  if (animalCurrentStep < 4) {
    animalCurrentStep++;
    animalStepDone = false;  // 새 단계 시작
  } else if (animalCurrentStep === 4) {
    // 4단계를 스킵하면 곧바로 완료 상태로
    animalCurrentStep = 5;
    animalStepDone = false;
  }

  console.log("[Animal] 강제 진행 후 단계:", animalCurrentStep);
}

// ================== UI ==================
function animalDrawUI() {
  fill(0, 180);
  rect(0, 0, width, 60);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);

  // ✅ 완료 상태일 때는: 문구 + QR버튼 그리고 return
  if (animalCurrentStep > 4) {
    let desc = "🎉 동물 키우기 완료! 행복한 시간을 보내세요!🎉";
    text(desc, width / 2, 30);

    // QR 저장 버튼 (우측 상단)
    let btnW = 120;
    let btnH = 36;
    let btnX = width - btnW / 2 - 20;  // 오른쪽 여백 20
    let btnY = 30;                     // 상단 바 가운데 높이

    // 전역 버튼 영역 갱신
    animalQRBtn.x = btnX - btnW / 2;
    animalQRBtn.y = btnY - btnH / 2;
    animalQRBtn.w = btnW;
    animalQRBtn.h = btnH;

    // hover 효과 (마우스 위치로)
    let hovering =
      mouseX > animalQRBtn.x &&
      mouseX < animalQRBtn.x + animalQRBtn.w &&
      mouseY > animalQRBtn.y &&
      mouseY < animalQRBtn.y + animalQRBtn.h;

    push();
    rectMode(CORNER);
    noStroke();
    fill(hovering ? color(230, 164, 174) : color(200, 150, 160));
    rect(animalQRBtn.x, animalQRBtn.y, btnW, btnH, 10);

    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("QR 저장", btnX, btnY);
    pop();

    return; // ✅ 아래 일반 단계 UI는 그리지 않고 종료
  }

  // ✅ 여기 아래는 진행 중 단계(1~4)일 때만
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
  let btnX = width - btnW / 2 - 20;
  let btnY = 30;

  animalSkipBtn.x = btnX - btnW / 2;
  animalSkipBtn.y = btnY - btnH / 2;
  animalSkipBtn.w = btnW;
  animalSkipBtn.h = btnH;

  let hovering =
    mouseX > animalSkipBtn.x &&
    mouseX < animalSkipBtn.x + animalSkipBtn.w &&
    mouseY > animalSkipBtn.y &&
    mouseY < animalSkipBtn.y + animalSkipBtn.h;

  push();
  rectMode(CORNER);
  noStroke();
  fill(hovering ? color(250, 210, 120) : color(230, 190, 140));
  rect(animalSkipBtn.x, animalSkipBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("SKIP", btnX, btnY);
  pop();
}