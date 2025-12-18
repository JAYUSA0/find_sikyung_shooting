/***************
 * 배경 이미지 모바일 대응
 ***************/
const bg = document.getElementById('bgImage');
function adjustBgForMobile() {
  if (window.innerWidth <= 768) {
    bg.style.width = '80vw';
    bg.style.height = 'auto';
    bg.style.left = '10%';
    bg.style.top = '0';
    bg.style.transform = 'none';
  } else {
    bg.style.width = 'auto';
    bg.style.height = '100vh';
    bg.style.left = '50%';
    bg.style.top = '0';
    bg.style.transform = 'translateX(-50%)';
  }
}
adjustBgForMobile();
window.addEventListener('resize', adjustBgForMobile);

/***************
 * 사운드
 ***************/
const clearSfx = new Audio("https://raw.githubusercontent.com/JAYUSA0/bgm/main/시경.mp3");
clearSfx.volume = 0.7;
let bgm;

/***************
 * 게임 설정
 ***************/
let ROWS = 9, COLS = 9, MINES = 10;
const bombImgUrl = "https://raw.githubusercontent.com/JAYUSA0/bgm/main/sikyeong2.png";

let board = [], flags = [], revealed = [];
let gameOver = false;
let time = 0, timerInterval = null;
let bgmStarted = false;

/***************
 * 초기 로드
 ***************/
window.onload = () => {
  bgm = document.getElementById("bgm");
  bgm.src = "https://raw.githubusercontent.com/JAYUSA0/bgm/main/히로인%20citypop4_master.wav";
  bgm.volume = 0.4;
  init();
};

/***************
 * 초기화
 ***************/
function init() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  flags = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  gameOver = false;
  bgmStarted = false;
  time = 0;
  stopTimer();
  document.getElementById("timer").textContent = "0";

  // 지뢰 배치
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (board[r][c] !== "M") { board[r][c] = "M"; placed++; }
  }

  // 숫자 계산
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === "M") continue;
      let count = 0;
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && board[nr][nc]==="M") count++;
      }
      board[r][c] = count;
    }
  }

  render();
  updateMineCount();
}

/***************
 * 렌더링 (동적 셀 + 모바일/PC 대응)
 ***************/
function render() {
  const game = document.getElementById("game");
  game.innerHTML = "";

  // 셀 크기 동적 계산
  const maxCellSize = 30;
  const minCellSize = 22;
  const availableWidth = window.innerWidth - 20;
  let cellSize = Math.floor(availableWidth / COLS);
  cellSize = Math.min(Math.max(cellSize, minCellSize), maxCellSize);

  game.style.gridTemplateColumns = `repeat(${COLS}, ${cellSize}px)`;

  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (revealed[r][c]) {
        cell.classList.add("open");
        if (board[r][c] === "M") {
          const img = document.createElement("img");
          img.src = bombImgUrl;
          img.style.width = cellSize+"px";
          img.style.height = cellSize+"px";
          cell.appendChild(img);
        } else if (board[r][c] !== 0) {
          cell.textContent = board[r][c];
        }
      } else if (flags[r][c]) {
        cell.textContent = "🚩";
      }

      addCellEvents(cell, r, c);
      game.appendChild(cell);
    }
  }
}

/***************
 * 이벤트 통합 (PC + 모바일)
 ***************/
function addCellEvents(cell, r, c) {
  // 모바일 터치
  let pressTimer, longPress=false;
  cell.addEventListener('pointerdown', e => {
    if(e.pointerType!=='touch') return;
    longPress=false;
    pressTimer = setTimeout(()=>{ longPress=true; toggleFlag(r,c); }, 300);
  });
  cell.addEventListener('pointerup', e => {
    if(e.pointerType!=='touch') return;
    clearTimeout(pressTimer);
    if(!longPress) openCell(r,c);
  });
  cell.addEventListener('pointercancel', e => { clearTimeout(pressTimer); });

  // PC 마우스 이벤트
  let bothPressed=false;
  cell.onmousedown = e => { if(e.buttons===3) bothPressed=true; };
  cell.onmouseup = e => {
    if(bothPressed){ bothPressed=false; openAround(r,c); return; }
    if(e.button===0) openCell(r,c);
  };
  cell.oncontextmenu = e => { e.preventDefault(); toggleFlag(r,c); };
}

/***************
 * 게임 로직
 ***************/
function openCell(r,c){
  if(gameOver||revealed[r][c]||flags[r][c]) return;
  if(!bgmStarted){ bgm.play().catch(()=>{}); bgmStarted=true; startTimer(); }
  revealed[r][c]=true;
  if(board[r][c]==="M"){ gameOver=true; revealAll(); stopTimer(); setTimeout(()=>alert("💥 오이오이, 시굥"),500); return; }
  if(board[r][c]===0){ for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const nr=r+dr,nc=c+dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS) openCell(nr,nc); } }
  if(checkClear()){ gameOver=true; stopTimer(); bgm.pause(); revealClearResult(); clearSfx.currentTime=0; clearSfx.play().catch(()=>{}); setTimeout(()=>alert("🎉 시굥!!!!!!"),500);}
  render();
}
function toggleFlag(r,c){ if(revealed[r][c]||gameOver) return; flags[r][c]=!flags[r][c]; render(); updateMineCount(); }
function openAround(r,c){ if(!revealed[r][c]||board[r][c]===0||board[r][c]==="M") return; let fc=0; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(flags[r+dr]&&flags[r+dr][c+dc]) fc++; if(fc!==board[r][c]) return; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const nr=r+dr,nc=c+dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!flags[nr][nc]&&!revealed[nr][nc]) openCell(nr,nc); } }

/***************
 * 유틸
 ***************/
function revealAll(){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) revealed[r][c]=true; render(); }
function revealClearResult(){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(board[r][c]==="M"){ revealed[r][c]=true; flags[r][c]=false; } render(); }
function checkClear(){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(board[r][c]!=="M"&&!revealed[r][c]) return false; return true; }
function startTimer(){ clearInterval(timerInterval); timerInterval=setInterval(()=>{ time++; document.getElementById("timer").textContent=time; },1000); }
function stopTimer(){ clearInterval(timerInterval); }
function updateMineCount(){ document.getElementById("mineCount").textContent=MINES-flags.flat().filter(Boolean).length; }
function restart(){ bgm.currentTime=0; init(); }
function setDifficulty(level){ if(level==="easy"){ROWS=9;COLS=9;MINES=10;} else if(level==="normal"){ROWS=16;COLS=16;MINES=40;} else if(level==="hard"){ROWS=16;COLS=30;MINES=99;} restart(); }
function changeVolume(v){ bgm.volume=v/100; }

// 브라우저 리사이즈 시 자동 렌더링
window.addEventListener('resize', render);