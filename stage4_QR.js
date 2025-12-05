function drawQRPage() {
  background(215, 240, 249);

  // 제목
  push();
  textAlign(CENTER, CENTER);
  textFont(fontTemplate);
  fill(0);
  noStroke();
  textSize(32);
  text("나만의 이모지 완성!", width / 2, 60);

  textSize(18);
  text("아래 QR을 스캔해서\n영상·이미지를 다운받아 보세요 :)", width / 2, 110);
  pop();

  // 가운데 카드
  push();
  rectMode(CENTER);
  noStroke();
  fill(255, 255, 255, 230);
  rect(width / 2, height / 2 + 20, 360, 260, 30);
  pop();

  // QR 이미지 (이미지 크기는 상황에 맞춰 조절)
  //if (qrImg) {
  // imageMode(CENTER);
  //  image(qrImg, width / 2, height / 2 + 10, 180, 180);
  //}

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