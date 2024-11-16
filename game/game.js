const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 20;
context.scale(BLOCK_SIZE, BLOCK_SIZE);

let score = 0;

const shapes = [
  [[1, 1, 1, 1]], // I shape
  [[1, 1], [1, 1]], // O shape
  [[0, 1, 0], [1, 1, 1]], // T shape
  [[1, 1, 0], [0, 1, 1]], // S shape
  [[0, 1, 1], [1, 1, 0]], // Z shape
  [[1, 0, 0], [1, 1, 1]], // L shape
  [[0, 0, 1], [1, 1, 1]], // J shape
];

const colors = ["cyan", "yellow", "purple", "green", "red", "orange", "blue"];

function createPiece(type) {
  return shapes[type];
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[currentPiece.type];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, COLUMNS, ROWS);
  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(currentPiece.matrix, currentPiece.position);
}

function collide(board, piece) {
  const [m, o] = [piece.matrix, piece.position];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] !== 0 &&
        (board[y + o.y] && board[y + o.y][x + o.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + piece.position.y][x + piece.position.x] = value;
      }
    });
  });
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map((row) => row[i])).reverse();
}

// 가득 찬 줄을 찾아서 지우고, 위에 있는 줄들을 한 줄씩 내립니다
function sweep() {
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }
    // 가득 찬 줄을 지우고 점수를 추가합니다
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++y; // 줄을 지운 후 다시 현재 y 위치를 검사합니다
    score += 100;
    document.getElementById("score").innerText = score;
  }
}

function playerDrop() {
  currentPiece.position.y++;
  if (collide(board, currentPiece)) {
    currentPiece.position.y--;
    merge(board, currentPiece);
    resetPiece();
    sweep();
  }
  dropCounter = 0;
}

function resetPiece() {
  const type = Math.floor(Math.random() * shapes.length);
  currentPiece.matrix = createPiece(type);
  currentPiece.position = { x: (COLUMNS / 2) | 0, y: 0 };
  currentPiece.type = type;
  if (collide(board, currentPiece)) {
    board.forEach((row) => row.fill(0));
    score = 0;
    document.getElementById("score").innerText = score;
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

const board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
let currentPiece = { position: { x: 0, y: 0 }, matrix: null, type: 0 };
resetPiece();
update();

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    currentPiece.position.x--;
    if (collide(board, currentPiece)) {
      currentPiece.position.x++;
    }
  } else if (event.key === "ArrowRight") {
    currentPiece.position.x++;
    if (collide(board, currentPiece)) {
      currentPiece.position.x--;
    }
  } else if (event.key === "ArrowDown") {
    playerDrop();
  } else if (event.key === "ArrowUp") {
    const rotatedMatrix = rotate(currentPiece.matrix);
    const pos = currentPiece.position.x;
    let offset = 1;
    while (collide(board, { ...currentPiece, matrix: rotatedMatrix })) {
      currentPiece.position.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > currentPiece.matrix[0].length) {
        currentPiece.position.x = pos;
        return;
      }
    }
    currentPiece.matrix = rotatedMatrix;
  }
});
