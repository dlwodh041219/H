// let cookVideo;           // ★ 이제 사용 안 함 (전역 video 재사용)
let cookBodyPose;
let cookPoses = [];
let cookCurrentPose = null;

let cookImgs = [];

// 기준선
let cookHeadY = null;
let cookChestY = null;

// 매끄럽게 (스무딩)
let cookSmoothPoints = {};
let COOK_SMOOTHING = 0.6;
let COOK_BASE_MIN_CONF = 0.15;

// 게임 단계
let cookStage = 0;
let cookStageDone = false;
let cookDetectedText = "";

// 1단계: 재료 썰기
let cookChopState = "WAIT_UP";
let cookChopUpStreak = 0;
let cookChopDownStreak = 0;
let cookChopCycles = 0;
let cookChopTimer = 0;
let COOK_CHOP_MAX_FRAMES = 80;

// 2단계: 재료 넣기
let cookBothState = "WAIT_UP";
let cookBothUpStreak = 0;
let cookBothDownStreak = 0;
let cookBothCycles = 0;
let cookBothTimer = 0;
let COOK_BOTH_MAX_FRAMES = 40;

// 3단계: 볶기
let cookFryState = "LEFT";
let cookFryCycles = 0;
let cookFryLeftStreak = 0;
let cookFryRightStreak = 0;

// 4단계: 간보기(입벌리기)
let cookTracker;
let cookMouthOpenThres = 20;

let cookTasteState = "WAIT_OPEN";
let cookTasteCycles = 0;
let cookTasteOpenStreak = 0;
let cookTasteCloseStreak = 0;

let COOK_TASTE_OPEN_FRAMES = 3;
let COOK_TASTE_CLOSE_FRAMES = 3;
let COOK_TASTE_TARGET = 3;

let cookQRBtn = { x: 0, y: 0, w: 0, h: 0 };
let cookSkipBtn = { x: 0, y: 0, w: 0, h: 0 };
let cookBackBtn = { x: 0, y: 0, w: 0, h: 0 };
let cookGoToQRTriggered = false;

let cookLastSkipTime = 0;          // ★ 추가
let COOK_SKIP_COOLDOWN = 800;    // ms

function initCookingGame() {
  // ★ 카메라: stage2_avatar.js 에서 쓰는 전역 video 재사용
  if (!video) {
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
  }

  // ★ BodyPose (MoveNet) - 공용 video 사용
  cookBodyPose = ml5.bodyPose("MoveNet", { flipped: true }, () => {
    console.log("cook bodyPose ready");
    cookBodyPose.detectStart(video, cookGotPoses);   // ★ cookVideo → video
  });

  // Face tracking (clmtrackr) - 공용 video 사용
  cookTracker = new clm.tracker();
  cookTracker.init();
  cookTracker.start(video.elt);                      // ★ cookVideo.elt → video.elt

  // 상태 리셋
  cookResetState();

  // 이미지 미리 로드
  cookImgs[0] = loadImage("cook1.png");
  cookImgs[1] = loadImage("cook2.png");
  cookImgs[2] = loadImage("cook3.png");
  cookImgs[3] = loadImage("cook4.png");
}

function cookResetState() {
  cookPoses = [];
  cookCurrentPose = null;

  cookHeadY = null;
  cookChestY = null;
  cookSmoothPoints = {};

  cookStage = 0;
  cookStageDone = false;
  cookDetectedText = "";

  cookChopState = "WAIT_UP";
  cookChopUpStreak = 0;
  cookChopDownStreak = 0;
  cookChopCycles = 0;
  cookChopTimer = 0;

  cookBothState = "WAIT_UP";
  cookBothUpStreak = 0;
  cookBothDownStreak = 0;
  cookBothCycles = 0;
  cookBothTimer = 0;

  cookFryState = "LEFT";
  cookFryCycles = 0;
  cookFryLeftStreak = 0;
  cookFryRightStreak = 0;

  cookTasteState = "WAIT_OPEN";
  cookTasteCycles = 0;
  cookTasteOpenStreak = 0;
  cookTasteCloseStreak = 0;

  cookDoneTime = null;
  cookGoToQRTriggered = false;
}

// BodyPose 콜백
function cookGotPoses(results) {
  cookPoses = results || [];
  cookCurrentPose = cookPoses[0] || null;

  if (cookCurrentPose) {
    cookUpdateBodyHeights();
    markActivity();    // 🔹 몸이 잡힌 순간 활동 기록
  }
}

// BodyPose 유틸 
function cookGetPart(name, minConf = COOK_BASE_MIN_CONF) {
  if (!cookCurrentPose || !cookCurrentPose.keypoints) {
    return cookSmoothPoints[name] || null;
  }

  let raw = cookCurrentPose.keypoints.find((k) => k.name === name);
  let prev = cookSmoothPoints[name];

  if (!raw) {
    // 관절이 아예 안 보이면 이전 값 유지
    return prev || null;
  }

  // confidence 필드 이름이 다를 수 있어서 둘 다 체크
  let c = raw.confidence !== undefined ? raw.confidence : raw.score;

  let sx, sy;
  if (!prev) {
    sx = raw.x;
    sy = raw.y;
  } else {
    sx = lerp(prev.x, raw.x, COOK_SMOOTHING);
    sy = lerp(prev.y, raw.y, COOK_SMOOTHING);
  }

  let smoothed = { x: sx, y: sy, confidence: c };
  cookSmoothPoints[name] = smoothed;

  // confidence 낮고 이전값도 없으면 null
  if (c < minConf && !prev) {
    return null;
  }
  return smoothed;
}

// 기준선 업데이트
function cookUpdateBodyHeights() {
  let nose = cookGetPart("nose");
  let ls = cookGetPart("left_shoulder");
  let rs = cookGetPart("right_shoulder");

  if (nose) cookHeadY = nose.y;
  if (ls && rs) cookChestY = (ls.y + rs.y) / 2;
}

function drawCookingGame() {
  background(0);

  // ★ 캠 풀스크린 + 이모지 아바타 (stage2_avatar.js 에 정의된 함수)
  drawFaceFullScreen();

  // 안내 텍스트
  cookDrawStageInfo();

  // 4단계: Face tracking (입 벌리기)만 별도로 처리
  if (cookStage === 3) {
    cookUpdateTaste();

  }

  // 1~3단계: BodyPose
  if (!cookStageDone && cookCurrentPose) {
    if (cookStage === 0) {
      cookUpdateChop();
    } else if (cookStage === 1) {
      cookUpdatePour();
    } else if (cookStage === 2) {
      cookUpdateFry();
    }
  }

  // 디버깅용 키포인트 표시
  if (cookCurrentPose && cookStage !== 3 && cookStage !== 4) {
    cookDrawKeypoints();
  }

  let stageIndex = cookStage;
  if (cookStage === 3) stageIndex = 3;
  if (cookStage === 4) stageIndex = 3;
  let img = cookImgs[stageIndex];
  // 🔥 단계별 그림 표시 (캔버스 우측 하단)
  if (cookStage >= 0) {
    // let img = cookImgs[cookStage];
    if (img) {
      // 단계별 이미지 크기 조정
      let w = 150;
      let h = (img.height / img.width) * w;
      let x = width - w - 20;
      let y = height - h - 20;

      fill(255);
      noStroke();
      rect(x-10,y-10,w+20,h+20,12);
      image(img, x,y,w,h);
      
      fill(0);
      textAlign(CENTER,CENTER)
      text('진행 상황',x+75,y)
    }
  }
}

// 1단계: 재료 썰기
function cookUpdateChop() {
  let rw = cookGetPart("right_wrist");
  if (!rw || cookChestY == null) return;

  // 기준선
  let upOK = rw.y < cookChestY - 30;
  let downOK = rw.y > cookChestY + 30;

  // streak 누적
  if (upOK) cookChopUpStreak++;
  else cookChopUpStreak = 0;

  if (downOK) cookChopDownStreak++;
  else cookChopDownStreak = 0;

  if (cookChopState === "WAIT_UP") {
    if (cookChopUpStreak >= 3) {
      cookChopState = "READY_DOWN";
      cookChopTimer = 0;
      cookChopDownStreak = 0;
    }
  } else if (cookChopState === "READY_DOWN") {
    cookChopTimer++;

    // 위 → 아래 1회
    if (cookChopDownStreak >= 3 && cookChopTimer < COOK_CHOP_MAX_FRAMES) {
      cookChopCycles++;
      console.log("재료 썰기 횟수:", cookChopCycles);

      cookDetectedText = `1단계 재료 썰기: ${cookChopCycles}/3`;

      // 초기화
      cookChopState = "WAIT_UP";
      cookChopTimer = 0;
      cookChopUpStreak = 0;
      cookChopDownStreak = 0;
    }
  }

  if (cookChopCycles >= 3) {
    cookStage = 1; // 2단계로
    cookDetectedText = "1단계 완료! → 2단계로 이동";
    console.log("1단계 완료 → 2단계!");
  }
}


// 2단계: 재료 넣기
function cookUpdatePour() {
  let lw = cookGetPart("left_wrist");
  let rw = cookGetPart("right_wrist");
  if (!lw || !rw || cookChestY == null) return;

  let upOK = lw.y < cookChestY - 30 && rw.y < cookChestY - 30;
  let downOK = lw.y > cookChestY + 30 && rw.y > cookChestY + 30;

  if (upOK) cookBothUpStreak++;
  else cookBothUpStreak = 0;

  if (downOK) cookBothDownStreak++;
  else cookBothDownStreak = 0;

  if (cookBothState === "WAIT_UP") {
    if (cookBothUpStreak >= 3) {
      cookBothState = "READY_DOWN";
      cookBothTimer = 0;
      cookBothDownStreak = 0;
    }
  } else if (cookBothState === "READY_DOWN") {
    cookBothTimer++;

    if (cookBothDownStreak >= 3 && cookBothTimer < COOK_BOTH_MAX_FRAMES) {
      cookBothCycles++;
      console.log("재료 넣기 횟수:", cookBothCycles);

      cookDetectedText = `2단계 재료 넣기: ${cookBothCycles}/3`;

      cookBothState = "WAIT_UP";
      cookBothTimer = 0;
      cookBothUpStreak = 0;
      cookBothDownStreak = 0;
    }
  }

  if (cookBothCycles >= 3) {
    cookStage = 2; // 3단계로
    cookDetectedText = "2단계 완료! → 3단계로 이동";
    console.log("2단계 완료 → 3단계!");
  }
}


// 3단계: 볶기
function cookUpdateFry() {
  // 오른손 위치
  let rw = cookGetPart("right_wrist", 0.05);
  if (!rw) {
    rw = cookGetPart("right_elbow", 0.05);
    if (!rw) return;
  }

  // 오른쪽 어깨 기준선
  let rs = cookGetPart("right_shoulder");
  if (!rs) return;

  let shoulderX = rs.x;

  // 어깨에서 좌/우로 40px 떨어진 지점을 경계로
  let leftBorder = shoulderX - 40;
  let rightBorder = shoulderX + 40;

  let isLeft = rw.x < leftBorder;
  let isRight = rw.x > rightBorder;

  if (isLeft) cookFryLeftStreak++;
  else cookFryLeftStreak = 0;

  if (isRight) cookFryRightStreak++;
  else cookFryRightStreak = 0;

  if (cookFryState === "LEFT") {
    if (cookFryRightStreak >= 3) {
      cookFryState = "RIGHT";
      cookFryLeftStreak = 0;
    }
  } else if (cookFryState === "RIGHT") {
    if (cookFryLeftStreak >= 3) {
      cookFryState = "LEFT";
      cookFryRightStreak = 0;
      cookFryCycles++;
      console.log("볶기 횟수:", cookFryCycles);

      cookDetectedText = `3단계 볶기: ${cookFryCycles}/3`;
    }
  }

  if (cookFryCycles >= 3) {
    cookStage = 3; // 4단계(간보기)
    cookDetectedText = "3단계 완료! → 4단계(간보기)로 이동";
    console.log("3단계 완료 → 4단계!");
  }
}


// 4단계: 간보기(입 벌리기)
function cookUpdateTaste() {
  let positions = cookTracker.getCurrentPosition();
  if (!positions) return;

  markActivity();

  fill(255);
  stroke(0);

  // 좌우 반전해서 그리기
  let mirrored = [];
  for (let i = 0; i < positions.length; i++) {
    let x = width - positions[i][0];
    let y = positions[i][1];
    mirrored[i] = [x, y];
    circle(x, y, 5);
  }

  // 입 포인트 (clmtrackr 인덱스)
  let upperLip = mirrored[57];
  let lowerLip = mirrored[60];
  if (!upperLip || !lowerLip) return;

  let distMouth = dist(
    upperLip[0],
    upperLip[1],
    lowerLip[0],
    lowerLip[1]
  );

  let isOpen = distMouth > cookMouthOpenThres * 0.75;

  if (isOpen) {
    cookTasteOpenStreak++;
    cookTasteCloseStreak = 0;
  } else {
    cookTasteCloseStreak++;
    cookTasteOpenStreak = 0;
  }

  // 상태 머신
  if (cookTasteState === "WAIT_OPEN") {
    if (cookTasteOpenStreak >= COOK_TASTE_OPEN_FRAMES) {
      cookTasteState = "WAIT_CLOSE";
    }
  } else if (cookTasteState === "WAIT_CLOSE") {
    if (cookTasteCloseStreak >= COOK_TASTE_CLOSE_FRAMES) {
      cookTasteCycles++;
      console.log("간보기 벌리기 횟수:", cookTasteCycles);

      cookTasteState = "WAIT_OPEN";
      cookTasteOpenStreak = 0;
      cookTasteCloseStreak = 0;

      cookDetectedText = `4단계 간보기: ${cookTasteCycles}/${COOK_TASTE_TARGET}`;
    }
  }

  // 완료
  if (cookTasteCycles >= COOK_TASTE_TARGET && !cookStageDone) {
    console.log("간보기 3회 완료!");
    cookStage = 4;
    cookStageDone = true;
    cookDetectedText =
      "🎉요리 완료! 사랑하는 사람들과 음식을 나눠 보세요!🎉";
  }
}

// 디버깅용 키포인트 표시
function cookDrawKeypoints() {
  noStroke();

  let names = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_wrist",
    "right_wrist",
  ];

  for (let name of names) {
    let raw =
      cookCurrentPose.keypoints &&
      cookCurrentPose.keypoints.find((k) => k.name === name);
    let smoothed = cookSmoothPoints[name];
    if (!raw && !smoothed) continue;

    let x = smoothed ? smoothed.x : raw.x;
    let y = smoothed ? smoothed.y : raw.y;

    // confidence 시각화 (녹-노-빨)
    let c =
      raw && (raw.confidence !== undefined ? raw.confidence : raw.score);
    if (c == null) c = 0;

    let r = map(c, 0, 1, 255, 0);
    let g = map(c, 0, 1, 0, 255);

    fill(r, g, 0);
    ellipse(x, y, 10, 10);
  }
}

function mousePressedCookingGame() {
  // 🔹 1) BACK 버튼 먼저 처리
  if (
    mouseX > cookBackBtn.x &&
    mouseX < cookBackBtn.x + cookBackBtn.w &&
    mouseY > cookBackBtn.y &&
    mouseY < cookBackBtn.y + cookBackBtn.h
  ) {
    console.log("[Cooking] BACK 버튼 클릭");

    // ✅ (완성 상태) 4단계까지 다 끝난 뒤의 화면
    if (cookStage === 4 && cookStageDone) {
      // 👉 stage 3의 완성단계에서 back은 stage 3의 4단계
      // = 간보기 단계(cookStage 3)로 되돌리고, 그 단계 리셋
      cookStage = 3;
      resetCookingStageTaste();
      console.log("[Cooking] BACK (완료 화면) → 4단계(간보기) 다시 시작");
      return;
    }

    // ✅ 진행 중인 단계 (0~3)
    if (cookStage >= 0 && cookStage <= 3) {
      if (cookStage === 0) {
        // 👉 stage 3의 1단계에서 back은 stage 2 이모지 2단계
        console.log("[Cooking] BACK → 이모지 커스텀으로 복귀");
        backToAvatarFromGame();
      } else {
        // 👉 2,3,4 단계에서 back은 바로 이전 요리 단계로
        cookStage--;   // 한 단계 뒤로

        if (cookStage === 0) {
          resetCookingStageChop();
        } else if (cookStage === 1) {
          resetCookingStagePour();
        } else if (cookStage === 2) {
          resetCookingStageFry();
        }

        console.log("[Cooking] BACK → 이전 요리 단계:", cookStage);
      }
    }
    return;
  }

  // 🔹 2) SKIP / QR 처리
  // 완료 상태가 아니면 SKIP 버튼만 작동
  if (!(cookStage === 4 && cookStageDone)) {
    // 쿨타임 체크
    if (millis() - cookLastSkipTime < COOK_SKIP_COOLDOWN) {
      console.log("[Cooking] SKIP 쿨타임 중, 무시");
      return;
    }

    // SKIP 버튼 클릭
    if (
      mouseX > cookSkipBtn.x &&
      mouseX < cookSkipBtn.x + cookSkipBtn.w &&
      mouseY > cookSkipBtn.y &&
      mouseY < cookSkipBtn.y + cookSkipBtn.h
    ) {
      console.log("[Cooking] SKIP 버튼 클릭 → 다음 단계");
      cookLastSkipTime = millis();   // ✅ 실제로 쿨타임 갱신
      cookForceNextStage();
    }
    return;
  }

  // 🔹 3) 완료 상태: QR 버튼 처리
  if (
    mouseX > cookQRBtn.x &&
    mouseX < cookQRBtn.x + cookQRBtn.w &&
    mouseY > cookQRBtn.y &&
    mouseY < cookQRBtn.y + cookQRBtn.h
  ) {
    if (!cookGoToQRTriggered && typeof goToQR === "function") {
      cookGoToQRTriggered = true;
      console.log("[Cooking] QR 저장 버튼 클릭 → goToQR()");
      goToQR();
    }
  }
}

function cookForceNextStage() {
  if (cookStage === 0) {
    cookChopCycles = 3;
    cookStage = 1;
  } else if (cookStage === 1) {
    cookBothCycles = 3;
    cookStage = 2;
  } else if (cookStage === 2) {
    cookFryCycles = 3;
    cookStage = 3;
  } else if (cookStage === 3) {
    cookTasteCycles = COOK_TASTE_TARGET;
    cookStage = 4;
    cookStageDone = true;
    cookDetectedText =
      "🎉요리 완료! 사랑하는 사람들과 음식을 나눠 보세요!🎉";
  }

  console.log("[Cooking] 강제 진행 후 cookStage:", cookStage);
}


// ================== 요리하기 단계별 리셋 함수 ==================

// 1단계: 재료 썰기 (cookStage === 0)
function resetCookingStageChop() {
  cookChopState = "WAIT_UP";
  cookChopUpStreak = 0;
  cookChopDownStreak = 0;
  cookChopCycles = 0;
  cookChopTimer = 0;

  cookStageDone = false;
  cookDetectedText = "";
}

// 2단계: 재료 넣기 (cookStage === 1)
function resetCookingStagePour() {
  cookBothState = "WAIT_UP";
  cookBothUpStreak = 0;
  cookBothDownStreak = 0;
  cookBothCycles = 0;
  cookBothTimer = 0;

  cookStageDone = false;
  cookDetectedText = "";
}

// 3단계: 볶기 (cookStage === 2)
function resetCookingStageFry() {
  cookFryState = "LEFT";
  cookFryCycles = 0;
  cookFryLeftStreak = 0;
  cookFryRightStreak = 0;

  cookStageDone = false;
  cookDetectedText = "";
}

// 4단계: 간보기 (cookStage === 3)
function resetCookingStageTaste() {
  cookTasteState = "WAIT_OPEN";
  cookTasteCycles = 0;
  cookTasteOpenStreak = 0;
  cookTasteCloseStreak = 0;

  cookStageDone = false;
  cookDetectedText = "";
}


// 화면 표시(UI)
function cookDrawStageInfo() {
  // 상단 바 배경
  fill(0, 180);
  noStroke();
  rect(0, 0, width, 60);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  textFont(fontTemplate); // 폰트 통일 (원하면 빼도 됨)

  // ✅ 4단계 완료 상태일 때: 완료 문구 + 왼쪽 BACK, 오른쪽 QR(80x30)
  if (cookStage === 4 && cookStageDone) {
    let desc = `🎉요리하기 완료! 사랑하는 사람들과 음식을 나누세요!🎉`;
    text(desc, width / 2, 30);

    let btnW = 80;
    let btnH = 30;
    let centerY = 30;
    let rightCenterX = width - btnW / 2 - 20; // QR
    let leftCenterX  = btnW / 2 + 20;         // BACK

    // 🔹 BACK 버튼 영역
    cookBackBtn.x = leftCenterX - btnW / 2;
    cookBackBtn.y = centerY - btnH / 2;
    cookBackBtn.w = btnW;
    cookBackBtn.h = btnH;

    // 🔹 QR 버튼 영역
    cookQRBtn.x = rightCenterX - btnW / 2;
    cookQRBtn.y = centerY - btnH / 2;
    cookQRBtn.w = btnW;
    cookQRBtn.h = btnH;

    // BACK hover
    let backHover =
      mouseX > cookBackBtn.x &&
      mouseX < cookBackBtn.x + cookBackBtn.w &&
      mouseY > cookBackBtn.y &&
      mouseY < cookBackBtn.y + cookBackBtn.h;

    // QR hover
    let qrHover =
      mouseX > cookQRBtn.x &&
      mouseX < cookQRBtn.x + cookQRBtn.w &&
      mouseY > cookQRBtn.y &&
      mouseY < cookQRBtn.y + cookQRBtn.h;

    // BACK 버튼
    push();
    rectMode(CORNER);
    noStroke();
    fill(backHover ? color(250, 210, 120) : color(230, 190, 140));
    rect(cookBackBtn.x, cookBackBtn.y, btnW, btnH, 8);

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
    rect(cookQRBtn.x, cookQRBtn.y, btnW, btnH, 10);

    fill(0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("QR 저장 >", rightCenterX, centerY);
    pop();

    return; // ✅ 완료 화면에서는 여기서 끝
  }

  // ✅ 진행 중 단계 텍스트
  let desc = "";
  if (cookStage === 0) {
    desc = `1단계) 재료 칼질: 오른손을 위아래로 크게 3회 움직여요! (${cookChopCycles}/3)`;
  } else if (cookStage === 1) {
    desc = `2단계) 재료 넣기: 양손을 머리 위아래로 크게 3회 움직여요! (${cookBothCycles}/3)`;
  } else if (cookStage === 2) {
    desc = `3단계) 재료 볶기: 오른손을 좌우로 3회 크게 움직여요! (${cookFryCycles}/3)`;
  } else if (cookStage === 3) {
    desc = `4단계) 간보기: 입을 3회 크게 벌렸다 오므리세요! (${cookTasteCycles}/${COOK_TASTE_TARGET})`;
  }

  noStroke();
  fill(255);
  text(desc, width / 2, 30);

  // 🔹 왼쪽 BACK, 오른쪽 SKIP (대칭, 80x30)
  let btnW = 80;
  let btnH = 30;
  let centerY = 30;

  let backCenterX = btnW / 2 + 20;
  let skipCenterX = width - btnW / 2 - 20;

  // BACK 버튼 영역
  cookBackBtn.x = backCenterX - btnW / 2;
  cookBackBtn.y = centerY - btnH / 2;
  cookBackBtn.w = btnW;
  cookBackBtn.h = btnH;

  // SKIP 버튼 영역
  cookSkipBtn.x = skipCenterX - btnW / 2;
  cookSkipBtn.y = centerY - btnH / 2;
  cookSkipBtn.w = btnW;
  cookSkipBtn.h = btnH;

  let backHover =
    mouseX > cookBackBtn.x &&
    mouseX < cookBackBtn.x + cookBackBtn.w &&
    mouseY > cookBackBtn.y &&
    mouseY < cookBackBtn.y + cookBackBtn.h;

  let skipHover =
    mouseX > cookSkipBtn.x &&
    mouseX < cookSkipBtn.x + cookSkipBtn.w &&
    mouseY > cookSkipBtn.y &&
    mouseY < cookSkipBtn.y + cookSkipBtn.h;

  // BACK 버튼
  push();
  rectMode(CORNER);
  noStroke();
  fill(backHover ? color(250, 210, 120) : color(230, 190, 140));
  rect(cookBackBtn.x, cookBackBtn.y, btnW, btnH, 8);

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
  rect(cookSkipBtn.x, cookSkipBtn.y, btnW, btnH, 8);

  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("SKIP >", skipCenterX, centerY);
  pop();
}