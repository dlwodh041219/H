let cookVideo;
let cookBodyPose;
let cookPoses = [];

// clmtrackr
let cookTracker;
let cookMouthOpenThreshold = 20;
let cookOpenFrameCount = 0;
let cookRequiredFrames = 5;

// 게임 단계
// 0: 재료 썰기
// 1: 팬 넣기
// 2: 볶기
// 3: 간보기(입벌림)
// 4: 완료
let cookStage = 0;
let cookDetectedText = "";
let cookStageDone = false;

// Wrist History
const COOK_HISTORY = 20;
let cookRightWristYHist = [];
let cookLeftWristYHist = [];
let cookRightWristXHist = [];
let cookLeftWristXHist = [];

const COOK_TARGET_REPS = 3;
let cookRepCount = 0;
let cookGestureActive = false;


// ================== 초기화 (메인에서 호출) ==================
function setupCookingGame() {
  createCanvas(640, 480);  // 만약 이미 메인에서 캔버스를 만들었다면 이 줄은 삭제!

  // cam
  cookVideo = createCapture(VIDEO);
  cookVideo.size(width, height);
  cookVideo.hide();

  // BodyPose
  cookBodyPose = ml5.bodyPose("MoveNet", { flipped: true }, () => {
    console.log("cook bodyPose ready");
    cookBodyPose.detectStart(cookVideo, cookGotPoses);
  });

  // Face tracking
  cookTracker = new clm.tracker();
  cookTracker.init();
  cookTracker.start(cookVideo.elt);

  cookStage = 0;
  cookDetectedText = "";
  cookStageDone = false;
  cookRepCount = 0;
  cookGestureActive = false;
  cookResetHistory();

  cookOpenFrameCount = 0;

  textFont("Arial");
}

function cookGotPoses(results) {
  cookPoses = results || [];
}


// ================== 메인 draw (메인 sketch에서 호출) ==================
function drawCookingGame() {
  background(0);

  // mirror
  push();
  translate(width, 0);
  scale(-1, 1);
  image(cookVideo, 0, 0, width, height);
  pop();

  cookDrawStageInfo();

  // -------- 4단계: Face tracking --------
  if (cookStage === 3) {
    cookRunFaceTracking();
    return;
  }

  // -------- 1~3단계: BodyPose --------
  if (cookPoses.length > 0) {
    let pose = cookPoses[0];

    let rw = pose.right_wrist;
    let lw = pose.left_wrist;
    let ls = pose.left_shoulder;
    let rs = pose.right_shoulder;

    if (!rw || !lw || !ls || !rs) return;

    let shoulderY = (ls.y + rs.y) / 2;
    let shoulderWidth = dist(ls.x, ls.y, rs.x, rs.y);

    cookUpdateHistory(rw, lw);

    if (cookStage === 0) {
      cookHandleReps(cookCheckChopGesture(shoulderWidth));
    } else if (cookStage === 1) {
      cookHandleReps(cookCheckPutIntoPanGesture(shoulderY, shoulderWidth));
    } else if (cookStage === 2) {
      cookHandleReps(cookCheckStirGesture(shoulderY, shoulderWidth));
    } else if (cookStage === 4) {
      cookDrawStageInfo();
      return;
    }

    cookDrawDebugPoints(pose);
  }

  // 모든 단계 완료 후 QR 페이지로 넘기고 싶다면:
  // if (cookStageDone && typeof goToQR === "function") {
  //   goToQR();
  // }
}


// ================== 4단계: Face Tracking ==================
function cookRunFaceTracking() {
  let positions = cookTracker.getCurrentPosition();
  if (!positions) return;

  // 포인트 표시
  for (let i = 0; i < positions.length; i++) {
    let x = width - positions[i][0];   // 좌우 반전
    let y = positions[i][1];
    circle(x, y, 5);
  }

  let upperLip = positions[57];
  let lowerLip = positions[60];
  if (!upperLip || !lowerLip) return;

  let mouthOpenDist = dist(
    upperLip[0],
    upperLip[1],
    lowerLip[0],
    lowerLip[1]
  );

  if (mouthOpenDist > cookMouthOpenThreshold) {
    cookOpenFrameCount++;
  } else {
    cookOpenFrameCount = 0;
  }

  if (cookOpenFrameCount === cookRequiredFrames) {
    cookDetectedText = "4단계(간보기) 완료! 🎉 전체 미션 클리어!";
    cookStage = 4;
    cookStageDone = true;
  }
}

// ================= 반복 처리 ==================
function cookHandleReps(isDoingGesture) {
  if (isDoingGesture) {
    if (!cookGestureActive) {
      cookGestureActive = true;
      cookRepCount++;

      if (cookStage === 0)
        cookDetectedText = `1단계 재료 썰기: ${cookRepCount}/${COOK_TARGET_REPS}`;
      if (cookStage === 1)
        cookDetectedText = `2단계 팬 넣기: ${cookRepCount}/${COOK_TARGET_REPS}`;
      if (cookStage === 2)
        cookDetectedText = `3단계 볶기: ${cookRepCount}/${COOK_TARGET_REPS}`;

      if (cookRepCount >= COOK_TARGET_REPS) cookAdvanceStage();
    }
  } else {
    cookGestureActive = false;
  }
}

function cookAdvanceStage() {
  let prev = cookStage;
  cookStage++;
  cookRepCount = 0;
  cookGestureActive = false;
  cookResetHistory();

  if (prev === 0) cookDetectedText = "1단계 완료! → 2단계로";
  if (prev === 1) cookDetectedText = "2단계 완료! → 3단계로";
  if (prev === 2) cookDetectedText = "3단계 완료! → 4단계(간보기)로";
  if (prev === 3)
    cookDetectedText = "모든 단계 완료! 사랑하는 사람들과 음식을 나눠보세요🤤";
}


// ================== 화면 표시 ==================
function cookDrawStageInfo() {
  fill(255);
  textSize(18);

  let txt = "";
  if (cookStage === 0)
    txt = "1단계) 재료 썰기: 오른손 위↔아래 3회!";
  else if (cookStage === 1)
    txt = "2단계) 팬 넣기: 양손 위↔아래 3회!";
  else if (cookStage === 2)
    txt = "3단계) 볶기: 양손 좌↔우 3회!";
  else if (cookStage === 3)
    txt = "4단계) 간보기: 입 벌리기!";
  else if (cookStage === 4)
    txt = "모든 단계 완료!";

  text(txt, 10, 25);
  textSize(16);
  text(cookDetectedText, 10, 50);
}

function cookDrawDebugPoints(pose) {
  noStroke();
  if (pose.nose) {
    fill(255, 0, 0);
    circle(pose.nose.x, pose.nose.y, 10);
  }
  if (pose.right_wrist) {
    fill(0, 255, 0);
    circle(pose.right_wrist.x, pose.right_wrist.y, 10);
  }
  if (pose.left_wrist) {
    fill(0, 0, 255);
    circle(pose.left_wrist.x, pose.left_wrist.y, 10);
  }
  if (pose.left_shoulder) {
    fill(255, 255, 0);
    circle(pose.left_shoulder.x, pose.left_shoulder.y, 10);
  }
  if (pose.right_shoulder) {
    fill(255, 255, 0);
    circle(pose.right_shoulder.x, pose.right_shoulder.y, 10);
  }
}


// ================== 히스토리 ==================
function cookUpdateHistory(rw, lw) {
  cookRightWristYHist.push(rw.y);
  cookLeftWristYHist.push(lw.y);
  cookRightWristXHist.push(rw.x);
  cookLeftWristXHist.push(lw.x);

  if (cookRightWristYHist.length > COOK_HISTORY) {
    cookRightWristYHist.shift();
    cookLeftWristYHist.shift();
    cookRightWristXHist.shift();
    cookLeftWristXHist.shift();
  }
}

function cookResetHistory() {
  cookRightWristYHist = [];
  cookLeftWristYHist = [];
  cookRightWristXHist = [];
  cookLeftWristXHist = [];
}

function cookRangeOf(arr) {
  if (arr.length === 0) return 0;

  let minVal = arr[0];
  let maxVal = arr[0];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < minVal) {
      minVal = arr[i];
    }
    if (arr[i] > maxVal) {
      maxVal = arr[i];
    }
  }

  return maxVal - minVal;
}


// ================== 제스처 판정 ==================
function cookCheckChopGesture(shoulderWidth) {
  if (cookRightWristYHist.length < COOK_HISTORY) return false;

  let rY = cookRangeOf(cookRightWristYHist);
  let rX = cookRangeOf(cookRightWristXHist);
  let lY = cookRangeOf(cookLeftWristYHist);

  return (
    rY > 0.6 * shoulderWidth &&
    rX < 1.0 * shoulderWidth &&
    rY > lY * 1.3
  );
}

function cookCheckPutIntoPanGesture(shoulderY, shoulderWidth) {
  if (cookRightWristYHist.length < COOK_HISTORY) {
    return false;
  }

  let rY = cookRangeOf(cookRightWristYHist);
  let lY = cookRangeOf(cookLeftWristYHist);

  return rY > 0.6 * shoulderWidth && lY > 0.6 * shoulderWidth;
}

function cookCheckStirGesture(shoulderY, shoulderWidth) {
  if (cookRightWristXHist.length < COOK_HISTORY) return false;

  let rX = cookRangeOf(cookRightWristXHist);
  let lX = cookRangeOf(cookLeftWristXHist);

  return rX > 0.7 * shoulderWidth && lX > 0.7 * shoulderWidth;
}