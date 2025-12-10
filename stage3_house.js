// let houseVideo;   // ★ 전역 video를 쓸 거라 필요 없음
let houseBodyPose;
let housePoses = [];
let houseCurrentPose = null;

let houseStep = 1;
let houseStepDone = false;

// 기준선
let houseHeadY, houseChestY;

// 스무딩
let houseSmoothPoints = {};
let HOUSE_SMOOTHING = 0.6;
let HOUSE_BASE_MIN_CONF = 0.15;

// 1단계: 도끼질
let houseAxeState = "WAIT_UP";
let houseAxeTimer = 0;
let houseAxeCount = 0;
let HOUSE_AXE_MAX_FRAMES = 40;
let houseAxeUpStreak = 0;
let houseAxeDownStreak = 0;

// 2단계: 톱질
let houseSawState = "LEFT";
let houseSawCycles = 0;
let houseSawLeftStreak = 0;
let houseSawRightStreak = 0;

// 3단계: 망치질
let houseHammerState = "UP";
let houseHammerCycles = 0;
let houseHammerUpStreak = 0;
let houseHammerDownStreak = 0;

// 4단계: 인사
let houseWaveState = "LEFT";
let houseWaveCycles = 0;
let houseWaveLeftStreak = 0;
let houseWaveRightStreak = 0;

let houseQRBtn = { x: 0, y: 0, w: 0, h: 0 };
let houseSkipBtn = { x: 0, y: 0, w: 0, h: 0 };
let houseBackBtn = { x: 0, y: 0, w: 0, h: 0 };
let houseGoToQRTriggered = false;

let houseLastSkipTime = 0;
let HOUSE_SKIP_COOLDOWN = 800;

let houseImgs = [];

// ================= 초기화 (phase=3 && selectedGame==="house" 진입 시 호출) =================
function initHouseGame() {
  // ★ 카메라: stage2_avatar.js에서 쓰는 전역 video 재사용
  if (!video) {
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
  }

  // 상태 초기화
  houseStep = 1;
  houseStepDone = false;

  houseAxeState = "WAIT_UP";
  houseAxeTimer = 0;
  houseAxeCount = 0;
  houseAxeUpStreak = 0;
  houseAxeDownStreak = 0;

  houseSawState = "LEFT";
  houseSawCycles = 0;
  houseSawLeftStreak = 0;
  houseSawRightStreak = 0;

  houseHammerState = "UP";
  houseHammerCycles = 0;
  houseHammerUpStreak = 0;
  houseHammerDownStreak = 0;

  houseWaveState = "LEFT";
  houseWaveCycles = 0;
  houseWaveLeftStreak = 0;
  houseWaveRightStreak = 0;

  houseSmoothPoints = {};
  houseHeadY = null;
  houseChestY = null;

  houseDoneTime = null;
  houseGoToQRTriggered = false;

  // ★ BodyPose 로드 & 시작 (공용 video 사용)
  houseBodyPose = ml5.bodyPose("MoveNet", { flipped: true }, () => {
    console.log("House BodyPose ready");
    houseBodyPose.detectStart(video, gotHousePoses);   // ★ houseVideo → video
  });
}

// BodyPose 콜백
function gotHousePoses(results) {
  housePoses = results || [];
  houseCurrentPose = housePoses[0] || null;

  if (houseCurrentPose) {
    updateHouseBodyHeights();
    markActivity();    // 몸이 보이면 활동 기록
  }

  houseImgs[1] = loadImage("house1.png")
  houseImgs[2] = loadImage("house2.png")
  houseImgs[3] = loadImage("house3.png")
  houseImgs[4] = loadImage("house4.png")
}

// 특정 관절 가져오기 + 스무딩
function houseGetPart(name, minConf = HOUSE_BASE_MIN_CONF) {
  if (!houseCurrentPose || !houseCurrentPose.keypoints) {
    return houseSmoothPoints[name] || null;
  }

  let raw = houseCurrentPose.keypoints.find((k) => k.name === name);
  let prev = houseSmoothPoints[name];

  if (!raw) return prev || null;

  let c = raw.confidence;
  let sx, sy;

  if (!prev) {
    sx = raw.x;
    sy = raw.y;
  } else {
    sx = lerp(prev.x, raw.x, HOUSE_SMOOTHING);
    sy = lerp(prev.y, raw.y, HOUSE_SMOOTHING);
  }

  let smoothed = { x: sx, y: sy, confidence: c };
  houseSmoothPoints[name] = smoothed;

  if (c < minConf && !prev) return null;
  return smoothed;
}

// 기준선 업데이트
function updateHouseBodyHeights() {
  let nose = houseGetPart("nose");
  let ls = houseGetPart("left_shoulder");
  let rs = houseGetPart("right_shoulder");

  if (nose) houseHeadY = nose.y;
  if (ls && rs) houseChestY = (ls.y + rs.y) / 2;
}

// -------------------- 메인 draw (phase===3 && selectedGame==="house"일 때 호출) --------------------
function drawHouseGame() {
  background(0);

  // ★ 캠 풀스크린 + 이모지 아바타 (stage2_avatar.js에 정의된 함수)
  push();
  drawFaceFullScreen();
  pop();

  // 포즈 디버깅(원하면 유지)
  push();
  if (houseCurrentPose) drawHouseKeypoints();
  
  if (!houseStepDone && houseCurrentPose) {
    if (houseStep === 1)      houseUpdateAxe();
    else if (houseStep === 2) houseUpdateSaw();
    else if (houseStep === 3) houseUpdateHammer();
    else if (houseStep === 4) houseUpdateWave();
  }
  pop();

  push();
  drawHouseUI();
  pop();

  push();
  resetMatrix();
  drawHouseStepImage();
  pop();
}

function drawHouseStepImage() {
  let stepIndex = houseStep;

  if (houseStepDone) stepIndex = 4;

  let img = houseImgs[stepIndex];
  if (!img) return;

  let w = 150;
  let h = (img.height / img.width) * w;
  let x = width - w - 20;
  let y = height - h - 20;

  push();
  // 배경 박스
  fill(255);
  noStroke();
  rect(x - 10, y - 10, w + 20, h + 20, 12);

  // 이미지
  push();
  image(img, x, y, w, h);
  pop();

  // 텍스트
  fill(0);
  textAlign(CENTER, CENTER);
  text("진행 상황", x + 73, y - 15);
  pop();
}



// 1단계: 도끼질
function houseUpdateAxe() {
  let lw = houseGetPart("left_wrist");
  let rw = houseGetPart("right_wrist");
  if (!lw || !rw || houseChestY == null) return;

  let upOK   = lw.y < houseChestY - 30 && rw.y < houseChestY - 30;
  let downOK = lw.y > houseChestY + 30 && rw.y > houseChestY + 30;

  if (upOK) houseAxeUpStreak++;
  else houseAxeUpStreak = 0;

  if (downOK) houseAxeDownStreak++;
  else houseAxeDownStreak = 0;

  if (houseAxeState === "WAIT_UP") {
    if (houseAxeUpStreak >= 3) {
      houseAxeState = "READY_DOWN";
      houseAxeTimer = 0;
      houseAxeDownStreak = 0;
    }
  } else if (houseAxeState === "READY_DOWN") {
    houseAxeTimer++;

    if (houseAxeDownStreak >= 3 && houseAxeTimer < HOUSE_AXE_MAX_FRAMES) {
      houseAxeCount++;
      console.log("도끼질:", houseAxeCount);
      houseAxeState = "WAIT_UP";
      houseAxeTimer = 0;
      houseAxeUpStreak = 0;
      houseAxeDownStreak = 0;
    }

    if (houseAxeTimer > HOUSE_AXE_MAX_FRAMES * 2) {
      houseAxeState = "WAIT_UP";
      houseAxeTimer = 0;
      houseAxeUpStreak = 0;
      houseAxeDownStreak = 0;
    }
  }

  if (houseAxeCount >= 1) {
    houseStep = 2;
    console.log("1단계 완료 → 2단계");
  }
}


// 2단계: 톱질
function houseUpdateSaw() {
  let lw = houseGetPart("left_wrist");
  let rw = houseGetPart("right_wrist");
  if (!lw || !rw) return;

  let handsClose = abs(lw.x - rw.x) < 140;
  if (!handsClose) {
    houseSawLeftStreak = 0;
    houseSawRightStreak = 0;
    return;
  }

  let avgX = (lw.x + rw.x) / 2;
  let center = width / 2;
  let leftZone = center - 60;
  let rightZone = center + 60;

  let inLeft = avgX < leftZone;
  let inRight = avgX > rightZone;

  if (inLeft) houseSawLeftStreak++;
  else houseSawLeftStreak = 0;

  if (inRight) houseSawRightStreak++;
  else houseSawRightStreak = 0;

  if (houseSawState === "LEFT") {
    if (houseSawRightStreak >= 3) {
      houseSawState = "RIGHT";
      houseSawLeftStreak = 0;
    }
  } else if (houseSawState === "RIGHT") {
    if (houseSawLeftStreak >= 3) {
      houseSawState = "LEFT";
      houseSawRightStreak = 0;
      houseSawCycles++;
      console.log("톱질 cycles:", houseSawCycles);
    }
  }

  if (houseSawCycles >= 3) {
    houseStep = 3;
    console.log("2단계 완료 → 3단계");
  }
}

// 3단계: 망치질
function houseUpdateHammer() {
  let rw = houseGetPart("right_wrist");
  if (!rw || houseChestY == null) return;

  let upper = houseChestY - 25;
  let lower = houseChestY + 25;

  let isUp = rw.y < upper;
  let isDown = rw.y > lower;

  if (isUp) houseHammerUpStreak++;
  else houseHammerUpStreak = 0;

  if (isDown) houseHammerDownStreak++;
  else houseHammerDownStreak = 0;

  if (houseHammerState === "UP") {
    if (houseHammerDownStreak >= 3) {
      houseHammerState = "DOWN";
      houseHammerUpStreak = 0;
    }
  } else if (houseHammerState === "DOWN") {
    if (houseHammerUpStreak >= 3) {
      houseHammerState = "UP";
      houseHammerDownStreak = 0;
      houseHammerCycles++;
      console.log("망치 cycles:", houseHammerCycles);
    }
  }

  if (houseHammerCycles >= 5) {
    houseStep = 4;
    console.log("3단계 완료 → 4단계");
  }
}


// 4단계: 인사
function houseUpdateWave() {
  let rw = houseGetPart("right_wrist");
  if (!rw) return;

  let centerX = width / 2;
  let leftBorder = centerX - 40;
  let rightBorder = centerX + 40;

  let isLeft = rw.x < leftBorder;
  let isRight = rw.x > rightBorder;

  if (isLeft) houseWaveLeftStreak++;
  else houseWaveLeftStreak = 0;

  if (isRight) houseWaveRightStreak++;
  else houseWaveRightStreak = 0;

  if (houseWaveState === "LEFT") {
    if (houseWaveRightStreak >= 3) {
      houseWaveState = "RIGHT";
      houseWaveLeftStreak = 0;
    }
  } else if (houseWaveState === "RIGHT") {
    if (houseWaveLeftStreak >= 3) {
      houseWaveState = "LEFT";
      houseWaveRightStreak = 0;
      houseWaveCycles++;
      console.log("인사 cycles:", houseWaveCycles);
    }
  }

  if (houseWaveCycles >= 3) {
    houseStepDone = true;
  }
}

// 디버그용 키포인트
function drawHouseKeypoints() {
  push();
  noStroke();

  let names = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_wrist",
    "right_wrist",
  ];

  for (let name of names) {
    let raw = houseCurrentPose.keypoints.find((k) => k.name === name);
    let smoothed = houseSmoothPoints[name];
    if (!raw && !smoothed) continue;

    let x = smoothed ? smoothed.x : raw.x;
    let y = smoothed ? smoothed.y : raw.y;

    let c = raw ? raw.confidence : 0;
    let r = map(c, 0, 1, 255, 0);
    let g = map(c, 0, 1, 0, 255);

    fill(r, g, 0);
    ellipse(x, y, 10, 10);
  }
  pop();
}

function mousePressedHouseGame() {
  // 🔹 1) BACK 버튼
  if (
    mouseX > houseBackBtn.x &&
    mouseX < houseBackBtn.x + houseBackBtn.w &&
    mouseY > houseBackBtn.y &&
    mouseY < houseBackBtn.y + houseBackBtn.h
  ) {
    console.log("[House] BACK 버튼 클릭");

    // ✅ 완료 화면이라고 가정 (houseStepDone == true일 때)
    if (houseStepDone && houseStep === 4) {
      // → 4단계를 다시 수행해야 하도록 리셋
      resetHouseStep4();
      console.log("[House] BACK (완료 화면) → 4단계 다시 시작");
      return;
    }

    // ✅ 진행 중(1~4 단계)
    if (houseStep >= 1 && houseStep <= 4) {
      if (houseStep === 1) {
        // 1단계에서 BACK → 이모지 2단계
        backToAvatarFromGame();
      } else {
        // 2,3,4 단계에서 BACK → 이전 집짓기 단계로
        houseStep--;

        if (houseStep === 1) resetHouseStep1();
        else if (houseStep === 2) resetHouseStep2();
        else if (houseStep === 3) resetHouseStep3();

        console.log("[House] BACK → 이전 집짓기 단계:", houseStep);
      }
    }
    return;
  }

  // 🔹 2) SKIP (완료되지 않은 경우만)
  if (!houseStepDone) {
    if (millis() - houseLastSkipTime < HOUSE_SKIP_COOLDOWN) {
      console.log("[House] SKIP 쿨타임 중, 무시");
      return;
    }

    if (
      mouseX > houseSkipBtn.x &&
      mouseX < houseSkipBtn.x + houseSkipBtn.w &&
      mouseY > houseSkipBtn.y &&
      mouseY < houseSkipBtn.y + houseSkipBtn.h
    ) {
      console.log("[House] SKIP 버튼 클릭 → 다음 단계");
      houseLastSkipTime = millis();
      houseForceNextStep();
    }
    return;
  }

  // 🔹 3) 완료 상태: QR 버튼
  if (
    mouseX > houseQRBtn.x &&
    mouseX < houseQRBtn.x + houseQRBtn.w &&
    mouseY > houseQRBtn.y &&
    mouseY < houseQRBtn.y + houseQRBtn.h
  ) {
    if (!houseGoToQRTriggered && typeof goToQR === "function") {
      houseGoToQRTriggered = true;
      console.log("[House] QR 저장 버튼 클릭 → goToQR()");
      goToQR();
    }
  }
}


function houseForceNextStep() {
  if (houseStep === 1) {
    houseAxeCount = 1;
    houseStep = 2;
  } else if (houseStep === 2) {
    houseSawCycles = 3;
    houseStep = 3;
  } else if (houseStep === 3) {
    houseHammerCycles = 5;
    houseStep = 4;
  } else if (houseStep === 4) {
    houseWaveCycles = 3;
    houseStepDone = true;
  }

  console.log("[House] 강제 진행 후 houseStep:", houseStep, "houseStepDone:", houseStepDone);
}


// ================== 집짓기 단계별 리셋 함수 ==================
function resetHouseStep1() {
  // 1단계: 도끼질
  houseAxeState = "WAIT_UP";
  houseAxeTimer = 0;
  houseAxeCount = 0;
  houseAxeUpStreak = 0;
  houseAxeDownStreak = 0;
  houseStepDone = false;
}

function resetHouseStep2() {
  // 2단계: 톱질
  houseSawState = "LEFT";
  houseSawCycles = 0;
  houseSawLeftStreak = 0;
  houseSawRightStreak = 0;
  houseStepDone = false;
}

function resetHouseStep3() {
  // 3단계: 망치질
  houseHammerState = "UP";
  houseHammerCycles = 0;
  houseHammerUpStreak = 0;
  houseHammerDownStreak = 0;
  houseStepDone = false;
}

function resetHouseStep4() {
  // 4단계: 인사
  houseWaveState = "LEFT";
  houseWaveCycles = 0;
  houseWaveLeftStreak = 0;
  houseWaveRightStreak = 0;
  houseStepDone = false;
}

// ================== UI ==================
function drawHouseUI() {
  push();
  fill(0, 180);
  rect(0, 0, width, 60);

  fill(255);
  textSize(19);
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);

  // ✅ 집 짓기 완료 상태라면: 완료 문구 + 왼쪽 BACK, 오른쪽 QR(80x30)
  if (houseStepDone) {
    let desc = "🎉 집 짓기 완료! 손님들과 즐거운 시간을 보내세요!🎉";
    text(desc, width / 2, 30);

    let btnW = 80;
    let btnH = 30;
    let centerY = 30;
    let rightCenterX = width - btnW / 2 - 20; // QR
    let leftCenterX  = btnW / 2 + 20;         // BACK

    // BACK 버튼 영역
    houseBackBtn.x = leftCenterX - btnW / 2;
    houseBackBtn.y = centerY - btnH / 2;
    houseBackBtn.w = btnW;
    houseBackBtn.h = btnH;

    // QR 버튼 영역
    houseQRBtn.x = rightCenterX - btnW / 2;
    houseQRBtn.y = centerY - btnH / 2;
    houseQRBtn.w = btnW;
    houseQRBtn.h = btnH;

    let backHover =
      mouseX > houseBackBtn.x &&
      mouseX < houseBackBtn.x + houseBackBtn.w &&
      mouseY > houseBackBtn.y &&
      mouseY < houseBackBtn.y + houseBackBtn.h;

    let qrHover =
      mouseX > houseQRBtn.x &&
      mouseX < houseQRBtn.x + houseQRBtn.w &&
      mouseY > houseQRBtn.y &&
      mouseY < houseQRBtn.y + houseQRBtn.h;

    // BACK 버튼
    push();
    rectMode(CORNER);
    noStroke();
    fill(backHover ? color(250, 210, 120) : color(230, 190, 140));
    rect(houseBackBtn.x, houseBackBtn.y, btnW, btnH, 8);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("< 이전", leftCenterX, centerY);
    pop();

    // QR 버튼
    push();
    rectMode(CORNER);
    noStroke();
    fill(qrHover ? color(230, 164, 174) : color(200, 150, 160));
    rect(houseQRBtn.x, houseQRBtn.y, btnW, btnH, 10);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("QR 저장 >", rightCenterX, centerY);
    pop();

    return;

    pop();
  }

  // ✅ 진행 중 단계 텍스트
  let desc = "";
  if (houseStep === 1)
    desc = "1단계) 도끼질: 양손 깍지를 끼고, 머리 위에서 아래로 크게 내리세요!";
  else if (houseStep === 2)
    desc = `2단계) 톱질: 옆으로 서서 양손 깍지를 끼고, 앞뒤로 움직여요! (${houseSawCycles}/3)`;
  else if (houseStep === 3)
    desc = `3단계) 망치질: 오른손을 위아래로 5회 왕복해서 움직여요! (${houseHammerCycles}/5)`;
  else if (houseStep === 4)
    desc = `4단계) 집들이 인사: 오른손을 좌우로 3회 흔들어요! (${houseWaveCycles}/3)`;

  text(desc, width / 2, 30);
  
  // 🔹 왼쪽 BACK, 오른쪽 SKIP (대칭)
  let btnW = 80;
  let btnH = 30;
  let centerY = 30;

  let backCenterX = btnW / 2 + 20;
  let skipCenterX = width - btnW / 2 - 20;

  // BACK 버튼 영역
  houseBackBtn.x = backCenterX - btnW / 2;
  houseBackBtn.y = centerY - btnH / 2;
  houseBackBtn.w = btnW;
  houseBackBtn.h = btnH;

  // SKIP 버튼 영역
  houseSkipBtn.x = skipCenterX - btnW / 2;
  houseSkipBtn.y = centerY - btnH / 2;
  houseSkipBtn.w = btnW;
  houseSkipBtn.h = btnH;

  let backHover =
    mouseX > houseBackBtn.x &&
    mouseX < houseBackBtn.x + houseBackBtn.w &&
    mouseY > houseBackBtn.y &&
    mouseY < houseBackBtn.y + houseBackBtn.h;

  let skipHover =
    mouseX > houseSkipBtn.x &&
    mouseX < houseSkipBtn.x + houseSkipBtn.w &&
    mouseY > houseSkipBtn.y &&
    mouseY < houseSkipBtn.y + houseSkipBtn.h;

  // BACK 버튼
  push();
  rectMode(CORNER);
  noStroke();
  fill(backHover ? color(250, 210, 120) : color(230, 190, 140));
  rect(houseBackBtn.x, houseBackBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("< 이전", backCenterX, centerY);
  pop();

  // SKIP 버튼
  push();
  rectMode(CORNER);
  noStroke();
  fill(skipHover ? color(250, 210, 120) : color(230, 190, 140));
  rect(houseSkipBtn.x, houseSkipBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("SKIP >", skipCenterX, centerY);
  pop();
}
