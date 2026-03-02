const board = document.querySelector('.board');
const blockHeight = 50;
const blockWidth = 50;

const modal = document.getElementById('game-over-modal');
const finalScoreSpan = document.getElementById('final-score');
const finalHighScoreSpan = document.getElementById('final-high-score');
const restartBtn = document.getElementById('restart-btn');
const startMenuModal = document.getElementById('start-menu-modal');
const startBtn = document.getElementById('start-btn');
const startSpeedSelect = document.getElementById('start-speed-select');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);
let intervalId = null;
let food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) }

const blocks = [];
const snake = [{
    x: 1, y: 3
}]

let direction = "down";
let score = 0;
let startTime = 0;
let totalPausedTime = 0;
let pauseStartTime = 0;
let currentSpeed = 150;
let isPaused = false;
let gameStarted = false;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
    }
}

function updateTime() {
    if (!gameStarted || isPaused) return;

    let elapsed = Math.floor((Date.now() - startTime - totalPausedTime) / 1000);
    let minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    let seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('time').innerText = `${minutes}:${seconds}`;
}

function render() {
    let head = null

    blocks[`${food.x}-${food.y}`].classList.add("food");

    if (direction == "left") {
        head = { x: snake[0].x, y: snake[0].y - 1 }
    } else if (direction == "right") {
        head = { x: snake[0].x, y: snake[0].y + 1 }
    } else if (direction == "down") {
        head = { x: snake[0].x + 1, y: snake[0].y }
    } else if (direction == "up") {
        head = { x: snake[0].x - 1, y: snake[0].y }
    }

    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        gameOver();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.forEach(segment => {
        if (blocks[`${segment.x}-${segment.y}`]) {
            blocks[`${segment.x}-${segment.y}`].classList.remove("fill");
        }
    })

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        blocks[`${food.x}-${food.y}`].classList.remove("food");
        score += 10;
        document.getElementById("score").innerText = score;

        let highScore = parseInt(document.getElementById("high-score").innerText);
        if (score > highScore) {
            document.getElementById("high-score").innerText = score;
        }

        let newFoodPos;
        while (true) {
            newFoodPos = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };
            let onSnake = snake.some(s => s.x === newFoodPos.x && s.y === newFoodPos.y);
            if (!onSnake && newFoodPos.x < rows && newFoodPos.y < cols) break;
        }
        food = newFoodPos;
        blocks[`${food.x}-${food.y}`].classList.add("food");
    } else {
        snake.pop();
    }

    snake.forEach(segment => {
        if (blocks[`${segment.x}-${segment.y}`]) {
            blocks[`${segment.x}-${segment.y}`].classList.add("fill");
        }
    })

    updateTime();
}

function gameOver() {
    clearInterval(intervalId);
    finalScoreSpan.innerText = score;
    finalHighScoreSpan.innerText = document.getElementById("high-score").innerText;
    modal.classList.remove('hidden');
}

function togglePause() {
    if (!gameStarted || !modal.classList.contains('hidden')) return;

    isPaused = !isPaused;

    if (isPaused) {
        clearInterval(intervalId);
        pauseStartTime = Date.now();
        pauseOverlay.classList.remove('hidden');
        pauseBtn.innerText = "Resume";
    } else {
        totalPausedTime += (Date.now() - pauseStartTime);
        pauseOverlay.classList.add('hidden');
        pauseBtn.innerText = "Pause";

        // Use a tiny timeout to prevent the key that unpaused from becoming the snake's new direction immediately
        setTimeout(() => {
            intervalId = setInterval(() => {
                render();
            }, currentSpeed);
        }, 50);
    }
}

pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);

function startGame(speed) {
    currentSpeed = speed;
    startMenuModal.classList.add('hidden');
    gameStarted = true;
    isPaused = false;

    // Reset state
    snake.length = 0;
    snake.push({ x: 1, y: 3 });
    direction = "down";
    score = 0;
    startTime = Date.now();
    totalPausedTime = 0;
    document.getElementById("score").innerText = "0";

    // Clear board
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (blocks[`${row}-${col}`]) {
                blocks[`${row}-${col}`].classList.remove("fill", "food");
            }
        }
    }

    food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };

    clearInterval(intervalId);
    intervalId = setInterval(() => {
        render()
    }, currentSpeed);
}

startBtn.addEventListener('click', () => {
    let selectedSpeed = parseInt(startSpeedSelect.value);
    startGame(selectedSpeed);
});

restartBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    startGame(currentSpeed);
});

// The original speedSelect.addEventListener was likely a typo for startSpeedSelect
// and its logic is now handled by startGame.
// If there was another speed select for in-game changes, it would need different logic.
// Assuming this block is no longer needed or should be removed.
// If it was meant for in-game speed changes, it would need to check gameStarted and isPaused.
// For now, removing it as the new logic implies startSpeedSelect is for initial speed.
// If 'speedSelect' was a different element, it would need to be defined.

// Original code had:
// speedSelect.addEventListener('change', (e) => {
//     currentSpeed = parseInt(e.target.value);
//     if (!modal.classList.contains('hidden')) return;
//     clearInterval(intervalId);
//     intervalId = setInterval(() => {
//         render()
//     }, currentSpeed);
// });

// The initial interval setup is now handled by startGame, so this line is removed.
// intervalId = setInterval(() => {
//     render()
// }, currentSpeed);

addEventListener('keydown', (event) => {
    if (event.code === "Space") {
        event.preventDefault(); // Prevent page scrolling
        togglePause();
        return;
    }

    if (isPaused || !gameStarted) return;
    if (event.key == "ArrowUp" && direction !== "down") {
        direction = "up";
    } else if (event.key == "ArrowDown" && direction !== "up") {
        direction = "down";
    } else if (event.key == "ArrowRight" && direction !== "left") {
        direction = "right";
    } else if (event.key == "ArrowLeft" && direction !== "right") {
        direction = "left";
    }
})