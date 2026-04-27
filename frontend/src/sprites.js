// SVG를 Image 객체로 변환해서 Canvas에 그리는 스프라이트
function svgToImage(svgStr) {
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  return img;
}

// 플레이어 전투기 (F-22 스타일, 초록/청록)
export const playerSprite = svgToImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
  <!-- 엔진 불꽃 -->
  <ellipse cx="24" cy="54" rx="5" ry="8" fill="#FF6600" opacity="0.9"/>
  <ellipse cx="24" cy="52" rx="3" ry="5" fill="#FFDD00"/>
  <!-- 주 동체 -->
  <polygon points="24,2 30,20 28,44 24,48 20,44 18,20" fill="#00CC66"/>
  <!-- 주익 (큰 날개) -->
  <polygon points="24,18 48,38 44,42 24,30" fill="#00AA55"/>
  <polygon points="24,18 0,38 4,42 24,30" fill="#00AA55"/>
  <!-- 카나드 (앞 작은 날개) -->
  <polygon points="24,14 36,22 34,25 24,20" fill="#00FF88"/>
  <polygon points="24,14 12,22 14,25 24,20" fill="#00FF88"/>
  <!-- 수직 꼬리날개 -->
  <polygon points="24,30 28,44 24,46 20,44" fill="#009944"/>
  <!-- 조종석 캐노피 -->
  <ellipse cx="24" cy="12" rx="5" ry="8" fill="#88FFEE" opacity="0.85"/>
  <ellipse cx="24" cy="11" rx="3" ry="5" fill="#CCFFFF" opacity="0.6"/>
  <!-- 엔진 노즐 -->
  <rect x="20" y="44" width="8" height="6" rx="2" fill="#005533"/>
  <!-- 기체 하이라이트 -->
  <polygon points="24,4 26,18 24,20 22,18" fill="#00FF88" opacity="0.5"/>
</svg>
`);

// 적 전투기 1 (빨강, 1행)
export const enemy1Sprite = svgToImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="36" viewBox="0 0 40 36">
  <!-- 동체 -->
  <polygon points="20,2 26,14 24,30 20,34 16,30 14,14" fill="#CC2200"/>
  <!-- 날개 -->
  <polygon points="20,12 40,28 36,32 20,22" fill="#AA1100"/>
  <polygon points="20,12 0,28 4,32 20,22" fill="#AA1100"/>
  <!-- 앞날개 -->
  <polygon points="20,10 30,18 28,21 20,16" fill="#FF4422"/>
  <polygon points="20,10 10,18 12,21 20,16" fill="#FF4422"/>
  <!-- 조종석 -->
  <ellipse cx="20" cy="10" rx="4" ry="6" fill="#FF8866" opacity="0.8"/>
  <!-- 눈 (LED) -->
  <circle cx="17" cy="9" r="2" fill="#FF0000"/>
  <circle cx="23" cy="9" r="2" fill="#FF0000"/>
  <circle cx="17" cy="9" r="1" fill="#FFAAAA"/>
  <circle cx="23" cy="9" r="1" fill="#FFAAAA"/>
  <!-- 하이라이트 -->
  <polygon points="20,4 22,14 20,16 18,14" fill="#FF6644" opacity="0.5"/>
</svg>
`);

// 적 전투기 2 (주황, 2행)
export const enemy2Sprite = svgToImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="36" viewBox="0 0 40 36">
  <!-- 동체 -->
  <polygon points="20,2 27,12 25,28 20,32 15,28 13,12" fill="#CC6600"/>
  <!-- 날개 (델타익) -->
  <polygon points="20,8 40,30 34,34 20,24" fill="#AA4400"/>
  <polygon points="20,8 0,30 6,34 20,24" fill="#AA4400"/>
  <!-- 앞날개 -->
  <polygon points="20,8 32,16 30,20 20,14" fill="#FF8800"/>
  <polygon points="20,8 8,16 10,20 20,14" fill="#FF8800"/>
  <!-- 조종석 -->
  <ellipse cx="20" cy="9" rx="4" ry="6" fill="#FFAA44" opacity="0.8"/>
  <!-- 눈 -->
  <circle cx="17" cy="8" r="2" fill="#FF6600"/>
  <circle cx="23" cy="8" r="2" fill="#FF6600"/>
  <circle cx="17" cy="8" r="1" fill="#FFDDAA"/>
  <circle cx="23" cy="8" r="1" fill="#FFDDAA"/>
  <!-- 하이라이트 -->
  <polygon points="20,3 22,12 20,14 18,12" fill="#FFAA44" opacity="0.5"/>
</svg>
`);

// 적 전투기 3 (노랑, 3행 - 보스급)
export const enemy3Sprite = svgToImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="38" viewBox="0 0 44 38">
  <!-- 동체 -->
  <polygon points="22,2 30,14 28,32 22,36 16,32 14,14" fill="#AAAA00"/>
  <!-- 큰 날개 -->
  <polygon points="22,10 44,32 38,36 22,26" fill="#888800"/>
  <polygon points="22,10 0,32 6,36 22,26" fill="#888800"/>
  <!-- 앞날개 -->
  <polygon points="22,8 36,18 33,22 22,16" fill="#DDDD00"/>
  <polygon points="22,8 8,18 11,22 22,16" fill="#DDDD00"/>
  <!-- 조종석 -->
  <ellipse cx="22" cy="10" rx="5" ry="7" fill="#FFFF66" opacity="0.85"/>
  <!-- 눈 (더 크고 위협적) -->
  <circle cx="18" cy="9" r="3" fill="#FFCC00"/>
  <circle cx="26" cy="9" r="3" fill="#FFCC00"/>
  <circle cx="18" cy="9" r="1.5" fill="#FF4400"/>
  <circle cx="26" cy="9" r="1.5" fill="#FF4400"/>
  <!-- 하이라이트 -->
  <polygon points="22,3 25,13 22,15 19,13" fill="#FFFF88" opacity="0.6"/>
  <!-- 미사일 포드 -->
  <rect x="8" y="20" width="6" height="10" rx="3" fill="#666600"/>
  <rect x="30" y="20" width="6" height="10" rx="3" fill="#666600"/>
</svg>
`);

// 폭발 이펙트용 (별 모양)
export const explosionSprite = svgToImage(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <polygon points="20,2 23,15 36,8 27,18 40,20 27,22 36,32 23,25 20,38 17,25 4,32 13,22 0,20 13,18 4,8 17,15" fill="#FF8800" opacity="0.9"/>
  <polygon points="20,6 22,15 30,10 24,18 34,20 24,22 30,30 22,25 20,34 18,25 10,30 16,22 6,20 16,18 10,10 18,15" fill="#FFDD00"/>
  <circle cx="20" cy="20" r="6" fill="#FFFFFF" opacity="0.8"/>
</svg>
`);
