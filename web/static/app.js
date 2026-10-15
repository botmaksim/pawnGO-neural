// pawnGO-Neural Anarchy Chess Arena & Sandbox
// Automated Engine Matches, Chess Clocks, Time Controls, Move Replayer, PGN Import/Export & Branching.

const PIECE_SVGS = {
  "P": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1;fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"/></svg>",
  "R": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:#ffffff;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \" style=\"stroke-linecap:butt\"/><path d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \" style=\"stroke-linecap:butt\"/><path d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14\" style=\"stroke-linecap:butt\"/><path d=\"M 34,14 L 31,17 L 14,17 L 11,14\"/><path d=\"M 31,17 L 31,29.5 L 14,29.5 L 14,17\" style=\"stroke-linecap:butt;stroke-linejoin:miter\"/><path d=\"M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5\"/><path d=\"M 11,14 L 34,14\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\"/></g></svg>",
  "N": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\" style=\"fill:#ffffff;stroke:#000000\"/><path d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\" style=\"fill:#ffffff;stroke:#000000\"/><path d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\" style=\"fill:#000000;stroke:#000000\"/><path d=\"M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z\" transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\" style=\"fill:#000000;stroke:#000000\"/></g></svg>",
  "B": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><g style=\"fill:#ffffff;stroke:#000000;stroke-linecap:butt\"><path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/><path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/><path d=\"M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z\"/></g><path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\"/></g></svg>",
  "Q": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"fill:#ffffff;stroke:#000000;stroke-width:1.5;stroke-linejoin:round\"><path d=\"M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z\"/><path d=\"M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z\"/><path d=\"M 11.5,30 C 15,29 30,29 33.5,30\" style=\"fill:none\"/><path d=\"M 12,33.5 C 18,32.5 27,32.5 33,33.5\" style=\"fill:none\"/><circle cx=\"6\" cy=\"12\" r=\"2\"/><circle cx=\"14\" cy=\"9\" r=\"2\"/><circle cx=\"22.5\" cy=\"8\" r=\"2\"/><circle cx=\"31\" cy=\"9\" r=\"2\"/><circle cx=\"39\" cy=\"12\" r=\"2\"/></g></svg>",
  "K": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 22.5,11.63 L 22.5,6\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\"/><path d=\"M 20,8 L 25,8\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\"/><path d=\"M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25\" style=\"fill:#ffffff;stroke:#000000;stroke-linecap:butt;stroke-linejoin:miter\"/><path d=\"M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37\" style=\"fill:#ffffff;stroke:#000000\"/><path d=\"M 12.5,30 C 18,27 27,27 32.5,30\" style=\"fill:none;stroke:#000000\"/><path d=\"M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5\" style=\"fill:none;stroke:#000000\"/><path d=\"M 12.5,37 C 18,34 27,34 32.5,37\" style=\"fill:none;stroke:#000000\"/></g></svg>",
  "p": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1;fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"/></svg>",
  "r": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \" style=\"stroke-linecap:butt\"/><path d=\"M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z \" style=\"stroke-linecap:butt\"/><path d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \" style=\"stroke-linecap:butt\"/><path d=\"M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z \" style=\"stroke-linecap:butt;stroke-linejoin:miter\"/><path d=\"M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z \" style=\"stroke-linecap:butt\"/><path d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z \" style=\"stroke-linecap:butt\"/><path d=\"M 12,35.5 L 33,35.5 L 33,35.5\" style=\"fill:none;stroke:#ffffff;stroke-width:1;stroke-linejoin:miter\"/><path d=\"M 13,31.5 L 32,31.5\" style=\"fill:none;stroke:#ffffff;stroke-width:1;stroke-linejoin:miter\"/><path d=\"M 14,29.5 L 31,29.5\" style=\"fill:none;stroke:#ffffff;stroke-width:1;stroke-linejoin:miter\"/><path d=\"M 14,16.5 L 31,16.5\" style=\"fill:none;stroke:#ffffff;stroke-width:1;stroke-linejoin:miter\"/><path d=\"M 11,14 L 34,14\" style=\"fill:none;stroke:#ffffff;stroke-width:1;stroke-linejoin:miter\"/></g></svg>",
  "n": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\" style=\"fill:#000000;stroke:#000000\"/><path d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\" style=\"fill:#000000;stroke:#000000\"/><path d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\" style=\"fill:#ffffff;stroke:#ffffff\"/><path d=\"M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z\" transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\" style=\"fill:#ffffff;stroke:#ffffff\"/><path d=\"M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z \" style=\"fill:#ffffff;stroke:none\"/></g></svg>",
  "b": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"opacity:1;fill:none;fill-rule:evenodd;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><g style=\"fill:#000000;stroke:#000000;stroke-linecap:butt\"><path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/><path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/><path d=\"M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z\"/></g><path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none;stroke:#ffffff;stroke-linejoin:miter\"/></g></svg>",
  "q": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"fill:#000000;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"><path d=\"M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z\" style=\"stroke-linecap:butt;fill:#000000\"/><path d=\"m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z\"/><path d=\"M 11.5,30 C 15,29 30,29 33.5,30\"/><path d=\"m 12,33.5 c 6,-1 15,-1 21,0\"/><circle cx=\"6\" cy=\"12\" r=\"2\"/><circle cx=\"14\" cy=\"9\" r=\"2\"/><circle cx=\"22.5\" cy=\"8\" r=\"2\"/><circle cx=\"31\" cy=\"9\" r=\"2\"/><circle cx=\"39\" cy=\"12\" r=\"2\"/><path d=\"M 11,38.5 A 35,35 1 0 0 34,38.5\" style=\"fill:none;stroke:#000000;stroke-linecap:butt\"/><g style=\"fill:none;stroke:#ffffff\"><path d=\"M 11,29 A 35,35 1 0 1 34,29\"/><path d=\"M 12.5,31.5 L 32.5,31.5\"/><path d=\"M 11.5,34.5 A 35,35 1 0 0 33.5,34.5\"/><path d=\"M 10.5,37.5 A 35,35 1 0 0 34.5,37.5\"/></g></g></svg>",
  "k": "<svg viewBox=\"0 0 45 45\" class=\"svg-piece\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\"><g style=\"fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1\"><path d=\"M 22.5,11.63 L 22.5,6\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\" id=\"path6570\"/><path d=\"M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25\" style=\"fill:#000000;fill-opacity:1;stroke-linecap:butt;stroke-linejoin:miter\"/><path d=\"M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37\" style=\"fill:#000000;stroke:#000000\"/><path d=\"M 20,8 L 25,8\" style=\"fill:none;stroke:#000000;stroke-linejoin:miter\"/><path d=\"M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5\" style=\"fill:none;stroke:#ffffff\"/><path d=\"M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37\" style=\"fill:none;stroke:#ffffff\"/></g></svg>",
};

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let boardState = {};
let activeTurn = 'w';
let draggedPiece = null;
let dragSourceSq = null;
let lastMoveSq = null;
let selectedSq = null;
let activeThermoEngine = 'stockfish';

// Game History & Replayer
let gameHistory = []; // list of { fen, move, san, from_sq, to_sq, is_legal, engine_name, captured }
let currentHistoryIndex = -1;

// Prediction & Highlights
let currentPredictedMove = null;
let predictedFromSq = null;
let predictedToSq = null;

// Match Arena & Clock State
let isMatchRunning = false;
let matchInterval = null;
let clockInterval = null;
let whiteTimeMs = 180000;
let blackTimeMs = 180000;
let incMs = 1000;
let isFixedTime = false;
let fixedTimeMs = 200;

function parseFen(fen) {
  const parts = fen.split(' ');
  const placement = parts[0];
  activeTurn = parts[1] || 'w';
  boardState = {};

  const ranks = placement.split('/');
  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r;
    let fileIdx = 0;
    const rankStr = ranks[r];
    for (let i = 0; i < rankStr.length; i++) {
      const char = rankStr[i];
      if (!isNaN(char)) {
        fileIdx += parseInt(char, 10);
      } else {
        const fileChar = String.fromCharCode('a'.charCodeAt(0) + fileIdx);
        boardState[`${fileChar}${rankNum}`] = char;
        fileIdx++;
      }
    }
  }
}

function generateFen() {
  let placement = "";
  for (let r = 8; r >= 1; r--) {
    let emptyCount = 0;
    for (let f = 0; f < 8; f++) {
      const sq = `${String.fromCharCode('a'.charCodeAt(0) + f)}${r}`;
      const piece = boardState[sq];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          placement += emptyCount;
          emptyCount = 0;
        }
        placement += piece;
      }
    }
    if (emptyCount > 0) {
      placement += emptyCount;
    }
    if (r > 1) placement += "/";
  }
  return `${placement} ${activeTurn} - - 0 1`;
}

function clearPredictionHighlights() {
  predictedFromSq = null;
  predictedToSq = null;
  currentPredictedMove = null;
  document.querySelectorAll(".square.predicted-from, .square.predicted-to").forEach(el => {
    el.classList.remove("predicted-from", "predicted-to");
  });
  const box = document.getElementById("aiPredictionBox");
  if (box) box.classList.add("hidden");
}

function highlightPredictionSquares() {
  document.querySelectorAll(".square.predicted-from, .square.predicted-to").forEach(el => {
    el.classList.remove("predicted-from", "predicted-to");
  });
  if (predictedFromSq) {
    const fromEl = document.querySelector(`.square[data-sq="${predictedFromSq}"]`);
    if (fromEl) fromEl.classList.add("predicted-from");
  }
  if (predictedToSq) {
    const toEl = document.querySelector(`.square[data-sq="${predictedToSq}"]`);
    if (toEl) toEl.classList.add("predicted-to");
  }
}


let boardInitialized = false;
const squaresDOM = {};

function initBoardDOM() {
  const boardEl = document.getElementById("board");
  if (!boardEl) return;
  boardEl.innerHTML = "";

  for (let r = 8; r >= 1; r--) {
    for (let f = 0; f < 8; f++) {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + f);
      const sq = `${fileChar}${r}`;
      // In standard chess: a1 is dark, h1 is light, a8 is light, h8 is dark!
      // f: 0..7, r: 1..8 -> for a1 (f=0, r=1) f+r=1 (odd) -> dark; h1 (f=7, r=1) f+r=8 (even) -> light!
      const isLight = (f + r) % 2 === 0;

      const sqEl = document.createElement("div");
      sqEl.className = `square ${isLight ? 'light' : 'dark'}`;
      sqEl.dataset.sq = sq;

      // Coordinates: rank numbers on file 'a' (top-left), file letters on rank 1 (bottom-right)
      if (f === 0) {
        const rCoord = document.createElement("span");
        rCoord.className = "coord rank";
        rCoord.textContent = r;
        sqEl.appendChild(rCoord);
      }
      if (r === 1) {
        const fCoord = document.createElement("span");
        fCoord.className = "coord file";
        fCoord.textContent = fileChar;
        sqEl.appendChild(fCoord);
      }

      const pieceContainer = document.createElement("div");
      pieceContainer.className = "piece-wrapper";
      pieceContainer.dataset.piece = "";
      sqEl.appendChild(pieceContainer);

      pieceContainer.addEventListener("dragstart", (e) => {
        if (isMatchRunning) return;
        const p = boardState[sq];
        if (!p) return;
        draggedPiece = p;
        dragSourceSq = sq;
        e.dataTransfer.setData("text/plain", p);
      });

      sqEl.addEventListener("dragover", (e) => e.preventDefault());
      sqEl.addEventListener("drop", (e) => {
        if (isMatchRunning) return;
        e.preventDefault();
        if (!draggedPiece) return;

        if (dragSourceSq) {
          applyMoveAndRecord(dragSourceSq, sq, `${dragSourceSq}->${sq}`, `${dragSourceSq}${sq}`, true, "Manual Move");
        } else {
          // Piece spawned from palette
          boardState[sq] = draggedPiece;
          lastMoveSq = sq;
          const pieceColor = draggedPiece === draggedPiece.toUpperCase() ? 'w' : 'b';
          activeTurn = (pieceColor === 'w') ? 'b' : 'w';
          clearPredictionHighlights();
          renderBoard();
          triggerEvaluate(pieceColor);
        }

        draggedPiece = null;
        dragSourceSq = null;
      });

      sqEl.addEventListener("click", () => {
        if (isMatchRunning) return;
        if (selectedSq) {
          if (selectedSq !== sq) {
            applyMoveAndRecord(selectedSq, sq, `${selectedSq}->${sq}`, `${selectedSq}${sq}`, true, "Manual Move");
            selectedSq = null;
            return;
          }
          selectedSq = null;
          renderBoard();
        } else if (boardState[sq]) {
          selectedSq = sq;
          renderBoard();
        }
      });

      squaresDOM[sq] = { sqEl, pieceContainer };
      boardEl.appendChild(sqEl);
    }
  }
  boardInitialized = true;
}

function renderBoard() {
  if (!boardInitialized) {
    initBoardDOM();
  }

  // Smooth DOM reuse: update only pieces and classes without tearing down the board!
  for (let r = 8; r >= 1; r--) {
    for (let f = 0; f < 8; f++) {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + f);
      const sq = `${fileChar}${r}`;
      const dom = squaresDOM[sq];
      if (!dom) continue;

      const piece = boardState[sq] || "";
      if (dom.pieceContainer.dataset.piece !== piece) {
        dom.pieceContainer.dataset.piece = piece;
        dom.pieceContainer.innerHTML = piece && PIECE_SVGS[piece] ? PIECE_SVGS[piece] : "";
        dom.pieceContainer.draggable = Boolean(piece && !isMatchRunning);
      }

      dom.sqEl.classList.toggle("last-move", sq === lastMoveSq);
      dom.sqEl.classList.toggle("selected", sq === selectedSq);
      dom.sqEl.classList.toggle("predicted-from", sq === predictedFromSq);
      dom.sqEl.classList.toggle("predicted-to", sq === predictedToSq);
    }
  }

  const currentFen = generateFen();
  const fenInput = document.getElementById("fenInput");
  if (fenInput) fenInput.value = currentFen;
  updateTurnIndicator();
  updateClockHighlight();
}


function renderPiecePalette() {
  const paletteEl = document.getElementById("piecePalette");
  if (!paletteEl) return;
  paletteEl.innerHTML = "";

  const whiteRow = document.createElement("div");
  whiteRow.className = "palette-row";
  ['P', 'N', 'B', 'R', 'Q', 'K'].forEach(p => {
    const el = document.createElement("div");
    el.className = "palette-piece";
    el.draggable = true;
    el.innerHTML = PIECE_SVGS[p];
    el.dataset.piece = p;
    el.addEventListener("dragstart", (e) => {
      draggedPiece = p;
      dragSourceSq = null;
      e.dataTransfer.setData("text/plain", p);
    });
    whiteRow.appendChild(el);
  });

  const blackRow = document.createElement("div");
  blackRow.className = "palette-row";
  ['p', 'n', 'b', 'r', 'q', 'k'].forEach(p => {
    const el = document.createElement("div");
    el.className = "palette-piece";
    el.draggable = true;
    el.innerHTML = PIECE_SVGS[p];
    el.dataset.piece = p;
    el.addEventListener("dragstart", (e) => {
      draggedPiece = p;
      dragSourceSq = null;
      e.dataTransfer.setData("text/plain", p);
    });
    blackRow.appendChild(el);
  });

  paletteEl.appendChild(whiteRow);
  paletteEl.appendChild(blackRow);
}

function updateTurnIndicator() {
  const turnEl = document.getElementById("turnIndicator");
  if (activeTurn === 'w') {
    turnEl.className = "turn-pill white-turn";
    turnEl.textContent = "White to Move";
  } else {
    turnEl.className = "turn-pill black-turn";
    turnEl.textContent = "Black to Move";
  }
}

function formatClock(ms) {
  if (ms <= 0) return "00:00.0";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${tenths}`;
}

function updateClockDisplays() {
  document.getElementById("whiteClockTime").textContent = formatClock(whiteTimeMs);
  document.getElementById("blackClockTime").textContent = formatClock(blackTimeMs);
}

function updateClockHighlight() {
  const wCard = document.getElementById("whiteClock");
  const bCard = document.getElementById("blackClock");
  if (activeTurn === 'w') {
    wCard.classList.add("active-clock");
    bCard.classList.remove("active-clock");
  } else {
    bCard.classList.add("active-clock");
    wCard.classList.remove("active-clock");
  }
}

function setupTimeControl(tcValue) {
  if (tcValue === "bullet_1_05") {
    whiteTimeMs = 60000; blackTimeMs = 60000; incMs = 500; isFixedTime = false;
  } else if (tcValue === "blitz_3_1") {
    whiteTimeMs = 180000; blackTimeMs = 180000; incMs = 1000; isFixedTime = false;
  } else if (tcValue === "rapid_5_2") {
    whiteTimeMs = 300000; blackTimeMs = 300000; incMs = 2000; isFixedTime = false;
  } else if (tcValue === "fixed_200ms") {
    whiteTimeMs = 200; blackTimeMs = 200; incMs = 0; isFixedTime = true; fixedTimeMs = 200;
  } else if (tcValue === "fixed_500ms") {
    whiteTimeMs = 500; blackTimeMs = 500; incMs = 0; isFixedTime = true; fixedTimeMs = 500;
  } else {
    whiteTimeMs = 999000; blackTimeMs = 999000; incMs = 0; isFixedTime = false;
  }
  updateClockDisplays();
}

function startClockTicking() {
  stopClockTicking();
  if (document.getElementById("timeControlSelect").value === "unlimited") return;

  const tickRate = 100;
  clockInterval = setInterval(() => {
    if (!isMatchRunning) return;
    if (activeTurn === 'w') {
      whiteTimeMs = Math.max(0, whiteTimeMs - tickRate);
      if (whiteTimeMs <= 0) {
        stopMatch("0-1", "White forfeited on time (Flag fell)");
      }
    } else {
      blackTimeMs = Math.max(0, blackTimeMs - tickRate);
      if (blackTimeMs <= 0) {
        stopMatch("1-0", "Black forfeited on time (Flag fell)");
      }
    }
    updateClockDisplays();
  }, tickRate);
}

function stopClockTicking() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

let evalAbortController = null;
async function triggerEvaluate(lastMovedColor = null) {
  if (evalAbortController) {
    evalAbortController.abort();
  }
  evalAbortController = new AbortController();

  const fen = generateFen();
  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        last_moved_color: lastMovedColor,
        eval_engine: activeThermoEngine
      }),
      signal: evalAbortController.signal
    });

    if (!res.ok) return;
    const data = await res.json();

    const fillEl = document.getElementById("thermometerFill");
    const valEl = document.getElementById("thermometerVal");
    const legalityIndicator = document.getElementById("legalityIndicator");

    fillEl.style.height = `${data.thermometer_pct}%`;
    const scoreStr = data.eval_white >= 0 ? `+${data.eval_white.toFixed(2)}` : data.eval_white.toFixed(2);
    valEl.textContent = data.mate_score ? `M${data.mate_score}` : scoreStr;

    if (data.is_legal_board) {
      legalityIndicator.className = "legality-pill legal";
      legalityIndicator.textContent = "Standard Board";
    } else {
      legalityIndicator.className = "legality-pill illegal";
      legalityIndicator.textContent = "Anarchy Board";
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      console.error("Evaluation error:", e);
    }
  }
}

// Apply move with rollback & branching support
function applyMoveAndRecord(fromSq, toSq, san, moveUci, isLegal, engineName) {
  // If rewound to a previous position, truncate future history to start a new branch!
  if (currentHistoryIndex < gameHistory.length - 1) {
    gameHistory = gameHistory.slice(0, currentHistoryIndex + 1);
  }

  let p = boardState[fromSq];
  const captured = boardState[toSq] ? boardState[toSq] : null;
  delete boardState[fromSq];

  // Pawn promotion to Queen
  if (p === 'P' && toSq[1] === '8') p = 'Q';
  if (p === 'p' && toSq[1] === '1') p = 'q';

  boardState[toSq] = p;
  lastMoveSq = toSq;

  const pieceColor = (p === p.toUpperCase()) ? 'w' : 'b';
  activeTurn = (pieceColor === 'w') ? 'b' : 'w';

  const newFen = generateFen();

  gameHistory.push({
    fen: newFen,
    move: moveUci,
    san: san || moveUci,
    from_sq: fromSq,
    to_sq: toSq,
    is_legal: isLegal,
    engine_name: engineName || "Player",
    captured: captured
  });
  currentHistoryIndex = gameHistory.length - 1;

  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate(pieceColor);
}

// Match Step execution
async function executeMatchStep() {
  const whiteEng = document.getElementById("matchWhiteEngine").value;
  const blackEng = document.getElementById("matchBlackEngine").value;
  const fen = generateFen();

  const historyFens = gameHistory.map(h => h.fen.split(' ')[0]);
  const moveCount = Math.floor(gameHistory.length / 2) + 1;

  try {
    const res = await fetch("/api/match/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        white_engine: whiteEng,
        black_engine: blackEng,
        move_count: moveCount,
        history_fens: historyFens
      })
    });

    if (!res.ok) throw new Error("Step API error");
    const data = await res.json();

    if (data.is_game_over) {
      stopMatch(data.result, data.termination_reason);
      return;
    }

    // Apply incremental clock
    if (!isFixedTime) {
      if (activeTurn === 'w') whiteTimeMs += incMs;
      else blackTimeMs += incMs;
    } else {
      if (activeTurn === 'w') whiteTimeMs = fixedTimeMs;
      else blackTimeMs = fixedTimeMs;
    }
    updateClockDisplays();

    // Record to history (respecting branching if user had rewound)
    if (currentHistoryIndex < gameHistory.length - 1) {
      gameHistory = gameHistory.slice(0, currentHistoryIndex + 1);
    }

    gameHistory.push({
      fen: data.fen,
      move: data.move,
      san: data.san || data.move,
      from_sq: data.from_sq,
      to_sq: data.to_sq,
      is_legal: data.is_legal,
      engine_name: data.engine_name,
      captured: data.captured
    });
    currentHistoryIndex = gameHistory.length - 1;

    parseFen(data.fen);
    lastMoveSq = data.to_sq;
    clearPredictionHighlights();
    renderBoard();
    updateMoveHistoryUI();
    triggerEvaluate();

    if (data.is_game_over) {
      stopMatch(data.result, data.termination_reason);
    }
  } catch (e) {
    console.error("Match step error:", e);
    stopMatch("*", `Error: ${e.message}`);
  }
}

function startMatch() {
  isMatchRunning = true;
  document.getElementById("btnStartMatch").disabled = true;
  document.getElementById("btnPauseMatch").disabled = false;
  document.getElementById("matchTerminationBanner").classList.add("hidden");

  startClockTicking();

  const delay = parseInt(document.getElementById("matchSpeedSlider").value, 10);
  matchInterval = setInterval(() => {
    if (!isMatchRunning) return;
    executeMatchStep();
  }, delay);
}

function pauseMatch() {
  isMatchRunning = false;
  document.getElementById("btnStartMatch").disabled = false;
  document.getElementById("btnPauseMatch").disabled = true;
  if (matchInterval) {
    clearInterval(matchInterval);
    matchInterval = null;
  }
  stopClockTicking();
}

function stopMatch(result, reason) {
  pauseMatch();
  const banner = document.getElementById("matchTerminationBanner");
  banner.classList.remove("hidden");
  document.getElementById("matchResultBadge").textContent = result;
  document.getElementById("matchReasonText").textContent = reason;
}

function updateMoveHistoryUI() {
  const container = document.getElementById("moveHistoryList");
  if (!container) return;

  const branchPill = document.getElementById("branchNotice");
  if (branchPill) {
    if (currentHistoryIndex < gameHistory.length - 1 && currentHistoryIndex >= 0) {
      branchPill.classList.remove("hidden");
      branchPill.textContent = `Rewound (${currentHistoryIndex + 1}/${gameHistory.length})`;
    } else if (currentHistoryIndex === -1 && gameHistory.length > 0) {
      branchPill.classList.remove("hidden");
      branchPill.textContent = `Rewound (0/${gameHistory.length})`;
    } else {
      branchPill.classList.add("hidden");
    }
  }

  if (gameHistory.length === 0) {
    container.innerHTML = `<div class="empty-history-text">No moves recorded yet</div>`;
    document.getElementById("moveCounter").textContent = "Move 0 / 0";
    return;
  }

  const emptyEl = container.querySelector(".empty-history-text");
  if (emptyEl) emptyEl.remove();

  const totalMoves = gameHistory.length;
  const numRowsNeeded = Math.ceil(totalMoves / 2);
  const existingRows = container.querySelectorAll(".move-row");

  if (existingRows.length !== numRowsNeeded) {
    container.innerHTML = "";
    for (let i = 0; i < totalMoves; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const wMove = gameHistory[i];
      const bMove = gameHistory[i + 1];

      const row = document.createElement("div");
      row.className = "move-row";

      const numSpan = document.createElement("span");
      numSpan.className = "move-num";
      numSpan.textContent = `${moveNum}.`;
      row.appendChild(numSpan);

      const wSpan = document.createElement("span");
      wSpan.className = `move-span ${i === currentHistoryIndex ? 'active' : ''}`;
      wSpan.textContent = wMove.san || `${wMove.from_sq}->${wMove.to_sq}${wMove.is_legal ? '' : '*'}`;
      const moveIdxW = i;
      wSpan.addEventListener("click", () => jumpToHistory(moveIdxW));
      row.appendChild(wSpan);

      if (bMove) {
        const bSpan = document.createElement("span");
        bSpan.className = `move-span ${i + 1 === currentHistoryIndex ? 'active' : ''}`;
        bSpan.textContent = bMove.san || `${bMove.from_sq}->${bMove.to_sq}${bMove.is_legal ? '' : '*'}`;
        const moveIdxB = i + 1;
        bSpan.addEventListener("click", () => jumpToHistory(moveIdxB));
        row.appendChild(bSpan);
      }

      container.appendChild(row);
    }
  } else {
    const allSpans = container.querySelectorAll(".move-span");
    allSpans.forEach(el => el.classList.remove("active"));
    if (currentHistoryIndex >= 0 && allSpans[currentHistoryIndex]) {
      allSpans[currentHistoryIndex].classList.add("active");
    }
  }

  document.getElementById("moveCounter").textContent = `Move ${currentHistoryIndex + 1} / ${gameHistory.length}`;
  container.scrollTop = container.scrollHeight;
}

function jumpToHistory(index) {
  if (index < 0 || index >= gameHistory.length) return;
  currentHistoryIndex = index;
  const state = gameHistory[index];
  parseFen(state.fen);
  lastMoveSq = state.to_sq;
  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate();
}

function jumpToStart() {
  if (gameHistory.length === 0) return;
  parseFen(STARTING_FEN);
  currentHistoryIndex = -1;
  lastMoveSq = null;
  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate();
}

// Next Move Predictor
async function predictNextMove() {
  clearPredictionHighlights();
  const modelId = document.getElementById("modelSelect").value;
  const isAnarchy = modelId.endsWith("_anarchy") || document.getElementById("chkAllowIllegal").checked;
  const fen = generateFen();
  const commentEl = document.getElementById("aiComment");
  commentEl.textContent = `Analyzing with ${modelId}...`;

  try {
    const res = await fetch("/api/ai_move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        model_id: modelId,
        allow_illegal: isAnarchy
      })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    currentPredictedMove = data;
    predictedFromSq = data.from_sq;
    predictedToSq = data.to_sq;

    const box = document.getElementById("aiPredictionBox");
    box.classList.remove("hidden");
    document.getElementById("predMoveSan").textContent = data.san || data.move;
    document.getElementById("predEngineTag").textContent = data.name;
    document.getElementById("predMoveUci").textContent = `${data.from_sq} -> ${data.to_sq}`;
    document.getElementById("predEval").textContent = (data.eval !== null && data.eval !== undefined) ?
      `Eval: ${data.eval > 0 ? '+' : ''}${Number(data.eval).toFixed(2)}` : '';
    document.getElementById("predTime").textContent = `${data.duration_ms}ms`;

    commentEl.textContent = `Predicted move: ${data.san || data.move} (${data.from_sq}->${data.to_sq}) by ${data.name} in ${data.duration_ms}ms`;

    highlightPredictionSquares();
  } catch (err) {
    commentEl.textContent = `Prediction failed: ${err.message}`;
  }
}

function playPredictedMove() {
  if (!currentPredictedMove) return;
  const { from_sq, to_sq, san, move, name, is_legal } = currentPredictedMove;
  applyMoveAndRecord(from_sq, to_sq, san || move, move, is_legal, name);
  clearPredictionHighlights();
}

async function executeSingleAiMove() {
  const modelId = document.getElementById("modelSelect").value;
  const isAnarchy = modelId.endsWith("_anarchy") || document.getElementById("chkAllowIllegal").checked;
  const fen = generateFen();
  const commentEl = document.getElementById("aiComment");
  commentEl.textContent = `Computing move with ${modelId}...`;

  try {
    const res = await fetch("/api/ai_move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, model_id: modelId, allow_illegal: isAnarchy })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    applyMoveAndRecord(data.from_sq, data.to_sq, data.san || data.move, data.move, data.is_legal, data.name);
    commentEl.textContent = `Played ${data.san || data.move} (${data.name}, ${data.duration_ms}ms)`;
    clearPredictionHighlights();
  } catch (err) {
    commentEl.textContent = `Engine move error: ${err.message}`;
  }
}

// Compare Engines
async function compareEngines() {
  const chks = document.querySelectorAll(".cmp-engine-chk:checked");
  const engineIds = Array.from(chks).map(c => c.value);
  if (engineIds.length === 0) {
    alert("Select at least one engine to compare.");
    return;
  }
  const fen = generateFen();
  const tbody = document.getElementById("cmpTableBody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Querying ${engineIds.length} engines in parallel...</td></tr>`;
  document.getElementById("comparisonResultsContainer").classList.remove("hidden");

  try {
    const res = await fetch("/api/compare_engines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, engine_ids: engineIds })
    });
    if (!res.ok) throw new Error("Comparison error");
    const data = await res.json();
    tbody.innerHTML = "";
    (data.results || []).forEach(r => {
      const tr = document.createElement("tr");
      const evalStr = (r.eval !== null && r.eval !== undefined) ? 
        (r.eval > 0 ? `+${r.eval.toFixed(2)}` : r.eval.toFixed(2)) : '-';
      const badgeClass = r.is_legal ? 'cmp-move-badge' : 'cmp-move-badge illegal';
      tr.innerHTML = `
        <td><strong>${r.name}</strong></td>
        <td><span class="${badgeClass}">${r.san || r.move}</span></td>
        <td>${evalStr}</td>
        <td>${r.duration_ms}ms</td>
      `;
      tr.style.cursor = "pointer";
      tr.title = "Click to preview this move";
      tr.addEventListener("click", () => {
        predictedFromSq = r.from_sq;
        predictedToSq = r.to_sq;
        currentPredictedMove = r;
        highlightPredictionSquares();
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444;">Error: ${err.message}</td></tr>`;
  }
}

// PGN Import & Export
function openPgnModal() {
  document.getElementById("pgnModal").classList.remove("hidden");
  document.getElementById("pgnTextInput").focus();
}

function closePgnModal() {
  document.getElementById("pgnModal").classList.add("hidden");
}

async function doImportPgn() {
  const pgnText = document.getElementById("pgnTextInput").value.trim();
  if (!pgnText) {
    alert("Please paste PGN text or choose a .pgn file first.");
    return;
  }
  try {
    const res = await fetch("/api/pgn/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pgn_text: pgnText })
    });
    if (!res.ok) throw new Error("Import failed");
    const data = await res.json();
    if (data.error) {
      alert("PGN Import error: " + data.error);
      return;
    }
    gameHistory = data.moves || [];
    const jumpToEnd = document.getElementById("chkPgnJumpToEnd").checked;
    const autoPredict = document.getElementById("chkPgnAutoPredict").checked;
    
    closePgnModal();

    if (gameHistory.length > 0) {
      if (jumpToEnd) {
        jumpToHistory(gameHistory.length - 1);
      } else {
        jumpToStart();
      }
    } else {
      parseFen(STARTING_FEN);
      currentHistoryIndex = -1;
      renderBoard();
      updateMoveHistoryUI();
      triggerEvaluate();
    }

    if (autoPredict) {
      predictNextMove();
    }
  } catch (err) {
    alert("Could not import PGN: " + err.message);
  }
}

async function exportPgnText() {
  if (gameHistory.length === 0) {
    alert("No moves to export as PGN.");
    return;
  }
  const headers = {
    "Event": "pawnGO-Neural Match Arena",
    "Site": "Localhost Sandbox",
    "Date": new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    "Round": "1",
    "White": document.getElementById("matchWhiteEngine") ? document.getElementById("matchWhiteEngine").value : "Player White",
    "Black": document.getElementById("matchBlackEngine") ? document.getElementById("matchBlackEngine").value : "Player Black",
    "Result": document.getElementById("matchResultBadge") ? document.getElementById("matchResultBadge").textContent : "*"
  };
  try {
    const res = await fetch("/api/pgn/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, moves: gameHistory })
    });
    if (!res.ok) throw new Error("Export API error");
    const data = await res.json();
    const blob = new Blob([data.pgn], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawngo_game_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("PGN export failed: " + err.message);
  }
}

// Save & Load Game JSON
function saveGameJson() {
  const payload = {
    white_engine: document.getElementById("matchWhiteEngine").value,
    black_engine: document.getElementById("matchBlackEngine").value,
    time_control: document.getElementById("timeControlSelect").value,
    result: document.getElementById("matchResultBadge").textContent,
    termination: document.getElementById("matchReasonText").textContent,
    history: gameHistory
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawngo_match_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadGameJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.history && Array.isArray(data.history)) {
        gameHistory = data.history;
        currentHistoryIndex = gameHistory.length - 1;
        if (currentHistoryIndex >= 0) {
          parseFen(gameHistory[currentHistoryIndex].fen);
          lastMoveSq = gameHistory[currentHistoryIndex].to_sq;
        } else {
          parseFen(STARTING_FEN);
          lastMoveSq = null;
        }
        clearPredictionHighlights();
        renderBoard();
        updateMoveHistoryUI();
        triggerEvaluate();

        if (data.result && data.termination) {
          stopMatch(data.result, data.termination);
        }
      }
    } catch (err) {
      alert("Invalid game JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Populate Engine Selectors
async function populateEngineSelectors() {
  try {
    const res = await fetch("/api/engines");
    if (!res.ok) return;
    const engines = await res.json();

    const mWhite = document.getElementById("matchWhiteEngine");
    const mBlack = document.getElementById("matchBlackEngine");
    const quickSel = document.getElementById("modelSelect");

    mWhite.innerHTML = "";
    mBlack.innerHTML = "";
    quickSel.innerHTML = "";

    engines.forEach(eng => {
      const optW = document.createElement("option");
      optW.value = eng.id;
      optW.textContent = eng.name;
      if (eng.id === "pawngo_cpp") optW.selected = true;
      mWhite.appendChild(optW);

      const optB = document.createElement("option");
      optB.value = eng.id;
      optB.textContent = eng.name;
      if (eng.id === "stockfish") optB.selected = true;
      mBlack.appendChild(optB);

      const optQ = document.createElement("option");
      optQ.value = eng.id;
      optQ.textContent = eng.name;
      if (eng.id === "policy_pawngo_wins_legal") optQ.selected = true;
      quickSel.appendChild(optQ);
    });
  } catch (e) {
    console.error("Error loading engines list:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  parseFen(STARTING_FEN);
  renderPiecePalette();
  renderBoard();
  triggerEvaluate();
  populateEngineSelectors();
  setupTimeControl("blitz_3_1");

  // Tab switching
  document.getElementById("tabBtnSandbox").addEventListener("click", () => {
    document.getElementById("tabBtnSandbox").classList.add("active");
    document.getElementById("tabBtnMatch").classList.remove("active");
    document.getElementById("sandboxPanel").classList.remove("hidden");
    document.getElementById("matchPanel").classList.add("hidden");
  });

  document.getElementById("tabBtnMatch").addEventListener("click", () => {
    document.getElementById("tabBtnMatch").classList.add("active");
    document.getElementById("tabBtnSandbox").classList.remove("active");
    document.getElementById("matchPanel").classList.remove("hidden");
    document.getElementById("sandboxPanel").classList.add("hidden");
  });

  // Bidirectional sync between Model Selection and Anarchy Checkbox
  const modelSelectEl = document.getElementById("modelSelect");
  const chkAllowIllegalEl = document.getElementById("chkAllowIllegal");
  if (modelSelectEl && chkAllowIllegalEl) {
    modelSelectEl.addEventListener("change", (e) => {
      const val = e.target.value;
      chkAllowIllegalEl.checked = val.endsWith("_anarchy");
    });
    chkAllowIllegalEl.addEventListener("change", (e) => {
      const isAnarchy = e.target.checked;
      const currentVal = modelSelectEl.value;
      if (isAnarchy && currentVal.endsWith("_legal")) {
        const targetVal = currentVal.replace("_legal", "_anarchy");
        if (modelSelectEl.querySelector(`option[value="${targetVal}"]`)) {
          modelSelectEl.value = targetVal;
        }
      } else if (!isAnarchy && currentVal.endsWith("_anarchy")) {
        const targetVal = currentVal.replace("_anarchy", "_legal");
        if (modelSelectEl.querySelector(`option[value="${targetVal}"]`)) {
          modelSelectEl.value = targetVal;
        }
      }
    });
  }

  // Time control dropdown
  document.getElementById("timeControlSelect").addEventListener("change", (e) => {
    setupTimeControl(e.target.value);
  });

  // Speed slider
  document.getElementById("matchSpeedSlider").addEventListener("input", (e) => {
    document.getElementById("lblSpeedVal").textContent = `${e.target.value}ms`;
    if (isMatchRunning) {
      clearInterval(matchInterval);
      matchInterval = setInterval(() => {
        if (!isMatchRunning) return;
        executeMatchStep();
      }, parseInt(e.target.value, 10));
    }
  });

  // Match buttons
  document.getElementById("btnStartMatch").addEventListener("click", startMatch);
  document.getElementById("btnPauseMatch").addEventListener("click", pauseMatch);
  document.getElementById("btnStepMatch").addEventListener("click", executeMatchStep);

  // Replayer Navigation
  document.getElementById("btnReplayStart").addEventListener("click", jumpToStart);

  document.getElementById("btnReplayPrev").addEventListener("click", () => {
    if (currentHistoryIndex > 0) {
      jumpToHistory(currentHistoryIndex - 1);
    } else if (currentHistoryIndex === 0) {
      jumpToStart();
    }
  });

  document.getElementById("btnReplayNext").addEventListener("click", () => {
    if (currentHistoryIndex < gameHistory.length - 1) {
      jumpToHistory(currentHistoryIndex + 1);
    }
  });

  document.getElementById("btnReplayEnd").addEventListener("click", () => {
    if (gameHistory.length > 0) {
      jumpToHistory(gameHistory.length - 1);
    }
  });

  // Keyboard navigation for replaying and branching
  document.addEventListener("keydown", (e) => {
    if (["input", "textarea", "select"].includes(document.activeElement.tagName.toLowerCase())) {
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById("btnReplayPrev").click();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      document.getElementById("btnReplayNext").click();
    } else if (e.key === "Home") {
      e.preventDefault();
      document.getElementById("btnReplayStart").click();
    } else if (e.key === "End") {
      e.preventDefault();
      document.getElementById("btnReplayEnd").click();
    } else if (e.key === " ") {
      e.preventDefault();
      if (isMatchRunning) pauseMatch();
      else startMatch();
    }
  });

  // Prediction & AI Move Buttons
  document.getElementById("btnPredictNext").addEventListener("click", predictNextMove);
  document.getElementById("btnPlayPrediction").addEventListener("click", playPredictedMove);
  document.getElementById("btnAiMove").addEventListener("click", executeSingleAiMove);
  document.getElementById("btnCompareEngines").addEventListener("click", compareEngines);

  // PGN Import Modal
  document.getElementById("btnOpenPgnModal").addEventListener("click", openPgnModal);
  document.getElementById("btnClosePgnModal").addEventListener("click", closePgnModal);
  document.getElementById("btnCancelPgnModal").addEventListener("click", closePgnModal);
  document.getElementById("btnDoImportPgn").addEventListener("click", doImportPgn);
  document.getElementById("btnExportPgn").addEventListener("click", exportPgnText);

  document.getElementById("fileImportPgn").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      document.getElementById("pgnFileName").textContent = file.name;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById("pgnTextInput").value = re.target.result;
      };
      reader.readAsText(file);
    }
  });

  // Save / Load JSON
  document.getElementById("btnSaveGame").addEventListener("click", saveGameJson);
  document.getElementById("fileLoadGame").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadGameJson(e.target.files[0]);
    }
  });

  // Thermometer source toggle
  document.getElementById("btnThermoSF").addEventListener("click", () => {
    activeThermoEngine = "stockfish";
    document.getElementById("btnThermoSF").classList.add("active");
    document.getElementById("btnThermoPawnGO").classList.remove("active");
    triggerEvaluate();
  });

  document.getElementById("btnThermoPawnGO").addEventListener("click", () => {
    activeThermoEngine = "pawngo";
    document.getElementById("btnThermoPawnGO").classList.add("active");
    document.getElementById("btnThermoSF").classList.remove("active");
    triggerEvaluate();
  });

  // Board Utils
  document.getElementById("btnFlipTurn").addEventListener("click", () => {
    activeTurn = (activeTurn === 'w') ? 'b' : 'w';
    clearPredictionHighlights();
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnResetBoard").addEventListener("click", () => {
    parseFen(STARTING_FEN);
    lastMoveSq = null;
    selectedSq = null;
    gameHistory = [];
    currentHistoryIndex = -1;
    clearPredictionHighlights();
    stopMatch("*", "Board reset");
    renderBoard();
    updateMoveHistoryUI();
    triggerEvaluate();
  });

  document.getElementById("btnClearBoard").addEventListener("click", () => {
    boardState = {};
    lastMoveSq = null;
    selectedSq = null;
    clearPredictionHighlights();
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnCopyFen").addEventListener("click", () => {
    const fen = document.getElementById("fenInput").value;
    navigator.clipboard.writeText(fen);
    const orig = document.getElementById("btnCopyFen").innerHTML;
    document.getElementById("btnCopyFen").textContent = "Copied!";
    setTimeout(() => document.getElementById("btnCopyFen").innerHTML = orig, 1200);
  });
});
