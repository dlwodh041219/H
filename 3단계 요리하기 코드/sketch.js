// ================== 전역 변수 ==================
// ---- BodyPose ----
let video;
let bodyPose;
let poses = [];
let currentPose = null;

let currentStep = 1;
let stepDone = false;

// 기준선
let headY;
let chestY;

// 매끄럽게
let smoothPoints = {};
let SMOOTHING = 0.6;
let BASE_MIN_CONF = 0.15;

// 1단계: 재료 썰기
let chopState = "WAIT_UP";
let chopUpStreak = 0;
let chopDownStreak = 0;
let chopCycles = 0; // 왕복카운트
let chopTimer = 0;
let CHOP_MAX_FRAMES = 80; 

// stage2: pour ingredients
let bothState = "WAIT_UP";
let bothUpStreak = 0;
let bothDownStreak = 0;
// let rightUpStreak = 0;
// let rightDownStreak = 0;
let bothCycles = 0;
let bothTimer = 0;
let BOTH_MAX_FRAMES = 40;

// stage3: fry ingredients
// let fryState = "LEFT";
// let fryLeftStreak = 0;
// let fryRightStreak = 0;
// let fryCycles = 0;
// let fryTimer = 0;
// let FRY_MAX_FRAMES = 40;
let fryState = "WAIT_LEFT";
let fryLeftStreak = 0;
let fryRightStreak = 0;
let fryCycles = 0;   // 왼손 왕복 카운트
let fryTimer = 0;
let FRY_MAX_FRAMES = 40;

// stage4: eating
let tracker;

let tasteState = "WAIT_OPEN";
let mouthOpenThres = 20;
let tasteCycles = 0;
let tasteOpenStreak = 0;
let tasteCloseStreak = 0;

let TASTE_OPEN_FRAMES = 3;   // 입이 열린 것으로 인정되는 최소 프레임
let TASTE_CLOSE_FRAMES = 3;  // 입이 닫힌 것으로 인정되는 최소 프레임

let TASTE_TARGET = 3; // 총 3회 왕복해야 단계 완료

function preload(){
  bodyPose = ml5.bodyPose("MoveNet", { flipped: true });
}

function setup(){
  createCanvas(640,480);
  
  video = createCapture(VIDEO, {flipped:true});
  video.size(width,height);
  video.hide();
  
  bodyPose.detectStart(video,gotPoses);
  
  console.log("ml5 version:", ml5.version);
  
  // ---- Face tracking ----
  tracker = new clm.tracker();
  tracker.init();
  tracker.start(video.elt);
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

// draw
function draw() {
  background(0);
  image(video, 0, 0, width, height);

  if (currentPose && currentStep !== 4) drawKeypoints();

  if (!stepDone) {
    if (currentStep === 1 && currentPose) updateChop();
    else if (currentStep === 2 && currentPose) updatePour();
    else if (currentStep === 3 && currentPose) updateFry();
    else if (currentStep === 4) updateTaste();
  }

  drawUI();
}

// stage1: chop ingredients 
function updateChop(){
  let rw = getPart("right_wrist");
  if(!rw || chestY == null) return;
  
  // 기준선
  let upOK = rw.y < chestY - 30;
  let downOK = rw.y > chestY + 30;
  
  // streak 누적
  if (upOK) chopUpStreak++;
  else chopUpStreak = 0;
  
  if (downOK) chopDownStreak++;
  else chopDownStreak = 0;
  
  if (chopState === "WAIT_UP"){
    if(chopUpStreak >= 3) {
      chopState = "READY_DOWN";
      chopTimer = 0;
      chopDownStreak = 0;
    }
  }
  
  else if (chopState === "READY_DOWN"){
    chopTimer++;
    
    // 위+아래 -> 1회 왕복
    if(chopDownStreak >= 3 && chopTimer < CHOP_MAX_FRAMES){
      chopCycles++;
      console.log("재료 썰기 횟수:", chopCycles);
      
      // 초기화
      chopState = "WAIT_UP";
      chopTimer = 0;
      chopUpStreak = 0;
      chopDownStreak = 0;
    }
  }
  
  if (chopCycles >= 3){
    currentStep = 2;
    console.log("1단계 완료 → 2단계!");
  }
}

// stage2: pour ingredients
function updatePour(){
  let lw = getPart("left_wrist");
  let rw = getPart("right_wrist");
  if(!lw || !rw || chestY == null) return;
  
  let upOK = lw.y < chestY - 30 && rw.y < chestY -30;
  let downOK = lw.y > chestY +30 && rw.y > chestY + 30;
  
  if (upOK) bothUpStreak++;
  else bothUpStreak = 0;
  
  if (downOK) bothDownStreak++;
  else bothDownStreak = 0;
  
  if (bothState === "WAIT_UP"){
    if(bothUpStreak>=3){
      bothState = "READY_DOWN";
      bothTimer = 0;
      bothDownStreak = 0;
    }
  }
  
  else if(bothState === "READY_DOWN"){
    bothTimer++;
    
    if(bothDownStreak>=3 && bothTimer < BOTH_MAX_FRAMES){
      bothCycles++;
      console.log("재료 넣기 횟수:", bothCycles);
      
      bothState = "WAIT_UP";
      bothTimer = 0;
      bothUpStreak = 0;
      bothDownStreak = 0;
    }
  }
  
  if (bothCycles>=3){
    currentStep = 3;
    console.log("2단계 완료 → 3단계!");
  }
}

// stage3: fry ingredients
function updateFry(){
  let lw = getPart("left_wrist");
  // let rw = getPart("right_wrist");
  if(!lw) return;
  
  // 가운데 기준선
  let centerX = width/2;
  
  // 왼쪽 오른쪽 영역 기준선
  let leftZone = centerX - 60;
  let rightZone = centerX + 60;
  
  let leftOK = lw.x < leftZone;
  let rightOK = lw.x > rightZone;
  
  // streak 누적
  if (leftOK) fryLeftStreak++;
  else fryLeftStreak = 0;
  
  if (rightOK) fryRightStreak++;
  else fryRightStreak = 0;
  
  // state machine
  if (fryState === "WAIT_LEFT"){
    if(fryLeftStreak >= 3){
      fryState = "READY_RIGHT";
      fryTimer = 0;
      fryRightStreak = 0;
    }
  }
  else if (fryState === "READY_RIGHT"){
    fryTimer++;
    
    if(fryRightStreak>=3 && fryTimer<FRY_MAX_FRAMES){
      fryCycles++;
      console.log("재료 볶기 횟수:", fryCycles);
      
      // 초기화
      fryState = "WAIT_LEFT";
      fryTimer = 0;
      fryLeftStreak = 0;
      fryRightStreak = 0;
    }
    
    if (fryTimer > FRY_MAX_FRAMES*2){
      fryState = "WAIT_LEFT";
      fryTimer = 0;
      fryLeftStreak = 0;
      fryRightStreak = 0;
    }
  }
  
  if (fryCycles >= 3) {
    currentStep = 4;
    console.log("3단계 완료 → 4단계!");
  }
}

// stage4: eating
function updateTaste() {
  let positions = tracker.getCurrentPosition();
  if (!positions) return;
  
  fill(255);
  stroke(0)

  // 좌우반전된 좌표로 다시 계산
  // 원본은 미러링 안 되었기 때문
  let mirrored = [];
  for (let i = 0; i < positions.length; i++) {
    let x = width - positions[i][0];
    let y = positions[i][1];
    mirrored[i] = [x, y];
    circle(x, y, 5);
  }

  // 입 포인트
  let upperLip = mirrored[57];
  let lowerLip = mirrored[60];
  if (!upperLip || !lowerLip) return;
  
  let distMouth = dist(upperLip[0], upperLip[1], lowerLip[0], lowerLip[1]);
  let isOpen = distMouth > mouthOpenThres * 0.75;
  
  if (isOpen) {
    tasteOpenStreak++;
    tasteCloseStreak = 0;
  } else {
    tasteCloseStreak++;
    tasteOpenStreak = 0;
  }

  // ----- state machine -----
  if (tasteState === "WAIT_OPEN") {
    if (tasteOpenStreak >= TASTE_OPEN_FRAMES) {
      tasteState = "WAIT_CLOSE";
    }
  }
  else if (tasteState === "WAIT_CLOSE") {
    if (tasteCloseStreak >= TASTE_CLOSE_FRAMES) {
      tasteCycles++;
      console.log("간보기 벌리기 횟수:", tasteCycles);

      tasteState = "WAIT_OPEN";  // 다시 OPEN 단계로
      tasteOpenStreak = 0;
      tasteCloseStreak = 0;
    }
  }

  // ----- finish -----
  if (tasteCycles >= TASTE_TARGET) {
    console.log("간보기 3회 완료!");
    stepDone = true;
  }
}

// 디버깅용 키포인트 표시
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
function drawUI(){
  fill(0,180);
  rect(0,0,width,60);
  
  fill(255);
  textSize(20);
  textAlign(CENTER,CENTER)
  
  let desc = "";
  if (currentStep === 1) desc = "1단계) 재료 손질: 오른손을 머리 위에서 아래로 크게 3회 내리세요!";
  else if (currentStep === 2) desc = "2단계) 재료 넣기: 양손을 머리 위에서 아래로 크게 3회 내리세요!";
  else if (currentStep === 3) desc = "3단계) 재료 볶기: 왼손을 주먹 쥐고 왼쪽에서 오른쪽으로 크게 3회 움직이세요!";
  else if (currentStep === 4) desc = "4단계) 간보기: 입을 크게 3회 벌리세요!"
  
  if (stepDone) desc = "요리하기 완료! 사랑하는 사람들과 음식을 나누세요!"
  
  text(desc, 320, 30);
}
