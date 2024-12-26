const BOARD_SIZE = 8;
const RABBIT = 'RABBIT';
const WOLF = 'WOLF';
const EMPTY = null;

const DIRECTIONS = {
    RABBIT: [
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
    ],
    WOLF: [
        { x: 1, y: -1 },
        { x: 1, y: 1 },
    ],
};

const SURROUND_DIRECTIONS = [
    { x: -1, y: -1 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
];

const DIFFICULTY_DEPTH = {
    easy: 1,
    medium: 5,
    hard: 8,
};

let board = [];
let rabbitPos = { x: 7, y: 2 };
let wolves = [
    { x: 0, y: 1 },
    { x: 0, y: 3 },
    { x: 0, y: 5 },
    { x: 0, y: 7 },
];
let isRabbitTurn = true;
let difficulty = 'easy';
let winner = null;
let selectedPiece = null;
let possibleMoves = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    renderBoard();

    document.getElementById('resetButton').addEventListener('click', resetGame);
    document.getElementById('difficulty').addEventListener('change', (e) => {
        difficulty = e.target.value;
        console.log(`Складність встановлена на: ${difficulty}`);
    });
});

function initializeBoard() {
    board = Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(EMPTY));
    board[rabbitPos.x][rabbitPos.y] = RABBIT;
    wolves.forEach(wolf => {
        board[wolf.x][wolf.y] = WOLF;
    });
    winner = null;
    isRabbitTurn = true;
    selectedPiece = null;
    possibleMoves = [];
    hideWinner();
    console.log('Гра скинута. Початковий стан встановлено.');
    renderBoard();
}

function renderBoard() {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';

    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((x + y) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.x = x;
            cell.dataset.y = y;

            
            if (possibleMoves.some(pos => pos.x === x && pos.y === y)) {
                cell.classList.add('highlight');
            }

            if (board[x][y] === RABBIT) {
                const rabbit = document.createElement('span');
                rabbit.classList.add('rabbit');
                rabbit.textContent = '🐰';
                cell.appendChild(rabbit);
            }

            if (board[x][y] === WOLF) {
                const wolf = document.createElement('span');
                wolf.classList.add('wolf');
                wolf.textContent = '🐺';
                cell.appendChild(wolf);
            }

            cell.addEventListener('click', handleCellClick);
            boardDiv.appendChild(cell);
        }
    }

    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = isLoading ? 'flex' : 'none';

    if (winner) {
        const winnerDiv = document.getElementById('winner');
        if (winner === 'Rabbit') {
            winnerDiv.textContent = '🐰 Заєць переміг!';
        } else if (winner === 'Wolves') {
            winnerDiv.textContent = '🐺 Вовки перемогли!';
        }
        winnerDiv.style.display = 'block';
    } else {
        hideWinner();
    }
}

function handleCellClick(event) {
    if (winner || !isRabbitTurn) return;

    const x = parseInt(event.currentTarget.dataset.x);
    const y = parseInt(event.currentTarget.dataset.y);

    if (selectedPiece) {
        const to = { x, y };
        if (isValidMove(selectedPiece, to, RABBIT)) {
            moveRabbit(to);
            selectedPiece = null;
        } else {
            selectedPiece = null;
            possibleMoves = [];
            console.log('Недійсний хід зача.');
        }
    } else if (rabbitPos.x === x && rabbitPos.y === y) {
        selectedPiece = { ...rabbitPos };
        calculatePossibleMoves();
    }
    renderBoard();
}

function calculatePossibleMoves() {
    if (selectedPiece && isRabbitTurn) {
        const moves = [];
        DIRECTIONS[RABBIT].forEach(dir => {
            const newX = selectedPiece.x + dir.x;
            const newY = selectedPiece.y + dir.y;
            if (
                newX >= 0 &&
                newX < BOARD_SIZE &&
                newY >= 0 &&
                newY < BOARD_SIZE &&
                board[newX][newY] === EMPTY &&
                (newX + newY) % 2 === 1
            ) {
                moves.push({ x: newX, y: newY });
            }
        });
        possibleMoves = moves;
        console.log(`Можливі ходи зача: ${JSON.stringify(possibleMoves)}`);
    } else {
        possibleMoves = [];
    }
}

function isValidMove(from, to, player) {
    const directions = DIRECTIONS[player];
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if ((from.x + from.y) % 2 === 0 || (to.x + to.y) % 2 === 0) {
        return false;
    }

    const isValidDirection = directions.some(dir => dir.x === dx && dir.y === dy);

    return (
        isValidDirection &&
        to.x >= 0 &&
        to.x < BOARD_SIZE &&
        to.y >= 0 &&
        to.y < BOARD_SIZE &&
        board[to.x][to.y] === EMPTY
    );
}

function moveRabbit(to) {
    board[rabbitPos.x][rabbitPos.y] = EMPTY;
    board[to.x][to.y] = RABBIT;
    rabbitPos = { ...to };
    isRabbitTurn = false;
    possibleMoves = []; 

    console.log(`Заєць перемістився на (${to.x}, ${to.y})`);

    if (to.x === 0) {
        winner = 'Rabbit';
        console.log('Заєць досяг верхнього ряду та переміг!');
        renderBoard();
        return;
    }

    if (areWolvesWin(board)) {
        winner = 'Wolves';
        console.log('Вовки оточили зача та перемогли!');
        renderBoard();
        return;
    }

    wolfMove();
}

function wolfMove() {
    if (winner) return;
    isLoading = true;
    renderBoard();

    setTimeout(() => {
        const depth = DIFFICULTY_DEPTH[difficulty];
        const bestMove = getBestWolfMove(board, depth, -Infinity, Infinity);
        if (bestMove) {
            const { from, to } = bestMove;
            board[from.x][from.y] = EMPTY;
            board[to.x][to.y] = WOLF;
            wolves = wolves.map(wolf =>
                wolf.x === from.x && wolf.y === from.y ? { ...to } : wolf
            );

            console.log(`Вовк перемістився з (${from.x}, ${from.y}) на (${to.x}, ${to.y})`);

            if (areWolvesWin(board)) {
                winner = 'Wolves';
                console.log('Вовки оточили зача та перемогли!');
            } else {
                isRabbitTurn = true;
            }
        } else {
            winner = 'Rabbit';
            console.log('Вовки не можуть зробити хід. Заєць переміг!');
        }

        isLoading = false;
        renderBoard();
    }, 500);
}

function areWolvesWin(currentBoard) {
    const surrounded = isRabbitSurrounded(currentBoard);
    console.log(`Is Rabbit Surrounded: ${surrounded}`);
    return surrounded;
}

function isRabbitSurrounded(currentBoard) {
    const rabbit = findPiece(currentBoard, RABBIT);
    if (!rabbit) {
        console.log('Rabbit is not on the board.');
        return true; 
    }

    const surrounded = SURROUND_DIRECTIONS.every(dir => {
        const newX = rabbit.x + dir.x;
        const newY = rabbit.y + dir.y;
        const condition =
            newX < 0 ||
            newX >= BOARD_SIZE ||
            newY < 0 ||
            newY >= BOARD_SIZE ||
            currentBoard[newX][newY] === WOLF;
        if (!condition) {
            console.log(`Rabbit can move to (${newX}, ${newY})`);
        }
        return condition;
    });
    console.log(`Rabbit Surrounded: ${surrounded}`);
    return surrounded;
}

function generateAllWolfMoves(currentBoard) {
    const wolvesPositions = findAllPieces(currentBoard, WOLF);
    const moves = [];
    wolvesPositions.forEach(wolf => {
        DIRECTIONS[WOLF].forEach(dir => {
            const newX = wolf.x + dir.x;
            const newY = wolf.y + dir.y;
            if (
                newX >= 0 &&
                newX < BOARD_SIZE &&
                newY >= 0 &&
                newY < BOARD_SIZE &&
                currentBoard[newX][newY] === EMPTY &&
                (newX + newY) % 2 === 1
            ) {
                moves.push({ from: wolf, to: { x: newX, y: newY } });
            }
        });
    });
    return moves;
}

function generateAllRabbitMoves(currentBoard) {
    const rabbit = findPiece(currentBoard, RABBIT);
    if (!rabbit) return [];
    const moves = [];
    DIRECTIONS[RABBIT].forEach(dir => {
        const newX = rabbit.x + dir.x;
        const newY = rabbit.y + dir.y;
        if (
            newX >= 0 &&
            newX < BOARD_SIZE &&
            newY >= 0 &&
            newY < BOARD_SIZE &&
            currentBoard[newX][newY] === EMPTY &&
            (newX + newY) % 2 === 1
        ) {
            moves.push({ from: rabbit, to: { x: newX, y: newY } });
        }
    });
    return moves;
}

function findPiece(currentBoard, piece) {
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (currentBoard[x][y] === piece) {
                return { x, y };
            }
        }
    }
    return null;
}

function findAllPieces(currentBoard, piece) {
    const positions = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            if (currentBoard[x][y] === piece) {
                positions.push({ x, y });
            }
        }
    }
    return positions;
}

function makeMove(currentBoard, from, to, player) {
    const newBoard = currentBoard.map(row => row.slice());
    newBoard[from.x][from.y] = EMPTY;
    newBoard[to.x][to.y] = player;
    return newBoard;
}

function getBestWolfMove(currentBoard, depth, alpha, beta) {
    let bestMove = null;
    let minEval = Infinity;
    const moves = generateAllWolfMoves(currentBoard);

    for (const move of moves) {
        const newBoard = makeMove(currentBoard, move.from, move.to, WOLF);
        const evalScore = alphaBeta(newBoard, depth - 1, true, alpha, beta);
        if (evalScore < minEval) {
            minEval = evalScore;
            bestMove = move;
        }
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
    }

    return bestMove;
}

function alphaBeta(currentBoard, depth, isMaximizing, alpha, beta) {
    if (depth === 0 || isGameOver(currentBoard)) {
        return evaluateBoard(currentBoard);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        const moves = generateAllRabbitMoves(currentBoard);
        for (const move of moves) {
            const newBoard = makeMove(currentBoard, move.from, move.to, RABBIT);
            const evalScore = alphaBeta(newBoard, depth - 1, false, alpha, beta);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = generateAllWolfMoves(currentBoard);
        for (const move of moves) {
            const newBoard = makeMove(currentBoard, move.from, move.to, WOLF);
            const evalScore = alphaBeta(newBoard, depth - 1, true, alpha, beta);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(currentBoard) {
    const rabbit = findPiece(currentBoard, RABBIT);
    if (!rabbit) return -Infinity;

    if (rabbit.x === 0) return Infinity;

    if (isRabbitSurrounded(currentBoard)) return -Infinity;

    const distanceToGoal = rabbit.x;
    const rabbitMoves = generateAllRabbitMoves(currentBoard).length;
    const wolfMoves = generateAllWolfMoves(currentBoard).length;

    return (-distanceToGoal * 10) + (rabbitMoves * 5) - (wolfMoves * 2);
}

function isGameOver(currentBoard) {
    const rabbit = findPiece(currentBoard, RABBIT);
    return !rabbit || rabbit.x === 0 || isRabbitSurrounded(currentBoard);
}

function resetGame() {
    rabbitPos = { x: 7, y: 2 };
    wolves = [
        { x: 0, y: 1 },
        { x: 0, y: 3 },
        { x: 0, y: 5 },
        { x: 0, y: 7 },
    ];
    initializeBoard();
}

function hideWinner() {
    const winnerDiv = document.getElementById('winner');
    winnerDiv.style.display = 'none';
}
