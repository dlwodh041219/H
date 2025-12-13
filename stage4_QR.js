// ====== QR 페이지(업로드 + QR 생성) ======
let qrDiv = null;         // QRCode.js가 그려주는 DOM
let qrLoading = false;
let qrReady = false;
let qrError = null;
let qrPublicUrl = null;

let SUPABASE_URL = "https://vchshodrfbxqvilbiown.supabase.co";
let SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaHNob2RyZmJ4cXZpbGJpb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzI3MjMsImV4cCI6MjA4MTIwODcyM30.CrUt1ovSoLMj9CU65YW7csJ6wzE-ezCsEIpFFyhpx0w";

let SUPABASE_BUCKET = "emojiCreated";
let SUPABASE_FOLDER = "public";

let sb = null;
function getSupabase() {
  if (!sb) {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("Supabase CDN 로드 실패: window.supabase.createClient 없음");
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return sb;
}


function dataURLtoFile(dataurl, fileName) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}

async function startQRFlowIfNeeded() {
  if (qrLoading || qrReady) return;

  qrLoading = true;
  qrError = null;
  qrPublicUrl = null;

  try {
    const url = await uploadCaptureToSupabaseAndGetUrl();
    qrPublicUrl = url;

    buildQRCodeWithUrl(qrPublicUrl);
    qrReady = true;
  } catch (e) {
    console.log("QR Flow Error:", e);
    qrError = (e && typeof e === "object")
      ? (e.message || JSON.stringify(e))
      : String(e);
    qrReady = false;
    hideQRDiv();
  } finally {
    qrLoading = false; // ✅ 이거 없어서 로딩이 계속 뜸
  }
}

async function uploadCaptureToSupabaseAndGetUrl() {
  const cap = window.__LAST_CAPTURE_DATAURL__;
  if (!cap) throw new Error("캡쳐 데이터가 없어요. (window.__LAST_CAPTURE_DATAURL__ 비어있음)");

  const supabase = getSupabase();

  const filename = `emoji_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  const file = dataURLtoFile(cap, filename);

  const path = `${SUPABASE_FOLDER}/${filename}`;

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      contentType: "image/jpg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // ✅ public URL 얻기
  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) throw new Error("publicUrl 생성 실패");
  return urlData.publicUrl;
}

function ensureQRDiv() {
  if (!qrDiv) {
    qrDiv = createDiv("");
    qrDiv.id("qrcode");
    qrDiv.style("background", "transparent");
  }
  return qrDiv;
}

function clearQRDiv() {
  if (qrDiv) qrDiv.html(""); // 이전 QR 지우기
}

function showQRDivAtCanvas(cx, cy, size = 180) {
  if (!qrDiv || !canvasEl) return;

  // ✅ 캔버스가 페이지에서 어디에 있는지 구함
  const rect = canvasEl.elt.getBoundingClientRect();

  // ✅ 캔버스 좌표(cx,cy)를 페이지 좌표로 변환
  const pageX = rect.left + cx;
  const pageY = rect.top + cy;

  qrDiv.position(pageX, pageY);
  qrDiv.style("width", `${size}px`);
  qrDiv.style("height", `${size}px`);
  qrDiv.style("z-index", "9999");     // ✅ 카드 위로
  qrDiv.style("pointer-events", "none"); // ✅ 클릭 방해 안 하게 (선택)
  qrDiv.show();
}

function hideQRDiv() {
  if (qrDiv) qrDiv.hide();
}

function buildQRCodeWithUrl(url) {
  ensureQRDiv();
  clearQRDiv();

  // QRCode.js는 element에 렌더링함
  new QRCode(document.getElementById("qrcode"), {
    text: url,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M,
  });
}

function resetQRPageState() {
  // DOM 숨기기
  if (typeof hideQRDiv === "function") hideQRDiv();

  // QR DOM 자체 제거(권장: 다음에 다시 들어올 때 깨끗하게)
  if (typeof qrDiv !== "undefined" && qrDiv) {
    qrDiv.remove();
    qrDiv = null;
  }

  // 상태 리셋
  qrLoading = false;
  qrReady = false;
  qrError = null;
  qrPublicUrl = null;
}

function drawQRPage() {
  background(215, 240, 249);

  // ✅ QR 페이지 들어오면 업로드/QR 생성 시작
  // (draw는 계속 도니까, 내부에서 1번만 실행되게 함수가 막아줌)
  startQRFlowIfNeeded();

  // 제목
  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(32);
  text("나만의 이모지 완성!", width / 2, 40);

  textSize(18);
  text("아래 QR을 스캔해서\n영상·이미지를 다운받아 보세요 :)", width / 2, 90);
  pop();

  // 가운데 카드
  push();
  rectMode(CENTER);
  noStroke();
  fill(255, 255, 255, 230);
  rect(width / 2, height / 2 + 20, 360, 260, 30);
  pop();

  const qrSize = 180;
  const cardCenterX = width / 2;
  const cardCenterY = height / 2 + 20;

  if (qrReady && qrDiv) {
    showQRDivAtCanvas(cardCenterX - qrSize/2, cardCenterY - qrSize/2, qrSize);
  } else {
    hideQRDiv();
  }

  // 로딩/에러 텍스트
  push();
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(16);

  if (qrLoading) {
    text("QR 만드는 중... (업로드 중)", width / 2, height / 2 + 30);
  } else if (qrError) {
    text("QR 생성 실패 😭", width / 2, height / 2 + 20);
    textSize(12);
    text(qrError, width / 2, height / 2 + 50);
  } else if (qrReady) {
    textSize(12);
    text("스캔하면 방금 찍은 사진 링크로 이동해요", width / 2, height / 2 + 120);
  }
  pop();

  // 하단 버튼 (처음으로 돌아가기)
  let btnX = width / 2;
  let btnY = height - 70;
  let btnW = 220;
  let btnH = 50;

  let hovering =
    mouseX > btnX - btnW / 2 &&
    mouseX < btnX + btnW / 2 &&
    mouseY > btnY - btnH / 2 &&
    mouseY < btnY + btnH / 2;

  push();
  rectMode(CENTER);
  noStroke();
  fill(hovering ? color(230, 164, 174) : color(200, 150, 160));
  rect(btnX, btnY, btnW, btnH, 20);

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("처음으로 돌아가기", btnX, btnY);
  pop();
}