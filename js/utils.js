function rectangularCollision({ rectangle1, rectangle2 }) {
    // attackBox인 경우 그대로 사용
    let rect1Width = rectangle1.width
    let rect1Height = rectangle1.height
    let rect1X = rectangle1.position.x
    let rect1Y = rectangle1.position.y
    
    let rect2Width = rectangle2.width
    let rect2Height = rectangle2.height
    let rect2X = rectangle2.position.x
    let rect2Y = rectangle2.position.y
    
    // Fighter 객체인 경우 피격 박스 크기(50x150) 사용
    if (rectangle1.sprites && rectangle1.sprites[rectangle1.currentState]) {
        // 피격 박스 크기 고정
        rect1Width = 50
        rect1Height = 150
        
        // 이미지 크기 계산 (위치 조정용)
        const sprite = rectangle1.sprites[rectangle1.currentState]
        if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
            const frameWidth = Math.floor(sprite.image.width / sprite.framesMax)
            const imageWidth = frameWidth * rectangle1.scale
            const imageHeight = sprite.image.height * rectangle1.scale
            
            // 피격 박스 위치 조정 - 이미지 중앙에 배치
            rect1X = rectangle1.position.x + (imageWidth / 2) - (rect1Width / 2) // 가로 중앙 정렬
            rect1Y = rectangle1.position.y + (imageHeight / 2) - (rect1Height / 2) // 세로 중앙 정렬
        }
    }
    
    if (rectangle2.sprites && rectangle2.sprites[rectangle2.currentState]) {
        // 피격 박스 크기 고정
        rect2Width = 50
        rect2Height = 150
        
        // 이미지 크기 계산 (위치 조정용)
        const sprite = rectangle2.sprites[rectangle2.currentState]
        if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
            const frameWidth = Math.floor(sprite.image.width / sprite.framesMax)
            const imageWidth = frameWidth * rectangle2.scale
            const imageHeight = sprite.image.height * rectangle2.scale
            
            // 피격 박스 위치 조정 - 이미지 중앙에 배치
            rect2X = rectangle2.position.x + (imageWidth / 2) - (rect2Width / 2) // 가로 중앙 정렬
            rect2Y = rectangle2.position.y + (imageHeight / 2) - (rect2Height / 2) // 세로 중앙 정렬
        }
    }
    
    return (
        rect1X + rect1Width >= rect2X &&
        rect1X <= rect2X + rect2Width &&
        rect1Y + rect1Height >= rect2Y &&
        rect1Y <= rect2Y + rect2Height
    )
}

function determineWinner({ player, enemy, timerId}) {
    clearTimeout(timerId)
    const displayText = document.querySelector('#displayText')
    const retryButton = document.querySelector('#retryButton')
    displayText.style.display = 'flex'
    retryButton.style.display = 'block'
    
    const textElement = displayText.querySelector('div') || displayText
    if (player.health === enemy.health) {
        textElement.textContent = 'Tie'
    } else if (player.health > enemy.health) {
        textElement.textContent = 'Player 1 Wins'
    } else if (player.health < enemy.health) {
        textElement.textContent = 'Player 2 Wins'
    }
}

let timer = 60
let timerId
let gameOver = false

function decreaseTimer() {
    // 일시정지 중이면 타이머 멈춤
    if (window.isPaused) {
        // 일시정지가 해제되면 다시 타이머 재개
        timerId = setTimeout(decreaseTimer, 100);
        return;
    }
    
    if (timer > 0) {
        timer--
        document.querySelector('#timer').innerHTML = timer
        timerId = setTimeout(decreaseTimer, 1000)
    } else {
        // timer가 0이 되면 게임 종료
        gameOver = true
        determineWinner({ player: window.player, enemy: window.enemy, timerId })
    }
}