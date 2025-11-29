let video;
let bodyPose;           
let poses = [];         
let currentPose = null; 
let handsfree;

let currentStep = 1;
let stepDone = false;

// 기준선
let headY, chestY;

// 스무딩
let smoothPoints = {};
let SMOOTHING = 0.6;
let BASE_MIN_CONF = 0.15;

// 1단계: 안아주기(양팔 벌리기)
let holdStartTime = null;
let HOLD_DURATION = 3000; // 3초

// 2단계: 밥주기(Handsfree)
let food = { x: 500, y: 100, r: 50, visible: true };
let bowl = { x: 320, y: 400, r: 60, visible: true };

// 3단계: 쓰다듬기
let waveState = "DOWN";
let waveCount = 0;
let REQUIRED_WAVES = 3;

// 4단계: 동물과 놀아주기
let swingState = "WAIT_UP";
let swingCount = 0;
let swingTimer = 0;
let SWING_MAX_FRAMES = 30;


function preload() {
  bodyPose = ml5.bodyPose("MoveNet", { flipped: true });
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);

  handsfree = new Handsfree({ hands: true, maxNumHands: 2 });
  handsfree.start();

  console.log("ml5 version:", ml5.version);
}

// BodyPose 콜백
function gotPoses(results) {
  poses = results || [];
  currentPose = poses[0] || null;

  if (currentPose) updateBodyHeights();
}

// 특정 관절 가져오기 + 스무딩
function getPart(name, minConf = BASE_MIN_CONF) {
  if (!currentPose || !currentPose.keypoints) {
    return smoothPoints[name] || null;
  }

  let raw = currentPose.keypoints.find((k) => k.name === name);
  let prev = smoothPoints[name];

  // 관절이 아예 안 보이지만 이전 값은 있는 경우, 이전 값 유지
  if (!raw) {
    return prev || null;
  }

  let c = raw.confidence;
  let sx, sy;

  if (!prev) {
    sx = raw.x;
    sy = raw.y;
  } else {
    sx = lerp(prev.x, raw.x, SMOOTHING);
    sy = lerp(prev.y, raw.y, SMOOTHING);
  }

  let smoothed = { x: sx, y: sy, confidence: c };
  smoothPoints[name] = smoothed;

  if (c < minConf && !prev) {
    return null;
  }

  return smoothed;
}

function updateBodyHeights() {
  let nose = getPart("nose");
  let ls = getPart("left_shoulder");
  let rs = getPart("right_shoulder");

  if (nose) headY = nose.y;
  if (ls && rs) chestY = (ls.y + rs.y) / 2;
}

// =====================================
function draw() {
  background(255);

  image(video, 0, 0, width, height);

  if (currentStep === 1) {
    drawKeypoints();              // 포즈 디버그 점
    stepDone = detectOpenArms();  // 안아주기
    } else if (currentStep === 2) {
      drawObjects();                // 당근/그릇
      let { left, right } = getHandCenters();
  
      if (left) checkCollision(left);
      if (right) checkCollision(right);

    if (!food.visible && !bowl.visible) stepDone = true;
  } else if (currentStep === 3) {
    drawKeypoints();
    detectWave();                 // 머리 위 손 왕복
  } else if (currentStep === 4) {
    drawKeypoints();
    playWithAnimal();             // 양손 위아래 도끼질 느낌
  }

  drawUI();

  if (stepDone) {
    currentStep++;
    stepDone = false;

    if (currentStep === 2) {
      food.visible = true;
      bowl.visible = true;
    }
    if (currentStep === 3) {
      waveState = "DOWN";
      waveCount = 0;
    }
    if (currentStep === 4) {
      swingState = "WAIT_UP";
      swingCount = 0;
      swingTimer = 0;
    }
  }
}

// 1단계: 안아주기(양팔 크게 벌리고 3초 유지)
function detectOpenArms() {
  if (!currentPose) return false;

  let ls = getPart("left_shoulder");
  let rs = getPart("right_shoulder");
  let lw = getPart("left_wrist");
  let rw = getPart("right_wrist");
  let le = getPart("left_elbow");
  let re = getPart("right_elbow");

  if (!ls || !rs || !lw || !rw || !le || !re) {
    holdStartTime = null;
    return false;
  }

  let shoulderWidth = dist(ls.x, ls.y, rs.x, rs.y);
  let wristDist = dist(lw.x, lw.y, rw.x, rw.y);
  let elbowDist = dist(le.x, le.y, re.x, re.y);

  let chestTopY = min(ls.y, rs.y);
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
    if (holdStartTime === null) holdStartTime = millis();
    let elapsed = millis() - holdStartTime;
    fill(0, 0, 0, 150);
    rect(0, height - 80, width, 80);
    fill(255);
    textSize(18);
    text(
      "유지 시간: " + (elapsed / 1000).toFixed(1) + "초 / 3초",
      width / 2,
      height - 40
    );
    if (elapsed >= HOLD_DURATION) return true;
  } else {
    holdStartTime = null;
  }

  return false;
}

// 2단계: 밥주기 (Handsfree)
function drawObjects() {
  textSize(100);
  if (food.visible) text("🥕", food.x, food.y);
  if (bowl.visible) text("🥣", bowl.x, bowl.y);
}

function checkCollision(hand) {
  // 당근부터 터치
  if (food.visible) {
    if (dist(hand.x, hand.y, food.x, food.y) < food.r) {
      food.visible = false;
      console.log("당근 터치!");
    }
    return;
  }

  // 당근이 사라진 뒤에야 그릇 터치
  if (!food.visible && bowl.visible) {
    if (dist(hand.x, hand.y, bowl.x, bowl.y) < bowl.r) {
      bowl.visible = false;
      console.log("그릇 터치!");
    }
  }
}

function getHandCenters() {
  if (
    !handsfree.data.hands ||
    !handsfree.data.hands.multiHandLandmarks
  )
    return { right: null, left: null };

  let landmarks = handsfree.data.hands.multiHandLandmarks;
  let handedness = handsfree.data.hands.multiHandedness;
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

// 3단계: 쓰담쓰담 (머리 위로 손 왕복)
function detectWave() {
  if (!currentPose) return;
  let rw = getPart("right_wrist");
  let lw = getPart("left_wrist");
  let nose = getPart("nose");
  if (!rw || !lw || !nose) return;

  headY = nose.y;
  let handAboveHead = rw.y < headY + 30 || lw.y < headY + 30;

  if (waveState === "DOWN") {
    if (handAboveHead) waveState = "UP";
  } else if (waveState === "UP") {
    if (!handAboveHead) {
      waveState = "DOWN";
      waveCount++;
      console.log("손 왕복 횟수:", waveCount);
    }
  }

  if (waveCount >= REQUIRED_WAVES) stepDone = true;
}

// 4단계: 동물과 놀기 (양손 위↔아래 도끼질 느낌)
function playWithAnimal() {
  if (!currentPose) return;

  let lw = getPart("left_wrist");
  let rw = getPart("right_wrist");
  let ls = getPart("left_shoulder");
  let rs = getPart("right_shoulder");

  if (!lw || !rw || !ls || !rs) return;

  let chestY = (ls.y + rs.y) / 2;
  let upMargin = 20;
  let downMargin = 20;

  let handsUp = lw.y < chestY - upMargin && rw.y < chestY - upMargin;
  let handsDown = lw.y > chestY + downMargin && rw.y > chestY + downMargin;

  if (swingState === "WAIT_UP") {
    if (handsUp) {
      swingState = "READY_DOWN";
      swingTimer = 0;
    }
  } else if (swingState === "READY_DOWN") {
    swingTimer++;
    if (handsDown && swingTimer < SWING_MAX_FRAMES) {
      swingCount++;
      console.log("동물과 놀아주기 완료:", swingCount);
      swingState = "WAIT_UP";
      swingTimer = 0;
    }
    if (swingTimer > SWING_MAX_FRAMES * 2) {
      swingState = "WAIT_UP";
      swingTimer = 0;
    }
  }

  if (swingCount >= 3) stepDone = true;
}

// 디버그용 키포인트 표시
function drawKeypoints() {
  if (!currentPose || !currentPose.keypoints) return;
  for (let kp of currentPose.keypoints) {
    if (kp.confidence > 0.3) {
      fill(0, 0, 255); noStroke(); ellipse(kp.x, kp.y, 8, 8);
    }
  }
  
  if (headY) {
    stroke(255, 0, 0); line(0, headY, width, headY); noStroke();
  }
}

function drawUI() {
  fill(0, 180);
  rect(0, 0, width, 60);
  
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER)
  
  let desc = "";
  if (currentStep === 1) desc = "1단계) 안아주기: 양팔을 크게 벌리세요!";
  else if (currentStep === 2) desc = "2단계) 밥 주기: 손으로 당근과 그릇을 차례대로 터치!";
  else if (currentStep === 3) desc = `3단계) 쓰다듬기: 머리 위로 손 왕복! ${waveCount}/${REQUIRED_WAVES}`;
  else if (currentStep === 4) desc = `4단계) 놀아주기: 양팔을 위아래로 왕복! ${swingCount}/3`;
  if (currentStep > 4) desc = "🎉 동물 키우기 완료! 행복한 시간을 보내세요!🎉";

  text(desc, 320, 30);
}