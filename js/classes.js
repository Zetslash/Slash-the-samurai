// 플로어(바닥) 상단 Y 좌표를 반환 (FLOOR_HEIGHT가 없으면 캔버스 하단 사용)
function getFloorTopY() {
    if (typeof canvas === 'undefined') return 0
    const floorHeight = (typeof FLOOR_HEIGHT !== 'undefined') ? FLOOR_HEIGHT : 0
    const floorOffset = (typeof FLOOR_OFFSET !== 'undefined') ? FLOOR_OFFSET : 0
    return canvas.height - floorHeight + floorOffset
}

// 캐릭터를 바닥보다 살짝 더 내려 보이게 하는 보정값(px)
const CHARACTER_SINK = -10
// 디버그: 히트박스/공격박스 표시 여부 (전역 변수로 설정)
if (typeof window.DEBUG_HITBOX === 'undefined') {
    window.DEBUG_HITBOX = false; // 기본값은 false
}

class Sprite {
    constructor({position, imageSrc, canvas, scale = 1, framesMax = 1, framesCurrent = 0, framesElapsed = 0, framesHold = 10, alignRight = false, alignBottom = false, offsetX = 0, offsetY = 0}) {
        this.position = position
        this.image = new Image()
        this.image.src = imageSrc
        this.canvas = canvas
        this.scale = scale
        this.width = 0
        this.height = 0
        this.framesMax = framesMax
        this.framesCurrent = framesCurrent
        this.framesElapsed = framesElapsed
        this.framesHold = framesHold
        this.alignRight = alignRight
        this.alignBottom = alignBottom
        this.offsetX = offsetX
        this.offsetY = offsetY
        
        // 이미지 로드 완료 후 크기 설정
        this.image.onload = () => {
            if (this.canvas && framesMax === 1) {
                // 배경처럼 캔버스 크기에 맞게 설정
                this.width = this.canvas.width
                this.height = this.canvas.height
            } else {
                // 애니메이션이 있는 경우 원본 이미지 크기 사용
                this.width = this.image.width / this.framesMax
                this.height = this.image.height
                
                // 오른쪽 정렬
                if (this.alignRight && this.canvas) {
                    this.position.x = this.canvas.width - (this.width * this.scale) + this.offsetX
                }
                
                // 하단 정렬
                if (this.alignBottom && this.canvas) {
                    this.position.y = this.canvas.height - (this.height * this.scale) + this.offsetY
                }
            }
        }
    }
    
    draw() {
        if (typeof c !== 'undefined' && this.image.complete && this.width > 0 && this.height > 0) {
            if (this.canvas && this.framesMax === 1) {
                // 배경처럼 캔버스 크기에 맞게 이미지 그리기
                c.drawImage(
                    this.image, 
                    this.position.x, 
                    this.position.y,
                    this.canvas.width,
                    this.canvas.height
                )
            } else {
                // 애니메이션이 있는 경우 스프라이트 시트에서 프레임 추출
                const frameWidth = this.width
                const frameHeight = this.height
                const currentFrame = Math.min(Math.max(0, this.framesCurrent), this.framesMax - 1)
                
                c.drawImage(
                    this.image,
                    currentFrame * frameWidth,
                    0,
                    frameWidth,
                    frameHeight,
                    this.position.x,
                    this.position.y,
                    frameWidth * this.scale,
                    frameHeight * this.scale
                )
            }
        }
    }

    update() {
        // 이미지가 로드되었고 정렬 옵션이 있으면 위치 재조정
        if (this.image.complete && this.width > 0 && this.height > 0) {
            if (this.alignRight && this.canvas) {
                this.position.x = this.canvas.width - (this.width * this.scale) + this.offsetX
            }
            if (this.alignBottom && this.canvas) {
                this.position.y = this.canvas.height - (this.height * this.scale) + this.offsetY
            }
        }
        
        this.draw()
        
        // 애니메이션 프레임 업데이트
        if (this.framesMax > 1) {
            this.framesElapsed++
            
            if (this.framesElapsed % this.framesHold === 0) {
                if (this.framesCurrent < this.framesMax - 1) {
                    this.framesCurrent++
                } else {
                    this.framesCurrent = 0
                }
            }
        }
    }
}

class Fighter {
    constructor({position, velocity, color = 'red', offset, sprites, scale = 2.5, flip = false}) {
        this.position = position
        this.velocity = velocity
        this.width = 50
        this.height = 150
        this.attackBox ={
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset,
            width: 180, // 기본값, 캐릭터별로 update()에서 조정 가능
            height: 60
        }
        this.color = color
        this.characterNum = null // 캐릭터 번호 (1: Ronan, 2: Player2, 3: Chan)
        this.isAttacking = false
        this.health = 200
        this.canJump = true
        this.isOnGround = false
        this.scale = scale
        this.flip = flip
        this.isStunned = false
        this.stunTimer = 0
        this.isDashing = false
        this.dashCooldown = 0
        this.dashDuration = 0
        
        // 캐릭터별 위치 오프셋 (음수면 위로, 양수면 아래로)
        this.characterPositionYOffset = 0
        // 캐릭터별 이미지 오프셋 (각 캐릭터마다 다르게 설정 가능)
        this.characterImageYOffset = 20
        // 캐릭터별 대쉬 이펙트 Y 오프셋 (음수면 위로, 양수면 아래로)
        this.dashEffectYOffset = 0
        
        // 연기 이펙트 배열
        this.smokeEffects = []
        
        // 애니메이션 상태
        this.currentState = 'idle'
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        this.sprites = {}
        
        // 스프라이트 로드
        if (sprites) {
            let loadedCount = 0
            let attack2Loaded = false // 공격 2 이미지 로드 여부
            const totalSprites = Object.keys(sprites).length
            // 공격 모션에 attack2Src가 있으면 총 스프라이트 수에 포함
            const hasAttack2 = sprites.attack && sprites.attack.attack2Src
            const actualTotalSprites = totalSprites + (hasAttack2 ? 1 : 0)
            
            for (const sprite in sprites) {
                this.sprites[sprite] = {
                    image: new Image(),
                    framesMax: sprites[sprite].framesMax || 1,
                    frameWidth: 0,  // 실제 프레임 너비 저장
                    frameHeight: 0  // 실제 프레임 높이 저장
                }
                
                // 공격 모션에 두 번째 이미지가 있는 경우 (Player 3)
                if (sprite === 'attack' && sprites[sprite].attack2Src) {
                    this.sprites[sprite].attack2Image = new Image()
                    this.sprites[sprite].attack2Frames = sprites[sprite].attack2Frames || 0
                    // 첫 번째 이미지의 원본 프레임 수 저장
                    this.sprites[sprite].attack1Frames = sprites[sprite].framesMax || 0
                    // 총 프레임 수 = 첫 번째 이미지 프레임 + 두 번째 이미지 프레임
                    this.sprites[sprite].framesMax = (sprites[sprite].framesMax || 0) + (sprites[sprite].attack2Frames || 0)
                    
                    // 공격 2 이미지 로드
                    this.sprites[sprite].attack2Image.onload = () => {
                        if (this.sprites[sprite].attack2Image.complete && this.sprites[sprite].attack2Image.width > 0) {
                            const attack2Frames = sprites[sprite].attack2Frames || 0
                            this.sprites[sprite].attack2FrameWidth = Math.floor(this.sprites[sprite].attack2Image.width / attack2Frames)
                            this.sprites[sprite].attack2FrameHeight = this.sprites[sprite].attack2Image.height
                        }
                        
                        attack2Loaded = true
                        loadedCount++
                        // 모든 이미지가 로드되면 위치 재조정
                        if (loadedCount === actualTotalSprites && typeof canvas !== 'undefined') {
                            const idleSprite = this.sprites.idle
                            if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                                this.width = idleSprite.frameWidth
                                this.height = idleSprite.frameHeight
                                this.position.y = getFloorTopY() - (this.height * this.scale) + CHARACTER_SINK
                            }
                        }
                    }
                    
                    this.sprites[sprite].attack2Image.src = sprites[sprite].attack2Src
                    
                    if (this.sprites[sprite].attack2Image.complete && this.sprites[sprite].attack2Image.width > 0) {
                        this.sprites[sprite].attack2Image.onload()
                    }
                }
                
                // 이미지 로드 완료 시 프레임 크기 계산 및 위치 조정
                this.sprites[sprite].image.onload = () => {
                    const spriteObj = this.sprites[sprite]
                    if (spriteObj.image.complete && spriteObj.image.width > 0) {
                        // 프레임 크기 계산 (정수로 내림하여 정확한 프레임 크기 계산)
                        const baseFramesMax = sprites[sprite].framesMax || 1
                        spriteObj.frameWidth = Math.floor(spriteObj.image.width / baseFramesMax)
                        spriteObj.frameHeight = spriteObj.image.height
                        
                        // idle 스프라이트의 경우 기본 크기 설정
                        if (sprite === 'idle' && typeof canvas !== 'undefined') {
                            this.width = spriteObj.frameWidth
                            this.height = spriteObj.frameHeight
                            // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                            const groundY = getFloorTopY()
                            const hitboxHeight = 150
                            const imageYOffset = 20 // 모든 캐릭터 동일한 이미지 오프셋
                            const scaledHeight = this.height * this.scale
                            // 히트박스 하단 = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                            // 따라서 position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
                            this.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
                        }
                    }
                    
                    loadedCount++
                    // 모든 이미지가 로드되면 위치 재조정
                        if (loadedCount === actualTotalSprites && typeof canvas !== 'undefined') {
                        const idleSprite = this.sprites.idle
                        if (idleSprite && idleSprite.image.complete && idleSprite.frameWidth > 0) {
                            this.width = idleSprite.frameWidth
                            this.height = idleSprite.frameHeight
                                // 히트박스 하단을 기준으로 모든 캐릭터를 동일한 땅 높이에 배치
                                const groundY = getFloorTopY()
                                const hitboxHeight = 150
                                const imageYOffset = 20 // 모든 캐릭터 동일한 이미지 오프셋
                                const scaledHeight = this.height * this.scale
                                // 히트박스 하단 = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                                // 따라서 position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
                                this.position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
                        }
                    }
                }
                
                // 이미지 소스 설정
                this.sprites[sprite].image.src = sprites[sprite].imageSrc
                
                // 이미 로드된 경우 즉시 처리
                if (this.sprites[sprite].image.complete && this.sprites[sprite].image.width > 0) {
                    this.sprites[sprite].image.onload()
                }
            }
        }
    }
    
    switchSprite(spriteKey) {
        if (this.sprites[spriteKey] && this.currentState !== spriteKey) {
            this.currentState = spriteKey
            this.framesCurrent = 0
            this.framesElapsed = 0  // 프레임 타이밍도 리셋
            
            // 공격 애니메이션 속도 조정
            if (spriteKey === 'attack') {
                // 플레이어 1과 플레이어 2 모두 같은 공격 속도
                this.framesHold = 4
            } else if (spriteKey === 'takeHit') {
                // 피격 애니메이션 속도 조정 - 플레이어 1은 빠르게
                if (this.color === 'red') {
                    this.framesHold = 2
                } else {
                    this.framesHold = 6
                }
            } else {
                this.framesHold = 5
            }
        }
    }
    
    draw() {
        if (typeof c !== 'undefined') {
            const sprite = this.sprites[this.currentState]
            
            if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
                // 매번 정확한 프레임 크기 계산 (framesMax가 변경될 수 있으므로)
                const framesMax = sprite.framesMax
                
                // 공격 모션에 두 번째 이미지가 있는 경우 (Player 3)
                let useAttack2 = false
                let attack1Frames = 0
                let currentFrame = 0
                let frameWidth = 0
                let frameHeight = 0
                let drawImage = sprite.image
                
                if (this.currentState === 'attack' && sprite.attack2Image && sprite.attack2Image.complete && sprite.attack2Image.width > 0) {
                    // 첫 번째 이미지의 원본 프레임 수 사용
                    attack1Frames = sprite.attack1Frames || (sprite.framesMax - (sprite.attack2Frames || 0))
                    if (this.framesCurrent >= attack1Frames) {
                        // 두 번째 이미지 사용 (Attack2)
                        useAttack2 = true
                        currentFrame = this.framesCurrent - attack1Frames
                        // Attack2의 프레임 인덱스 유효성 검사
                        currentFrame = Math.min(Math.max(0, currentFrame), (sprite.attack2Frames || 1) - 1)
                        frameWidth = sprite.attack2FrameWidth || Math.floor(sprite.attack2Image.width / (sprite.attack2Frames || 1))
                        frameHeight = sprite.attack2FrameHeight || sprite.attack2Image.height
                        drawImage = sprite.attack2Image
                    } else {
                        // 첫 번째 이미지 사용 (Attack1)
                        useAttack2 = false
                        currentFrame = this.framesCurrent
                        // Attack1의 프레임 인덱스 유효성 검사
                        currentFrame = Math.min(Math.max(0, currentFrame), attack1Frames - 1)
                        frameWidth = Math.floor(sprite.image.width / attack1Frames)
                        frameHeight = sprite.image.height
                        drawImage = sprite.image
                    }
                } else {
                    // 일반 모션
                    frameWidth = Math.floor(sprite.image.width / framesMax)
                    frameHeight = sprite.image.height
                    currentFrame = Math.min(Math.max(0, this.framesCurrent), framesMax - 1)
                    drawImage = sprite.image
                }
                
                // 이미지를 아래로 내려서 발이 히트박스 하단에 맞춤
                // 캐릭터별로 개별 오프셋 사용 (characterImageYOffset 사용)
                const imageYOffsetBoss = 38 // 보스
                
                // 오프셋 계산 - 캐릭터별 설정 우선, 없으면 기본값 사용
                let imageYOffset;
                const isBossMode = typeof window !== 'undefined' && window.isBossMode === true;
                const isEnemy = typeof window !== 'undefined' && window.enemy === this;
                const isBoss = isBossMode && isEnemy;
                
                if (isBoss) {
                    imageYOffset = imageYOffsetBoss;
                } else {
                    // 캐릭터별 이미지 오프셋 사용 (getCharacterSprites에서 설정된 값)
                    imageYOffset = this.characterImageYOffset || 20;
                }
                
                // 색상 필터 제거 (모든 캐릭터 원래 색상 사용)
                let colorFilter = null;
                
                // 좌우 반전이 필요한 경우
                if (this.flip) {
                    c.save() // 항상 save하여 상태 저장
                    // 변환 행렬을 완전히 리셋하여 누적 방지 (save 후에 리셋)
                    c.setTransform(1, 0, 0, 1, 0, 0);
                    // 필터 초기화 후 색상 필터 적용 (누적 방지)
                    c.filter = colorFilter || 'none';
                    // 캔버스 변환을 사용하여 반전
                    // translate에는 imageYOffset을 포함하지 않고, drawImage의 y 위치에만 적용
                    c.translate(this.position.x + frameWidth * this.scale, this.position.y)
                    c.scale(-1, 1)
                    c.drawImage(
                        drawImage,
                        currentFrame * frameWidth,
                        0,
                        frameWidth,
                        frameHeight,
                        0,
                        imageYOffset, // 오프셋은 drawImage의 y 위치에만 적용
                        frameWidth * this.scale,
                        frameHeight * this.scale
                    )
                    c.restore() // 항상 restore하여 필터와 변환 상태 초기화
                } else {
                    c.save() // 항상 save하여 상태 저장
                    // 변환 행렬을 완전히 리셋하여 누적 방지 (save 후에 리셋)
                    c.setTransform(1, 0, 0, 1, 0, 0);
                    // 필터 초기화 후 색상 필터 적용 (누적 방지)
                    c.filter = colorFilter || 'none';
                    c.drawImage(
                        drawImage,
                        currentFrame * frameWidth,
                        0,
                        frameWidth,
                        frameHeight,
                        this.position.x,
                        this.position.y + imageYOffset,
                        frameWidth * this.scale,
                        frameHeight * this.scale
                    )
                    c.restore() // 항상 restore하여 필터 상태 초기화
                }
            }
            
            if (window.DEBUG_HITBOX) {
                // 공격 박스 표시 (초록색 반투명)
                if (this.isAttacking && this.currentState === 'attack') {
                c.fillStyle = 'rgba(0, 255, 0, 0.5)'
                c.fillRect(
                    this.attackBox.position.x, 
                    this.attackBox.position.y, 
                    this.attackBox.width, 
                    this.attackBox.height
                )
                    // 공격 박스 테두리
                    c.strokeStyle = 'rgba(0, 255, 0, 1)'
                    c.lineWidth = 2
                    c.strokeRect(
                        this.attackBox.position.x, 
                        this.attackBox.position.y, 
                        this.attackBox.width, 
                        this.attackBox.height
                    )
                }
                
                // 피격 박스 (캐릭터 충돌 박스) 표시 - 고정 크기 50x150 (빨간색 테두리)
                const hitboxWidth = 50
                const hitboxHeight = 150
                
                // 이미지의 실제 크기 계산 (위치 조정용)
                let imageWidth = 0
                let imageHeight = 0
                
                if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
                    const framesMax = sprite.framesMax
                    imageWidth = Math.floor(sprite.image.width / framesMax) * this.scale
                    imageHeight = sprite.image.height * this.scale
                } else {
                    imageWidth = this.width * this.scale
                    imageHeight = this.height * this.scale
                }
                
                // 피격 박스 위치 조정 - 이미지 중앙에 배치
                const isBossMode = typeof window !== 'undefined' && window.isBossMode === true;
                const isEnemy = typeof window !== 'undefined' && window.enemy === this;
                const isBoss = isBossMode && isEnemy;
                
                // 이미지 오프셋 계산 (draw() 메서드와 동일한 로직)
                const imageYOffsetPlayer1 = 20;
                const imageYOffsetPlayer2 = 20;
                const imageYOffsetBoss = 20; // 모든 캐릭터 동일하게
                
                let imageYOffset;
                if (isBoss) {
                    imageYOffset = imageYOffsetBoss;
                } else if (this.color === 'red') {
                    imageYOffset = imageYOffsetPlayer1;
                } else {
                    imageYOffset = imageYOffsetPlayer2;
                }
                
                const hitboxX = this.position.x + (imageWidth / 2) - (hitboxWidth / 2)
                // 히트박스 Y 위치 = position.y + 이미지 중앙 + 이미지 오프셋
                const hitboxY = this.position.y + (imageHeight / 2) - (hitboxHeight / 2) + imageYOffset
                
                c.strokeStyle = 'rgba(255, 0, 0, 0.8)'
                c.lineWidth = 2
                c.strokeRect(
                    hitboxX,
                    hitboxY,
                    hitboxWidth,
                    hitboxHeight
                )
            }
            
            // 연기 이펙트 그리기
            if (this.smokeEffects && this.smokeEffects.length > 0) {
                for (const smokeEffect of this.smokeEffects) {
                    // initialized가 true이고 이미지가 로드되었을 때만 그리기
                    if (smokeEffect.initialized && smokeEffect.sprite && smokeEffect.sprite.image.complete && smokeEffect.sprite.width > 0 && smokeEffect.sprite.height > 0) {
                        // 플레이어가 보고 있는 방향에 따라 연기 이펙트 반전
                        if (smokeEffect.flip) {
                            c.save()
                            const frameWidth = smokeEffect.sprite.width
                            const frameHeight = smokeEffect.sprite.height
                            const currentFrame = Math.min(Math.max(0, smokeEffect.sprite.framesCurrent), smokeEffect.sprite.framesMax - 1)
                            
                            // 캔버스 변환을 사용하여 반전
                            c.translate(smokeEffect.sprite.position.x + frameWidth * smokeEffect.sprite.scale, smokeEffect.sprite.position.y)
                            c.scale(-1, 1)
                            c.drawImage(
                                smokeEffect.sprite.image,
                                currentFrame * frameWidth,
                                0,
                                frameWidth,
                                frameHeight,
                                0,
                                0,
                                frameWidth * smokeEffect.sprite.scale,
                                frameHeight * smokeEffect.sprite.scale
                            )
                            c.restore()
                        } else {
                            smokeEffect.sprite.draw()
                        }
                    }
                }
            }
        }
    }

    update() {
        this.draw()
        
        // 현재 스프라이트의 실제 크기 계산
        const sprite = this.sprites[this.currentState]
        let frameWidth = 0
        let frameHeight = 0
        
        if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
            const framesMax = sprite.framesMax
            frameWidth = Math.floor(sprite.image.width / framesMax)
            frameHeight = sprite.image.height
        } else {
            // 이미지가 로드되지 않은 경우 기본값 사용
            frameWidth = this.width
            frameHeight = this.height
        }
        
        // 히트박스 위치를 이미지의 실제 위치와 크기에 맞게 조정
        const scaledWidth = frameWidth * this.scale
        const scaledHeight = frameHeight * this.scale
        
        // 히트박스 위치 계산 (이미지 중앙)
        const hitboxWidth = 50
        const hitboxX = this.position.x + (scaledWidth / 2) - (hitboxWidth / 2)
        
        // 캐릭터별 공격 박스 크기 설정
        let attackBoxWidth = 180; // 기본값 (로난, 쇼군)
        if (this.characterNum === 3) {
            // 챈: 공격 박스 짧음
            attackBoxWidth = 120;
        }
        this.attackBox.width = attackBoxWidth;
        
        // 플레이어별, 방향별 공격 박스 위치 조정 - 히트박스 기준 대칭 위치
        if (this.color === 'red') {
            // 플레이어 1
            if (this.flip) {
                // 뒷쪽을 바라볼 때: 히트박스 왼쪽 끝에서 -80 (대칭)
                this.attackBox.position.x = hitboxX - this.attackBox.width
            } else {
                // 정면을 바라볼 때: 히트박스 오른쪽 끝에서 +80
                this.attackBox.position.x = hitboxX + hitboxWidth
            }
        } else {
            // 플레이어 2 (반대 방향)
            if (this.flip) {
                // 뒷쪽을 바라볼 때: 히트박스 오른쪽 끝에서 +80 (대칭)
                this.attackBox.position.x = hitboxX + hitboxWidth - 230
            } else {
                // 정면을 바라볼 때: 히트박스 왼쪽 끝에서 -80 (대칭)
                this.attackBox.position.x = hitboxX - this.attackBox.width + 230
            }
        }
        
        // y 위치는 이미지의 중앙 높이에 맞춤
        const isBossMode = typeof window !== 'undefined' && window.isBossMode === true;
        const isEnemy = typeof window !== 'undefined' && window.enemy === this;
        const isBoss = isBossMode && isEnemy;
        
        // 이미지 오프셋 계산 (draw() 메서드와 동일한 로직)
        const imageYOffsetBoss = 20;
        
        let imageYOffset;
        if (isBoss) {
            imageYOffset = imageYOffsetBoss;
        } else {
            // 캐릭터별 이미지 오프셋 사용
            imageYOffset = this.characterImageYOffset || 20;
        }
        
        // 히트박스 Y 위치 = position.y + 이미지 중앙 + 이미지 오프셋
        // 이미지 오프셋을 고려하여 히트박스가 이미지의 실제 위치에 맞춰지도록 함
        this.attackBox.position.y = this.position.y + (scaledHeight / 2) - (this.attackBox.height / 2) + imageYOffset

        // 애니메이션 프레임 업데이트
        if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0 && sprite.framesMax > 0) {
            // 공격 모션에 두 번째 이미지가 있는 경우 (Player 3)
            const hasAttack2 = this.currentState === 'attack' && sprite.attack2Image && sprite.attack2Image.complete
            const attack1Frames = sprite.attack1Frames || 0
            const attack2Frames = sprite.attack2Frames || 0
            const totalAttackFrames = attack1Frames + attack2Frames
            
            // 프레임 인덱스 유효성 검사 및 초기화
            if (hasAttack2 && totalAttackFrames > 0) {
                // 공격 모션: Attack1 6프레임 후 Attack2 7프레임
                if (this.framesCurrent >= totalAttackFrames || this.framesCurrent < 0) {
                    this.framesCurrent = 0
                }
            } else {
                // 일반 모션
            if (this.framesCurrent >= sprite.framesMax || this.framesCurrent < 0) {
                this.framesCurrent = 0
                }
            }
            
            this.framesElapsed++
            
            if (this.framesElapsed >= this.framesHold) {
                this.framesElapsed = 0  // 프레임 타이머 리셋
                
                if (hasAttack2 && totalAttackFrames > 0) {
                    // 공격 모션: Attack1 6프레임 후 Attack2 7프레임
                    if (this.framesCurrent < totalAttackFrames - 1) {
                        this.framesCurrent++
                    } else {
                        // 공격 애니메이션이 끝나면 상태 전환
                        this.isAttacking = false
                        this.switchSprite('idle')
                    }
                } else {
                    // 일반 모션
                if (this.framesCurrent < sprite.framesMax - 1) {
                    this.framesCurrent++
                } else {
                    // 애니메이션이 끝나면 상태 전환
                    if (this.currentState === 'attack') {
                        this.isAttacking = false
                        this.switchSprite('idle')
                    } else if (this.currentState === 'takeHit') {
                        // takeHit 애니메이션이 끝나도 경직이 남아있으면 idle 유지
                        if (!this.isStunned) {
                            this.switchSprite('idle')
                        }
                    } else if (this.currentState === 'death') {
                        // 연습 모드 더미의 경우 역재생 처리
                        if (this.isDummy && this.deathAnimationReversed) {
                            // 역재생 중이면 프레임 감소
                            if (this.framesCurrent > 0) {
                                this.framesCurrent--;
                            } else {
                                // 역재생 완료는 animate 함수에서 처리
                                this.framesCurrent = 0;
                            }
                        } else {
                            // 일반 죽음 애니메이션은 반복하지 않음
                            this.framesCurrent = sprite.framesMax - 1
                        }
                    } else {
                        this.framesCurrent = 0
                        }
                    }
                }
            }
        }

        // 경직 타이머 업데이트
        if (this.isStunned) {
            this.stunTimer--
            if (this.stunTimer <= 0) {
                this.isStunned = false
                // 경직이 끝나면 idle로 전환
                if (this.currentState === 'takeHit') {
                    this.switchSprite('idle')
                }
            }
        }
        
        // 대시 타이머 및 쿨타임 업데이트
        if (this.isDashing) {
            this.dashDuration--
            if (this.dashDuration <= 0) {
                this.isDashing = false
                // 대시가 끝나면 velocity.x를 0으로 설정
                this.velocity.x = 0
            }
        }
        
        if (this.dashCooldown > 0) {
            this.dashCooldown--
        }
        
        // 연기 이펙트 업데이트 및 제거
        if (this.smokeEffects && this.smokeEffects.length > 0) {
            for (let i = this.smokeEffects.length - 1; i >= 0; i--) {
                const smokeEffect = this.smokeEffects[i]
                
                if (!smokeEffect.sprite || !smokeEffect.sprite.image.complete) {
                    continue
                }
                
                // 플레이어 위치를 따라가도록 위치 업데이트
                if (smokeEffect.initialized && smokeEffect.sprite.width > 0) {
                    // 캐릭터의 히트박스 하단 위치 계산
                    const sprite = this.sprites[this.currentState]
                    let frameHeight = 0
                    if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
                        frameHeight = sprite.image.height
                    } else {
                        frameHeight = this.height
                    }
                    const scaledHeight = frameHeight * this.scale
                    
                    // 이미지 오프셋 계산
                    const isBossMode = typeof window !== 'undefined' && window.isBossMode === true;
                    const isEnemy = typeof window !== 'undefined' && window.enemy === this;
                    const isBoss = isBossMode && isEnemy;
                    const imageYOffsetBoss = 20;
                    let imageYOffset;
                    if (isBoss) {
                        imageYOffset = imageYOffsetBoss;
                    } else {
                        // 캐릭터별 이미지 오프셋 사용
                        imageYOffset = this.characterImageYOffset || 20;
                    }
                    
                    // 히트박스 크기 (50x150)
                    const hitboxHeight = 150
                    const hitboxWidth = 50
                    
                    // 히트박스는 이미지 중앙에 배치되므로, 히트박스 하단 위치 계산
                    // 히트박스 Y = position.y + (scaledHeight / 2) - (hitboxHeight / 2) + imageYOffset
                    // 히트박스 하단 = 히트박스 Y + hitboxHeight = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                    const playerFootY = this.position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                    
                    // 캐릭터 중앙 X 위치
                    const smokeX = this.position.x + (this.width * this.scale / 2)
                    const smokeHeight = smokeEffect.sprite.height * smokeEffect.sprite.scale
                    const smokeWidth = smokeEffect.sprite.width * smokeEffect.sprite.scale
                    
                    // 연기 하단이 히트박스 하단(발 위치)에 붙도록 위치 조정
                    // 대쉬 이펙트 Y 오프셋 적용
                    const dashEffectYOffset = this.dashEffectYOffset || 0
                    smokeEffect.sprite.position.y = playerFootY - smokeHeight + dashEffectYOffset
                    // 연기 중앙이 캐릭터 발 위치에 맞도록 X 위치 조정 (여기서 X 좌표 조정)
                    // 플레이어가 보고 있는 방향의 반대(뒤)로 오프셋 추가
                    const backOffset = 60 // 뒤로 보낼 거리
                    if (this.flip) {
                        // 왼쪽을 보고 있으면 오른쪽(뒤)으로 이동
                        smokeEffect.sprite.position.x = smokeX - (smokeWidth / 2) + backOffset
                    } else {
                        // 오른쪽을 보고 있으면 왼쪽(뒤)으로 이동
                        smokeEffect.sprite.position.x = smokeX - (smokeWidth / 2) - backOffset
                    }
                    
                    // 플레이어가 보고 있는 방향 업데이트
                    smokeEffect.flip = this.flip
                }
                
                // Sprite 업데이트 (애니메이션 프레임 업데이트만, draw는 하지 않음)
                // draw는 Fighter의 draw()에서 처리하므로 여기서는 프레임만 업데이트
                if (smokeEffect.sprite.framesMax > 1) {
                    smokeEffect.sprite.framesElapsed++
                    
                    if (smokeEffect.sprite.framesElapsed % smokeEffect.sprite.framesHold === 0) {
                        if (smokeEffect.sprite.framesCurrent < smokeEffect.sprite.framesMax - 1) {
                            smokeEffect.sprite.framesCurrent++
                        }
                    }
                }
                
                // 연기 애니메이션이 끝나면 제거
                if (smokeEffect.sprite.framesCurrent >= smokeEffect.sprite.framesMax - 1) {
                    this.smokeEffects.splice(i, 1)
                }
            }
        }

        this.position.x += this.velocity.x
        
        // 화면 경계 체크 - 좌우로 나가지 못하도록 제한
        // window.LEFT_BOUNDARY와 window.RIGHT_BOUNDARY를 사용하여 경계 조정 가능
        const currentCanvas = typeof window !== 'undefined' && window.canvas ? window.canvas : (typeof canvas !== 'undefined' ? canvas : null)
        
        if (currentCanvas) {
            // 현재 스프라이트의 실제 크기 계산
            const sprite = this.sprites[this.currentState]
            let frameWidth = 0
            
            if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
                const framesMax = sprite.framesMax
                frameWidth = Math.floor(sprite.image.width / framesMax)
            } else {
                frameWidth = this.width
            }
            
            const scaledWidth = frameWidth * this.scale
            
            // 경계 값 가져오기 (더미인 경우 더미 전용 경계 사용)
            let leftBoundary, rightBoundary;
            if (this.isDummy && typeof window !== 'undefined' && window.practiceDummyLeftBoundary !== undefined && window.practiceDummyRightBoundary !== undefined) {
                // 더미 전용 경계 사용
                leftBoundary = window.practiceDummyLeftBoundary;
                rightBoundary = window.practiceDummyRightBoundary;
            } else {
                // 일반 경계 사용
                leftBoundary = (typeof window !== 'undefined' && window.LEFT_BOUNDARY !== undefined) 
                    ? window.LEFT_BOUNDARY 
                    : 0;
                rightBoundary = (typeof window !== 'undefined' && window.RIGHT_BOUNDARY !== undefined) 
                    ? window.RIGHT_BOUNDARY 
                    : currentCanvas.width;
            }
            
            // 왼쪽 경계 체크
            if (this.position.x < leftBoundary) {
                this.position.x = leftBoundary
                this.velocity.x = 0
            }
            
            // 오른쪽 경계 체크
            if (this.position.x + scaledWidth > rightBoundary) {
                this.position.x = rightBoundary - scaledWidth
                this.velocity.x = 0
            }
        }
        
        this.position.y += this.velocity.y
        
        // 바닥(플로어 상단)에 닿았는지 확인
        if (typeof canvas !== 'undefined' && typeof gravity !== 'undefined') {
        const wasOnGround = this.isOnGround
            // 바닥 판정은 'idle' 스프라이트 기준 높이(스케일 적용)를 사용해 일관된 발 위치를 유지
            // 모든 모션에서 동일한 기준점 사용 (오프셋은 draw()에서만 적용)
            const idleSprite = this.sprites && this.sprites.idle
            const baselineHeight = (idleSprite && idleSprite.image && idleSprite.image.complete && idleSprite.image.height > 0)
                ? (idleSprite.image.height * this.scale)
                : (this.height * this.scale)
            // 지면은 플로어 상단
            const groundY = getFloorTopY()
            // 캐릭터별 위치 오프셋 적용 (음수면 위로, 양수면 아래로)
            const positionYOffset = this.characterPositionYOffset || 0
            // 히트박스 하단을 기준으로 바닥 판정
            const hitboxHeight = 150
            const imageYOffset = 20 // 모든 캐릭터 동일한 이미지 오프셋
            const currentFrameHeight = (idleSprite && idleSprite.image && idleSprite.image.complete && idleSprite.image.height > 0)
                ? idleSprite.image.height
                : this.height
            const currentScaledHeight = currentFrameHeight * this.scale
            // 히트박스 하단 = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
            const hitboxBottom = this.position.y + (currentScaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
            this.isOnGround = hitboxBottom >= groundY + CHARACTER_SINK
        
        if (this.isOnGround) {
            // 모든 캐릭터가 동일한 땅 높이에 서도록 히트박스 하단을 기준으로 계산
            // 히트박스 하단이 항상 groundY + CHARACTER_SINK에 오도록 position.y 설정
            const hitboxHeight = 150
            const imageYOffset = 20 // 모든 캐릭터 동일한 이미지 오프셋
            
            // 현재 스프라이트의 실제 높이 계산
            const currentSprite = this.sprites[this.currentState] || this.sprites.idle
            const currentFrameHeight = (currentSprite && currentSprite.image && currentSprite.image.complete && currentSprite.image.height > 0)
                ? currentSprite.image.height
                : this.height
            const currentScaledHeight = currentFrameHeight * this.scale
            
            // 히트박스 하단 = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
            // 따라서 position.y = (groundY + CHARACTER_SINK) - (scaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
            this.position.y = (groundY + CHARACTER_SINK) - (currentScaledHeight / 2) - (hitboxHeight / 2) - imageYOffset
            this.velocity.y = 0
                
            if (!wasOnGround) {
                this.canJump = true
                    // 착지 애니메이션
                    if (this.currentState !== 'attack' && this.currentState !== 'takeHit' && this.currentState !== 'death') {
                        this.switchSprite('idle')
                    }
            }
        } else {
            this.velocity.y += gravity
                
                // 공중에서 애니메이션
                if (this.velocity.y < 0 && this.currentState !== 'attack' && this.currentState !== 'takeHit' && this.currentState !== 'death') {
                    this.switchSprite('jump')
                } else if (this.velocity.y > 0 && this.currentState !== 'attack' && this.currentState !== 'takeHit' && this.currentState !== 'death') {
                    this.switchSprite('fall')
                }
            }
        }
    }
    
    attack() {
        // 대시 중이어도 공격 가능
        if (this.currentState !== 'attack' && this.currentState !== 'death') {
            this.isAttacking = true
            this.switchSprite('attack')
            // 공격 사운드 재생
            if (typeof window !== 'undefined' && window.sounds && window.sounds.slash) {
                window.sounds.slash.currentTime = 0;
                window.sounds.slash.play().catch(err => console.log('공격 사운드 재생 실패:', err));
            }
        }
    }
    
    dash() {
        // 대시 쿨타임이 없고, 공격 중이 아니고, 죽지 않았을 때만 대시 가능
        if (this.dashCooldown <= 0 && this.currentState !== 'attack' && this.currentState !== 'death' && !this.isDashing) {
            this.isDashing = true
            this.dashDuration = 20 // 대시 지속 시간 (프레임 단위) - 길이 증가
            // 캐릭터별 대시 쿨타임 설정
            let dashCooldownValue = 60; // 기본값 (로난, 챈): 1초 (60프레임)
            if (this.characterNum === 2) {
                // 쇼군: 대시 쿨타임 짧음 (30프레임 = 0.5초)
                dashCooldownValue = 30;
            }
            this.dashCooldown = dashCooldownValue;
            
            // 보는 방향으로 빠르게 이동
            if (this.flip) {
                // 왼쪽을 보고 있으면 왼쪽으로 대시
                this.velocity.x = -15
            } else {
                // 오른쪽을 보고 있으면 오른쪽으로 대시
                this.velocity.x = 15
            }
            
            // 대시 중에는 run 애니메이션 사용
            if (this.isOnGround) {
                this.switchSprite('run')
            }
            
            // 연기 이펙트 생성 (바닥 위치에 맞게)
            if (typeof canvas !== 'undefined' && typeof getFloorTopY !== 'undefined') {
                // 연기 이펙트 객체 생성 (플레이어 참조 포함)
                const smokeEffect = {
                    sprite: null,
                    fighter: this, // Fighter 참조 저장
                    initialized: false,
                    flip: this.flip // 플레이어가 보고 있는 방향 저장
                }
                
                // 플레이어 위치 계산 (히트박스 하단 기준)
                const sprite = this.sprites[this.currentState] || this.sprites.idle
                let frameHeight = 0
                if (sprite && sprite.image && sprite.image.complete && sprite.image.width > 0) {
                    frameHeight = sprite.image.height
                } else {
                    frameHeight = this.height
                }
                const scaledHeight = frameHeight * this.scale
                
                // 이미지 오프셋 계산
                const isBossMode = typeof window !== 'undefined' && window.isBossMode === true;
                const isEnemy = typeof window !== 'undefined' && window.enemy === this;
                const isBoss = isBossMode && isEnemy;
                const imageYOffsetBoss = 20;
                let imageYOffset;
                if (isBoss) {
                    imageYOffset = imageYOffsetBoss;
                } else {
                    // 캐릭터별 이미지 오프셋 사용
                    imageYOffset = this.characterImageYOffset || 20;
                }
                
                // 히트박스는 이미지 중앙에 배치되므로, 히트박스 하단 위치 계산
                const hitboxHeight = 150
                // 히트박스 Y = position.y + (scaledHeight / 2) - (hitboxHeight / 2) + imageYOffset
                // 히트박스 하단 = 히트박스 Y + hitboxHeight = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                const playerFootY = this.position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                const smokeX = this.position.x + (this.width * this.scale / 2)
                
                // Sprite 생성 (초기 위치를 플레이어 위치로 설정)
                // 대쉬 이펙트 Y 오프셋 적용
                const dashEffectYOffset = this.dashEffectYOffset || 0
                smokeEffect.sprite = new Sprite({
                    position: {
                        x: smokeX, // 초기 위치를 플레이어 중앙으로 설정
                        y: playerFootY + dashEffectYOffset // 초기 위치를 히트박스 하단(발 위치)로 설정 + 오프셋
                    },
                    imageSrc: 'img/Smoke N Dust 03-page-1.png',
                    canvas: canvas,
                    scale: 3.0, // 크기 증가
                    framesMax: 8,
                    framesCurrent: 0,
                    framesElapsed: 0,
                    framesHold: 3,
                    alignBottom: false
                })
                
                // 이미지 로드 후 위치 초기화
                const originalOnload = smokeEffect.sprite.image.onload
                smokeEffect.sprite.image.onload = () => {
                    // 기존 onload 실행
                    if (originalOnload) {
                        originalOnload.call(smokeEffect.sprite.image)
                    }
                    
                    // 위치 초기화
                    if (smokeEffect.sprite.image.complete && smokeEffect.sprite.image.height > 0) {
                        smokeEffect.initialized = true
                        smokeEffect.sprite.width = smokeEffect.sprite.image.width / 8
                        smokeEffect.sprite.height = smokeEffect.sprite.image.height
                        
                        // 초기 위치를 올바르게 설정 (히트박스 하단 기준)
                        const currentSprite = this.sprites[this.currentState] || this.sprites.idle
                        let currentFrameHeight = 0
                        if (currentSprite && currentSprite.image && currentSprite.image.complete && currentSprite.image.width > 0) {
                            currentFrameHeight = currentSprite.image.height
                        } else {
                            currentFrameHeight = this.height
                        }
                        const currentScaledHeight = currentFrameHeight * this.scale
                        
                        // 이미지 오프셋 계산
                        const currentIsBossMode = typeof window !== 'undefined' && window.isBossMode === true;
                        const currentIsEnemy = typeof window !== 'undefined' && window.enemy === this;
                        const currentIsBoss = currentIsBossMode && currentIsEnemy;
                        const currentImageYOffset = currentIsBoss ? 20 : (this.color === 'red' ? 20 : 20); // 모든 캐릭터 동일
                        
                        // 히트박스는 이미지 중앙에 배치되므로, 히트박스 하단 위치 계산
                        const currentHitboxHeight = 150
                        // 히트박스 Y = position.y + (scaledHeight / 2) - (hitboxHeight / 2) + imageYOffset
                        // 히트박스 하단 = 히트박스 Y + hitboxHeight = position.y + (scaledHeight / 2) + (hitboxHeight / 2) + imageYOffset
                        const currentPlayerFootY = this.position.y + (currentScaledHeight / 2) + (currentHitboxHeight / 2) + currentImageYOffset
                        
                        const smokeHeight = smokeEffect.sprite.height * smokeEffect.sprite.scale
                        const smokeWidth = smokeEffect.sprite.width * smokeEffect.sprite.scale
                        const backOffset = 40
                        
                        // 연기 하단이 히트박스 하단(발 위치)에 붙도록 위치 조정
                        smokeEffect.sprite.position.y = currentPlayerFootY - smokeHeight
                        if (this.flip) {
                            smokeEffect.sprite.position.x = smokeX - (smokeWidth / 2) + backOffset
                        } else {
                            smokeEffect.sprite.position.x = smokeX - (smokeWidth / 2) - backOffset
                        }
                    }
                }
                
                // 이미 로드된 경우 즉시 처리
                if (smokeEffect.sprite.image.complete) {
                    smokeEffect.sprite.image.onload()
                }
                
                this.smokeEffects.push(smokeEffect)
            }
            
            // 대시가 실제로 시작되었을 때만 사운드 재생 (한 번만)
            if (typeof window !== 'undefined' && window.sounds && window.sounds.dash) {
                // 사운드가 이미 재생 중이면 중지하고 처음부터 재생
                if (!window.sounds.dash.paused) {
                    window.sounds.dash.pause();
                }
                window.sounds.dash.currentTime = 0;
                window.sounds.dash.play().catch(err => console.log('대시 사운드 재생 실패:', err));
            }
        }
    }
    
    takeHit(attackerDirection = null) {
        if (this.currentState !== 'death' && this.currentState !== 'takeHit') {
            this.switchSprite('takeHit')
            
            // 공격 받을 때 사운드 재생
            if (typeof window !== 'undefined' && window.sounds && window.sounds.attacked) {
                window.sounds.attacked.currentTime = 0;
                window.sounds.attacked.play().catch(err => console.log('공격 받음 사운드 재생 실패:', err));
            }
            
            // 경직 상태 설정
            this.isStunned = true
            this.stunTimer = 10 // 경직 시간 (프레임 단위)
        }
    }
}