// 로비 화면 관리
const lobbyScreen = document.getElementById('lobbyScreen');
const lobbyStartSection = document.getElementById('lobbyStartSection');
const lobbyModeSection = document.getElementById('lobbyModeSection');
const characterSelectionSection = document.getElementById('characterSelectionSection');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const pvpModeButton = document.getElementById('pvpModeButton');
const aiModeButton = document.getElementById('aiModeButton');
const bossModeButton = document.getElementById('bossModeButton');
const practiceModeButton = document.getElementById('practiceModeButton');
const duelButton = document.getElementById('duelButton');
const countdown = document.getElementById('countdown');
const countdownText = document.getElementById('countdownText');

// 언어 설정
let currentLanguage = 'en'; // 'ko' 또는 'en'
// 전역으로 설정하여 utils.js에서 접근 가능하도록
window.currentLanguage = currentLanguage;
const translations = {
    en: {
        startGame: 'Start Game',
        selectGameMode: 'Select Game Mode',
        selectCharacters: 'Select Characters',
        mode1v1: '1 vs 1',
        mode1v1Desc: 'Battle against another player. Test your skills with a friend.',
        modeAI: 'vs AI',
        modeAIDesc: 'Battle against artificial intelligence. Accept the AI\'s challenge.',
        modeBoss: 'Boss Mode',
        modeBossDesc: 'Face the ultimate challenge. The boss has double damage, faster speed, and superior AI.',
        modePractice: 'Practice',
        modePracticeDesc: 'Learn the basics. Practice your moves against a training dummy.',
        practiceSettings: 'Practice Settings',
        dummyHealth: 'Dummy Health',
        playerDamage: 'Player Damage',
        dummyMovement: 'Dummy Movement',
        showHitbox: 'Show Hitbox',
        resetDummyPosition: 'Reset Dummy Position',
        controls: 'Controls',
        start: 'Start',
        player1: 'Player 1',
        player2: 'Player 2',
        cpu: 'CPU',
        boss: 'Boss',
        selecting: 'Selecting...',
        selected: 'Selected',
        confirmed: 'Confirmed',
        waiting: 'Waiting...',
        confirm: 'Confirm',
        duel: 'Duel!',
        player1Wins: 'Player 1 Wins',
        player2Wins: 'Player 2 Wins',
        tie: 'Tie',
        pause: 'Pause',
        resume: 'Resume',
        retry: 'Quit',
        backToLobby: 'Back to Lobby'
    },
    ko: {
        startGame: '게임 시작',
        selectGameMode: '게임 모드 선택',
        selectCharacters: '캐릭터 선택',
        mode1v1: '1 대 1',
        mode1v1Desc: '다른 플레이어와 대전하세요. 친구와 함께 실력을 테스트하세요.',
        modeAI: 'AI 대전',
        modeAIDesc: '인공지능과 대전하세요. AI의 도전을 받아들이세요.',
        modeBoss: '보스 모드',
        modeBossDesc: '최고의 도전에 맞서세요. 보스는 2배 데미지, 빠른 속도, 우수한 AI를 가지고 있습니다.',
        modePractice: '연습장',
        modePracticeDesc: '기본 조작을 익히세요. 훈련용 더미와 함께 움직임을 연습하세요.',
        practiceSettings: '연습 설정',
        dummyHealth: '더미 체력',
        playerDamage: '플레이어 공격력',
        dummyMovement: '더미 이동',
        showHitbox: '히트박스 표시',
        resetDummyPosition: '더미 위치 초기화',
        controls: '조작키',
        start: '시작',
        player1: '플레이어 1',
        player2: '플레이어 2',
        cpu: 'CPU',
        boss: '보스',
        selecting: '선택 중...',
        selected: '선택됨',
        confirmed: '확정됨',
        waiting: '대기 중...',
        confirm: '확정',
        duel: '대결!',
        player1Wins: '플레이어 1 승리',
        player2Wins: '플레이어 2 승리',
        tie: '무승부',
        pause: '일시정지',
        resume: '재개',
        retry: '나가기',
        backToLobby: '로비로 돌아가기'
    }
};

// 캐릭터 선택 상태
let selectedPlayer1Character = null;
let selectedPlayer2Character = null;
let currentGameMode = null; // 'pvp', 'ai', 'boss', 'practice'
let isPracticeMode = false;
let practiceDummyHealth = 200;
let practicePlayerDamage = 20; // 기본값은 로난의 공격력
let practiceDummyMovementEnabled = false;
// 더미 전용 경계 설정 (코드에서 직접 변경 가능)
// 더미가 이동할 수 있는 좌우 경계 좌표
let practiceDummyLeftBoundary = 0;   // 왼쪽 경계 (기본값: 0)
let practiceDummyRightBoundary = 1024; // 오른쪽 경계 (기본값: 1024, 캔버스 너비)
let player1Confirmed = false;
let player2Confirmed = false;

// 캐릭터 정보창 X 오프셋 설정 (픽셀 단위)
let infoPanelLeftOffset = 30;   // 플레이어 1 정보창 (좌측) X 오프셋
let infoPanelRightOffset = 10;  // 플레이어 2 정보창 (우측) X 오프셋

// 정보창 오프셋 업데이트 함수
function updateInfoPanelOffsets() {
    document.documentElement.style.setProperty('--info-panel-left-offset', `${infoPanelLeftOffset}px`);
    document.documentElement.style.setProperty('--info-panel-right-offset', `${infoPanelRightOffset}px`);
}

// 초기 오프셋 적용
updateInfoPanelOffsets();

// 요소가 없으면 에러 방지
if (!lobbyScreen || !lobbyStartSection || !lobbyModeSection || !gameScreen || !startButton || !pvpModeButton || !aiModeButton || !bossModeButton || !countdown || !countdownText) {
    console.error('필수 HTML 요소를 찾을 수 없습니다.');
}

// 게임이 시작되었는지 확인하는 플래그
let gameStarted = false;
let isCountdownActive = false;
// AI 모드 여부를 확인하는 플래그
let isAIMode = false;
// Boss 모드 여부를 확인하는 플래그
let isBossMode = false;
// 전역으로 설정하여 classes.js에서 접근 가능하도록
window.isBossMode = false;
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
    
    // Boss 모드 전용: 고급 AI 기능
    playerPattern: [],                      // 플레이어 패턴 분석 (최근 50프레임)
    predictedPlayerAction: null,            // 예측된 플레이어 행동
    comboCount: 0,                          // 현재 콤보 카운트
    lastComboTime: 0,                       // 마지막 콤보 시간
    playerWeakness: {                       // 플레이어 약점 분석
        jumpAfterAttack: 0,                 // 공격 후 점프 빈도
        dashAfterAttack: 0,                 // 공격 후 대시 빈도
        attackAfterJump: 0,                 // 점프 후 공격 빈도
        defensiveAfterHit: 0                 // 맞은 후 방어 빈도
    },
    adaptiveStrategy: 'aggressive',         // 적응형 전략 (aggressive/defensive/neutral)
    frameTrapCount: 0,                      // 프레임 트랩 시도 횟수
    lastSuccessfulCounter: 0,               // 마지막 성공한 카운터 시간
    airAttackAttempted: false               // 공중 공격 시도 플래그 (중복 방지)
};

// 사운드 관리
// 파일명에 공백이 있어서 encodeURI 사용
// file:// 프로토콜 대응을 위한 경로 처리
function getAudioPath(relativePath) {
    // 현재 프로토콜 확인
    const isFileProtocol = window.location.protocol === 'file:';
    if (isFileProtocol) {
        // file:// 프로토콜일 때는 현재 디렉토리 기준으로 절대 경로 생성
        const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        return basePath + relativePath;
    }
    return relativePath;
}

const sounds = {
    slash: new Audio(getAudioPath('Sound/slash.mp3')),
    attacked: new Audio(getAudioPath('Sound/attacked.mp3')),
    jump: new Audio(getAudioPath('Sound/jump.mp3')),
    dash: new Audio(getAudioPath('Sound/dash.mp3')),
    backgroundMusic: new Audio(getAudioPath('Sound/BackgroundMusic.mp3')),
    // 파일명에 공백이 있어서 encodeURI로 처리
    mainLobbyTheme: new Audio(getAudioPath(encodeURI('Sound/main lobby theme.mp3')))
};

// 모든 오디오에 preload 설정 (file:// 프로토콜 대응)
Object.values(sounds).forEach(audio => {
    if (audio) {
        audio.preload = 'auto';
        // 에러 핸들링
        audio.addEventListener('error', function(e) {
            console.error('오디오 로드 실패:', this.src, e);
        });
    }
});

// 메인 로비 테마 로드 에러 핸들링
sounds.mainLobbyTheme.addEventListener('error', function(e) {
    console.error('메인 로비 테마 로드 실패:', e);
    console.error('시도한 경로:', this.src);
    // 대체 경로 시도
    const altPath = getAudioPath('Sound/main%20lobby%20theme.mp3');
    const altAudio = new Audio(altPath);
    altAudio.preload = 'auto';
    altAudio.volume = 0.5;
    altAudio.loop = true;
    altAudio.addEventListener('error', () => {
        console.error('대체 경로도 실패:', altPath);
    });
    // 원본 오디오를 대체 오디오로 교체
    sounds.mainLobbyTheme = altAudio;
    window.sounds = sounds; // 전역 참조도 업데이트
});

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

// 메인 로비 테마 재생 함수
function playLobbyTheme() {
    if (!sounds.mainLobbyTheme) return;
    
    // 이미 재생 중이면 재생하지 않음
    if (!sounds.mainLobbyTheme.paused) return;
    
    sounds.mainLobbyTheme.currentTime = 0;
    sounds.mainLobbyTheme.play().catch(err => {
        console.log('메인 로비 테마 재생 실패:', err);
    });
}

// 페이지 로드 시 로비 화면 초기화만 (BGM은 스타트 버튼 클릭 시 재생)
window.addEventListener('load', () => {
    // 로비 화면 초기화
    showLobbyStart();
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
    if (lobbyModeSection) lobbyModeSection.style.display = 'none';
    if (characterSelectionSection) characterSelectionSection.style.display = 'none';
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

// 캐릭터 번호를 색상으로 변환하는 함수
function getCharacterColor(characterNum) {
    // 모든 캐릭터는 원래 색상 사용 (필터 없음)
    return 'red'; // 기본값
}

// 캐릭터별 스프라이트 설정 반환
function getCharacterSprites(characterNum) {
    if (characterNum === 1) {
        // Player 1 (Ronan)
        return {
            idle: { imageSrc: 'img/player 1/Idle.png', framesMax: 8 },
            run: { imageSrc: 'img/player 1/Run.png', framesMax: 8 },
            jump: { imageSrc: 'img/player 1/Jump.png', framesMax: 2 },
            fall: { imageSrc: 'img/player 1/Fall.png', framesMax: 2 },
            attack: { imageSrc: 'img/player 1/Attack1.png', framesMax: 6 },
            takeHit: { imageSrc: 'img/player 1/Take Hit - white silhouette.png', framesMax: 4 },
            death: { imageSrc: 'img/player 1/Death.png', framesMax: 6 },
            positionYOffset: 0,
            imageYOffset: 43, // Ronan 이미지 오프셋
            dashEffectYOffset: 25 // Ronan 대쉬 이펙트 Y 오프셋
        };
    } else if (characterNum === 2) {
        // Player 2 (Shogun)
        return {
            idle: { imageSrc: 'img/player 2/Idle.png', framesMax: 4 },
            run: { imageSrc: 'img/player 2/Run.png', framesMax: 8 },
            jump: { imageSrc: 'img/player 2/Jump.png', framesMax: 2 },
            fall: { imageSrc: 'img/player 2/Fall.png', framesMax: 2 },
            attack: { imageSrc: 'img/player 2/Attack1.png', framesMax: 4 },
            takeHit: { imageSrc: 'img/player 2/Take Hit.png', framesMax: 3 },
            death: { imageSrc: 'img/player 2/Death.png', framesMax: 7 },
            positionYOffset: 0,
            imageYOffset: 28, // Shogun 이미지 오프셋
            dashEffectYOffset: 40 // Shogun 대쉬 이펙트 Y 오프셋
        };
    } else if (characterNum === 3) {
        // Player 3 (Chan)
        return {
            idle: { imageSrc: 'img/player 3/Idle.png', framesMax: 10 },
            run: { imageSrc: 'img/player 3/Run.png', framesMax: 8 },
            jump: { imageSrc: 'img/player 3/Jump.png', framesMax: 3 },
            fall: { imageSrc: 'img/player 3/Fall.png', framesMax: 3 },
            attack: { imageSrc: 'img/player 3/Attack1.png', framesMax: 7 },
            takeHit: { imageSrc: 'img/player 3/Take Hit.png', framesMax: 3 },
            death: { imageSrc: 'img/player 3/Death.png', framesMax: 11 },
            positionYOffset: 0,
            imageYOffset: 50, // Chan 이미지 오프셋
            dashEffectYOffset: 15 // Chan 대쉬 이펙트 Y 오프셋
        };
    } else {
        // 기본값 (Ronan)
        return {
            idle: { imageSrc: 'img/player 1/Idle.png', framesMax: 8 },
            run: { imageSrc: 'img/player 1/Run.png', framesMax: 8 },
            jump: { imageSrc: 'img/player 1/Jump.png', framesMax: 2 },
            fall: { imageSrc: 'img/player 1/Fall.png', framesMax: 2 },
            attack: { imageSrc: 'img/player 1/Attack1.png', framesMax: 6 },
            takeHit: { imageSrc: 'img/player 1/Take Hit - white silhouette.png', framesMax: 4 },
            death: { imageSrc: 'img/player 1/Death.png', framesMax: 6 },
            positionYOffset: 0,
            imageYOffset: 20,
            dashEffectYOffset: 0 // 기본 대쉬 이펙트 Y 오프셋
        };
    }
}

// 게임 시작 함수 (공통)
function startGame(aiMode = false, bossMode = false, practiceMode = false) {
    // 게임 상태 초기화
    isAIMode = aiMode || bossMode || practiceMode; // Boss 모드와 연습 모드도 AI 모드로 취급
    isBossMode = bossMode;
    isPracticeMode = practiceMode;
    window.isBossMode = bossMode; // 전역으로 설정
    window.isPracticeMode = practiceMode; // 전역으로 설정
    gameStarted = false;
    isCountdownActive = false;
    gameOver = false;
    isPaused = false;
    window.isPaused = false;
    
    // 선택된 캐릭터 사용
    if (player && selectedPlayer1Character) {
        player.color = getCharacterColor(selectedPlayer1Character);
        player.characterNum = selectedPlayer1Character;
    } else if (player) {
        player.color = 'red';
        player.characterNum = 1; // 기본값
    }
    if (enemy && !bossMode && selectedPlayer2Character) {
        enemy.color = getCharacterColor(selectedPlayer2Character);
        enemy.characterNum = selectedPlayer2Character;
    } else if (enemy && !bossMode) {
        enemy.color = 'red';
        enemy.characterNum = 1; // 기본값
    }
    
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
        // 선택된 캐릭터 스프라이트 사용
        const playerCharacterNum = selectedPlayer1Character || 1;
        const playerSprites = getCharacterSprites(playerCharacterNum);
        
        // 캐릭터별 설정 적용
        player.characterPositionYOffset = playerSprites.positionYOffset || 0;
        player.characterImageYOffset = playerSprites.imageYOffset || 20; // 기본값 20
        player.dashEffectYOffset = playerSprites.dashEffectYOffset || 0; // 대쉬 이펙트 Y 오프셋
        
        // 스프라이트 재초기화
        player.sprites = {};
        let playerLoadedCount = 0;
        const playerTotalSprites = Object.keys(playerSprites).length;
        const playerHasAttack2 = playerSprites.attack && playerSprites.attack.attack2Src;
        const playerActualTotalSprites = playerTotalSprites + (playerHasAttack2 ? 1 : 0);
        
        for (const spriteKey in playerSprites) {
            const spriteData = playerSprites[spriteKey];
            player.sprites[spriteKey] = {
                image: new Image(),
                framesMax: spriteData.framesMax || 1,
                frameWidth: 0,
                frameHeight: 0
            };
            
            // 공격 모션에 두 번째 이미지가 있는 경우
            if (spriteKey === 'attack' && spriteData.attack2Src) {
                player.sprites[spriteKey].attack2Image = new Image();
                player.sprites[spriteKey].attack2Frames = spriteData.attack2Frames || 0;
                // 첫 번째 이미지의 원본 프레임 수 저장
                player.sprites[spriteKey].attack1Frames = spriteData.framesMax || 0;
                player.sprites[spriteKey].framesMax = (spriteData.framesMax || 0) + (spriteData.attack2Frames || 0);
                
                player.sprites[spriteKey].attack2Image.onload = () => {
                    if (player.sprites[spriteKey].attack2Image.complete && player.sprites[spriteKey].attack2Image.width > 0) {
                        const attack2Frames = spriteData.attack2Frames || 0;
                        player.sprites[spriteKey].attack2FrameWidth = Math.floor(player.sprites[spriteKey].attack2Image.width / attack2Frames);
                        player.sprites[spriteKey].attack2FrameHeight = player.sprites[spriteKey].attack2Image.height;
                    }
                    playerLoadedCount++;
                    if (playerLoadedCount === playerActualTotalSprites && typeof canvas !== 'undefined') {
                        const idleSprite = player.sprites.idle;
                        if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                            player.width = idleSprite.frameWidth;
                            player.height = idleSprite.frameHeight;
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY();
                            const hitboxHeight = 150;
                            const imageYOffset = player.characterImageYOffset || 20;
                            const scaledHeight = player.height * player.scale;
                            player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                        }
                    }
                };
                
                player.sprites[spriteKey].attack2Image.src = spriteData.attack2Src;
                if (player.sprites[spriteKey].attack2Image.complete && player.sprites[spriteKey].attack2Image.width > 0) {
                    player.sprites[spriteKey].attack2Image.onload();
                }
            }
            
            player.sprites[spriteKey].image.onload = () => {
                const spriteObj = player.sprites[spriteKey];
                if (spriteObj.image.complete && spriteObj.image.width > 0) {
                    const baseFramesMax = spriteData.framesMax || 1;
                    spriteObj.frameWidth = Math.floor(spriteObj.image.width / baseFramesMax);
                    spriteObj.frameHeight = spriteObj.image.height;
                    
                    if (spriteKey === 'idle' && typeof canvas !== 'undefined') {
                        player.width = spriteObj.frameWidth;
                        player.height = spriteObj.frameHeight;
                        // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                        const groundY = getFloorTopY();
                        const hitboxHeight = 150;
                        const imageYOffset = player.characterImageYOffset || 20;
                        const scaledHeight = player.height * player.scale;
                        player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                        // X 좌표도 스프라이트 로딩 완료 후 재설정
                        if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
                            player.position.x = canvas.width / 2 - START_GAP;
                        }
                    }
                }
                playerLoadedCount++;
                if (playerLoadedCount === playerActualTotalSprites && typeof canvas !== 'undefined') {
                    const idleSprite = player.sprites.idle;
                    if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                        player.width = idleSprite.frameWidth;
                        player.height = idleSprite.frameHeight;
                        // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                        const groundY = getFloorTopY();
                        const hitboxHeight = 150;
                        const imageYOffset = player.characterImageYOffset || 20;
                        const scaledHeight = player.height * player.scale;
                        player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                        // X 좌표도 스프라이트 로딩 완료 후 재설정
                        if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
                            player.position.x = canvas.width / 2 - START_GAP;
                        }
                    }
                }
            };
            
            player.sprites[spriteKey].image.src = spriteData.imageSrc;
            if (player.sprites[spriteKey].image.complete && player.sprites[spriteKey].image.width > 0) {
                player.sprites[spriteKey].image.onload();
            }
        }
        
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(player, START_GAP)) {
            player.position.x = canvas.width / 2 - START_GAP;
        }
        // 스프라이트가 완전히 로드되고 frameWidth가 설정된 후에만 위치 설정
        if (player.sprites.idle && player.sprites.idle.image.complete && player.sprites.idle.frameWidth > 0) {
            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
            const groundY = getFloorTopY();
            const hitboxHeight = 150;
            const imageYOffset = player.characterImageYOffset || 20;
            const scaledHeight = player.sprites.idle.image.height * player.scale;
            player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
        }
        // 상태 리셋
        player.velocity.x = 0;
        player.velocity.y = 10;
        player.health = 200;
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
        // 연습 모드일 때 더미 스프라이트 설정
        if (practiceMode) {
            // 더미 스프라이트로 교체
            enemy.sprites = {
                idle: {
                    image: new Image(),
                    framesMax: 1,
                    frameWidth: 0,
                    frameHeight: 0
                },
                takeHit: {
                    image: new Image(),
                    framesMax: 9,
                    frameWidth: 0,
                    frameHeight: 0
                },
                death: {
                    image: new Image(),
                    framesMax: 16,
                    frameWidth: 0,
                    frameHeight: 0
                }
            };
            
            // 더미 스프라이트 이미지 로드
            const dummySprites = {
                idle: { imageSrc: 'img/dummy/Sprite Sheet 1 - Idle.png', framesMax: 1 },
                takeHit: { imageSrc: 'img/dummy/Sprite Sheet 2 - Hit.png', framesMax: 9 },
                death: { imageSrc: 'img/dummy/Sprite Sheet 3 - Death.png', framesMax: 16 }
            };
            
            let dummyLoadedCount = 0;
            const dummyTotalSprites = Object.keys(dummySprites).length;
            
            for (const spriteKey in dummySprites) {
                const spriteData = dummySprites[spriteKey];
                const sprite = enemy.sprites[spriteKey];
                
                sprite.image.onload = () => {
                    if (sprite.image.complete && sprite.image.width > 0) {
                        sprite.frameWidth = Math.floor(sprite.image.width / spriteData.framesMax);
                        sprite.frameHeight = sprite.image.height;
                        dummyLoadedCount++;
                        
                        // idle 스프라이트가 로드되면 위치 설정
                        if (spriteKey === 'idle' && typeof canvas !== 'undefined') {
                            enemy.width = sprite.frameWidth;
                            enemy.height = sprite.frameHeight;
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY();
                            const hitboxHeight = 150;
                            const imageYOffset = 20;
                            const scaledHeight = enemy.height * enemy.scale;
                            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                            // X 좌표도 스프라이트 로딩 완료 후 재설정
                            if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                enemy.position.x = canvas.width / 2 + START_GAP;
                            }
                        }
                    }
                };
                sprite.image.src = spriteData.imageSrc;
                // 이미 로드된 경우 즉시 실행
                if (sprite.image.complete && sprite.image.width > 0) {
                    sprite.image.onload();
                }
            }
            
            // 더미 초기 설정
            enemy.health = practiceDummyHealth;
            enemy.isDummy = true;
            enemy.deathAnimationReversed = false;
            enemy.switchSprite('idle');
            enemy.framesCurrent = 0;
            enemy.framesElapsed = 0;
            // 더미는 공격하지 않음
            enemy.isAttacking = false;
            // 더미는 기본적으로 좌우 반전 (플레이어 2와 동일)
            enemy.flip = true;
            enemy.characterImageYOffset = 20;
            
            // 더미 전용 경계를 전역으로 설정 (classes.js에서 사용)
            window.practiceDummyLeftBoundary = practiceDummyLeftBoundary;
            window.practiceDummyRightBoundary = practiceDummyRightBoundary;
            
            // 더미 초기 위치 설정 (일반 모드 enemy와 동일)
            if (typeof canvas !== 'undefined') {
                enemy.position.x = canvas.width / 2 + START_GAP;
            }
        }
        // Boss 모드일 때 스프라이트 교체
        else if (bossMode) {
            // 보스 대쉬 이펙트 Y 오프셋 설정 (여기서 변경 가능)
            enemy.dashEffectYOffset = 50; // 보스 대쉬 이펙트 Y 오프셋
            // Boss 전용 스프라이트로 교체
            enemy.sprites = {
                idle: {
                    image: new Image(),
                    framesMax: 11,
                    frameWidth: 0,
                    frameHeight: 0
                },
                run: {
                    image: new Image(),
                    framesMax: 8,
                    frameWidth: 0,
                    frameHeight: 0
                },
                jump: {
                    image: new Image(),
                    framesMax: 3,
                    frameWidth: 0,
                    frameHeight: 0
                },
                fall: {
                    image: new Image(),
                    framesMax: 3,
                    frameWidth: 0,
                    frameHeight: 0
                },
                attack: {
                    image: new Image(),
                    framesMax: 7,
                    frameWidth: 0,
                    frameHeight: 0
                },
                takeHit: {
                    image: new Image(),
                    framesMax: 4,
                    frameWidth: 0,
                    frameHeight: 0
                },
                death: {
                    image: new Image(),
                    framesMax: 11,
                    frameWidth: 0,
                    frameHeight: 0
                }
            };
            
            // Boss 스프라이트 이미지 로드
            const bossSprites = {
                idle: { imageSrc: 'img/boss/Idle.png', framesMax: 11 },
                run: { imageSrc: 'img/boss/Run.png', framesMax: 8 },
                jump: { imageSrc: 'img/boss/Jump.png', framesMax: 3 },
                fall: { imageSrc: 'img/boss/Fall.png', framesMax: 3 },
                attack: { imageSrc: 'img/boss/Attack1.png', framesMax: 7 },
                takeHit: { imageSrc: 'img/boss/Take Hit.png', framesMax: 4 },
                death: { imageSrc: 'img/boss/Death.png', framesMax: 11 }
            };
            
            let loadedCount = 0;
            const totalSprites = Object.keys(bossSprites).length;
            
            for (const spriteKey in bossSprites) {
                const spriteData = bossSprites[spriteKey];
                const spriteObj = enemy.sprites[spriteKey];
                
                spriteObj.image.onload = () => {
                    if (spriteObj.image.complete && spriteObj.image.width > 0) {
                        spriteObj.frameWidth = Math.floor(spriteObj.image.width / spriteObj.framesMax);
                        spriteObj.frameHeight = spriteObj.image.height;
                        
                        if (spriteKey === 'idle' && typeof canvas !== 'undefined') {
                            enemy.width = spriteObj.frameWidth;
                            enemy.height = spriteObj.frameHeight;
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY();
                            const hitboxHeight = 150;
                            const imageYOffset = 20;
                            const scaledHeight = enemy.height * enemy.scale;
                            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                            // X 좌표도 스프라이트 로딩 완료 후 재설정
                            if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                enemy.position.x = canvas.width / 2 + START_GAP;
                            }
                        }
                    }
                    
                    loadedCount++;
                        if (loadedCount === totalSprites && typeof canvas !== 'undefined') {
                            const idleSprite = enemy.sprites.idle;
                            if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                                enemy.width = idleSprite.frameWidth;
                                enemy.height = idleSprite.frameHeight;
                                // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                                const groundY = getFloorTopY();
                                const hitboxHeight = 150;
                                const imageYOffset = 20;
                                const scaledHeight = enemy.height * enemy.scale;
                                enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                                // X 좌표도 스프라이트 로딩 완료 후 재설정
                                if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                    enemy.position.x = canvas.width / 2 + START_GAP;
                                }
                            }
                        }
                };
                
                spriteObj.image.src = spriteData.imageSrc;
                
                if (spriteObj.image.complete && spriteObj.image.width > 0) {
                    spriteObj.image.onload();
                }
            }
        } else {
            // 일반 모드일 때는 선택된 캐릭터 스프라이트 사용
            const enemyCharacterNum = selectedPlayer2Character || 1;
            const enemySprites = getCharacterSprites(enemyCharacterNum);
            
            // 캐릭터별 설정 적용
            enemy.characterPositionYOffset = enemySprites.positionYOffset || 0;
            enemy.characterImageYOffset = enemySprites.imageYOffset || 20; // 기본값 20
            enemy.dashEffectYOffset = enemySprites.dashEffectYOffset || 0; // 대쉬 이펙트 Y 오프셋
            
            // 스프라이트 재초기화
            enemy.sprites = {};
            let enemyLoadedCount = 0;
            const enemyTotalSprites = Object.keys(enemySprites).length;
            const enemyHasAttack2 = enemySprites.attack && enemySprites.attack.attack2Src;
            const enemyActualTotalSprites = enemyTotalSprites + (enemyHasAttack2 ? 1 : 0);
            
            for (const spriteKey in enemySprites) {
                const spriteData = enemySprites[spriteKey];
                enemy.sprites[spriteKey] = {
                    image: new Image(),
                    framesMax: spriteData.framesMax || 1,
                    frameWidth: 0,
                    frameHeight: 0
                };
                
                // 공격 모션에 두 번째 이미지가 있는 경우
                if (spriteKey === 'attack' && spriteData.attack2Src) {
                    enemy.sprites[spriteKey].attack2Image = new Image();
                    enemy.sprites[spriteKey].attack2Frames = spriteData.attack2Frames || 0;
                    // 첫 번째 이미지의 원본 프레임 수 저장
                    enemy.sprites[spriteKey].attack1Frames = spriteData.framesMax || 0;
                    enemy.sprites[spriteKey].framesMax = (spriteData.framesMax || 0) + (spriteData.attack2Frames || 0);
                    
                    enemy.sprites[spriteKey].attack2Image.onload = () => {
                        if (enemy.sprites[spriteKey].attack2Image.complete && enemy.sprites[spriteKey].attack2Image.width > 0) {
                            const attack2Frames = spriteData.attack2Frames || 0;
                            enemy.sprites[spriteKey].attack2FrameWidth = Math.floor(enemy.sprites[spriteKey].attack2Image.width / attack2Frames);
                            enemy.sprites[spriteKey].attack2FrameHeight = enemy.sprites[spriteKey].attack2Image.height;
                        }
                        enemyLoadedCount++;
                        if (enemyLoadedCount === enemyActualTotalSprites && typeof canvas !== 'undefined') {
                            const idleSprite = enemy.sprites.idle;
                            if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                                enemy.width = idleSprite.frameWidth;
                                enemy.height = idleSprite.frameHeight;
                                // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                                const groundY = getFloorTopY();
                                const hitboxHeight = 150;
                                const imageYOffset = enemy.characterImageYOffset || 20;
                                const scaledHeight = enemy.height * enemy.scale;
                                enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                                // X 좌표도 스프라이트 로딩 완료 후 재설정
                                if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                    enemy.position.x = canvas.width / 2 + START_GAP;
                                }
                            }
                        }
                    };
                    
                    enemy.sprites[spriteKey].attack2Image.src = spriteData.attack2Src;
                    if (enemy.sprites[spriteKey].attack2Image.complete && enemy.sprites[spriteKey].attack2Image.width > 0) {
                        enemy.sprites[spriteKey].attack2Image.onload();
                    }
                }
                
                enemy.sprites[spriteKey].image.onload = () => {
                    const spriteObj = enemy.sprites[spriteKey];
                    if (spriteObj.image.complete && spriteObj.image.width > 0) {
                        const baseFramesMax = spriteData.framesMax || 1;
                        spriteObj.frameWidth = Math.floor(spriteObj.image.width / baseFramesMax);
                        spriteObj.frameHeight = spriteObj.image.height;
                        
                        if (spriteKey === 'idle' && typeof canvas !== 'undefined') {
                            enemy.width = spriteObj.frameWidth;
                            enemy.height = spriteObj.frameHeight;
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY();
                            const hitboxHeight = 150;
                            const imageYOffset = enemy.characterImageYOffset || 20;
                            const scaledHeight = enemy.height * enemy.scale;
                            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                            // X 좌표도 스프라이트 로딩 완료 후 재설정
                            if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                enemy.position.x = canvas.width / 2 + START_GAP;
                            }
                        }
                    }
                    enemyLoadedCount++;
                    if (enemyLoadedCount === enemyActualTotalSprites && typeof canvas !== 'undefined') {
                        const idleSprite = enemy.sprites.idle;
                        if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                            enemy.width = idleSprite.frameWidth;
                            enemy.height = idleSprite.frameHeight;
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY();
                            const hitboxHeight = 150;
                            const imageYOffset = enemy.characterImageYOffset || 20;
                            const scaledHeight = enemy.height * enemy.scale;
                            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
                            // X 좌표도 스프라이트 로딩 완료 후 재설정
                            if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                                enemy.position.x = canvas.width / 2 + START_GAP;
                            }
                        }
                    }
                };
                
                enemy.sprites[spriteKey].image.src = spriteData.imageSrc;
                if (enemy.sprites[spriteKey].image.complete && enemy.sprites[spriteKey].image.width > 0) {
                    enemy.sprites[spriteKey].image.onload();
                }
            }
        }
        
        // 위치 초기화
        if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
            enemy.position.x = canvas.width / 2 + START_GAP;
        }
        // 스프라이트가 완전히 로드되고 frameWidth가 설정된 후에만 위치 설정
        if (enemy.sprites.idle && enemy.sprites.idle.image.complete && enemy.sprites.idle.frameWidth > 0) {
            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
            const groundY = getFloorTopY();
            const hitboxHeight = 150;
            const imageYOffset = enemy.characterImageYOffset || 20;
            const scaledHeight = enemy.sprites.idle.image.height * enemy.scale;
            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
        }
        // 상태 리셋
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        if (isPracticeMode && enemy.isDummy) {
            enemy.health = practiceDummyHealth;
        } else {
            enemy.health = 200;
        }
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
    
    // 연습 모드 UI 표시/숨김 (게임 화면이 표시된 후 실행)
    setTimeout(() => {
        const practiceSettings = document.getElementById('practiceSettings');
        const controlsGuide = document.getElementById('controlsGuide');
        const timerElement = document.getElementById('timer');
        const playerDamageInput = document.getElementById('playerDamageInput');
        
        if (practiceMode) {
            if (practiceSettings) {
                practiceSettings.style.display = 'block';
            }
            if (controlsGuide) {
                controlsGuide.style.display = 'block';
            }
            if (timerElement) {
                timerElement.innerHTML = '<span class="timer-infinite">∞</span>';
                timerElement.classList.add('timer-infinite');
            }
            // 선택된 캐릭터의 공격력으로 초기화
            if (playerDamageInput && player) {
                let baseDamage = 20; // 기본값 (로난)
                if (player.characterNum === 2) {
                    baseDamage = 10; // 쇼군
                } else if (player.characterNum === 3) {
                    baseDamage = 30; // 챈
                } else if (player.characterNum === 1) {
                    baseDamage = 20; // 로난
                }
                practicePlayerDamage = baseDamage;
                playerDamageInput.value = baseDamage;
            }
        } else {
            if (practiceSettings) {
                practiceSettings.style.display = 'none';
            }
            if (controlsGuide) {
                controlsGuide.style.display = 'none';
            }
            if (timerElement) {
                timerElement.classList.remove('timer-infinite');
            }
        }
    }, 100);
    
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


// 언어 변경 함수
function changeLanguage(lang) {
    currentLanguage = lang;
    window.currentLanguage = lang; // 전역으로 설정
    window.translations = translations; // 전역으로 설정
    updateUI();
    
    // 언어 버튼 활성화 상태 업데이트
    const langKo = document.getElementById('langKo');
    const langEn = document.getElementById('langEn');
    if (langKo && langEn) {
        if (lang === 'ko') {
            langKo.classList.add('active');
            langEn.classList.remove('active');
        } else {
            langKo.classList.remove('active');
            langEn.classList.add('active');
        }
    }
    
    // 언어 설정을 localStorage에 저장
    if (typeof Storage !== 'undefined') {
        localStorage.setItem('gameLanguage', lang);
    }
}

// UI 텍스트 업데이트 함수
function updateUI() {
    const t = translations[currentLanguage];
    
    // 시작 화면
    if (startButton) startButton.textContent = t.startGame;
    
    // 모드 선택 화면
    const modeTitle = document.querySelector('#lobbyModeSection .lobby-title');
    if (modeTitle) modeTitle.textContent = t.selectGameMode;
    
    const pvpModeName = document.querySelector('#pvpModeCard .mode-name');
    if (pvpModeName) pvpModeName.textContent = t.mode1v1;
    const pvpModeDesc = document.querySelector('#pvpModeCard .mode-description');
    if (pvpModeDesc) pvpModeDesc.textContent = t.mode1v1Desc;
    const pvpModeButton = document.getElementById('pvpModeButton');
    if (pvpModeButton) pvpModeButton.textContent = t.start;
    
    const aiModeName = document.querySelector('#aiModeCard .mode-name');
    if (aiModeName) aiModeName.textContent = t.modeAI;
    const aiModeDesc = document.querySelector('#aiModeCard .mode-description');
    if (aiModeDesc) aiModeDesc.textContent = t.modeAIDesc;
    const aiModeButton = document.getElementById('aiModeButton');
    if (aiModeButton) aiModeButton.textContent = t.start;
    
    const bossModeName = document.querySelector('#bossModeCard .mode-name');
    if (bossModeName) bossModeName.textContent = t.modeBoss;
    const bossModeDesc = document.querySelector('#bossModeCard .mode-description');
    if (bossModeDesc) bossModeDesc.textContent = t.modeBossDesc;
    const bossModeButton = document.getElementById('bossModeButton');
    if (bossModeButton) bossModeButton.textContent = t.start;
    
    const practiceModeName = document.querySelector('#practiceModeCard .mode-name');
    if (practiceModeName) practiceModeName.textContent = t.modePractice;
    const practiceModeDesc = document.querySelector('#practiceModeCard .mode-description');
    if (practiceModeDesc) practiceModeDesc.textContent = t.modePracticeDesc;
    const practiceModeButton = document.getElementById('practiceModeButton');
    if (practiceModeButton) practiceModeButton.textContent = t.start;
    
    // 연습 모드 세부 설정
    const practiceSettingsTitle = document.querySelector('#practiceSettings .practice-settings-title');
    if (practiceSettingsTitle) practiceSettingsTitle.textContent = t.practiceSettings;
    
    const practiceSettingLabels = document.querySelectorAll('#practiceSettings .practice-setting-item label');
    if (practiceSettingLabels.length >= 3) {
        // 첫 번째 라벨: Dummy Health
        if (practiceSettingLabels[0]) practiceSettingLabels[0].textContent = t.dummyHealth + ':';
        // 두 번째 라벨: Player Damage
        if (practiceSettingLabels[1]) practiceSettingLabels[1].textContent = t.playerDamage + ':';
        // 세 번째 라벨: Dummy Movement
        if (practiceSettingLabels[2]) practiceSettingLabels[2].textContent = t.dummyMovement + ':';
    }
    
    // 더미 위치 초기화 버튼
    const resetDummyPositionButton = document.getElementById('resetDummyPositionButton');
    if (resetDummyPositionButton) resetDummyPositionButton.textContent = t.resetDummyPosition;
    
    // 조작키 설명
    const controlsGuideTitle = document.querySelector('#controlsGuide .controls-guide-title');
    if (controlsGuideTitle) controlsGuideTitle.textContent = t.controls;
    
    // 캐릭터 선택 화면
    const charTitle = document.querySelector('#characterSelectionSection .lobby-title');
    if (charTitle) charTitle.textContent = t.selectCharacters;
    
    const player1Header = document.querySelector('#player1InfoPanel .info-panel-header');
    if (player1Header) player1Header.textContent = t.player1;
    
    const player2Header = document.querySelector('#player2InfoPanel .info-panel-header');
    if (player2Header) {
        if (currentGameMode === 'ai') {
            player2Header.textContent = t.cpu;
        } else if (currentGameMode === 'boss') {
            player2Header.textContent = t.boss;
        } else if (currentGameMode === 'practice') {
            player2Header.textContent = '더미';
        } else {
            player2Header.textContent = t.player2;
        }
    }
    
    const player1ConfirmBtn = document.getElementById('player1ConfirmButton');
    if (player1ConfirmBtn) player1ConfirmBtn.textContent = t.confirm;
    
    const player2ConfirmBtn = document.getElementById('player2ConfirmButton');
    if (player2ConfirmBtn) player2ConfirmBtn.textContent = t.confirm;
    
    if (duelButton) duelButton.textContent = t.duel;
    
    // 게임 화면 텍스트
    const player1Name = document.querySelector('.player-health-wrapper .player-name');
    if (player1Name) player1Name.textContent = t.player1;
    
    const player2Name = document.querySelector('.enemy-health-wrapper .player-name');
    if (player2Name) {
        if (isAIMode) {
            player2Name.textContent = t.cpu;
        } else if (isBossMode) {
            player2Name.textContent = t.boss;
        } else {
            player2Name.textContent = t.player2;
        }
    }
    
    // 일시정지 메뉴
    const resumeBtn = document.getElementById('resumeButton');
    if (resumeBtn) resumeBtn.textContent = t.resume;
    
    const restartFromPauseBtn = document.getElementById('restartFromPauseButton');
    if (restartFromPauseBtn) restartFromPauseBtn.textContent = t.retry;
    
    const backToLobbyBtn = document.getElementById('backToLobbyButton');
    if (backToLobbyBtn) backToLobbyBtn.textContent = t.backToLobby;
    
    // 선택 상태 텍스트 업데이트
    updateSelectionStatus();
}

// 언어 버튼 이벤트 설정
const langKo = document.getElementById('langKo');
const langEn = document.getElementById('langEn');
if (langKo) {
    langKo.addEventListener('click', () => changeLanguage('ko'));
}
if (langEn) {
    langEn.addEventListener('click', () => changeLanguage('en'));
}

// 전역 translations 설정 (utils.js에서 사용)
window.translations = translations;

// 저장된 언어 설정 불러오기
if (typeof Storage !== 'undefined') {
    const savedLang = localStorage.getItem('gameLanguage');
    if (savedLang === 'ko' || savedLang === 'en') {
        changeLanguage(savedLang);
    } else {
        // 초기 UI 업데이트
        updateUI();
    }
} else {
    // 초기 UI 업데이트
    updateUI();
}

// 스타트 버튼 클릭 -> 모드 선택 화면 표시 및 BGM 재생
startButton.addEventListener('click', () => {
    // BGM 재생
    playLobbyTheme();
    // 모드 선택 화면 표시
    lobbyStartSection.style.display = 'none';
    lobbyModeSection.style.display = 'flex';
});

// 조작 방법 버튼 및 팝업
const controlsButton = document.getElementById('controlsButton');
const controlsPopup = document.getElementById('controlsPopup');
const closeControlsButton = document.getElementById('closeControlsButton');

if (controlsButton) {
    controlsButton.addEventListener('click', () => {
        if (controlsPopup) {
            controlsPopup.classList.add('active');
        }
    });
}

if (closeControlsButton) {
    closeControlsButton.addEventListener('click', () => {
        if (controlsPopup) {
            controlsPopup.classList.remove('active');
        }
    });
}

// 팝업 외부 클릭 시 닫기
if (controlsPopup) {
    controlsPopup.addEventListener('click', (e) => {
        if (e.target === controlsPopup) {
            controlsPopup.classList.remove('active');
        }
    });
}

// 돌아가기 버튼 이벤트
const backToStartButton = document.getElementById('backToStartButton');
const backToModeButton = document.getElementById('backToModeButton');

// 게임 모드 선택 화면에서 시작 화면으로 돌아가기
if (backToStartButton) {
    backToStartButton.addEventListener('click', () => {
        lobbyModeSection.style.display = 'none';
        lobbyStartSection.style.display = 'flex';
        // 메인 로비 테마 재생
        if (sounds.mainLobbyTheme) {
            sounds.mainLobbyTheme.currentTime = 0;
            sounds.mainLobbyTheme.play().catch(err => console.log('메인 로비 테마 재생 실패:', err));
        }
    });
}

// 캐릭터 선택 화면에서 게임 모드 선택 화면으로 돌아가기
if (backToModeButton) {
    backToModeButton.addEventListener('click', () => {
        characterSelectionSection.style.display = 'none';
        lobbyModeSection.style.display = 'flex';
        // 캐릭터 선택 상태 초기화
        selectedPlayer1Character = null;
        selectedPlayer2Character = null;
        player1Confirmed = false;
        player2Confirmed = false;
        // 모든 캐릭터 카드에서 선택 클래스 제거
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected-player1', 'selected-player2');
        });
        // 정보 패널 초기화
        updateCharacterInfoPanel(1, null);
        updateCharacterInfoPanel(2, null);
    });
}

// 캐릭터 정보 데이터
const characterInfo = {
    1: {
        name: 'Ronan',
        description: '준수한 스탯을 지닌 캐릭터',
        stats: [
            { label: '체력', value: '200' },
            { label: '공격력', value: '20' },
            { label: '속도', value: '보통' },
            { label: '사거리', value: '보통' }
        ]
    },
    2: {
        name: 'Shogun',
        description: '공격력이 낮은 대신, 공격 속도가 빠르고, 대쉬 쿨타임이 짧음',
        stats: [
            { label: '체력', value: '200' },
            { label: '공격력', value: '10', isLow: true },
            { label: '속도', value: '빠름', isHigh: true },
            { label: '사거리', value: '보통' }
        ]
    },
    3: {
        name: 'Chan',
        description: '공격 사거리가 짧은 대신 공격력이 높음',
        stats: [
            { label: '체력', value: '200' },
            { label: '공격력', value: '30', isHigh: true },
            { label: '속도', value: '보통' },
            { label: '사거리', value: '짧음', isLow: true }
        ]
    }
};

// 캐릭터 정보 패널 업데이트 함수
function updateCharacterInfoPanel(playerNum, characterNum) {
    const infoPanel = document.getElementById(`player${playerNum}InfoPanel`);
    const infoName = document.getElementById(`player${playerNum}InfoName`);
    const infoDescription = document.getElementById(`player${playerNum}InfoDescription`);
    const infoStats = document.getElementById(`player${playerNum}InfoStats`);
    
    if (!infoPanel || !infoName || !infoDescription || !infoStats) return;
    
    if (characterNum && characterInfo[characterNum]) {
        const info = characterInfo[characterNum];
        infoName.textContent = info.name;
        infoDescription.textContent = info.description;
        
        // 능력치 업데이트
        infoStats.innerHTML = '';
        info.stats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statLabel = document.createElement('span');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label;
            
            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            if (stat.isHigh) statValue.classList.add('stat-high');
            if (stat.isLow) statValue.classList.add('stat-low');
            statValue.textContent = stat.value;
            
            statItem.appendChild(statLabel);
            statItem.appendChild(statValue);
            infoStats.appendChild(statItem);
        });
        
        infoPanel.style.display = 'flex';
        infoPanel.style.opacity = '1';
    } else {
        // 빈 패널 유지 (투명도만 조정)
        infoName.textContent = '';
        infoDescription.textContent = '';
        infoStats.innerHTML = '';
        infoPanel.style.display = 'flex';
        infoPanel.style.opacity = '0.3';
    }
}

// 캐릭터 선택 화면 초기화
function initCharacterSelection(mode) {
    currentGameMode = mode;
    selectedPlayer1Character = null;
    selectedPlayer2Character = null;
    player1Confirmed = false;
    player2Confirmed = false;
    
    // 정보 패널 초기화 (빈 패널로 표시)
    updateCharacterInfoPanel(1, null);
    updateCharacterInfoPanel(2, null);
    
    // 상태 표시 업데이트
    updateSelectionStatus();
    
    // 모든 캐릭터 카드에서 선택 클래스 제거
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected-player1', 'selected-player2');
    });
    
    // Duel 버튼 비활성화
    if (duelButton) {
        duelButton.disabled = true;
    }
    
    // 캐릭터 선택 이벤트 설정
    setupCharacterSelection();
}

// 선택 상태 표시 업데이트
function updateSelectionStatus() {
    const t = translations[currentLanguage];
    const player1ConfirmButton = document.getElementById('player1ConfirmButton');
    const player2ConfirmButton = document.getElementById('player2ConfirmButton');
    const player1InfoPanel = document.getElementById('player1InfoPanel');
    const player2InfoPanel = document.getElementById('player2InfoPanel');
    const player2Header = player2InfoPanel ? player2InfoPanel.querySelector('.info-panel-header') : null;
    
    // AI 모드에서 플레이어2 헤더를 "CPU"로 변경
    if (player2Header) {
        if (currentGameMode === 'ai') {
            player2Header.textContent = t.cpu;
        } else if (currentGameMode === 'boss') {
            player2Header.textContent = t.boss;
        } else if (currentGameMode === 'practice') {
            player2Header.textContent = '더미';
        } else {
            player2Header.textContent = t.player2;
        }
    }
    
    // 플레이어1 확정 버튼 상태 업데이트
    if (player1ConfirmButton) {
        if (player1Confirmed) {
            player1ConfirmButton.disabled = true;
        } else if (selectedPlayer1Character) {
            player1ConfirmButton.disabled = false;
        } else {
            player1ConfirmButton.disabled = true;
        }
    }
    
    // 플레이어2 확정 버튼 상태 업데이트
    if (player2ConfirmButton) {
        if (currentGameMode === 'boss' || currentGameMode === 'practice') {
            // 보스 모드와 연습 모드에서는 플레이어2는 고정
            player2ConfirmButton.style.display = 'none';
            player2Confirmed = true;
        } else {
            // AI 모드와 1대1 모드에서는 플레이어2 확정 버튼 표시
            player2ConfirmButton.style.display = 'block';
            
            if (player2Confirmed) {
                player2ConfirmButton.disabled = true;
            } else if (player1Confirmed && selectedPlayer2Character) {
                player2ConfirmButton.disabled = false;
            } else {
                player2ConfirmButton.disabled = true;
            }
        }
    }
    
    // Duel 버튼 활성화/비활성화
    if (duelButton) {
        if (currentGameMode === 'boss' || currentGameMode === 'practice') {
            // 보스 모드와 연습 모드에서는 플레이어1만 확정하면 됨
            duelButton.disabled = !player1Confirmed;
        } else {
            // 1대1/AI 모드에서는 플레이어1과 플레이어2 모두 확정해야 함
            duelButton.disabled = !player1Confirmed || !player2Confirmed;
        }
    }
}

// 캐릭터 선택 이벤트 설정 함수
function setupCharacterSelection() {
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
        // 기존 이벤트 리스너 제거를 위해 클론 후 교체
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        newCard.addEventListener('click', () => {
            // 보스 모드와 연습 모드에서는 플레이어1만 선택 가능
            if (currentGameMode === 'boss' || currentGameMode === 'practice') {
                if (!player1Confirmed) {
                    const characterNum = parseInt(newCard.getAttribute('data-character'));
                    const isPlayer1Selected = newCard.classList.contains('selected-player1');
                    
                    if (isPlayer1Selected) {
                        // 이미 선택된 캐릭터를 다시 클릭하면 취소
                        newCard.classList.remove('selected-player1');
                        selectedPlayer1Character = null;
                        updateCharacterInfoPanel(1, null);
                    } else {
                        // 다른 플레이어1 선택 제거
                        document.querySelectorAll('.character-card').forEach(c => {
                            c.classList.remove('selected-player1');
                        });
                        // 새 캐릭터 선택
                        newCard.classList.add('selected-player1');
                        selectedPlayer1Character = characterNum;
                        updateCharacterInfoPanel(1, characterNum);
                    }
                }
            }
            // 일반 모드: 플레이어1이 확정하지 않았으면 플레이어1만 선택 가능
            else if (!player1Confirmed) {
                const characterNum = parseInt(newCard.getAttribute('data-character'));
                const isPlayer1Selected = newCard.classList.contains('selected-player1');
                
                if (isPlayer1Selected) {
                    // 이미 선택된 캐릭터를 다시 클릭하면 취소
                    newCard.classList.remove('selected-player1');
                    selectedPlayer1Character = null;
                    updateCharacterInfoPanel(1, null);
                } else {
                    // 다른 플레이어1 선택 제거
                    document.querySelectorAll('.character-card').forEach(c => {
                        c.classList.remove('selected-player1');
                    });
                    // 새 캐릭터 선택
                    newCard.classList.add('selected-player1');
                    selectedPlayer1Character = characterNum;
                    updateCharacterInfoPanel(1, characterNum);
                }
            } 
            // 플레이어1이 확정했고 플레이어2가 확정하지 않았으면 플레이어2만 선택 가능 (AI 모드 포함)
            else if (player1Confirmed && !player2Confirmed && currentGameMode !== 'boss' && currentGameMode !== 'practice') {
                const characterNum = parseInt(newCard.getAttribute('data-character'));
                const isPlayer2Selected = newCard.classList.contains('selected-player2');
                
                if (isPlayer2Selected) {
                    // 이미 선택된 캐릭터를 다시 클릭하면 취소
                    newCard.classList.remove('selected-player2');
                    selectedPlayer2Character = null;
                    updateCharacterInfoPanel(2, null);
                } else {
                    // 다른 플레이어2 선택 제거
                    document.querySelectorAll('.character-card').forEach(c => {
                        c.classList.remove('selected-player2');
                    });
                    // 새 캐릭터 선택
                    newCard.classList.add('selected-player2');
                    selectedPlayer2Character = characterNum;
                    updateCharacterInfoPanel(2, characterNum);
                }
            }
            
            updateSelectionStatus();
        });
    });
    
    // 플레이어1 확정 버튼 이벤트
    const player1ConfirmButton = document.getElementById('player1ConfirmButton');
    if (player1ConfirmButton) {
        const newButton = player1ConfirmButton.cloneNode(true);
        player1ConfirmButton.parentNode.replaceChild(newButton, player1ConfirmButton);
        
        newButton.addEventListener('click', () => {
            if (selectedPlayer1Character && !player1Confirmed) {
                player1Confirmed = true;
                // 확정 시 정보 패널 고정 (이미 표시되어 있음)
                updateCharacterInfoPanel(1, selectedPlayer1Character);
                updateSelectionStatus();
            }
        });
    }
    
    // 플레이어2 확정 버튼 이벤트
    const player2ConfirmButton = document.getElementById('player2ConfirmButton');
    if (player2ConfirmButton) {
        const newButton = player2ConfirmButton.cloneNode(true);
        player2ConfirmButton.parentNode.replaceChild(newButton, player2ConfirmButton);
        
        newButton.addEventListener('click', () => {
            if (selectedPlayer2Character && !player2Confirmed && player1Confirmed) {
                player2Confirmed = true;
                // 확정 시 정보 패널 고정 (이미 표시되어 있음)
                updateCharacterInfoPanel(2, selectedPlayer2Character);
                updateSelectionStatus();
            }
        });
        
        // AI 모드와 1대1 모드에서 플레이어2 확정 버튼 표시 (보스 모드 제외)
        if (currentGameMode !== 'boss') {
            newButton.style.display = 'block';
        }
    }
}

// 1 vs 1 모드 버튼 클릭 이벤트
pvpModeButton.addEventListener('click', () => {
    if (lobbyModeSection) lobbyModeSection.style.display = 'none';
    if (characterSelectionSection) {
        characterSelectionSection.style.display = 'flex';
        initCharacterSelection('pvp');
    }
});

// vs AI 모드 버튼 클릭 이벤트
aiModeButton.addEventListener('click', () => {
    if (lobbyModeSection) lobbyModeSection.style.display = 'none';
    if (characterSelectionSection) {
        characterSelectionSection.style.display = 'flex';
        initCharacterSelection('ai');
    }
});

// Boss 모드 버튼 클릭 이벤트
if (bossModeButton) {
    bossModeButton.addEventListener('click', () => {
        if (lobbyModeSection) lobbyModeSection.style.display = 'none';
        if (characterSelectionSection) {
            characterSelectionSection.style.display = 'flex';
            initCharacterSelection('boss');
        }
    });
}

// 연습 모드 버튼 클릭 이벤트
if (practiceModeButton) {
    practiceModeButton.addEventListener('click', () => {
        if (lobbyModeSection) lobbyModeSection.style.display = 'none';
        if (characterSelectionSection) {
            characterSelectionSection.style.display = 'flex';
            initCharacterSelection('practice');
        }
    });
}

// Duel 버튼 클릭 이벤트
if (duelButton) {
    duelButton.addEventListener('click', () => {
        if (currentGameMode === 'pvp') {
            startGame(false, false, false);
        } else if (currentGameMode === 'ai') {
            startGame(true, false, false);
        } else if (currentGameMode === 'boss') {
            startGame(true, true, false);
        } else if (currentGameMode === 'practice') {
            startGame(false, false, true);
        }
    });
}

// ==================== 연습 모드 세부 설정 이벤트 ====================
const dummyHealthInput = document.getElementById('dummyHealthInput');
const playerDamageInput = document.getElementById('playerDamageInput');
const dummyMovementToggle = document.getElementById('dummyMovementToggle');

if (dummyHealthInput) {
    dummyHealthInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        // 범위 제한
        if (value < 50) value = 50;
        if (value > 500) value = 500;
        if (isNaN(value)) value = practiceDummyHealth;
        
        practiceDummyHealth = value;
        e.target.value = value;
        
        if (enemy && enemy.isDummy) {
            enemy.health = value;
            const enemyHealthBar = document.getElementById('enemyHealth');
            if (enemyHealthBar) {
                const percentage = (enemy.health / practiceDummyHealth) * 100;
                enemyHealthBar.style.width = percentage + '%';
            }
        }
    });
    
    dummyHealthInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 50) value = 50;
        if (value > 500) value = 500;
        e.target.value = value;
        practiceDummyHealth = value;
    });
}

if (playerDamageInput) {
    playerDamageInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        // 범위 제한 및 10단위로 조정
        if (value < 10) value = 10;
        if (value > 100) value = 100;
        if (isNaN(value)) value = practicePlayerDamage;
        // 10단위로 반올림
        value = Math.round(value / 10) * 10;
        
        practicePlayerDamage = value;
        e.target.value = value;
    });
    
    playerDamageInput.addEventListener('blur', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 10) value = 10;
        if (value > 100) value = 100;
        // 10단위로 반올림
        value = Math.round(value / 10) * 10;
        e.target.value = value;
        practicePlayerDamage = value;
    });
}

if (dummyMovementToggle) {
    dummyMovementToggle.addEventListener('change', (e) => {
        practiceDummyMovementEnabled = e.target.checked;
    });
}

// 더미 위치 초기화 버튼
const resetDummyPositionButton = document.getElementById('resetDummyPositionButton');
if (resetDummyPositionButton) {
    resetDummyPositionButton.addEventListener('click', () => {
        if (enemy && enemy.isDummy && typeof canvas !== 'undefined') {
            // 더미를 원래 위치로 초기화
            if (!centerPlaceHorizontallyByIdle(enemy, START_GAP)) {
                enemy.position.x = canvas.width / 2 + START_GAP;
            }
            // 속도 초기화
            enemy.velocity.x = 0;
            enemy.velocity.y = 0;
            // 상태 초기화
            enemy.isDashing = false;
            enemy.isAttacking = false;
            enemy.isStunned = false;
            // idle 상태로 전환
            if (enemy.currentState !== 'idle') {
                enemy.switchSprite('idle');
            }
        }
    });
}

// ==================== 더미 AI 함수 ====================
function updateDummyAI() {
    if (!enemy || !enemy.isDummy || !player) return;
    
    const distance = Math.abs(player.position.x - enemy.position.x);
    const playerCenterX = player.position.x + player.width / 2;
    const enemyCenterX = enemy.position.x + enemy.width / 2;
    
    // 플레이어가 공격 중이면 회피
    if (player.isAttacking && distance < 200) {
        // 점프 또는 대시로 회피
        if (enemy.isOnGround && enemy.canJump && Math.random() < 0.5) {
            // 점프로 회피
            enemy.velocity.y = -20;
            enemy.canJump = false;
            enemy.isOnGround = false;
            if (window.sounds && window.sounds.jump) {
                window.sounds.jump.currentTime = 0;
                window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
            }
        } else if (enemy.dashCooldown <= 0 && enemy.isOnGround) {
            // 대시로 회피
            if (playerCenterX < enemyCenterX) {
                enemy.flip = false; // 오른쪽으로 대시
            } else {
                enemy.flip = true; // 왼쪽으로 대시
            }
            enemy.dash();
        }
        return;
    }
    
    // 기본 이동 메커니즘 - 플레이어로부터 멀어지려는 메커니즘
    if (enemy.isOnGround && !enemy.isDashing) {
        // 더미 전용 경계 값 사용
        const leftBoundary = practiceDummyLeftBoundary;
        const rightBoundary = practiceDummyRightBoundary;
        
        // 현재 스프라이트의 실제 크기 계산
        const sprite = enemy.sprites[enemy.currentState];
        let frameWidth = 0;
        if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
            frameWidth = sprite.frameWidth > 0 ? sprite.frameWidth : Math.floor(sprite.image.width / (sprite.framesMax || 1));
        } else {
            frameWidth = enemy.width;
        }
        const scaledWidth = frameWidth * enemy.scale;
        
        // 기본적으로 플레이어로부터 멀어지려고 이동
        if (distance < 400) {
            // 플레이어가 가까이 있으면 멀어지려고 이동
            if (playerCenterX < enemyCenterX) {
                // 플레이어가 왼쪽에 있으면 오른쪽으로 이동 (멀어짐)
                enemy.flip = false;
                // 오른쪽 경계 체크
                if (enemy.position.x + scaledWidth < rightBoundary) {
                    enemy.velocity.x = 3;
                } else {
                    // 경계에 도달했으면 정지
                    enemy.velocity.x = 0;
                }
            } else {
                // 플레이어가 오른쪽에 있으면 왼쪽으로 이동 (멀어짐)
                enemy.flip = true;
                // 왼쪽 경계 체크
                if (enemy.position.x > leftBoundary) {
                    enemy.velocity.x = -3;
                } else {
                    // 경계에 도달했으면 정지
                    enemy.velocity.x = 0;
                }
            }
        } else {
            // 플레이어가 충분히 멀리 있으면 정지
            enemy.velocity.x = 0;
        }
    }
}

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
window.FLOOR_OFFSET = -30;

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
    // frameWidth가 설정되어 있으면 그것을 사용, 없으면 계산
    const frameWidth = idle.frameWidth > 0 
        ? idle.frameWidth * fighter.scale 
        : (idle.image.width / (idle.framesMax || 1)) * fighter.scale
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
    if (enemy.isDashing) {
        return;
    }
    
    // 경직 중이면 AI 동작 중지 (하지만 velocity는 유지)
    // 경직이 해제되면 다음 프레임에 AI 로직이 실행되어 움직임
    if (enemy.isStunned) {
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
    
    // Boss 모드일 때 속도 증가 및 더 똑똑한 로직을 위한 변수
    const baseSpeed = isBossMode ? 7 : 5; // Boss는 기본 속도 7 (일반 AI는 5)
    const fastSpeed = isBossMode ? 9 : 5; // Boss는 빠른 속도 9
    const attackRange = isBossMode ? 220 : 200; // Boss는 공격 범위가 더 넓음
    const optimalAttackDistance = isBossMode ? 90 : 100; // Boss는 더 가까이서 공격
    const attackCooldownFrames = isBossMode ? 20 : 30; // Boss는 공격 쿨타임이 더 짧음 (20프레임)
    
    // 플레이어와 적의 공중 상태 확인
    const playerInAir = player.currentState === 'jump' || player.currentState === 'fall';
    const enemyInAir = enemy.currentState === 'jump' || enemy.currentState === 'fall';
    
    // ==================== Boss 모드 전용: 패턴 학습 및 분석 ====================
    if (isBossMode) {
        // 1. 플레이어 패턴 학습 및 분석
        aiState.frameCount++;
        
        // 플레이어의 현재 상태를 패턴에 추가 (최근 50프레임만 유지)
        const currentPlayerState = {
            state: player.currentState,
            isAttacking: player.isAttacking,
            isDashing: player.isDashing,
            isStunned: player.isStunned,
            position: player.position.x,
            distance: distance,
            frame: aiState.frameCount
        };
        
        aiState.playerPattern.push(currentPlayerState);
        if (aiState.playerPattern.length > 50) {
            aiState.playerPattern.shift();
        }
        
        // 플레이어 약점 분석 업데이트
        if (aiState.playerPattern.length >= 3) {
            const recent = aiState.playerPattern.slice(-3);
            // 공격 후 점프 패턴 감지
            if (recent[0].isAttacking && (recent[1].state === 'jump' || recent[2].state === 'jump')) {
                aiState.playerWeakness.jumpAfterAttack = Math.min(1, aiState.playerWeakness.jumpAfterAttack + 0.1);
            }
            // 공격 후 대시 패턴 감지
            if (recent[0].isAttacking && (recent[1].isDashing || recent[2].isDashing)) {
                aiState.playerWeakness.dashAfterAttack = Math.min(1, aiState.playerWeakness.dashAfterAttack + 0.1);
            }
            // 점프 후 공격 패턴 감지
            if ((recent[0].state === 'jump' || recent[0].state === 'fall') && recent[1].isAttacking) {
                aiState.playerWeakness.attackAfterJump = Math.min(1, aiState.playerWeakness.attackAfterJump + 0.1);
            }
        }
        
        // 2. 플레이어 행동 예측
        if (aiState.playerPattern.length >= 5) {
            const recent = aiState.playerPattern.slice(-5);
            // 패턴 분석: 플레이어가 공격 후 점프를 자주 하는지 확인
            if (aiState.playerWeakness.jumpAfterAttack > 0.3 && recent[0].isAttacking) {
                aiState.predictedPlayerAction = 'jump';
            }
            // 패턴 분석: 플레이어가 공격 후 대시를 자주 하는지 확인
            else if (aiState.playerWeakness.dashAfterAttack > 0.3 && recent[0].isAttacking) {
                aiState.predictedPlayerAction = 'dash';
            }
            // 패턴 분석: 플레이어가 점프 후 공격을 자주 하는지 확인
            else if (aiState.playerWeakness.attackAfterJump > 0.3 && (recent[0].state === 'jump' || recent[0].state === 'fall')) {
                aiState.predictedPlayerAction = 'attack';
            }
            else {
                aiState.predictedPlayerAction = null;
            }
        }
        
        // 3. 적응형 전략 결정 (3초마다 재평가)
        if (aiState.frameCount % 180 === 0) {
            const recentHits = aiState.playerPattern.filter(p => p.isStunned).length;
            const playerAggression = aiState.playerPattern.filter(p => p.isAttacking).length / Math.max(1, aiState.playerPattern.length);
            
            if (recentHits > 3 || playerAggression > 0.4) {
                // 플레이어가 공격적이면 방어적으로 전환
                aiState.adaptiveStrategy = 'defensive';
            } else if (playerAggression < 0.2) {
                // 플레이어가 방어적이면 공격적으로 전환
                aiState.adaptiveStrategy = 'aggressive';
            } else {
                aiState.adaptiveStrategy = 'neutral';
            }
        }
        
        // 4. 콤보 시스템 (연속 공격)
        if (aiState.comboCount > 0 && aiState.frameCount - aiState.lastComboTime > 60) {
            // 1초 이상 콤보가 끊기면 리셋
            aiState.comboCount = 0;
        }
    }
    
    // ==================== 공중 전투 로직 ====================
    if (playerInAir) {
        // 플레이어가 공중에 있을 때
        
        // 1. 공중에서 플레이어 공격 회피
        if (player.isAttacking && player.currentState === 'attack' && distance < 150 && enemyInAir) {
            // 공중에서 플레이어의 반대 방향으로 이동
            if (playerCenterX < enemyCenterX) {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed; // 오른쪽으로 회피
            } else {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed; // 왼쪽으로 회피
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
                enemy.velocity.x = -baseSpeed;
            } else {
                enemy.velocity.x = baseSpeed;
            }
            return;
        }
        
        // 3. 공중에서 플레이어에게 접근 및 공격
        if (enemyInAir) {
            // 플레이어 방향으로 이동
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed;
            } else {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed;
            }
            
            // 공중에서 공격 가능 거리면 공격 시도
            const airAttackDistance = isBossMode ? 200 : 180; // Boss는 공중 공격 범위가 더 넓음
            if (distance < airAttackDistance && !enemy.isAttacking && enemy.currentState !== 'attack') {
                // Boss 모드일 때는 공격 확률이 더 높음 (80% vs 60%)
                const airAttackChance = isBossMode ? 0.8 : 0.6;
                if (Math.random() < airAttackChance) {
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
    
    // ==================== Boss 모드 전용: 고급 전투 로직 ====================
    if (isBossMode) {
        // ==================== 적극적인 점프 회피 및 공격 메커니즘 ====================
        
        // 1. 플레이어 공격 박스와의 거리 계산 및 점프 회피
        if (player.isAttacking && player.currentState === 'attack' && enemy.isOnGround && enemy.canJump && !enemyInAir) {
            const attackBox = player.attackBox;
            const attackBoxRight = attackBox.position.x + attackBox.width;
            const attackBoxLeft = attackBox.position.x;
            const attackBoxTop = attackBox.position.y;
            const attackBoxBottom = attackBox.position.y + attackBox.height;
            
            // 적의 중심점 계산
            const enemySprite = enemy.sprites[enemy.currentState];
            const enemyWidth = enemySprite && enemySprite.image && enemySprite.image.complete ? 
                Math.floor(enemySprite.image.width / enemySprite.framesMax) * enemy.scale : 50;
            const enemyHeight = enemySprite && enemySprite.image ? 
                enemySprite.image.height * enemy.scale : 150;
            const enemyCenterX = enemy.position.x + enemyWidth / 2;
            const enemyCenterY = enemy.position.y + enemyHeight / 2;
            
            // 공격 박스와 적의 거리 계산
            const horizontalDistance = Math.min(
                Math.abs(enemyCenterX - attackBoxLeft),
                Math.abs(enemyCenterX - attackBoxRight)
            );
            const verticalDistance = Math.abs(enemyCenterY - attackBoxTop);
            
            // 공격 박스가 적에게 접근 중이고 위험 거리 내에 있으면 점프로 회피
            const dangerZone = 120; // 위험 거리
            if (horizontalDistance < dangerZone && verticalDistance < 100) {
                // 플레이어의 반대 방향으로 점프하여 회피
                if (playerCenterX < enemyCenterX) {
                    enemy.flip = false;
                    enemy.velocity.x = baseSpeed; // 오른쪽으로 점프
                } else {
                    enemy.flip = true;
                    enemy.velocity.x = -baseSpeed; // 왼쪽으로 점프
                }
                enemy.velocity.y = -20;
                enemy.canJump = false;
                enemy.isOnGround = false;
                if (window.sounds && window.sounds.jump) {
                    window.sounds.jump.currentTime = 0;
                    window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
                }
                // 공중에서 플레이어를 향해 공격 시도 (실제 enemy 상태를 체크)
                setTimeout(() => {
                    const currentEnemyInAir = enemy.currentState === 'jump' || enemy.currentState === 'fall';
                    const currentDistance = getDistance(player, enemy);
                    if (currentEnemyInAir && currentDistance < 200 && !enemy.isAttacking && enemy.currentState !== 'attack') {
                        const currentPlayerCenterX = player.position.x + (player.sprites[player.currentState]?.image ? 
                            Math.floor(player.sprites[player.currentState].image.width / player.sprites[player.currentState].framesMax) * player.scale / 2 : 0);
                        const currentEnemyCenterX = enemy.position.x + (enemy.sprites[enemy.currentState]?.image ? 
                            Math.floor(enemy.sprites[enemy.currentState].image.width / enemy.sprites[enemy.currentState].framesMax) * enemy.scale / 2 : 0);
                        if (currentPlayerCenterX < currentEnemyCenterX) {
                            enemy.flip = true;
                        } else {
                            enemy.flip = false;
                        }
                        enemy.attack();
                    }
                }, 150);
                return;
            }
        }
        
        // 2. 공격 박스 충돌 예측 및 선제 점프 회피
        if (player.isAttacking && player.currentState === 'attack' && enemy.isOnGround && enemy.canJump && !enemyInAir) {
            // 공격 박스가 곧 닿을 것으로 예측되는 경우
            const attackBox = player.attackBox;
            const attackBoxRight = attackBox.position.x + attackBox.width;
            const attackBoxLeft = attackBox.position.x;
            
            // 적의 위치
            const enemyLeft = enemy.position.x;
            const enemyRight = enemy.position.x + (enemy.sprites[enemy.currentState]?.image ? 
                Math.floor(enemy.sprites[enemy.currentState].image.width / enemy.sprites[enemy.currentState].framesMax) * enemy.scale : 50);
            
            // 공격 박스가 적의 범위와 겹치거나 곧 겹칠 것으로 예상되는 경우
            const willCollide = (attackBoxRight >= enemyLeft - 30 && attackBoxLeft <= enemyRight + 30);
            
            if (willCollide && distance < 150) {
                // 점프로 회피
                if (playerCenterX < enemyCenterX) {
                    enemy.flip = false;
                    enemy.velocity.x = baseSpeed;
                } else {
                    enemy.flip = true;
                    enemy.velocity.x = -baseSpeed;
                }
                enemy.velocity.y = -20;
                enemy.canJump = false;
                enemy.isOnGround = false;
                if (window.sounds && window.sounds.jump) {
                    window.sounds.jump.currentTime = 0;
                    window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
                }
                return;
            }
        }
        
        // 3. 적극적인 점프 공격 (플레이어가 지상에 있어도)
        if (!enemyInAir && enemy.isOnGround && enemy.canJump && !player.isAttacking && enemy.currentState !== 'attack') {
            // 플레이어가 가까이 있고 공격 가능 거리면 점프 공격 시도
            if (distance < 180 && distance > 80 && aiState.attackCooldown <= 0) {
                // 40% 확률로 점프 공격
                if (Math.random() < 0.4) {
                    // 플레이어 방향으로 점프
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = true;
                        enemy.velocity.x = -baseSpeed;
                    } else {
                        enemy.flip = false;
                        enemy.velocity.x = baseSpeed;
                    }
                    enemy.velocity.y = -20;
                    enemy.canJump = false;
                    enemy.isOnGround = false;
                    if (window.sounds && window.sounds.jump) {
                        window.sounds.jump.currentTime = 0;
                        window.sounds.jump.play().catch(err => console.log('점프 사운드 재생 실패:', err));
                    }
                    // 공중에서 공격 (실제 enemy 상태를 체크)
                    setTimeout(() => {
                        const currentEnemyInAir = enemy.currentState === 'jump' || enemy.currentState === 'fall';
                        const currentDistance = getDistance(player, enemy);
                        if (currentEnemyInAir && currentDistance < 200 && !enemy.isAttacking && enemy.currentState !== 'attack') {
                            enemy.attack();
                        }
                    }, 100);
                    return;
                }
            }
        }
        
        // 4. 공중에서 적극적인 공격 (플레이어가 지상에 있을 때)
        if (enemyInAir && !playerInAir && enemy.canJump === false && !enemy.isAttacking && enemy.currentState !== 'attack') {
            // 공중에서 플레이어가 가까이 있으면 공격 시도
            if (distance < 200) {
                // 60% 확률로 공중 공격 (한 번만 시도)
                if (Math.random() < 0.6 && !aiState.airAttackAttempted) {
                    aiState.airAttackAttempted = true; // 공중 공격 시도 플래그
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = true;
                    } else {
                        enemy.flip = false;
                    }
                    enemy.attack();
                    // 착지 후 플래그 리셋
                    setTimeout(() => {
                        if (enemy.isOnGround) {
                            aiState.airAttackAttempted = false;
                        }
                    }, 500);
                    return;
                }
            }
        } else if (enemy.isOnGround && aiState.airAttackAttempted) {
            // 착지하면 공중 공격 시도 플래그 리셋
            aiState.airAttackAttempted = false;
        }
        
        // 5. 예측 기반 카운터 공격
        if (aiState.predictedPlayerAction === 'jump' && player.currentState === 'attack' && !playerInAir && !enemyInAir) {
            // 플레이어가 점프할 것으로 예측되면 대공 준비
            if (distance < 250 && enemy.isOnGround && enemy.canJump) {
                // 플레이어 방향으로 점프하여 대공 공격
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
                // 공중에서 공격 준비 (실제 enemy 상태를 체크)
                setTimeout(() => {
                    const currentEnemyInAir = enemy.currentState === 'jump' || enemy.currentState === 'fall';
                    const currentDistance = getDistance(player, enemy);
                    if (currentEnemyInAir && currentDistance < 200 && enemy.currentState !== 'attack' && !enemy.isAttacking) {
                        enemy.attack();
                    }
                }, 100);
                return;
            }
        }
        
        // 2. 플레이어 공격 타이밍 예측 및 회피
        if (aiState.playerPattern.length >= 3) {
            const recent = aiState.playerPattern.slice(-3);
            // 플레이어가 공격 애니메이션을 시작하는 패턴 감지
            if (recent[0].state !== 'attack' && recent[1].state === 'attack' && recent[2].state === 'attack') {
                // 공격이 곧 나올 것으로 예측 - 선제 회피
                const dodgeDistance = 180; // 더 멀리서도 회피
                if (distance < dodgeDistance && enemy.dashCooldown <= 0 && enemy.isOnGround) {
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = false;
                        enemy.dash();
                        enemy.dashCooldown = 15;
                    } else {
                        enemy.flip = true;
                        enemy.dash();
                        enemy.dashCooldown = 15;
                    }
                    return;
                }
            }
        }
        
        // 3. 콤보 공격 시스템
        if (aiState.comboCount > 0 && distance < optimalAttackDistance && aiState.attackCooldown <= 0) {
            // 콤보 중이면 연속 공격 시도
            if (Math.random() < 0.7) { // 70% 확률로 콤보 계속
                enemy.velocity.x = 0;
                enemy.attack();
                aiState.attackCooldown = 15; // 콤보 중에는 쿨타임 더 짧음
                aiState.lastComboTime = aiState.frameCount;
                return;
            }
        }
        
        // 4. 프레임 트랩 (플레이어의 공격 후 빈틈 노리기)
        if (aiState.playerPattern.length >= 2) {
            const recent = aiState.playerPattern.slice(-2);
            // 플레이어가 공격을 끝내는 순간 감지
            if (recent[0].isAttacking && !recent[1].isAttacking && distance < attackRange) {
                // 플레이어의 공격 후 빈틈을 노려 즉시 공격
                if (aiState.attackCooldown <= 0 && enemy.isOnGround) {
                    if (playerCenterX < enemyCenterX) {
                        enemy.flip = true;
                    } else {
                        enemy.flip = false;
                    }
                    enemy.velocity.x = 0;
                    enemy.attack();
                    aiState.attackCooldown = attackCooldownFrames;
                    aiState.frameTrapCount++;
                    return;
                }
            }
        }
        
        // 5. 적응형 전략에 따른 행동
        if (aiState.adaptiveStrategy === 'defensive') {
            // 방어적 전략: 거리 유지 및 카운터 위주
            if (distance < 150 && player.isAttacking) {
                // 플레이어가 공격 중이면 후퇴
                if (playerCenterX < enemyCenterX) {
                    enemy.flip = false;
                    enemy.velocity.x = baseSpeed;
                } else {
                    enemy.flip = true;
                    enemy.velocity.x = -baseSpeed;
                }
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                    enemy.switchSprite('run');
                }
                return;
            }
        } else if (aiState.adaptiveStrategy === 'aggressive') {
            // 공격적 전략: 지속적인 압박
            if (distance > optimalAttackDistance && distance < attackRange) {
                // 최적 거리로 접근
                if (playerCenterX < enemyCenterX) {
                    enemy.flip = true;
                    enemy.velocity.x = -fastSpeed; // 더 빠르게 접근
                } else {
                    enemy.flip = false;
                    enemy.velocity.x = fastSpeed;
                }
                if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                    enemy.switchSprite('run');
                }
            }
        }
        
        // 6. 플레이어의 약점 노리기
        if (aiState.playerWeakness.jumpAfterAttack > 0.3 && player.currentState === 'attack') {
            // 플레이어가 공격 후 점프할 가능성이 높으면 대공 준비
            if (distance < 200 && enemy.isOnGround && enemy.canJump) {
                // 약간의 딜레이 후 점프하여 대공
                setTimeout(() => {
                    if (playerInAir && distance < 250) {
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
                    }
                }, 200);
            }
        }
    }
    
    // 1. 긴급 상황: 플레이어 공격 회피 (매우 가까이 있을 때만)
    // Boss 모드일 때는 더 빠르게 반응하고 더 멀리서도 회피
    const dodgeDistance = isBossMode ? 150 : 120;
    if (player.isAttacking && player.currentState === 'attack' && distance < dodgeDistance && enemy.dashCooldown <= 0 && enemy.isOnGround) {
        // 플레이어의 반대 방향으로 대시
        if (playerCenterX < enemyCenterX) {
            enemy.flip = false;
            enemy.dash();
            // Boss 모드일 때 대시 후 쿨타임을 짧게 설정
            if (isBossMode) {
                enemy.dashCooldown = 15;
            }
        } else {
            enemy.flip = true;
            enemy.dash();
            // Boss 모드일 때 대시 후 쿨타임을 짧게 설정
            if (isBossMode) {
                enemy.dashCooldown = 15;
            }
        }
        return;
    }
    
    // 공격 쿨다운 감소
    if (aiState.attackCooldown > 0) {
        aiState.attackCooldown--;
    }
    
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
                        enemy.velocity.x = -baseSpeed;
                    } else {
                        enemy.velocity.x = baseSpeed;
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
            } else if (!player.isAttacking && !player.isDashing) {
                // 플레이어가 공격 중이 아니면 공격 시도 (Boss 모드일 때는 확률이 더 높음)
                const attackChance = isBossMode ? 0.85 : 0.7;
                if (Math.random() < attackChance) {
                    // 최적 공격 거리보다 멀면 접근
                    if (distance > optimalAttackDistance) {
                        // 플레이어 방향으로 이동
                        if (playerCenterX < enemyCenterX) {
                            enemy.velocity.x = -baseSpeed;
                        } else {
                            enemy.velocity.x = baseSpeed;
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
                }
            } else {
                // 공격 조건이 맞지 않으면 플레이어 방향으로 이동 유지
                if (distance > optimalAttackDistance) {
                    if (playerCenterX < enemyCenterX) {
                        enemy.velocity.x = -baseSpeed;
                    } else {
                        enemy.velocity.x = baseSpeed;
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
                    enemy.velocity.x = -baseSpeed;
                } else {
                    enemy.velocity.x = baseSpeed;
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
            enemy.velocity.x = -baseSpeed;
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        } else {
            // 플레이어가 오른쪽에 있으면 오른쪽으로 이동
            enemy.flip = false;
            enemy.velocity.x = baseSpeed;
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        }
        
        // 멀리 있으면 대시로 빠르게 접근 (Boss 모드일 때는 더 자주 대시)
        const dashDistance = isBossMode ? 300 : 350;
        if (distance > dashDistance && enemy.dashCooldown <= 0 && enemy.isOnGround) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
            } else {
                enemy.flip = false;
            }
            enemy.dash();
            // Boss 모드일 때 대시 후 쿨타임을 짧게 설정
            if (isBossMode) {
                enemy.dashCooldown = 15;
            }
        }
    } else if (distance < attackRange - 50) {
        // 너무 가까이 있으면 약간 후퇴 (플레이어가 공격 중일 때만)
        if (player.isAttacking) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed;
            } else {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed;
            }
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        } else {
            // 공격 중이 아니면 접근 유지
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed;
            } else {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed;
            }
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        }
    } else {
        // 적절한 거리면 플레이어를 향해 이동 (미세 조절)
        const fineSpeed = isBossMode ? 4 : 3; // Boss는 미세 조절도 더 빠름
        if (playerCenterX < enemyCenterX) {
            enemy.flip = true;
            enemy.velocity.x = -fineSpeed; // 느리게 접근
        } else {
            enemy.flip = false;
            enemy.velocity.x = fineSpeed;
        }
        if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
            enemy.switchSprite('run');
        }
    }
    
    // takeHit 상태가 끝나면 즉시 플레이어를 향해 이동하도록 함
    // takeHit 애니메이션이 끝나고 경직이 해제되면 즉시 움직임
    // 여러 대 맞아도 계속 움직이도록 항상 체크
    // 경직이 해제된 직후에도 velocity가 0이면 즉시 움직이도록 함
    // takeHit 상태가 아니고 경직이 해제되면 항상 플레이어를 향해 이동
    if (enemy.currentState !== 'takeHit' && enemy.currentState !== 'attack' && enemy.currentState !== 'death' && !enemy.isStunned) {
        // takeHit나 attack 상태가 아니고 경직이 해제되면 플레이어를 향해 이동
        // velocity가 0이면 항상 플레이어를 향해 이동하도록 설정 (여러 대 맞아도 계속 움직임)
        // 이 체크는 매 프레임 실행되어 경직이 해제되면 즉시 움직임
        if (enemy.velocity.x === 0 && distance > 0) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed;
            } else {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed;
            }
            if (enemy.isOnGround && enemy.currentState !== 'attack' && enemy.currentState !== 'takeHit') {
                enemy.switchSprite('run');
            }
        }
    } else if (enemy.currentState === 'takeHit' && !enemy.isStunned) {
        // takeHit 상태이지만 경직이 해제되면 (takeHit 애니메이션이 끝나기 전에 경직이 해제될 수 있음)
        // velocity를 유지하거나 설정하여 계속 움직이도록 함
        if (enemy.velocity.x === 0 && distance > 0) {
            if (playerCenterX < enemyCenterX) {
                enemy.flip = true;
                enemy.velocity.x = -baseSpeed;
            } else {
                enemy.flip = false;
                enemy.velocity.x = baseSpeed;
            }
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
        // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
        const groundY = getFloorTopY();
        const hitboxHeight = 150;
        const imageYOffset = 20;
        const scaledHeight = player.sprites.idle.image.height * player.scale;
        player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
    }
    player.velocity.x = 0
    player.velocity.y = 10
    player.health = 200
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
        // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
        const groundY = getFloorTopY();
        const hitboxHeight = 150;
        const imageYOffset = 20;
        const scaledHeight = enemy.sprites.idle.image.height * enemy.scale;
        enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
    }
    enemy.velocity.x = 0
    enemy.velocity.y = 0
    enemy.health = 200
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
            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
            const groundY = getFloorTopY();
            const hitboxHeight = 150;
            const imageYOffset = 20;
            const scaledHeight = player.sprites.idle.image.height * player.scale;
            player.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
        }
        // 상태 리셋
        player.velocity.x = 0;
        player.velocity.y = 10;
        player.health = 200;
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
            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
            const groundY = getFloorTopY();
            const hitboxHeight = 150;
            const imageYOffset = enemy.characterImageYOffset || 20;
            const scaledHeight = enemy.sprites.idle.image.height * enemy.scale;
            enemy.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset;
        }
        // 상태 리셋
        enemy.velocity.x = 0;
        enemy.velocity.y = 0;
        enemy.health = 200;
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
            // 모든 화면 숨기기
            if (lobbyModeSection) lobbyModeSection.style.display = 'none';
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
            // 모든 화면 숨기기
            if (lobbyModeSection) lobbyModeSection.style.display = 'none';
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
        hitboxToggleLabel.textContent = window.DEBUG_HITBOX ? 'On' : 'Off';
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
        // 연습 모드 더미는 이동이 활성화되어 있을 때만 AI가 velocity를 설정
        if (!isAIMode && !enemy.isStunned && !enemy.isDashing) {
            enemy.velocity.x = 0
        }
        
        // 연습 모드 더미 AI 처리
        if (isPracticeMode && enemy && enemy.isDummy && practiceDummyMovementEnabled && !enemy.isStunned) {
            updateDummyAI();
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
            } else if (isAIMode && !isPracticeMode) {
                // AI 모드일 때 AI 로직 실행 (게임 종료 시에는 실행되지 않음)
                // 연습 모드는 더미 AI를 별도로 처리
                updateAI();
        }
        }
    }

    // 게임이 끝나지 않았을 때만 충돌 및 승리 조건 체크
    if (!gameOver) {
        //detect for collision
        // 플레이어 공격 데미지 적용 프레임 계산 (캐릭터별)
        let playerAttackDamageFrame = 4; // 기본값 (로난: 6프레임 중 4번째)
        if (player.characterNum === 2) {
            // 쇼군: 4프레임 중 2번째
            playerAttackDamageFrame = 2;
        } else if (player.characterNum === 3) {
            // 챈: 7프레임 중 4번째
            playerAttackDamageFrame = 4;
        } else if (player.characterNum === 1) {
            // 로난: 6프레임 중 4번째
            playerAttackDamageFrame = 4;
        }
        
        if (
            rectangularCollision({
                rectangle1: player.attackBox,
                rectangle2: enemy
            })
            && player.isAttacking
            && player.currentState === 'attack' // 공격 상태인지 확인
            && player.framesCurrent === playerAttackDamageFrame // 캐릭터별 공격 프레임 중간에 데미지 적용
            && (!player.lastHitFrame || player.lastHitFrame !== player.framesCurrent) // 같은 프레임에서 중복 데미지 방지
            ) {
            player.lastHitFrame = player.framesCurrent // 마지막 데미지 적용 프레임 저장
            // 공격자의 방향을 전달 (flip이 false면 오른쪽, true면 왼쪽)
            const attackerDirection = player.flip ? 'left' : 'right'
            enemy.takeHit(attackerDirection)
            
            // 캐릭터별 공격력 설정
            let playerDamage = 20; // 기본값 (로난)
            if (player.characterNum === 2) {
                // 쇼군: 공격력 10
                playerDamage = 10;
            } else if (player.characterNum === 3) {
                // 챈: 공격력 30
                playerDamage = 30;
            } else if (player.characterNum === 1) {
                // 로난: 공격력 20
                playerDamage = 20;
            }
            
            // 연습 모드에서는 설정된 공격력 직접 사용
            if (isPracticeMode) {
                playerDamage = practicePlayerDamage;
            }
            
            enemy.health -= playerDamage
            // 체력바는 최대 체력 기준으로 퍼센트 계산
            const maxHealth = isPracticeMode ? practiceDummyHealth : 200;
            const enemyHealthPercent = Math.max(0, (enemy.health / maxHealth) * 100)
            document.querySelector('#enemyHealth').style.width = enemyHealthPercent + '%'
            // AI 상태 업데이트: 플레이어가 적을 맞췄음
            if (isAIMode) {
                aiState.lastHitResult = -1; // 적(AI)이 패배
                aiState.lastWhiffFrame = -999; // whiff 리셋
            }
        }
        // 적 공격 데미지 적용 프레임 계산 (캐릭터별)
        let enemyAttackDamageFrame = 4; // 기본값 (로난: 6프레임 중 4번째)
        if (isBossMode) {
            // 보스: 7프레임 중 3번째
            enemyAttackDamageFrame = 3;
        } else if (enemy.characterNum === 2) {
            // 쇼군: 4프레임 중 2번째
            enemyAttackDamageFrame = 2;
        } else if (enemy.characterNum === 3) {
            // 챈: 7프레임 중 4번째
            enemyAttackDamageFrame = 4;
        } else if (enemy.characterNum === 1) {
            // 로난: 6프레임 중 4번째
            enemyAttackDamageFrame = 4;
        }
        
        if (
            rectangularCollision({
                rectangle1: enemy.attackBox,
                rectangle2: player
            })
            && enemy.isAttacking
            && enemy.currentState === 'attack' // 공격 상태인지 확인
            && enemy.framesCurrent === enemyAttackDamageFrame // 캐릭터별 공격 프레임 중간에 데미지 적용
            && (!enemy.lastHitFrame || enemy.lastHitFrame !== enemy.framesCurrent) // 같은 프레임에서 중복 데미지 방지
        ) {
            enemy.lastHitFrame = enemy.framesCurrent // 마지막 데미지 적용 프레임 저장
            // 공격자의 방향을 전달 (flip이 false면 오른쪽, true면 왼쪽)
            const attackerDirection = enemy.flip ? 'left' : 'right'
            player.takeHit(attackerDirection)
            
            // 캐릭터별 공격력 설정
            let enemyDamage = 20; // 기본값 (로난)
            if (isBossMode) {
                // 보스: 공격력 40
                enemyDamage = 40;
            } else if (enemy.characterNum === 2) {
                // 쇼군: 공격력 10
                enemyDamage = 10;
            } else if (enemy.characterNum === 3) {
                // 챈: 공격력 30
                enemyDamage = 30;
            } else if (enemy.characterNum === 1) {
                // 로난: 공격력 20
                enemyDamage = 20;
            }
            
            player.health -= enemyDamage
            // 체력바는 최대 체력(200) 기준으로 퍼센트 계산
            const playerHealthPercent = Math.max(0, (player.health / 200) * 100)
            document.querySelector('#playerHealth').style.width = playerHealthPercent + '%'
            // AI 상태 업데이트: 적(AI)이 플레이어를 맞췄음
            if (isAIMode) {
                aiState.lastHitResult = 1; // 적(AI)이 승리
                // Boss 모드: 콤보 카운트 증가
                if (isBossMode) {
                    aiState.comboCount++;
                    aiState.lastComboTime = aiState.frameCount;
                    aiState.lastSuccessfulCounter = aiState.frameCount;
                }
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
            // 연습 모드 더미 죽음 처리
            if (isPracticeMode && enemy && enemy.isDummy && enemy.health <= 0) {
                if (enemy.currentState !== 'death' && !enemy.deathAnimationReversed) {
                    enemy.switchSprite('death');
                    enemy.framesCurrent = 0;
                    enemy.deathAnimationReversed = false;
                }
                
                // 죽음 애니메이션이 끝나면 역재생 시작
                if (enemy.currentState === 'death' && enemy.framesCurrent >= enemy.sprites.death.framesMax - 1 && !enemy.deathAnimationReversed) {
                    enemy.deathAnimationReversed = true;
                }
                
                // 역재생 중
                if (enemy.deathAnimationReversed) {
                    if (enemy.framesCurrent > 0) {
                        enemy.framesCurrent--;
                    } else {
                        // 역재생 완료 - 체력 복구
                        enemy.health = practiceDummyHealth;
                        enemy.deathAnimationReversed = false;
                        enemy.switchSprite('idle');
                        enemy.framesCurrent = 0;
                        const enemyHealthBar = document.getElementById('enemyHealth');
                        if (enemyHealthBar) {
                            enemyHealthBar.style.width = '100%';
                        }
                    }
                }
            } else {
                // 일반 모드 죽음 처리
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
