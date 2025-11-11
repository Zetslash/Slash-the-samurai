// 로비 화면 관리
const lobbyScreen = document.getElementById('lobbyScreen');
const lobbyStartSection = document.getElementById('lobbyStartSection');
const lobbyModeSection = document.getElementById('lobbyModeSection');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const pvpModeButton = document.getElementById('pvpModeButton');
const aiModeButton = document.getElementById('aiModeButton');
const countdown = document.getElementById('countdown');
const countdownText = document.getElementById('countdownText');

// 요소가 없으면 에러 방지
if (!lobbyScreen || !lobbyStartSection || !lobbyModeSection || !gameScreen || !startButton || !pvpModeButton || !aiModeButton || !countdown || !countdownText) {
    console.error('필수 HTML 요소를 찾을 수 없습니다.');
}

// 게임이 시작되었는지 확인하는 플래그
let gameStarted = false;
let isCountdownActive = false;
// AI 모드 여부를 확인하는 플래그
let isAIMode = false;
// 일시정지 상태
let isPaused = false;
// isPaused를 전역으로 사용 가능하도록 설정 (타이머에서 접근하기 위해)
window.isPaused = false;

// 전술 상태 정의
const TACTICAL_STATES = {
    NEUTRAL: 'neutral',           // 중립 (Footsies)
    APPROACH: 'approach',         // 접근
    PRESSURE: 'pressure',         // 압박
    WHIFF_PUNISH: 'whiff_punish', // 빈틈처벌
    ANTI_AIR: 'anti_air',         // 대공
    RETREAT: 'retreat',           // 철수/리셋
    CORNER_TRAP: 'corner_trap',   // 코너트랩
    OKIZEME: 'okizeme'            // 기상공방
};

// 행동 정의
const ACTIONS = {
    MOVE_RIGHT: 'move_right',
    MOVE_LEFT: 'move_left',
    DASH: 'dash',
    ATTACK: 'attack',
    JUMP: 'jump'
};

// AI 상태 관리 (전술 시스템)
let aiState = {
    currentState: TACTICAL_STATES.NEUTRAL,  // 현재 전술 상태
    frameCount: 0,                           // 프레임 카운터
    decisionInterval: 1,                    // 매 프레임 결정 (60FPS)
    lastAction: null,                        // 마지막 행동
    actionHistory: [],                       // 행동 히스토리 (반복 패턴 감지용)
    consecutiveActionCount: 0,               // 연속 동일 행동 횟수
    
    // 피처 추적
    playerInputHistory: [],                  // 플레이어 입력 히스토리
    playerMotionHistory: [],                // 플레이어 모션 히스토리
    lastHitResult: 0,                       // 마지막 교환 결과 (-1: 패배, 0: 무승부, 1: 승리)
    lastWhiffFrame: -999,                   // 마지막 whiff 프레임
    playerJumpFrequency: 0.1,               // 플레이어 점프 빈도
    playerDashFrequency: 0.1,               // 플레이어 대시 빈도
    
    // 코너 위치
    enemyCornerDistance: 0,                  // 적의 코너 거리
    playerCornerDistance: 0,                 // 플레이어의 코너 거리
    
    // 반응 지연
    reactionDelay: 10,                       // 반응 지연 (프레임) - 이동 지속을 위해 증가
    reactionCounter: 0,                      // 반응 카운터
    moveDuration: 0,                         // 이동 지속 시간
    
    // ε-탐욕
    epsilon: 0.1,                           // 무작위 선택 확률
    
    // 공격 쿨다운
    attackCooldown: 0,                      // 공격 쿨다운 (프레임 단위)
};

// 사운드 관리
const sounds = {
    slash: new Audio('Sound/slash.mp3'),
    attacked: new Audio('Sound/attacked.mp3'),
    jump: new Audio('Sound/jump.mp3'),
    dash: new Audio('Sound/dash.mp3'),
    backgroundMusic: new Audio('Sound/BackgroundMusic.mp3'),
    mainLobbyTheme: new Audio('Sound/main lobby theme.mp3')
};

// 사운드 볼륨 설정
sounds.slash.volume = 0.5;
sounds.attacked.volume = 0.5;
sounds.jump.volume = 0.5;
sounds.dash.volume = 0.5;
sounds.backgroundMusic.volume = 0.3;
sounds.backgroundMusic.loop = true; // 배경음악 반복 재생
sounds.mainLobbyTheme.volume = 0.5;
sounds.mainLobbyTheme.loop = true; // 메인 로비 테마 반복 재생

// sounds를 전역으로 사용 가능하도록 설정
window.sounds = sounds;

// 페이지 로드 시 로비 화면 초기화 및 메인 로비 테마 재생
window.addEventListener('load', () => {
    // 로비 화면 초기화
    showLobbyStart();
    
    // 메인 로비 테마 무음 자동재생 시도 (브라우저 정책 회피)
    if (sounds.mainLobbyTheme) {
        const prevVolume = sounds.mainLobbyTheme.volume;
        sounds.mainLobbyTheme.muted = true;
        sounds.mainLobbyTheme.currentTime = 0;
        sounds.mainLobbyTheme.play().then(() => {
            // 재생 시작 후 짧은 지연 뒤 음소거 해제 및 원래 볼륨 복원
            setTimeout(() => {
                sounds.mainLobbyTheme.muted = false;
                sounds.mainLobbyTheme.volume = prevVolume;
            }, 150);
        }).catch(err => {
            console.log('메인 로비 테마 자동 재생 실패 (브라우저 정책). 사용자 상호작용 후 재생됩니다:', err);
        });
    }
});

// 사용자 상호작용 시 메인 로비 테마 재생 (자동 재생이 차단된 경우 대비)
let hasUserInteracted = false;
document.addEventListener('click', () => {
    const lobbyVisible = lobbyScreen && lobbyScreen.style.display !== 'none';
    const gameActive = gameScreen && gameScreen.classList.contains('show');
    if (!hasUserInteracted && lobbyVisible && !gameActive && !gameStarted && !isCountdownActive && sounds.mainLobbyTheme && sounds.mainLobbyTheme.paused) {
        hasUserInteracted = true;
        sounds.mainLobbyTheme.currentTime = 0;
        sounds.mainLobbyTheme.play().catch(err => console.log('메인 로비 테마 재생 실패:', err));
    }
}, { once: true });

document.addEventListener('keydown', () => {
    const lobbyVisible = lobbyScreen && lobbyScreen.style.display !== 'none';
    const gameActive = gameScreen && gameScreen.classList.contains('show');
    if (!hasUserInteracted && lobbyVisible && !gameActive && !gameStarted && !isCountdownActive && sounds.mainLobbyTheme && sounds.mainLobbyTheme.paused) {
        hasUserInteracted = true;
        sounds.mainLobbyTheme.currentTime = 0;
        sounds.mainLobbyTheme.play().catch(err => console.log('메인 로비 테마 재생 실패:', err));
    }
}, { once: true });

// 카운트다운 함수
function startCountdown() {
    isCountdownActive = true;
    countdown.classList.add('show');
    
    let count = 3;
    countdownText.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = 'Duel!';
        } else {
            // 카운트다운 종료 (count가 -1이 되면)
            clearInterval(countdownInterval);
            countdown.classList.remove('show');
            isCountdownActive = false;
            gameStarted = true;
            // 일시정지 버튼 표시
            const pauseButton = document.getElementById('pauseButton');
            if (pauseButton) {
                pauseButton.style.display = 'flex';
            }
            // 게임 시작 시 타이머 시작
            decreaseTimer();
            // 로비 음악이 재생 중이면 안전하게 정지
            if (sounds.mainLobbyTheme) {
                try { sounds.mainLobbyTheme.pause(); } catch (_) {}
            }
            // 전투 중 배경음악 재생
            if (sounds.backgroundMusic) {
                sounds.backgroundMusic.currentTime = 0;
                sounds.backgroundMusic.play().catch(err => console.log('배경음악 재생 실패:', err));
            }
            // 모바일 컨트롤 표시 확인 (모바일에서만)
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                // 모바일 체크 (화면 너비 또는 터치 지원 여부)
                const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
                if (isMobile && !mobileControls.classList.contains('show')) {
                    mobileControls.style.display = 'flex';
                    mobileControls.style.visibility = 'visible';
                    mobileControls.classList.add('show');
                }
            }
        }
    }, 1000);
}

// 로비 화면 초기화 (게임 재시작 시)
function showLobbyStart() {
    lobbyStartSection.style.display = 'flex';
    lobbyModeSection.style.display = 'none';
    lobbyScreen.style.display = 'flex';
    // 배경음악 정지
    if (sounds.backgroundMusic) {
        sounds.backgroundMusic.pause();
        sounds.backgroundMusic.currentTime = 0;
    }
    // 메인 로비 테마 재생
    if (sounds.mainLobbyTheme) {
        sounds.mainLobbyTheme.currentTime = 0;
        sounds.mainLobbyTheme.play().catch(err => console.log('메인 로비 테마 재생 실패:', err));
    }
}

// 게임 시작 함수 (공통)
function startGame(aiMode = false) {
    // 게임 상태 초기화
    isAIMode = aiMode;
    gameStarted = false;
    isCountdownActive = false;
    gameOver = false;
    isPaused = false;
    window.isPaused = false;
    
    // 메인 로비 테마 정지
    if (sounds.mainLobbyTheme) {
        sounds.mainLobbyTheme.pause();
        sounds.mainLobbyTheme.currentTime = 0;
    }
    // 배경음악도 정지 (카운트다운 종료 시 재생)
    if (sounds.backgroundMusic) {
        sounds.backgroundMusic.pause();
        sounds.backgroundMusic.currentTime = 0;
    }
    
    // 이전 게임 세션 정리
    if (timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
    
    // 배경 스프라이트 리셋
    if (background) {
        background.framesCurrent = 0;
        background.framesElapsed = 0;
        background.position.x = 0;
        background.position.y = 0;
    }
    
    // 캐릭터 위치 및 상태 확실하게 초기화
    if (player) {
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
            player.position.x = canvas.width / 2 - START_GAP;
        }
        if (player.sprites.idle && player.sprites.idle.image.complete) {
            player.position.y = getFloorTopY() - (player.sprites.idle.image.height * player.scale) + CHARACTER_SINK;
        }
        // 상태 리셋
        player.velocity.x = 0;
        player.velocity.y = 10;
        player.health = 100;
        player.isAttacking = false;
        player.isDashing = false;
        player.canJump = true;
        player.isOnGround = true;
        player.isStunned = false;
        player.lastHitFrame = null;
        player.switchSprite('idle');
        player.framesCurrent = 0;
        player.framesElapsed = 0;
        player.flip = false;
    }
    
    if (enemy) {
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
            enemy.position.x = canvas.width / 2 + START_GAP;
        }
        if (enemy.sprites.idle && enemy.sprites.idle.image.complete) {
            enemy.position.y = getFloorTopY() - (enemy.sprites.idle.image.height * enemy.scale) + CHARACTER_SINK;
        }
        // 상태 리셋
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        enemy.health = 100;
        enemy.isAttacking = false;
        enemy.isDashing = false;
        enemy.canJump = true;
        enemy.isOnGround = true;
        enemy.isStunned = false;
        enemy.lastHitFrame = null;
        enemy.switchSprite('idle');
        enemy.framesCurrent = 0;
        enemy.framesElapsed = 0;
        enemy.flip = true; // 플레이어 2는 기본적으로 좌우 반전
    }
    
    // 게임 상태 리셋
    resetGame();
    
    lobbyScreen.style.display = 'none';
    setTimeout(() => {
        gameScreen.classList.add('show');
        // 모바일 컨트롤 미리 표시 (게임 시작 시)
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            // 모바일 체크 (화면 너비 또는 터치 지원 여부)
            const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
            if (isMobile) {
                // 인라인 스타일로 확실하게 표시
                mobileControls.style.display = 'flex';
                mobileControls.style.visibility = 'visible';
                mobileControls.classList.add('show');
            } else {
                mobileControls.style.display = 'none';
            }
        }
        // 카운트다운 시작
        startCountdown();
    }, 500);
}

// 스타트 버튼 클릭 -> 모드 선택 화면 표시
startButton.addEventListener('click', () => {
    // 사용자 상호작용이 있었으므로 사운드 재생 시도
    if (sounds.mainLobbyTheme && sounds.mainLobbyTheme.paused) {
        sounds.mainLobbyTheme.currentTime = 0;
        sounds.mainLobbyTheme.play().catch(err => console.log('메인 로비 테마 재생 실패:', err));
    }
    lobbyStartSection.style.display = 'none';
    lobbyModeSection.style.display = 'flex';
});

// 1 vs 1 모드 버튼 클릭 이벤트
pvpModeButton.addEventListener('click', () => {
    startGame(false);
});

// vs AI 모드 버튼 클릭 이벤트
aiModeButton.addEventListener('click', () => {
    startGame(true);
});

// ==================== 모바일 컨트롤 이벤트 ====================

const mobileControls = document.getElementById('mobileControls');
const mobileLeft = document.getElementById('mobileLeft');
const mobileRight = document.getElementById('mobileRight');
const mobileJump = document.getElementById('mobileJump');
const mobileAttack = document.getElementById('mobileAttack');
const mobileDash = document.getElementById('mobileDash');

// 모바일 버튼 이벤트 (플레이어 1만 조작)
if (mobileLeft) {
    mobileLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive) {
            keys.a.pressed = true;
            player.lastKey = 'a';
        }
    });
    
    mobileLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.a.pressed = false;
    });
    
    mobileLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive) {
            keys.a.pressed = true;
            player.lastKey = 'a';
        }
    });
    
    mobileLeft.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.a.pressed = false;
    });
}

if (mobileRight) {
    mobileRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive) {
            keys.d.pressed = true;
            player.lastKey = 'd';
        }
    });
    
    mobileRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.d.pressed = false;
    });
    
    mobileRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive) {
            keys.d.pressed = true;
            player.lastKey = 'd';
        }
    });
    
    mobileRight.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys.d.pressed = false;
    });
}

if (mobileJump) {
    mobileJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned && player.canJump && player.isOnGround) {
            player.velocity.y = -20;
            player.canJump = false;
            player.isOnGround = false;
            if (sounds.jump) {
                sounds.jump.currentTime = 0;
                sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
        }
    });
    
    mobileJump.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned && player.canJump && player.isOnGround) {
            player.velocity.y = -20;
            player.canJump = false;
            player.isOnGround = false;
            if (sounds.jump) {
                sounds.jump.currentTime = 0;
                sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
        }
    });
}

if (mobileAttack) {
    mobileAttack.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned) {
            player.attack();
        }
    });
    
    mobileAttack.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned) {
            player.attack();
        }
    });
}

if (mobileDash) {
    mobileDash.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned) {
            player.dash();
        }
    });
    
    mobileDash.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameStarted && !gameOver && !isCountdownActive && !player.isStunned) {
            player.dash();
        }
    });
}

// Canvas 요소 찾기
const canvas = document.querySelector('canvas');
if (!canvas) {
    console.error('Canvas 요소를 찾을 수 없습니다.');
}
const c = canvas ? canvas.getContext('2d') : null;

if (canvas && c) {
    canvas.width = 1024;
    canvas.height = 576;
    c.fillRect(0, 0, canvas.width, canvas.height);
}

// 전역 변수로 설정 (getFloorTopY() 함수에서 사용)
window.canvas = canvas;
window.FLOOR_HEIGHT = 40;
window.FLOOR_OFFSET = 130;

const gravity = 0.7
// 시작 시 중앙(캔버스 기준)으로부터 떨어뜨릴 거리(px)
const START_GAP = 200
// 바닥(플로어) 설정
const FLOOR_COLOR = '#2b2b2b'
window.FLOOR_COLOR = FLOOR_COLOR;

// 화면 경계 설정 (플레이어가 화면 밖으로 나가지 못하도록 제한)
// 왼쪽 경계: 숫자로 직접 설정 (픽셀 단위)
// 오른쪽 경계: 숫자로 직접 설정 (픽셀 단위)
// 필요시 이 값들을 조정하여 경계를 변경할 수 있습니다
// 예: LEFT_BOUNDARY = -200, RIGHT_BOUNDARY = 1224
const LEFT_BOUNDARY = -200
const RIGHT_BOUNDARY = 1224  // 기본값: canvas.width (1024) + 여유 공간

// 전역으로 설정하여 classes.js에서 사용 가능하도록
window.LEFT_BOUNDARY = LEFT_BOUNDARY
window.RIGHT_BOUNDARY = RIGHT_BOUNDARY

// 스프라이트가 로드된 뒤 중앙 기준 대칭 X 좌표를 정확히 맞추는 헬퍼
function centerPlaceHorizontallyByIdle(fighter, gap) {
    const idle = fighter && fighter.sprites && fighter.sprites.idle
    if (!idle || !idle.image || !idle.image.complete || idle.image.width === 0) return false
    const frameWidth = (idle.image.width / idle.framesMax) * fighter.scale
    // 중앙에서 좌우 gap 만큼 떨어뜨리고, 스프라이트 중심을 그 점에 맞춥니다
    const centerX = canvas.width / 2 + (fighter.flip ? +gap : -gap)
    fighter.position.x = centerX - frameWidth / 2
    return true
}

const background = canvas ? new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: 'img/background.png',
    canvas: canvas
}) : null;

// 전역 변수로 설정 (utils.js의 함수들에서 사용)
window.player = canvas ? new Fighter({
    position: {
        x: canvas.width / 2 - START_GAP, // 초기값: 이후 idle 로드 후 재조정
        y: 0 // 이미지 로드 후 자동으로 조정됨
    },
    velocity: {
        x: 0,
        y: 10
    },
    offset: {
        x: 0,
        y: 0
    },
    sprites: {
        idle: {
            imageSrc: 'img/player 1/Idle.png',
            framesMax: 8
        },
        run: {
            imageSrc: 'img/player 1/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: 'img/player 1/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: 'img/player 1/Fall.png',
            framesMax: 2
        },
        attack: {
            imageSrc: 'img/player 1/Attack1.png',
            framesMax: 6
        },
        takeHit: {
            imageSrc: 'img/player 1/Take Hit - white silhouette.png',
            framesMax: 4
        },
        death: {
            imageSrc: 'img/player 1/Death.png',
            framesMax: 6
        }
    }
}) : null;

window.enemy = canvas ? new Fighter({
    position: {
        x: canvas.width / 2 + START_GAP, // 초기값: 이후 idle 로드 후 재조정
        y: 0 // 이미지 로드 후 자동으로 조정됨
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: -80,
        y: 0
    },
    flip: true, // 플레이어 2는 좌우 반전
    sprites: {
        idle: {
            imageSrc: 'img/player 1/Idle.png',
            framesMax: 8
        },
        run: {
            imageSrc: 'img/player 1/Run.png',
            framesMax: 8
        },
        jump: {
            imageSrc: 'img/player 1/Jump.png',
            framesMax: 2
        },
        fall: {
            imageSrc: 'img/player 1/Fall.png',
            framesMax: 2
        },
        attack: {
            imageSrc: 'img/player 1/Attack1.png',
            framesMax: 6
        },
        takeHit: {
            imageSrc: 'img/player 1/Take Hit - white silhouette.png',
            framesMax: 4
        },
        death: {
            imageSrc: 'img/player 1/Death.png',
            framesMax: 6
        }
    }
}) : null;

// 로컬 변수로도 참조 (코드 내에서 사용)
const player = window.player;
const enemy = window.enemy;

const keys = {
    d: {
        pressed: false
    },
    a: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}

// idle 이미지가 준비되면 중앙 기준 대칭 X 좌표를 프레임 중심 기준으로 재정렬
;(function tryCenterPlace() {
    const placedPlayer = centerPlaceHorizontallyByIdle(player, START_GAP)
    const placedEnemy = centerPlaceHorizontallyByIdle(enemy, START_GAP)
    if (!placedPlayer || !placedEnemy) {
        // 이미지 로드가 끝나지 않았다면 다음 프레임에 다시 시도
        requestAnimationFrame(tryCenterPlace)
    }
})()

// AI 헬퍼 함수들
function getDistance(fighter1, fighter2) {
    // 두 캐릭터의 중심점 사이의 거리 계산
    const sprite1 = fighter1.sprites[fighter1.currentState];
    const sprite2 = fighter2.sprites[fighter2.currentState];
    
    let width1 = 0, height1 = 0, width2 = 0, height2 = 0;
    
    if (sprite1 && sprite1.image && sprite1.image.complete) {
        width1 = Math.floor(sprite1.image.width / sprite1.framesMax) * fighter1.scale;
        height1 = sprite1.image.height * fighter1.scale;
    }
    if (sprite2 && sprite2.image && sprite2.image.complete) {
        width2 = Math.floor(sprite2.image.width / sprite2.framesMax) * fighter2.scale;
        height2 = sprite2.image.height * fighter2.scale;
    }
    
    const centerX1 = fighter1.position.x + width1 / 2;
    const centerY1 = fighter1.position.y + height1 / 2;
    const centerX2 = fighter2.position.x + width2 / 2;
    const centerY2 = fighter2.position.y + height2 / 2;
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
}

function isPlayerAttackIncoming() {
    // 플레이어가 공격 중이고 공격 박스가 적에게 닿을 수 있는 거리에 있는지 확인
    if (!player.isAttacking || player.currentState !== 'attack') {
        return false;
    }
    
    // 공격 박스와 적의 거리 확인
    const attackBox = player.attackBox;
    const enemySprite = enemy.sprites[enemy.currentState];
    
    if (!enemySprite || !enemySprite.image || !enemySprite.image.complete) {
        return false;
    }
    
    const enemyWidth = Math.floor(enemySprite.image.width / enemySprite.framesMax) * enemy.scale;
    const enemyHeight = enemySprite.image.height * enemy.scale;
    const enemyCenterX = enemy.position.x + enemyWidth / 2;
    const enemyCenterY = enemy.position.y + enemyHeight / 2;
    
    // 공격 박스 범위 내에 있는지 확인
    const attackBoxRight = attackBox.position.x + attackBox.width;
    const attackBoxLeft = attackBox.position.x;
    const attackBoxTop = attackBox.position.y;
    const attackBoxBottom = attackBox.position.y + attackBox.height;
    
    // 공격 박스가 적의 중심점 근처에 있는지 확인 (여유 공간 포함)
    const margin = 50; // 여유 공간
    return (
        enemyCenterX >= attackBoxLeft - margin &&
        enemyCenterX <= attackBoxRight + margin &&
        enemyCenterY >= attackBoxTop - margin &&
        enemyCenterY <= attackBoxBottom + margin
    );
}

function shouldDodge() {
    // 회피 조건을 더 엄격하게 - 정말 위험할 때만 회피
    // 공격 박스와의 충돌이 실제로 임박했는지 확인 (더 엄격한 조건)
    if (rectangularCollision({
        rectangle1: player.attackBox,
        rectangle2: enemy
    }) && player.isAttacking && player.currentState === 'attack') {
        return true;
    }
    
    // 플레이어가 공격 중이고 매우 가까이 있을 때만 회피
    if (player.isAttacking && player.currentState === 'attack') {
        const distance = getDistance(player, enemy);
        // 매우 가까이 있을 때만 회피 (100픽셀 이내)
        if (distance < 100) {
            return true;
        }
    }
    
    return false;
}

// ==================== 피처 계산 함수들 ====================

// 거리 점수 (가우시안 분포)
function calculateDistanceScore(distance, idealDistance, sigma = 100) {
    const diff = distance - idealDistance;
    return Math.exp(-(diff * diff) / (sigma * sigma));
}

// 공회수 점수 (whiff 확률)
function calculatePunishScore(aiState, currentFrame) {
    const recentFrames = 30; // 최근 30프레임 확인
    const whiffWindow = 20;   // whiff 판정 윈도우
    
    // 최근 whiff가 있었는지 확인
    if (currentFrame - aiState.lastWhiffFrame < whiffWindow) {
        const timeSinceWhiff = currentFrame - aiState.lastWhiffFrame;
        return Math.max(0, 1 - (timeSinceWhiff / whiffWindow)); // 시간이 지날수록 감소
    }
    
    // 플레이어가 공격을 했지만 맞지 않았는지 확인
    if (aiState.playerMotionHistory.length >= 2) {
        const recent = aiState.playerMotionHistory.slice(-recentFrames);
        let whiffCount = 0;
        for (let i = 0; i < recent.length - 1; i++) {
            // 공격 모션이 있었지만 히트가 없었음
            if (recent[i] === 'attack' && aiState.lastHitResult <= 0) {
                whiffCount++;
            }
        }
        return Math.min(1, whiffCount / 5); // 최대 5회 whiff 기준
    }
    
    return 0;
}

// 점프 위험도
function calculateAirRisk(aiState) {
    // 플레이어가 점프 중이거나 점프하려는지 확인
    if (player.currentState === 'jump' || player.currentState === 'fall') {
        return 0.8; // 높은 위험
    }
    
    // 플레이어의 점프 빈도 기반
    return aiState.playerJumpFrequency;
}

// 코너 보정 점수
function calculateCornerScore(aiState) {
    const canvasWidth = canvas ? canvas.width : 1024;
    const enemyX = enemy.position.x;
    const playerX = player.position.x;
    
    // 적이 중앙에 가깝고, 플레이어가 코너에 가까울수록 높은 점수
    const enemyCenterDist = Math.abs(enemyX - canvasWidth / 2) / (canvasWidth / 2);
    const playerCornerDist = Math.min(
        playerX / (canvasWidth / 2),
        (canvasWidth - playerX) / (canvasWidth / 2)
    );
    
    // 플레이어가 코너에 가까울수록 (값이 작을수록) 높은 점수
    return (1 - playerCornerDist) * (1 - enemyCenterDist);
}

// 프레임 우위 추정
function calculateFrameAdvantage(aiState) {
    // 마지막 교환 결과 기반
    if (aiState.lastHitResult > 0) {
        return 0.3; // 우위
    } else if (aiState.lastHitResult < 0) {
        return -0.3; // 열세
    }
    return 0; // 무승부
}

// 상대 성향 모델
function calculateTendencyScore(aiState, action) {
    // 플레이어의 반복 패턴 기반 점수
    if (action === ACTIONS.JUMP && aiState.playerJumpFrequency > 0.3) {
        return 0.2; // 점프를 자주 하면 대공 가치 상승
    }
    if (action === ACTIONS.DASH && aiState.playerDashFrequency > 0.3) {
        return 0.1; // 대시를 자주 하면 대시 대응 가치 상승
    }
    return 0;
}

// ==================== 유틸리티 계산 함수들 ====================

// 공격 유틸리티 (공격 우선순위 높임)
function calculateAttackUtility(state, features) {
    const weights = {
        neutral: { punish: 0.5, frame: 0.3, corner: 0.2, base: 0.4 },
        approach: { punish: 0.4, frame: 0.3, corner: 0.3, base: 0.5 },
        pressure: { punish: 0.3, frame: 0.4, corner: 0.3, base: 0.7 },
        whiff_punish: { punish: 0.7, frame: 0.2, corner: 0.1, base: 0.6 },
        anti_air: { punish: 0.2, frame: 0.3, corner: 0.5, base: 0.3 },
        retreat: { punish: 0.1, frame: 0.1, corner: 0.8, base: 0.2 },
        corner_trap: { punish: 0.4, frame: 0.3, corner: 0.3, base: 0.6 },
        okizeme: { punish: 0.6, frame: 0.2, corner: 0.2, base: 0.7 }
    };
    
    const w = weights[state] || weights.neutral;
    // 기본 점수를 높여서 공격을 더 자주 선택
    return w.base + w.punish * features.punish + 
           w.frame * (0.5 + features.frameAdvantage) + 
           w.corner * features.corner;
}

// 대시 유틸리티
function calculateDashUtility(state, features) {
    const weights = {
        neutral: { dist: 0.4, punish: 0.3, airRisk: 0.3 },
        approach: { dist: 0.6, punish: 0.2, airRisk: 0.2 },
        pressure: { dist: 0.3, punish: 0.3, airRisk: 0.4 },
        whiff_punish: { dist: 0.5, punish: 0.4, airRisk: 0.1 },
        anti_air: { dist: 0.2, punish: 0.2, airRisk: 0.6 },
        retreat: { dist: 0.5, punish: 0.1, airRisk: 0.4 },
        corner_trap: { dist: 0.3, punish: 0.3, airRisk: 0.4 },
        okizeme: { dist: 0.4, punish: 0.4, airRisk: 0.2 }
    };
    
    const w = weights[state] || weights.neutral;
    return w.dist * features.distance + 
           w.punish * features.punish + 
           w.airRisk * (1 - features.airRisk);
}

// 점프 유틸리티 (대부분의 경우 매우 낮게 설정)
function calculateJumpUtility(state, features) {
    // 점프는 거의 사용하지 않도록 매우 낮은 점수
    // anti_air 상태에서만 약간 높게
    if (state === 'anti_air') {
        return 0.3 * (1 - features.airRisk) + 0.1 * features.distance;
    }
    
    // 나머지 상태에서는 매우 낮은 점수 (거의 사용 안 함)
    return 0.05;
}

// 이동 유틸리티 (좌/우) - 이동 우선순위 높임
function calculateMoveUtility(state, features, direction) {
    const weights = {
        neutral: { dist: 0.5, corner: 0.3, reset: 0.3, base: 0.5 },
        approach: { dist: 0.7, corner: 0.2, reset: 0.2, base: 0.6 },
        pressure: { dist: 0.3, corner: 0.4, reset: 0.3, base: 0.4 },
        whiff_punish: { dist: 0.5, corner: 0.3, reset: 0.2, base: 0.4 },
        anti_air: { dist: 0.2, corner: 0.5, reset: 0.3, base: 0.3 },
        retreat: { dist: 0.3, corner: 0.2, reset: 0.5, base: 0.5 },
        corner_trap: { dist: 0.4, corner: 0.4, reset: 0.2, base: 0.5 },
        okizeme: { dist: 0.3, corner: 0.3, reset: 0.4, base: 0.4 }
    };
    
    const w = weights[state] || weights.neutral;
    const resetNeed = features.frameAdvantage < 0 ? 0.5 : 0; // 열세일 때 리셋 필요
    
    // 기본 점수를 높여서 이동을 더 자주 선택
    return w.base + w.dist * features.distance + 
           w.corner * features.corner + 
           w.reset * resetNeed;
}

// ==================== 상태 전환 규칙 ====================

function updateTacticalState(aiState, distance, playerCenterX, enemyCenterX) {
    const canvasWidth = canvas ? canvas.width : 1024;
    const isPlayerJumping = player.currentState === 'jump' || player.currentState === 'fall';
    const isPlayerInCorner = Math.min(playerCenterX / (canvasWidth / 2), (canvasWidth - playerCenterX) / (canvasWidth / 2)) < 0.2;
    const isEnemyInCorner = Math.min(enemyCenterX / (canvasWidth / 2), (canvasWidth - enemyCenterX) / (canvasWidth / 2)) < 0.2;
    const punishScore = calculatePunishScore(aiState, aiState.frameCount);
    
    // 상태 전환 우선순위
    if (isPlayerJumping && distance < 300) {
        return TACTICAL_STATES.ANTI_AIR;
    }
    
    if (isEnemyInCorner && distance < 200) {
        return TACTICAL_STATES.CORNER_TRAP;
    }
    
    if (punishScore > 0.5) {
        return TACTICAL_STATES.WHIFF_PUNISH;
    }
    
    if (distance > 400) {
        return TACTICAL_STATES.APPROACH;
    }
    
    if (distance < 150 && !player.isAttacking && !player.isStunned) {
        return TACTICAL_STATES.PRESSURE;
    }
    
    if (aiState.lastHitResult < 0 || enemy.health < player.health) {
        if (distance < 200) {
            return TACTICAL_STATES.RETREAT;
        }
    }
    
    if (player.isStunned && distance < 250) {
        return TACTICAL_STATES.OKIZEME;
    }
    
    // 기본: 중립
    return TACTICAL_STATES.NEUTRAL;
}

// ==================== 행동 실행 함수 ====================

function executeAction(action, playerCenterX, enemyCenterX) {
    switch (action) {
        case ACTIONS.MOVE_RIGHT:
            enemy.flip = false;
            enemy.velocity.x = 5;
            aiState.moveDuration = 30; // 30프레임 동안 이동 유지
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
            break;
            
        case ACTIONS.MOVE_LEFT:
            enemy.flip = true;
            enemy.velocity.x = -5;
            aiState.moveDuration = 30; // 30프레임 동안 이동 유지
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
            break;
            
        case ACTIONS.DASH:
            if (enemy.dashCooldown <= 0 && enemy.isOnGround) {
                // 플레이어 방향으로 대시 (접근) 또는 반대 방향 (후퇴)
                const distance = getDistance(player, enemy);
                if (distance > 200 || aiState.currentState === TACTICAL_STATES.RETREAT) {
                    // 후퇴 대시
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = false;
                    } else {
                        enemy.flip = true;
                    }
                } else {
                    // 접근 대시
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = true;
                    } else {
                        enemy.flip = false;
                    }
                }
                enemy.dash();
            }
            break;
            
        case ACTIONS.ATTACK:
            if (enemy.isOnGround && enemy.currentState !== 'attack' && !enemy.isAttacking) {
                // 플레이어를 향해 방향 설정
                if (playerCenterX < enemyCenterX) {
                    enemy.flip = true;
                } else {
                    enemy.flip = false;
                }
                enemy.velocity.x = 0;
                enemy.attack();
            }
            break;
            
        case ACTIONS.JUMP:
            if (enemy.canJump && enemy.isOnGround) {
                enemy.velocity.y = -20;
                enemy.canJump = false;
                enemy.isOnGround = false;
                if (window.sounds && window.sounds.jump) {
                    window.sounds.jump.currentTime = 0;
                    window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
                }
            }
            break;
    }
}

// ==================== 간단하고 공격적인 AI 로직 ====================

function updateAI() {
    // 게임 종료 시 AI 멈춤
    if (gameOver) {
        return;
    }
    
    if (!player || !enemy || enemy.currentState === 'death') {
        return;
    }
    
    // 경직 중이거나 대시 중이면 AI 동작 중지 (하지만 velocity는 유지)
    if (enemy.isStunned || enemy.isDashing) {
        return;
    }
    
    // 공격 중이면 다른 동작 하지 않음 (velocity는 유지)
    if (enemy.currentState === 'attack' || enemy.isAttacking) {
        return;
    }
    
    // 거리 및 위치 계산
    const distance = getDistance(player, enemy);
    const playerCenterX = player.position.x + (player.sprites[player.currentState]?.image ? 
        Math.floor(player.sprites[player.currentState].image.width / player.sprites[player.currentState].framesMax) * player.scale / 2 : 0);
    const enemyCenterX = enemy.position.x + (enemy.sprites[enemy.currentState]?.image ? 
        Math.floor(enemy.sprites[enemy.currentState].image.width / enemy.sprites[enemy.currentState].framesMax) * enemy.scale / 2 : 0);
    
    // 플레이어와 적의 공중 상태 확인
    const playerInAir = player.currentState === 'jump' || player.currentState === 'fall';
    const enemyInAir = enemy.currentState === 'jump' || enemy.currentState === 'fall';
    
    // ==================== 공중 전투 로직 ====================
    if (playerInAir) {
        // 플레이어가 공중에 있을 때
        
        // 1. 공중에서 플레이어 공격 회피
        if (player.isAttacking && player.currentState === 'attack' && distance < 150 && enemyInAir) {
            // 공중에서 플레이어의 반대 방향으로 이동
            if (playerCenterX < enemyCenterX) {
                enemy.flip = false;
                enemy.velocity.x = 5; // 오른쪽으로 회피
            } else {
                enemy.flip = true;
                enemy.velocity.x = -5; // 왼쪽으로 회피
            }
            return;
        }
        
        // 2. AI가 지상에 있고 플레이어가 공중에 있으면 점프해서 따라가기
        if (!enemyInAir && enemy.isOnGround && enemy.canJump) {
            // 플레이어 방향으로 점프
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
            } else {
                enemy.flip = false;
            }
            enemy.velocity.y = -20;
            enemy.canJump = false;
            enemy.isOnGround = false;
            if (window.sounds && window.sounds.jump) {
                window.sounds.jump.currentTime = 0;
                window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
            // 점프와 동시에 플레이어 방향으로 이동
            if (playerCenterX < enemyCenterX) {
                enemy.velocity.x = -5;
            } else {
                enemy.velocity.x = 5;
            }
            return;
        }
        
        // 3. 공중에서 플레이어에게 접근 및 공격
        if (enemyInAir) {
            // 플레이어 방향으로 이동
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -5;
            } else {
                enemy.flip = false;
                enemy.velocity.x = 5;
            }
            
            // 공중에서 공격 가능 거리면 공격 시도
            if (distance < 180 && !enemy.isAttacking && enemy.currentState !== 'attack') {
                // 60% 확률로 공중 공격
                if (Math.random() < 0.6) {
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = true;
                    } else {
                        enemy.flip = false;
                    }
                    // 공중에서도 공격 가능 (attack() 함수는 isOnGround 체크 없음)
                    enemy.attack();
                }
            }
            return;
        }
    }
    
    // ==================== 지상 전투 로직 ====================
    
    // 1. 긴급 상황: 플레이어 공격 회피 (매우 가까이 있을 때만)
    if (player.isAttacking && player.currentState === 'attack' && distance < 120 && enemy.dashCooldown <= 0 && enemy.isOnGround) {
        // 플레이어의 반대 방향으로 대시
        if (playerCenterX < enemyCenterX) {
            enemy.flip = false;
            enemy.dash();
        } else {
            enemy.flip = true;
            enemy.dash();
        }
        return;
    }
    
    // 공격 쿨다운 감소
    if (aiState.attackCooldown > 0) {
        aiState.attackCooldown--;
    }
    
    // 2. 공격 가능 거리면 공격 우선
    const attackRange = 200; // 공격 가능 거리
    const optimalAttackDistance = 100; // 최적 공격 거리 (공격 박스가 확실히 닿는 거리)
    const attackCooldownFrames = 30; // 공격 간격 (프레임 단위, 약 0.5초)
    
    // 공격 중이면 다른 동작 하지 않음 (플레이어와 동일하게)
    if (enemy.currentState === 'attack' || enemy.isAttacking) {
        // 공격 애니메이션이 끝나면 쿨다운 설정
        if (enemy.currentState !== 'attack' && !enemy.isAttacking && aiState.attackCooldown === 0) {
            aiState.attackCooldown = attackCooldownFrames;
        }
        return;
    }
    
    if (distance <= attackRange && enemy.isOnGround) {
        // 플레이어를 향해 방향 설정 (항상 먼저 설정)
        if (playerCenterX < enemyCenterX) {
            enemy.flip = true; // 왼쪽을 봄
        } else {
            enemy.flip = false; // 오른쪽을 봄
        }
        
        // 공격 쿨다운이 끝났을 때만 공격 가능
        if (aiState.attackCooldown <= 0) {
            // 플레이어가 경직 상태이거나 idle 상태이면 즉시 공격
            if (player.isStunned || (player.currentState === 'idle' && !player.isAttacking && !player.isDashing)) {
                // 최적 공격 거리보다 멀면 접근
                if (distance > optimalAttackDistance) {
                    // 플레이어 방향으로 이동
                    if (playerCenterX < enemyCenterX) {
                        enemy.velocity.x = -5;
                    } else {
                        enemy.velocity.x = 5;
                    }
                    if (enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                        enemy.switchSprite('run');
                    }
                } else {
                    // 충분히 가까우면 공격 (플레이어와 동일한 조건: currentState !== 'attack')
                    if (enemy.currentState !== 'attack' && enemy.currentState !== 'death') {
                        enemy.velocity.x = 0;
                        enemy.attack();
                        aiState.attackCooldown = attackCooldownFrames; // 공격 후 쿨다운 설정
                        return;
                    }
                }
            } else if (!player.isAttacking && !player.isDashing && Math.random() < 0.7) {
                // 플레이어가 공격 중이 아니면 공격 시도 (70% 확률)
                // 최적 공격 거리보다 멀면 접근
                if (distance > optimalAttackDistance) {
                    // 플레이어 방향으로 이동
                    if (playerCenterX < enemyCenterX) {
                        enemy.velocity.x = -5;
                    } else {
                        enemy.velocity.x = 5;
                    }
                    if (enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                        enemy.switchSprite('run');
                    }
                    return; // 이동 중이면 여기서 종료
                } else {
                    // 충분히 가까우면 공격 (플레이어와 동일한 조건: currentState !== 'attack')
                    if (enemy.currentState !== 'attack' && enemy.currentState !== 'death') {
                        enemy.velocity.x = 0;
                        enemy.attack();
                        aiState.attackCooldown = attackCooldownFrames; // 공격 후 쿨다운 설정
                        return;
                    }
                }
            } else {
                // 공격 조건이 맞지 않으면 플레이어 방향으로 이동 유지
                if (distance > optimalAttackDistance) {
                    if (playerCenterX < enemyCenterX) {
                        enemy.velocity.x = -5;
                    } else {
                        enemy.velocity.x = 5;
                    }
                    if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                        enemy.switchSprite('run');
                    }
                }
            }
        } else {
            // 공격 쿨다운 중이면 플레이어 방향으로 이동
            if (distance > optimalAttackDistance) {
                if (playerCenterX < enemyCenterX) {
                    enemy.velocity.x = -5;
                } else {
                    enemy.velocity.x = 5;
                }
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                    enemy.switchSprite('run');
                }
            }
        }
    }
    
    // 3. 플레이어에게 접근 (지속적으로 이동)
    if (distance > attackRange) {
        // 플레이어 방향으로 이동
        if (playerCenterX < enemyCenterX) {
            // 플레이어가 왼쪽에 있으면 왼쪽으로 이동
            enemy.flip = true;
            enemy.velocity.x = -5;
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        } else {
            // 플레이어가 오른쪽에 있으면 오른쪽으로 이동
            enemy.flip = false;
            enemy.velocity.x = 5;
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        }
        
        // 멀리 있으면 대시로 빠르게 접근
        if (distance > 350 && enemy.dashCooldown <= 0 && enemy.isOnGround) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
            } else {
                enemy.flip = false;
            }
            enemy.dash();
        }
    } else if (distance < attackRange - 50) {
        // 너무 가까이 있으면 약간 후퇴 (플레이어가 공격 중일 때만)
        if (player.isAttacking) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = false;
                enemy.velocity.x = 5;
            } else {
                enemy.flip = true;
                enemy.velocity.x = -5;
            }
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        } else {
            // 공격 중이 아니면 접근 유지
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -5;
            } else {
                enemy.flip = false;
                enemy.velocity.x = 5;
            }
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        }
    } else {
        // 적절한 거리면 플레이어를 향해 이동 (미세 조절)
        if (playerCenterX < enemyCenterX) {
            enemy.flip = true;
            enemy.velocity.x = -3; // 느리게 접근
        } else {
            enemy.flip = false;
            enemy.velocity.x = 3;
        }
        if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
            enemy.switchSprite('run');
        }
    }
    
    // 애니메이션 유지
    if (enemy.velocity.x === 0 && enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit' && enemy.currentState !== 'death') {
        if (enemy.currentState !== 'idle') {
            enemy.switchSprite('idle');
        }
    }
}

function resetGame() {
    // 게임 상태 리셋
    gameOver = false
    isPaused = false
    window.isPaused = false
    
    // 모바일 컨트롤 숨기기
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.classList.remove('show');
    }
    
    // AI 상태 리셋
    aiState.currentState = TACTICAL_STATES.NEUTRAL;
    aiState.frameCount = 0;
    aiState.lastAction = null;
    aiState.actionHistory = [];
    aiState.consecutiveActionCount = 0;
    aiState.playerInputHistory = [];
    aiState.playerMotionHistory = [];
    aiState.lastHitResult = 0;
    aiState.lastWhiffFrame = -999;
    aiState.playerJumpFrequency = 0.1;
    aiState.playerDashFrequency = 0.1;
    aiState.enemyCornerDistance = 0;
    aiState.playerCornerDistance = 0;
    aiState.reactionCounter = 0;
    aiState.moveDuration = 0;
    aiState.attackCooldown = 0;
    
    // 캐릭터 위치 초기화 (캔버스 중앙 기준 대칭, 프레임 중심 기준)
    if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
        player.position.x = canvas.width / 2 - START_GAP
    }
    if (player.sprites.idle && player.sprites.idle.image.complete) {
        // 플로어 상단에 닿도록 배치 (FLOOR_OFFSET 반영)
        player.position.y = getFloorTopY() - (player.sprites.idle.image.height * player.scale) + CHARACTER_SINK
    }
    player.velocity.x = 0
    player.velocity.y = 10
    player.health = 100
    player.isAttacking = false
    player.canJump = true
    player.isOnGround = true
    player.lastHitFrame = null // 데미지 추적 리셋
    // 애니메이션 상태 리셋
    player.switchSprite('idle')
    player.framesCurrent = 0
    player.framesElapsed = 0
    
    if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
        enemy.position.x = canvas.width / 2 + START_GAP
    }
    if (enemy.sprites.idle && enemy.sprites.idle.image.complete) {
        // 플로어 상단에 닿도록 배치 (FLOOR_OFFSET 반영)
        enemy.position.y = getFloorTopY() - (enemy.sprites.idle.image.height * enemy.scale) + CHARACTER_SINK
    }
    enemy.velocity.x = 0
    enemy.velocity.y = 0
    enemy.health = 100
    enemy.isAttacking = false
    enemy.canJump = true
    enemy.isOnGround = true
    enemy.lastHitFrame = null // 데미지 추적 리셋
    // 애니메이션 상태 리셋
    enemy.switchSprite('idle')
    enemy.framesCurrent = 0
    enemy.framesElapsed = 0
    
    // 체력바 업데이트
    document.querySelector('#playerHealth').style.width = '100%'
    document.querySelector('#enemyHealth').style.width = '100%'
    
    // 타이머 리셋
    timer = 60
    clearTimeout(timerId)
    document.querySelector('#timer').innerHTML = timer
    
    // 키 상태 리셋
    keys.d.pressed = false
    keys.a.pressed = false
    keys.ArrowRight.pressed = false
    keys.ArrowLeft.pressed = false
    
    // UI 숨기기
    document.querySelector('#displayText').style.display = 'none'
    document.querySelector('#retryButton').style.display = 'none'
    
    // 일시정지 메뉴 및 버튼 숨기기
    if (pauseMenu) pauseMenu.style.display = 'none'
    if (pauseButton) pauseButton.style.display = 'none'
    if (settingsPopup) settingsPopup.style.display = 'none'
    
    // 타이머는 게임이 시작될 때만 시작 (startCountdown에서 decreaseTimer 호출)
}

// 게임 세션 완전 종료 함수
function endGameSession() {
    // 게임 상태 완전 종료
    gameStarted = false;
    isCountdownActive = false;
    gameOver = false;
    isPaused = false;
    window.isPaused = false;
    
    // 타이머 완전 정지
    if (timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
    
    // 배경 음악 정지
    if (sounds.backgroundMusic) {
        sounds.backgroundMusic.pause();
        sounds.backgroundMusic.currentTime = 0;
    }
    
    // 메인 로비 테마 정지
    if (sounds.mainLobbyTheme) {
        sounds.mainLobbyTheme.pause();
        sounds.mainLobbyTheme.currentTime = 0;
    }
    
    // 배경 스프라이트 리셋
    if (background) {
        background.framesCurrent = 0;
        background.framesElapsed = 0;
        background.position.x = 0;
        background.position.y = 0;
    }
    
    // 캐릭터 위치 및 상태 완전 리셋
    if (player) {
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
            player.position.x = canvas.width / 2 - START_GAP;
        }
        if (player.sprites.idle && player.sprites.idle.image.complete) {
            player.position.y = getFloorTopY() - (player.sprites.idle.image.height * player.scale) + CHARACTER_SINK;
        }
        // 상태 리셋
        player.velocity.x = 0;
        player.velocity.y = 10;
        player.health = 100;
        player.isAttacking = false;
        player.isDashing = false;
        player.canJump = true;
        player.isOnGround = true;
        player.isStunned = false;
        player.lastHitFrame = null;
        player.switchSprite('idle');
        player.framesCurrent = 0;
        player.framesElapsed = 0;
        player.flip = false;
    }
    
    if (enemy) {
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
            enemy.position.x = canvas.width / 2 + START_GAP;
        }
        if (enemy.sprites.idle && enemy.sprites.idle.image.complete) {
            enemy.position.y = getFloorTopY() - (enemy.sprites.idle.image.height * enemy.scale) + CHARACTER_SINK;
        }
        // 상태 리셋
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        enemy.health = 100;
        enemy.isAttacking = false;
        enemy.isDashing = false;
        enemy.canJump = true;
        enemy.isOnGround = true;
        enemy.isStunned = false;
        enemy.lastHitFrame = null;
        enemy.switchSprite('idle');
        enemy.framesCurrent = 0;
        enemy.framesElapsed = 0;
        enemy.flip = true; // 플레이어 2는 기본적으로 좌우 반전
    }
    
    // AI 상태 리셋
    aiState.currentState = TACTICAL_STATES.NEUTRAL;
    aiState.frameCount = 0;
    aiState.lastAction = null;
    aiState.actionHistory = [];
    aiState.consecutiveActionCount = 0;
    aiState.playerInputHistory = [];
    aiState.playerMotionHistory = [];
    aiState.lastHitResult = 0;
    aiState.lastWhiffFrame = -999;
    aiState.playerJumpFrequency = 0.1;
    aiState.playerDashFrequency = 0.1;
    aiState.enemyCornerDistance = 0;
    aiState.playerCornerDistance = 0;
    aiState.reactionCounter = 0;
    aiState.moveDuration = 0;
    aiState.attackCooldown = 0;
    
    // 키 상태 리셋
    keys.d.pressed = false;
    keys.a.pressed = false;
    keys.ArrowRight.pressed = false;
    keys.ArrowLeft.pressed = false;
    
    // 체력바 리셋
    const playerHealth = document.querySelector('#playerHealth');
    const enemyHealth = document.querySelector('#enemyHealth');
    if (playerHealth) playerHealth.style.width = '100%';
    if (enemyHealth) enemyHealth.style.width = '100%';
    
    // 타이머 리셋
    timer = 60;
    const timerElement = document.querySelector('#timer');
    if (timerElement) timerElement.innerHTML = timer;
    
    // 일시정지 메뉴 및 버튼 숨기기
    if (pauseMenu) pauseMenu.style.display = 'none';
    if (pauseButton) pauseButton.style.display = 'none';
    if (settingsPopup) settingsPopup.style.display = 'none';
    
    // 게임 오버 UI 숨기기
    const displayText = document.querySelector('#displayText');
    const retryBtn = document.querySelector('#retryButton');
    if (displayText) displayText.style.display = 'none';
    if (retryBtn) retryBtn.style.display = 'none';
    
    // 모바일 컨트롤 숨기기
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.style.display = 'none';
        mobileControls.classList.remove('show');
    }
    
    // 카운트다운 숨기기
    if (countdown) {
        countdown.classList.remove('show');
    }
    
    // 게임 화면 숨기기
    gameScreen.classList.remove('show');
    
    // 캔버스를 완전히 지워서 일시정지된 배경이 보이지 않도록 함
    if (canvas && c) {
        c.fillStyle = 'black';
        c.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Retry 버튼 클릭 이벤트 - 로비로 돌아가기
const retryButton = document.getElementById('retryButton');
if (retryButton) {
    retryButton.addEventListener('click', () => {
        // 게임 세션 완전 종료
        endGameSession();
        // 로비 시작 화면으로 돌아가기
        setTimeout(() => {
            showLobbyStart();
        }, 300);
    })
}

// 일시정지 관련 요소
const pauseButton = document.getElementById('pauseButton');
const pauseMenu = document.getElementById('pauseMenu');
const resumeButton = document.getElementById('resumeButton');
const restartFromPauseButton = document.getElementById('restartFromPauseButton');
const settingsButton = document.getElementById('settingsButton');
const settingsPopup = document.getElementById('settingsPopup');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const gameSoundSlider = document.getElementById('gameSoundSlider');
const bgMusicSlider = document.getElementById('bgMusicSlider');
const gameSoundValue = document.getElementById('gameSoundValue');
const bgMusicValue = document.getElementById('bgMusicValue');
const hitboxToggle = document.getElementById('hitboxToggle');
const hitboxToggleLabel = document.getElementById('hitboxToggleLabel');
const settingsTabs = document.querySelectorAll('.settings-tab');
const soundTab = document.getElementById('soundTab');
const displayTab = document.getElementById('displayTab');

// 일시정지 버튼 클릭
if (pauseButton) {
    pauseButton.addEventListener('click', () => {
        if (!isPaused && gameStarted && !gameOver && !isCountdownActive) {
            isPaused = true;
            window.isPaused = true;
            pauseMenu.style.display = 'flex';
        }
    });
}

// 계속하기 버튼
if (resumeButton) {
    resumeButton.addEventListener('click', () => {
        isPaused = false;
        window.isPaused = false;
        pauseMenu.style.display = 'none';
    });
}

// 다시 시작 버튼 (일시정지 메뉴에서)
if (restartFromPauseButton) {
    restartFromPauseButton.addEventListener('click', () => {
        // 게임 세션 완전 종료
        endGameSession();
        // 로비 시작 화면으로 돌아가기
        setTimeout(() => {
            showLobbyStart();
        }, 300);
    });
}

// 설정 버튼
if (settingsButton) {
    settingsButton.addEventListener('click', () => {
        settingsPopup.style.display = 'flex';
        // 설정 팝업 열 때 사운드 탭으로 초기화
        if (settingsTabs && soundTab && displayTab) {
            settingsTabs.forEach(t => t.classList.remove('active'));
            soundTab.classList.remove('active');
            displayTab.classList.remove('active');
            // 첫 번째 탭(사운드) 활성화
            if (settingsTabs.length > 0) {
                settingsTabs[0].classList.add('active');
                soundTab.classList.add('active');
            }
        }
    });
}

// 설정 팝업 닫기 버튼
if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', () => {
        settingsPopup.style.display = 'none';
    });
}

// 게임 사운드 슬라이더
if (gameSoundSlider && gameSoundValue) {
    gameSoundSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        gameSoundValue.textContent = value + '%';
        const volume = value / 100;
        // 게임 사운드 볼륨 조정 (배경 음악 제외)
        if (sounds.slash) sounds.slash.volume = volume * 0.5;
        if (sounds.attacked) sounds.attacked.volume = volume * 0.5;
        if (sounds.jump) sounds.jump.volume = volume * 0.5;
        if (sounds.dash) sounds.dash.volume = volume * 0.5;
    });
}

// 배경 음악 슬라이더
if (bgMusicSlider && bgMusicValue) {
    bgMusicSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        bgMusicValue.textContent = value + '%';
        const volume = value / 100;
        // 배경 음악 볼륨 조정
        if (sounds.backgroundMusic) {
            sounds.backgroundMusic.volume = volume * 0.3;
        }
    });
}

// 히트박스 표시 토글
if (hitboxToggle && hitboxToggleLabel) {
    // 초기값 설정 (저장된 값이 있으면 사용)
    const savedHitboxSetting = localStorage.getItem('hitboxDisplay');
    if (savedHitboxSetting !== null) {
        window.DEBUG_HITBOX = savedHitboxSetting === 'true';
        hitboxToggle.checked = window.DEBUG_HITBOX;
    } else {
        window.DEBUG_HITBOX = false;
        hitboxToggle.checked = false;
    }
    updateHitboxToggleLabel();
    
    hitboxToggle.addEventListener('change', (e) => {
        window.DEBUG_HITBOX = e.target.checked;
        localStorage.setItem('hitboxDisplay', window.DEBUG_HITBOX);
        updateHitboxToggleLabel();
    });
}

// 히트박스 토글 라벨 업데이트 함수
function updateHitboxToggleLabel() {
    if (hitboxToggleLabel) {
        hitboxToggleLabel.textContent = window.DEBUG_HITBOX ? '켜짐' : '끔';
    }
}

// 설정 탭 전환
if (settingsTabs && soundTab && displayTab) {
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // 모든 탭 비활성화
            settingsTabs.forEach(t => t.classList.remove('active'));
            soundTab.classList.remove('active');
            displayTab.classList.remove('active');
            
            // 선택된 탭 활성화
            tab.classList.add('active');
            if (targetTab === 'sound') {
                soundTab.classList.add('active');
            } else if (targetTab === 'display') {
                displayTab.classList.add('active');
            }
        });
    });
}

// ESC 키로 일시정지/재개
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
        if (gameStarted && !gameOver && !isCountdownActive) {
            if (isPaused) {
                // 설정 팝업이 열려있으면 닫기
                if (settingsPopup && settingsPopup.style.display === 'flex') {
                    settingsPopup.style.display = 'none';
                } else {
                    // 일시정지 해제
                    isPaused = false;
                    window.isPaused = false;
                    if (pauseMenu) pauseMenu.style.display = 'none';
                }
            } else {
                // 일시정지
                isPaused = true;
                window.isPaused = true;
                if (pauseMenu) pauseMenu.style.display = 'flex';
            }
        }
    }
});

function animate() {
    window.requestAnimationFrame(animate)
    
    // Canvas가 없으면 리턴
    if (!canvas || !c) {
        return;
    }
    
    // 게임 화면이 표시되지 않으면 캔버스를 완전히 지우고 리턴
    if (!gameScreen.classList.contains('show')) {
        c.fillStyle = 'black'
        c.fillRect(0, 0, canvas.width, canvas.height)
        return;
    }
    
    // 게임이 시작되지 않았거나 카운트다운 중이거나 일시정지 중이면 캔버스를 지우고 리턴
    if (!gameStarted || isCountdownActive || isPaused) {
        c.fillStyle = 'black'
        c.fillRect(0, 0, canvas.width, canvas.height)
        return;
    }
    
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    if (background) {
        background.update()
    }
    // 바닥(플로어) 그리기 - 더 아래로 내림
    c.fillStyle = FLOOR_COLOR
    c.fillRect(0, canvas.height - window.FLOOR_HEIGHT + window.FLOOR_OFFSET, canvas.width, window.FLOOR_HEIGHT)
    
    // 캐릭터 업데이트는 게임 종료 후에도 계속 (애니메이션 등)
    if (player && enemy) {
        player.update()
        enemy.update()
        
        // 게임 종료 시 모든 움직임 멈추고 idle 상태로 전환
        if (gameOver) {
            player.velocity.x = 0
            enemy.velocity.x = 0
            player.velocity.y = 0
            enemy.velocity.y = 0
            
            // idle 상태로 전환 (죽음 애니메이션 중이 아닐 때만)
            if (player.currentState !== 'death' && player.currentState !== 'idle') {
                player.switchSprite('idle')
                player.isAttacking = false
            }
            if (enemy.currentState !== 'death' && enemy.currentState !== 'idle') {
                enemy.switchSprite('idle')
                enemy.isAttacking = false
            }
        }
        
        // 게임이 끝나지 않았을 때만 조작 및 AI 처리
        if (!gameOver) {
        // 경직 중이 아니고 대시 중이 아닐 때만 velocity.x를 0으로 설정
        if (!player.isStunned && !player.isDashing) {
            player.velocity.x = 0
        }
        // AI 모드일 때는 AI가 velocity를 설정하므로 여기서 0으로 설정하지 않음
        if (!isAIMode && !enemy.isStunned && !enemy.isDashing) {
            enemy.velocity.x = 0
        }

        //player movement (경직 중에는 움직임 제한, 대시 중에는 일반 이동 무시)
        if (!player.isStunned && !player.isDashing) {
            if (keys.d.pressed && player.lastKey === 'd' && player.currentState !== 'death') {
                player.velocity.x = 5
                player.flip = false // 오른쪽을 봄
                // 공격 중이 아닐 때만 run 애니메이션으로 전환
                if (player.isOnGround && player.currentState !== 'attack' && player.currentState !== 'takeHit') {
                    player.switchSprite('run')
                }
            } else if (keys.a.pressed && player.lastKey === 'a' && player.currentState !== 'death') {
                player.velocity.x = -5
                player.flip = true // 왼쪽을 봄
                // 공격 중이 아닐 때만 run 애니메이션으로 전환
                if (player.isOnGround && player.currentState !== 'attack' && player.currentState !== 'takeHit') {
                    player.switchSprite('run')
                }
            } else {
                // 공격 중이 아니고 이동하지 않을 때만 idle 애니메이션으로 전환
                if (player.isOnGround && player.currentState !== 'attack' && player.currentState !== 'takeHit' && player.currentState !== 'death') {
                    player.switchSprite('idle')
                }
            }
        } else if (player.isStunned) {
            // 경직 중에는 velocity.x를 점진적으로 감소시켜 튕김 효과
            player.velocity.x *= 0.8
        }

        // enemy movement (경직 중에는 움직임 제한, 대시 중에는 일반 이동 무시)
            // AI 모드일 때는 플레이어 2 조작 비활성화
            if (!isAIMode && !enemy.isStunned && !enemy.isDashing) {
            if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight' && enemy.currentState !== 'death') {
                enemy.velocity.x = 5
                enemy.flip = false // 오른쪽을 봄
                // 공격 중이 아닐 때만 run 애니메이션으로 전환
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                    enemy.switchSprite('run')
                }
            } else if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft' && enemy.currentState !== 'death') {
                enemy.velocity.x = -5
                enemy.flip = true // 왼쪽을 봄
                // 공격 중이 아닐 때만 run 애니메이션으로 전환
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                    enemy.switchSprite('run')
                }
            } else {
                // 공격 중이 아니고 이동하지 않을 때만 idle 애니메이션으로 전환
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit' && enemy.currentState !== 'death') {
                    enemy.switchSprite('idle')
                }
            }
        } else if (enemy.isStunned) {
            // 경직 중에는 velocity.x를 점진적으로 감소시켜 튕김 효과
            enemy.velocity.x *= 0.8
            } else if (isAIMode) {
                // AI 모드일 때 AI 로직 실행 (게임 종료 시에는 실행되지 않음)
                updateAI();
        }
        }
    }

    // 게임이 끝나지 않았을 때만 충돌 및 승리 조건 체크
    if (!gameOver) {
        //detect for collision
        if (
            rectangularCollision({
                rectangle1: player.attackBox,
                rectangle2: enemy
            })
            && player.isAttacking
            && player.currentState === 'attack' // 공격 상태인지 확인
            && player.framesCurrent === 4 // 공격 프레임 중간에 데미지 적용 (6프레임 중 4번째)
            && (!player.lastHitFrame || player.lastHitFrame !== player.framesCurrent) // 같은 프레임에서 중복 데미지 방지
            ) {
            player.lastHitFrame = player.framesCurrent // 마지막 데미지 적용 프레임 저장
            // 공격자의 방향을 전달 (flip이 false면 오른쪽, true면 왼쪽)
            const attackerDirection = player.flip ? 'left' : 'right'
            enemy.takeHit(attackerDirection)
            enemy.health -= 10
            document.querySelector('#enemyHealth').style.width = enemy.health + '%'
            // AI 상태 업데이트: 플레이어가 적을 맞췄음
            if (isAIMode) {
                aiState.lastHitResult = -1; // 적(AI)이 패배
                aiState.lastWhiffFrame = -999; // whiff 리셋
            }
        }
        if (
            rectangularCollision({
                rectangle1: enemy.attackBox,
                rectangle2: player
            })
            && enemy.isAttacking
            && enemy.currentState === 'attack' // 공격 상태인지 확인
            && enemy.framesCurrent === 4 // 공격 프레임 중간에 데미지 적용 (6프레임 중 4번째) - 플레이어와 동일
            && (!enemy.lastHitFrame || enemy.lastHitFrame !== enemy.framesCurrent) // 같은 프레임에서 중복 데미지 방지
        ) {
            enemy.lastHitFrame = enemy.framesCurrent // 마지막 데미지 적용 프레임 저장
            // 공격자의 방향을 전달 (flip이 false면 오른쪽, true면 왼쪽)
            const attackerDirection = enemy.flip ? 'left' : 'right'
            player.takeHit(attackerDirection)
            player.health -= 10
            document.querySelector('#playerHealth').style.width = player.health + '%'
            // AI 상태 업데이트: 적(AI)이 플레이어를 맞췄음
            if (isAIMode) {
                aiState.lastHitResult = 1; // 적(AI)이 승리
            }
        }
        
        // 공격 애니메이션이 끝나면 lastHitFrame 리셋
        if (player.currentState !== 'attack') {
            player.lastHitFrame = null
            // 플레이어가 공격을 했지만 맞지 않았으면 whiff 기록
            if (isAIMode && player.currentState === 'idle' && aiState.playerMotionHistory[aiState.playerMotionHistory.length - 2] === 'attack') {
                // 이전 프레임에 공격이 있었고, 현재 idle이면 whiff 가능성
                if (aiState.lastHitResult <= 0) {
                    aiState.lastWhiffFrame = aiState.frameCount;
                }
            }
        }
        if (enemy.currentState !== 'attack') {
            enemy.lastHitFrame = null
        }

        // end game base on health
        if (enemy.health <= 0 || player.health <= 0) {
            if (enemy.health <= 0 && enemy.currentState !== 'death') {
                enemy.switchSprite('death')
            }
            if (player.health <= 0 && player.currentState !== 'death') {
                player.switchSprite('death')
            }
            
            // 죽음 애니메이션이 끝나면 게임 종료
            if ((enemy.health <= 0 && enemy.framesCurrent >= enemy.sprites.death.framesMax - 1) ||
                (player.health <= 0 && player.framesCurrent >= player.sprites.death.framesMax - 1)) {
                gameOver = true
                determineWinner({ player, enemy, timerId })
            }
        }
    }
}

animate()

window.addEventListener('keydown', (event) => {
    // 게임이 시작되지 않았거나 게임이 끝났거나 카운트다운 중이거나 일시정지 중이면 입력 무시
    if (!gameStarted || gameOver || isCountdownActive || isPaused) return
    
    switch (event.key) {
        case 'd' :
            if (!player.isStunned) {
                keys.d.pressed = true
                player.lastKey = 'd'
            }
            break
        case 'a' :
            if (!player.isStunned) {
                keys.a.pressed = true
                player.lastKey = 'a'
            }
            break
        case 'w' :
            if (!player.isStunned && player.canJump && player.isOnGround) {
                player.velocity.y = -20
                player.canJump = false
                player.isOnGround = false
                // 점프 사운드 재생
                sounds.jump.currentTime = 0;
                sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
            break
        case ' ' :
            // 대시 중이어도 공격 가능
            if (!player.isStunned) {
                player.attack()
            }
            break
        case 'e' :
        case 'E' :
            if (!player.isStunned) {
                player.dash()
            }
            break

        case 'ArrowRight' :
            // AI 모드일 때 플레이어 2 조작 비활성화
            if (!isAIMode && !enemy.isStunned) {
                keys.ArrowRight.pressed = true
                enemy.lastKey = 'ArrowRight'
            }
            break
        case 'ArrowLeft' :
            // AI 모드일 때 플레이어 2 조작 비활성화
            if (!isAIMode && !enemy.isStunned) {
                keys.ArrowLeft.pressed = true
                enemy.lastKey = 'ArrowLeft'
            }
            break
        case 'ArrowUp' :
            // AI 모드일 때 플레이어 2 조작 비활성화
            if (!isAIMode && !enemy.isStunned && enemy.canJump && enemy.isOnGround) {
                enemy.velocity.y = -20
                enemy.canJump = false
                enemy.isOnGround = false
                // 점프 사운드 재생
                sounds.jump.currentTime = 0;
                sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
            break
        case 'ArrowDown' :
            // AI 모드일 때 플레이어 2 조작 비활성화
            // 대시 중이어도 공격 가능
            if (!isAIMode && !enemy.isStunned) {
                enemy.attack()
            }
            break
        case 'Shift' :
            // AI 모드일 때 플레이어 2 조작 비활성화
            // 오른쪽 Shift만 감지
            if (!isAIMode && event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT && !enemy.isStunned) {
                enemy.dash()
            }
            break
    }
})

window.addEventListener('keyup', (event) => {
    // 일시정지 중이면 입력 무시
    if (isPaused) return;
    
    switch (event.key) {
        case 'd' :
            keys.d.pressed = false
            break
        case 'a' :
            keys.a.pressed = false
            break
    }

//enemy keys
    // AI 모드일 때 플레이어 2 조작 비활성화
    if (!isAIMode) {
    switch (event.key) {
        case 'ArrowRight' :
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft' :
            keys.ArrowLeft.pressed = false
            break
        }
    }
})
