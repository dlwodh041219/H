// ===============================
// FaceMesh + 이모지 얼굴
// ===============================

let faceMesh;
let video;
let faces = [];

// 부드럽게 보정용
let smoothPoints = null;
// 0에 가까울수록 더 빠르게 따라옴 (반응성↑, 흔들림도↑)
let SMOOTH_FACTOR = 0.3;

// FaceMesh 옵션 (한 얼굴만, 좌우 반전은 p5에서 처리)
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // FaceMesh 시작
  faceMesh.detectStart(video, gotFaces);

  textAlign(CENTER, CENTER);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);

  // 거울처럼 좌우 반전 (비디오 + 이모지 같이 뒤집기)
  push();
  translate(width, 0);
  scale(-1, 1);

  image(video, 0, 0, width, height);
  drawEmojiFace();

  pop();
}

// ===============================
// 이모지 그리기
// ===============================
function drawEmojiFace() {
  if (faces.length === 0) {
    smoothPoints = null;
    return;
  }

  let face = faces[0];
  let keypoints = face.keypoints;
  // 우리가 쓰는 인덱스(최대 386)까지 없으면 그냥 리턴
  if (!keypoints || keypoints.length <= 386) return;

  // 현재 프레임 좌표 배열로 정리
  let current = [];
  for (let i = 0; i < keypoints.length; i++) {
    current[i] = [keypoints[i].x, keypoints[i].y];
  }

  // -------------------------------
  // 부드럽게 보간 (조금만 사용해서 반응성 유지)
  // -------------------------------
  if (!smoothPoints) {
    smoothPoints = current.map(p => [p[0], p[1]]);
  } else {
    for (let i = 0; i < current.length; i++) {
      smoothPoints[i][0] = lerp(
        smoothPoints[i][0],
        current[i][0],
        1 - SMOOTH_FACTOR
      );
      smoothPoints[i][1] = lerp(
        smoothPoints[i][1],
        current[i][1],
        1 - SMOOTH_FACTOR
      );
    }
  }

  // 헬퍼 함수들
  let pt = function (idx) {
    if (!smoothPoints[idx]) return null;
    return createVector(smoothPoints[idx][0], smoothPoints[idx][1]);
  };

  let avg = function (indices) {
    let sx = 0;
    let sy = 0;
    let cnt = 0;
    for (let i = 0; i < indices.length; i++) {
      let p = pt(indices[i]);
      if (p) {
        sx += p.x;
        sy += p.y;
        cnt++;
      }
    }
    if (cnt === 0) return null;
    return createVector(sx / cnt, sy / cnt);
  };

  // ================================
  // FaceMesh 인덱스로 포인트 가져오기
  // (MediaPipe 기준 인덱스 – 위치가 조금 어긋나면
  //  디버그 찍어서 미세조정 필요할 수 있음, "확실하지 않음" 부분)
  // ================================

  // 왼쪽 눈(사용자 기준 왼쪽) 주변 4점 평균
  let leftEye = avg([362, 263, 386, 374]);
  // 오른쪽 눈 주변 4점 평균
  let rightEye = avg([133, 33, 159, 145]);
  // 코 끝
  let nose = pt(1);
  // 입 중앙 (윗/아랫 입술 중앙 + 양쪽 입꼬리 평균)
  let mouth = avg([0, 17, 61, 291]);

  if (!leftEye || !rightEye || !nose || !mouth) return;

  // 눈 사이 거리 = 얼굴 스케일
  let eyeDist = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y);

  // 과장된 크기 (더 크게 하고 싶으면 계수만 올리면 됨)
  let eyeSize = eyeDist * 0.9;
  let noseSize = eyeDist * 0.9;
  let mouthSize = eyeDist * 0.9;

// 머리 기울기 (눈 두 점으로 각도 계산 - 순서 반대로!)
let dx = leftEye.x - rightEye.x;
let dy = leftEye.y - rightEye.y;
let angle = atan2(dy, dx);


  noStroke();
  textAlign(CENTER, CENTER);

  // ===============================
  // 눈 👁 👁
  // ===============================
  textSize(eyeSize);

  push();
  translate(leftEye.x, leftEye.y);
  rotate(angle);
  text("👁", 0, 0);
  pop();

  push();
  translate(rightEye.x, rightEye.y);
  rotate(angle);
  text("👁", 0, 0);
  pop();

  // ===============================
  // 코 👃
  // ===============================
  textSize(noseSize);
  push();
  translate(nose.x, nose.y-15);
  rotate(angle);
  text("👃", 0, 0);
  pop();

  // ===============================
  // 입 👄
  // ===============================
  textSize(mouthSize);
  push();
  translate(mouth.x, mouth.y);
  rotate(angle);
  text("👄", 0, 0);
  pop();
}
