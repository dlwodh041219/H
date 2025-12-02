let cookVideo;
let cookBodyPose;
let cookPoses = [];
let cookCurrentPose = null;

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

function setupCookingGame() {
  // 카메라
  cookVideo = createCapture(VIDEO);
  cookVideo.size(width, height);
  cookVideo.hide();

  // BodyPose (MoveNet)
  cookBodyPose = ml5.bodyPose("MoveNet", { flipped: true }, () => {
    console.log("cook bodyPose ready");
    cookBodyPose.detectStart(cookVideo, cookGotPoses);
  });

  // Face tracking (clmtrackr)
  cookTracker = new clm.tracker();
  cookTracker.init();
  cookTracker.start(cookVideo.elt);

  // 상태 리셋
  cookResetState();
  textFont("Arial");
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
}

// BodyPose 콜백
function cookGotPoses(results) {
  cookPoses = results || [];
  cookCurrentPose = cookPoses[0] || null;

  if (cookCurrentPose) cookUpdateBodyHeights();
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

  // 영상 미러링
  push();
  translate(width, 0);
  scale(-1, 1);
  image(cookVideo, 0, 0, width, height);
  pop();

  // 안내 텍스트
  cookDrawStageInfo();

  // 4단계: Face tracking (입 벌리기)만 별도로 처리
  if (cookStage === 3) {
    cookUpdateTaste();
    return;
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

// 화면 표시(UI)
function cookDrawStageInfo() {
  fill(0, 180);
  rect(0, 0, width, 60);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);

  let desc = "";
  if (cookStage === 0) {
    desc = `1단계) 재료 손질: 오른손을 머리 위에서 아래로 크게 3회 내리세요! (${cookChopCycles}/3)`;
  } else if (cookStage === 1) {
    desc = `2단계) 재료 넣기: 양손을 머리 위에서 아래로 크게 3회 내리세요! (${cookBothCycles}/3)`;
  } else if (cookStage === 2) {
    desc = `3단계) 재료 볶기: 오른손을 왼쪽↔오른쪽으로 크게 3회 움직여요! (${cookFryCycles}/3)`;
  } else if (cookStage === 3) {
    desc = `4단계) 간보기: 입을 크게 벌렸다 닫는 동작을 3회 하세요! (${cookTasteCycles}/3)`;
  } else if (cookStage === 4) {
    // 전 단계 다 끝난 뒤
    desc = `🎉요리하기 완료! 사랑하는 사람들과 음식을 나누세요!🎉`;
  }

  text(desc, width / 2, 30);
}