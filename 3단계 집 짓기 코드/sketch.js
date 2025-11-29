let video;
let bodyPose;
let poses = [];
let currentPose = null;

let currentStep = 1;
let stepDone = false;

// 기준선
let headY, chestY;

// 매끄럽게
let smoothPoints = {};
let SMOOTHING = 0.6;
let BASE_MIN_CONF = 0.15;

// 1단계: 도끼질
let axeState = "WAIT_UP";
let axeTimer = 0;
let axeCount = 0;
let AXE_MAX_FRAMES = 40;
let axeUpStreak = 0;
let axeDownStreak = 0;

// 2단계: 톱질
let sawState = "LEFT";
let sawCycles = 0;
let sawLeftStreak = 0;
let sawRightStreak = 0;

// 3단계: 망치질
let hammerState = "UP";
let hammerCycles = 0;
let hammerUpStreak = 0;
let hammerDownStreak = 0;

// 4단계: 인사
let waveState = "LEFT";
let waveCycles = 0;
let waveLeftStreak = 0;
let waveRightStreak = 0;


function preload() {
  bodyPose = ml5.bodyPose("MoveNet", { flipped: true });
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);

  console.log("ml5 version:", ml5.version);
}

// BodyPose 콜백
function gotPoses(results) {
  poses = results || [];
  currentPose = poses[0] || null;

  if (currentPose) updateBodyHeights();
}

// getPart 
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
    // 이전 데이터가 없으면 raw 그대로
    sx = raw.x;
    sy = raw.y;
  } else {
    // 스무딩 적용
    sx = lerp(prev.x, raw.x, SMOOTHING);
    sy = lerp(prev.y, raw.y, SMOOTHING);
  }

  let smoothed = { x: sx, y: sy, confidence: c };
  smoothPoints[name] = smoothed;

  // confidence 낮아도 이전값 있었으면 유지
  if (c < minConf && !prev) {
    return null;
  }

  return smoothed;
}

// 기준선 업데이트
function updateBodyHeights() {
  let nose = getPart("nose");
  let ls = getPart("left_shoulder");
  let rs = getPart("right_shoulder");

  if (nose) headY = nose.y;
  if (ls && rs) chestY = (ls.y + rs.y) / 2;
}

// =====================================
function draw() {
  background(0);
  image(video, 0, 0, width, height);

  if (currentPose) drawKeypoints();

  if (!stepDone && currentPose) {
    if (currentStep === 1) updateAxe();
    else if (currentStep === 2) updateSaw();
    else if (currentStep === 3) updateHammer();
    else if (currentStep === 4) updateWave();
  }

  drawUI();
}

// 1단계: 도끼질
function updateAxe() {
  let lw = getPart("left_wrist");
  let rw = getPart("right_wrist");
  if (!lw || !rw || chestY == null) return;

  let upOK = lw.y < chestY - 30 && rw.y < chestY - 30;
  let downOK = lw.y > chestY + 30 && rw.y > chestY + 30;

  if (upOK) axeUpStreak++;
  else axeUpStreak = 0;

  if (downOK) axeDownStreak++;
  else axeDownStreak = 0;

  if (axeState === "WAIT_UP") {
    if (axeUpStreak >= 3) {
      axeState = "READY_DOWN";
      axeTimer = 0;
      axeDownStreak = 0;
    }
  } else if (axeState === "READY_DOWN") {
    axeTimer++;

    if (axeDownStreak >= 3 && axeTimer < AXE_MAX_FRAMES) {
      axeCount++;
      console.log("도끼질:", axeCount);
      axeState = "WAIT_UP";
      axeTimer = 0;
      axeUpStreak = 0;
      axeDownStreak = 0;
    }

    if (axeTimer > AXE_MAX_FRAMES * 2) {
      axeState = "WAIT_UP";
      axeTimer = 0;
      axeUpStreak = 0;
      axeDownStreak = 0;
    }
  }

  if (axeCount >= 1) {
    currentStep = 2;
    console.log("1단계 완료 → 2단계");
  }
}

// 2단계: 톱질
function updateSaw() {
  let lw = getPart("left_wrist");
  let rw = getPart("right_wrist");
  if (!lw || !rw) return;

  let handsClose = abs(lw.x - rw.x) < 140;
  if (!handsClose) {
    sawLeftStreak = 0;
    sawRightStreak = 0;
    return;
  }

  let avgX = (lw.x + rw.x) / 2;
  let center = width / 2;
  let leftZone = center - 60;
  let rightZone = center + 60;

  let inLeft = avgX < leftZone;
  let inRight = avgX > rightZone;

  if (inLeft) sawLeftStreak++;
  else sawLeftStreak = 0;

  if (inRight) sawRightStreak++;
  else sawRightStreak = 0;

  if (sawState === "LEFT") {
    if (sawRightStreak >= 3) {
      sawState = "RIGHT";
      sawLeftStreak = 0;
    }
  } else if (sawState === "RIGHT") {
    if (sawLeftStreak >= 3) {
      sawState = "LEFT";
      sawRightStreak = 0;
      sawCycles++;
      console.log("톱질 cycles:", sawCycles);
    }
  }

  if (sawCycles >= 3) {
    currentStep = 3;
    console.log("2단계 완료 → 3단계");
  }
}

// 3단계: 망치질 (오른손 위↔아래)
function updateHammer() {
  let rw = getPart("right_wrist");
  if (!rw || chestY == null) return;

  let upper = chestY - 25;
  let lower = chestY + 25;

  let isUp = rw.y < upper;
  let isDown = rw.y > lower;

  if (isUp) hammerUpStreak++;
  else hammerUpStreak = 0;

  if (isDown) hammerDownStreak++;
  else hammerDownStreak = 0;

  if (hammerState === "UP") {
    if (hammerDownStreak >= 3) {
      hammerState = "DOWN";
      hammerUpStreak = 0;
    }
  } else if (hammerState === "DOWN") {
    if (hammerUpStreak >= 3) {
      hammerState = "UP";
      hammerDownStreak = 0;
      hammerCycles++;
      console.log("망치 cycles:", hammerCycles);
    }
  }

  if (hammerCycles >= 5) {
    currentStep = 4;
    console.log("3단계 완료 → 4단계");
  }
}

// 4단계: 인사 (오른손 좌↔우)
function updateWave() {
  let rw = getPart("right_wrist");
  if (!rw) return;

  let centerX = width / 2;
  let leftBorder = centerX - 40;
  let rightBorder = centerX + 40;

  let isLeft = rw.x < leftBorder;
  let isRight = rw.x > rightBorder;

  if (isLeft) waveLeftStreak++;
  else waveLeftStreak = 0;

  if (isRight) waveRightStreak++;
  else waveRightStreak = 0;

  if (waveState === "LEFT") {
    if (waveRightStreak >= 3) {
      waveState = "RIGHT";
      waveLeftStreak = 0;
    }
  } else if (waveState === "RIGHT") {
    if (waveLeftStreak >= 3) {
      waveState = "LEFT";
      waveRightStreak = 0;
      waveCycles++;
      console.log("인사 cycles:", waveCycles);
    }
  }

  if (waveCycles >= 3) {
    stepDone = true;
    fill(0, 180);
    rect(0, height / 2 - 30, width, 60);
    fill(0, 255, 0);
    textSize(28);
    text("🎉 집 짓기 완료! 손님들과 집들이를 해요! 🎉", width / 2, height / 2);
  }
}

// 디버그용 키포인트 표시
function drawKeypoints() {
  noStroke();

  let names = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_wrist",
    "right_wrist",
  ];

  for (let name of names) {
    let raw = currentPose.keypoints.find((k) => k.name === name);
    let smoothed = smoothPoints[name];
    if (!raw && !smoothed) continue;

    let x = smoothed ? smoothed.x : raw.x;
    let y = smoothed ? smoothed.y : raw.y;

    // confidence 시각화 (녹-노-빨)
    let c = raw ? raw.confidence : 0;
    let r = map(c, 0, 1, 255, 0);
    let g = map(c, 0, 1, 0, 255);

    fill(r, g, 0);
    ellipse(x, y, 10, 10);
  }
}

// UI
function drawUI() {
  fill(0, 180);
  rect(0, 0, width, 60);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER)

  let desc = "";
  if (currentStep === 1) desc = "1단계) 도끼질: 양손 깍지를 끼고, 머리 위에서 아래로 크게 내리세요!";
  else if (currentStep === 2) desc = `2단계) 톱질: 옆으로 서서 양손 깍지를 끼고, 앞뒤로 크게 왕복하세요! (${sawCycles}/3)`;
  else if (currentStep === 3) desc = `3단계) 망치질: 오른손을 위아래로 왕복하세요! (${hammerCycles}/5)`;
  else if (currentStep === 4) desc = `4단계) 집들이 인사: 오른손을 좌우로 흔들어 보세요! (${waveCycles}/3)`;
  if (stepDone) desc = "🎉 집 짓기 완료! 손님들과 즐거운 시간을 보내세요!🎉";

  text(desc, 320, 30);
}