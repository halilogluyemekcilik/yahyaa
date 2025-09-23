import Game from '.';
import { GAME_STATUS, Obstacal, playerStatus } from './const';
import Environment, { roadLength, roadWidth } from './environment';
// import {SceneOctree} from './octree';
import * as THREE from 'three';
import { EventEmitter } from 'events';
import Player from './player';
// @ts-ignore
import showToast from '../components/Toast/index.js';
enum Side {
    FRONT,
    BACK,
    LEFT,
    RIGHT,
    DOWN,
    FRONTDOWN,
    UP
}
export class ControlPlayer extends EventEmitter {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    status!: string;
    renderer!: THREE.WebGLRenderer;
    score: number = 0;
    coin: number = 0;
    allAnimate: Record<string, THREE.AnimationAction>;
    // velocity = new THREE.Vector3(0, 0, 0);
    runVelocity: number;
    maxRunVelocity: number;
    speedIncreaseIntervalMs: number;
    lastSpeedIncreaseAt: number = Date.now();
    jumpHight: number;
    targetPosition!: number;
    // Mevcut şerit (1-2-3)
    way!: number;
    lastPosition!: number;
    // sceneOctree!: SceneOctree;
    isJumping: boolean = false;
    capsule!: THREE.Mesh<THREE.CapsuleGeometry, THREE.MeshNormalMaterial>;
    game: Game;
    player: Player;
    scene: THREE.Scene = new THREE.Scene();
    smallMistake!: number;
    far: number;
    key!: string;
    // Orijinal/önceki şerit konumu
    originLocation!: THREE.Vector3;
    // Tekil sağ/sol çarpışmayı işlemek için bayrak
    removeHandle: boolean = true;
    lastAnimation!: string;
    // Şu an yuvarlanma animasyonu oynuyor mu
    roll!: boolean;
    // Şu an arkaya bakma animasyonu oynuyor mu
    runlookback!: boolean;
    // Oyuncunun koştuğu toplam mesafe
    playerRunDistance!: number;
    environement: Environment = new Environment();
    // Oyuncunun bulunduğu zemin bloğu indeksi
    currentPlane: number = -1;
    // Yeni zemin eklenecek mi (sonsuz yol için)
    isAddPlane: boolean = false;
    fallingSpeed: number = 0; // düşüş hızı
    downCollide: boolean = false; // karakter zeminde mi

    gameStatus: GAME_STATUS = GAME_STATUS.READY; // oyun durumu
    gameStart: boolean = false;
    raycasterDown: THREE.Raycaster;
    raycasterFrontDown: THREE.Raycaster;
    raycasterFront: THREE.Raycaster;
    raycasterRight: THREE.Raycaster;
    raycasterLeft: THREE.Raycaster;
    frontCollide: boolean;
    firstFrontCollide: Record<string, any> = { isCollide: true, collideInfo: null };
    frontCollideInfo: any;
    leftCollide: boolean;
    rightCollide: boolean;
    upCollide: boolean;
    constructor(
        model: THREE.Group,
        mixer: THREE.AnimationMixer,
        currentAction: string = 'run',
        allAnimate: Record<string, THREE.AnimationAction>
    ) {
        super();
        this.model = model;
        this.mixer = mixer;
        this.game = new Game();
        this.player = new Player();
        this.scene = this.game.scene;
        this.allAnimate = allAnimate;
        // Koşu hızı
        this.runVelocity = 20;
        // Karakterin maksimum hız limiti
        this.maxRunVelocity = 100;
        this.speedIncreaseIntervalMs = 3000; // her 3 sn'de 1 artış
        // Zıplama yüksekliği (bir tık artırıldı)
        this.jumpHight = 3.8;
        this.gameStart = false;
        this.far = 2.5; // karakter yüksekliği referansı
        this.raycasterDown = new THREE.Raycaster();
        this.raycasterFrontDown = new THREE.Raycaster();
        this.raycasterFront = new THREE.Raycaster();
        this.raycasterRight = new THREE.Raycaster();
        this.raycasterLeft = new THREE.Raycaster();
        this.frontCollide = false;
        this.leftCollide = false;
        this.rightCollide = false;
        this.downCollide = true;
        this.upCollide = false;
        this.isJumping = false;
        this.startGame(currentAction, model);
        this.addAnimationListener();
        this.initRaycaster();
    }
    // Oyunu başlatırken başlangıç durumlarını ayarla
    startGame(currentAction: string, model: THREE.Group) {
        this.status = currentAction;
        this.allAnimate[currentAction].play();
        this.lastAnimation = currentAction;
        // Mevcut şerit
        this.way = 2;
        // Yuvarlanma durumu
        this.roll = false;
        // Arkaya bakma durumu
        this.runlookback = false;
        this.playerRunDistance = model.position.z;
        this.smallMistake = 0;
        this.key = '';
        this.originLocation = model.position;
        this.lastPosition = model.position.x;
        this.targetPosition = 0;
    }

    initRaycaster() {
        // Başlangıç yön vektörü oluştur (ör. Z eksenine doğru)
        const initialDirection = new THREE.Vector3(0, -1, 0);
        // Quaternion ile 30 derece döndür
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6); // 30 derece
        // Başlangıç yönünü ~30 derece döndür
        const direction = initialDirection.clone().applyQuaternion(rotation).normalize();
        this.raycasterFrontDown.ray.direction = new THREE.Vector3(0, 1, 0);
        // Eğik aşağı bakan ışın
        this.raycasterDown.ray.direction = new THREE.Vector3(0, -1, 0);
        this.raycasterFrontDown.ray.direction = direction;
        this.raycasterLeft.ray.direction = new THREE.Vector3(-1, 0, 0);
        this.raycasterRight.ray.direction = new THREE.Vector3(1, 0, 0);

        this.raycasterDown.far = 5.8;
        this.raycasterFrontDown.far = 3;
    }
    // @ts-ignore
    addAnimationListener() {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const key = e.key;
            // Oyunu başlat
            if (key === 'p') {
                if (!this.gameStart) {
                    this.gameStart = true;
                    this.gameStatus = GAME_STATUS.START;
                    this.key === 'p';
                    this.game.emit('gameStatus', this.gameStatus);
                }
            }
            else if (
                key === 'w'
                && this.status !== playerStatus.JUMP
                && this.status !== playerStatus.FALL
                && this.downCollide
            ) {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }

                this.key = 'w';
                this.downCollide = false;
                this.isJumping = true;
                setTimeout(() => {
                    this.isJumping = false;
                }, 50);
                // Biraz daha kısa toplam süre için impuls hafif düşürüldü
                this.fallingSpeed += this.jumpHight * 0.11;
            }
            else if (key === 's' && !this.roll && this.status !== playerStatus.ROLL) {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                this.roll = true;
                setTimeout(() => {
                    this.roll = false;
                }, 620);
                this.key = 's';
                this.fallingSpeed = -5 * 0.1;
            }
            else if (key === 'a') {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                // En sol şeritteyse uyarı ver ve geri sektir
                if (this.way === 1) {
                    this.runlookback = true;
                    this.emit('collision');
                    showToast('Engele çarptın! Lütfen dikkat et!');
                    setTimeout(() => {
                        this.runlookback = false;
                    }, 1040);
                    this.smallMistake += 1;
                    return;
                }
                this.way -= 1;
                this.originLocation = this.model.position.clone();
                this.lastPosition = this.model.position.clone().x;
                this.targetPosition -= roadWidth / 3;
            }
            else if (key === 'd') {
                if (!this.gameStart || this.status === playerStatus.DIE) {
                    return;
                }
                if (this.way === 3) {
                    this.runlookback = true;
                    this.emit('collision');
                    showToast('Engele çarptın! Lütfen dikkat et!');
                    setTimeout(() => {
                        this.runlookback = false;
                    }, 1040);
                    this.smallMistake += 1;
                    return;
                }
                this.originLocation = this.model.position.clone();
                this.lastPosition = this.model.position.clone().x;
                this.targetPosition += roadWidth / 3;
                this.way += 1;
            }
            else if (key === 'r') {
                this.gameStatus = GAME_STATUS.READY;
                this.game.emit('gameStatus', this.gameStatus);
                this.smallMistake = 0;
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }
                // disposeNode(this.scene);
                this.environement.startGame();
                this.player.createPlayer(false);
            }
        });

        // Dokunmatik ekranlar için kaydırma ile kontrol
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const minDistance = 24; // minimum piksel mesafesi
        const maxTime = 600; // ms

        function dispatchKey(key: string) {
            const evt = new KeyboardEvent('keydown', { key });
            window.dispatchEvent(evt);
        }

        window.addEventListener('touchstart', (e: TouchEvent) => {
            const t = e.changedTouches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        window.addEventListener('touchend', (e: TouchEvent) => {
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;
            if (dt > maxTime) {
                return;
            }
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            if (adx < minDistance && ady < minDistance) {
                return;
            }
            if (adx > ady) {
                // yatay kaydırma
                if (dx > 0) {
                    dispatchKey('d'); // sağ
                } else {
                    dispatchKey('a'); // sol
                }
            } else {
                // dikey kaydırma
                if (dy < 0) {
                    dispatchKey('w'); // yukarı: zıpla
                } else {
                    dispatchKey('s'); // aşağı: yuvarlan
                }
            }
        }, { passive: true });

        // Mouse ile sürükleme (drag) desteği
        let mouseStartX = 0;
        let mouseStartY = 0;
        let mouseDownTime = 0;
        let mouseDown = false;

        window.addEventListener('mousedown', (e: MouseEvent) => {
            mouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            mouseDownTime = Date.now();
        });

        window.addEventListener('mouseup', (e: MouseEvent) => {
            if (!mouseDown) return;
            mouseDown = false;
            const dx = e.clientX - mouseStartX;
            const dy = e.clientY - mouseStartY;
            const dt = Date.now() - mouseDownTime;
            if (dt > maxTime) return;
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            if (adx < minDistance && ady < minDistance) return;
            if (adx > ady) {
                if (dx > 0) dispatchKey('d'); else dispatchKey('a');
            } else {
                if (dy < 0) dispatchKey('w'); else dispatchKey('s');
            }
        });
    }
    // Sağ/sol hareket kontrolü
    handleLeftRightMove() {
        const targetPosition = this.targetPosition;
        const lastPosition = this.lastPosition;
        if (Math.abs(targetPosition - lastPosition) < 1) {
            this.removeHandle = true;
        }
        if (targetPosition !== lastPosition) {
            // Tek çarpışmayı handle et ve sağ/sol çarpışmada geri sektir
            if ((this.leftCollide || this.rightCollide) && this.removeHandle) {
                this.smallMistake += 1;
                this.emit('collision');
                showToast('Engele çarptın! Lütfen dikkat et!');
                this.targetPosition = this.originLocation.x;
                this.removeHandle = false;
                if (targetPosition > lastPosition) {
                    this.way -= 1;
                }
                else {
                    this.way += 1;
                }
            }
            // Yumuşak geçiş hareketi
            const moveSpeed = 0.15; // hareket hızı
            const diff = targetPosition - lastPosition;
            if (Math.abs(diff) > 0.0001) {
                this.model.position.x += diff * moveSpeed;
                this.lastPosition += diff * moveSpeed;
            }
        }
    }
    // Yukarı/aşağı hareket kontrolü (boş)
    handleUpdownMove() {
    }
    // Tüm ışınlarla çarpışma kontrolü
    collideCheckAll() {
        const position = this.model.position.clone();
        try {
            // Zemin tespiti: far ışın uzunluğu
            this.collideCheck(Side.DOWN, position, 5);
            this.collideCheck(Side.FRONTDOWN, position, 3);
            this.collideCheck(Side.FRONT, position, 2);
            this.collideCheck(Side.LEFT, position, 1);
            this.collideCheck(Side.RIGHT, position, 1);
        }
        catch (error) {
            console.log(error);
        }

    }
    // Tek ışın çarpışma kontrolü
    collideCheck(
        side: Side,
        position: THREE.Vector3,
        far: number = 2.5
    ) {
        const { x, y, z } = position;
        switch (side) {
            case Side.DOWN:
                this.raycasterDown.ray.origin = new THREE.Vector3(x, y + 4, z + 0.5);
                this.raycasterDown.far = far;
                break;
            case Side.FRONTDOWN:
                this.raycasterFrontDown.ray.origin = new THREE.Vector3(x, y + 2, z);
                this.raycasterFrontDown.far = far;
                break;
            case Side.FRONT:
                this.raycasterFront.ray.origin = new THREE.Vector3(x, y + 2, z - 1);
                this.raycasterFront.far = far;
            case Side.LEFT:
                this.raycasterLeft.ray.origin = new THREE.Vector3(x + 0.5, y + 2, z);
                this.raycasterLeft.far = far;
            case Side.RIGHT:
                this.raycasterRight.ray.origin = new THREE.Vector3(x - 0.5, y + 2, z);
                this.raycasterRight.far = far;
        }
        // const arrowHelper = new THREE.ArrowHelper(
        //     this.raycasterFront.ray.direction,
        //     this.raycasterFront.ray.origin,
        //     this.raycasterFront.far,
        //     0xff0000
        // );
        // this.scene.add(arrowHelper);
        const ds = this.playerRunDistance;
        // Bulunulan zemin bloğu indeksi
        const nowPlane = Math.floor(ds / roadLength);
        const intersectPlane = this.environement.plane?.[nowPlane];
        const intersectObstacal = this.environement.obstacal?.[nowPlane];
        const intersectCoin = this.environement.coin?.[nowPlane];
        if (!intersectObstacal && !intersectPlane) {
            return;
        }
        // update collide
        const origin = new THREE.Vector3(x, position.y + 3, z);
        const originDown = new THREE.Vector3(x, position.y + 4.6, z - 0.5);
        switch (side) {
            case Side.DOWN: {
                if (!intersectPlane) {
                    return;
                }
                const c1 = this.raycasterDown.intersectObjects(
                    [intersectPlane, intersectObstacal]
                )[0]?.object.name;
                this.raycasterDown.ray.origin = originDown;
                const c2 = this.raycasterDown.intersectObjects(
                    [intersectPlane, intersectObstacal]
                )[0]?.object.name;
                c1 || c2 ? (this.downCollide = true) : (this.downCollide = false);
                break;
            }
            case Side.FRONT: {
                const r1 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterFront.far = 1.5;
                const r2 = this.raycasterFront.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // Çarpışma noktası bilgisi
                const c2 = r2Name && r2Name !== 'coin';
                this.frontCollideInfo = r1 || r2;
                c1 || c2 ? (this.frontCollide = true) : (this.frontCollide = false);
                break;
            }
            case Side.FRONTDOWN: {
                const r1 = this.raycasterFrontDown.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                c1 ? (this.frontCollide = true) : (this.frontCollide = false);
                break;
            }
            case Side.LEFT: {
                const r1 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterLeft.ray.origin = origin;
                const r2 = this.raycasterLeft.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // Çarpışma noktası bilgisi
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.leftCollide = true) : (this.leftCollide = false);
                break;
            }
            case Side.RIGHT: {
                const r1 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r1Name = r1?.object.name;
                if (r1Name === 'coin') {
                    r1.object.visible = false;
                    this.coin += 1;
                }
                const c1 = r1Name && r1Name !== 'coin';
                this.raycasterRight.ray.origin = origin;
                const r2 = this.raycasterRight.intersectObjects([intersectObstacal, intersectCoin])[0];
                const r2Name = r2?.object.name;
                if (r2Name === 'coin') {
                    r2.object.visible = false;
                    this.coin += 1;
                }
                // Çarpışma noktası bilgisi
                const c2 = r2Name && r2Name !== 'coin';
                c1 || c2 ? (this.rightCollide = true) : (this.rightCollide = false);
                break;
            }
        }
    }
    // Karakter animasyon/durum geçiş kontrolü
    changeStatus(delta: number) {
        if (!this.gameStart) {
            return;
        }
        const moveZ = this.runVelocity * delta;
        if (!this.frontCollide) {
            if (this.status !== playerStatus.DIE) {
                this.playerRunDistance += moveZ;
                this.model.position.z -= moveZ;
            }
        }
        if (this.status === playerStatus.DIE) {
            this.status = playerStatus.DIE;
        }
        else if (this.fallingSpeed > 0) {
            this.status = playerStatus.JUMP;
        }
        else if (this.fallingSpeed < 0 && this.key !== 's') {
            this.status = playerStatus.FALL;
        }
        else if (this.roll) {
            this.status = playerStatus.ROLL;
        }
        else if (this.key === 'p') {
            this.status = playerStatus.RUN;
        }
        else if (!this.roll && this.fallingSpeed === 0 && !this.runlookback) {
            this.status = playerStatus.RUN;
        }
        else if (this.runlookback) {
            this.status = playerStatus.RUNLOOKBACK;
        }
        // Aynı animasyon tekrar tetiklenmesin
        if (this.status === this.lastAnimation) {
            return;
        }
        this.lastAnimation && this.allAnimate[this.lastAnimation].fadeOut(0.1);
        this.allAnimate[this.status].reset().fadeIn(0.1).play();
        this.lastAnimation = this.status;
    }
    // Oyuncu mesafesini kontrol et
    checkPlayerDistance() {
        const ds = this.playerRunDistance;
        // Bulunulan zemin bloğu
        const nowPlane = Math.floor(ds / roadLength) + 1;

        // Bulunduğu bloğun uzunluğuna göre ilerleme yüzdesi
        // %45'i geçince dinamik olarak yeni sahne ekle (sonsuz yol)
        const runToLength = (ds - roadLength * (nowPlane - 1)) / roadLength;
        if (runToLength > 0.45 && this.currentPlane !== nowPlane) {
            console.log('Bir sonraki zemin eklendi');
            this.currentPlane = nowPlane;
            this.environement.z -= roadLength;
            const newZ = this.environement.z;
            // Z ekseni boyunca konumlandır
            this.environement.setGroupScene(newZ, -5 - nowPlane * roadLength, false);
        }
    }
    // Öne doğru çarpışma kontrolü ve sonuçları
    frontCollideCheckStatus() {
        if (this.frontCollide && this.firstFrontCollide.isCollide) {
            const { object } = this.frontCollideInfo;
            const { y } = this.frontCollideInfo.point;
            const point = Number(y - 2);
            const obstacal = Number(Obstacal[object.name]?.y);
            // Çarpışma alanı yüzdesini hesapla
            const locateObstacal = point / obstacal;
            console.log('Engel', object.name, 'çarpışma yüzdesi', locateObstacal);
            this.firstFrontCollide = { isCollide: false, name: object.name };
            // Çarpışma alanı > 0.75 ise oyun biter ve ölüm animasyonu oynatılır
            if (locateObstacal < 0.75) {
                this.status = playerStatus.DIE;
                this.gameStatus = GAME_STATUS.END;
                showToast('Öldün! Lütfen oyunu yeniden başlat!');
                this.game.emit('gameStatus', this.gameStatus);
            }
            else {
                this.fallingSpeed += 0.4;
                this.model.position.y += obstacal * (1 - locateObstacal);
                this.smallMistake += 1;
                this.emit('collision');
                showToast('Engele çarptın! Lütfen dikkat et!');
                this.firstFrontCollide.isCollide = false;
                setTimeout(() => {
                    this.firstFrontCollide.isCollide = true;
                }, 400);

            }

        }
    }
    // Altın (coin) döndürme animasyonu
    coinRotate() {
        const ds = this.playerRunDistance;
        // Bulunulan zemin bloğu
        const nowPlane = Math.floor(ds / roadLength);
        const nowPlane1 = nowPlane + 1;
        const intersectCoin = this.environement.coin?.[nowPlane];
        const intersectCoin1 = this.environement.coin?.[nowPlane1];
        // İki sahnedeki coin'lere döndürme animasyonu uygula
        intersectCoin && intersectCoin.traverse(mesh => {
            if (mesh.name === 'coin') {
                mesh.rotation.z += Math.random() * 0.1;
            }
        });
        intersectCoin1 && intersectCoin1.traverse(mesh => {
            if (mesh.name === 'coin') {
                mesh.rotation.z += Math.random() * 0.1;
            }
        });
    }
    // Oyun durumunu kontrol et
    checkGameStatus() {
        const mistake = this.smallMistake;
        // Küçük hata sayısı 2'ye ulaşınca oyunu bitir
        if (mistake >= 2 && this.gameStatus !== GAME_STATUS.END) {
            this.status = playerStatus.DIE;
            this.gameStatus = GAME_STATUS.END;
            this.game.emit('gameStatus', this.gameStatus);
        }
    }
    update(delta: number) {
        // Oyun başladıysa belirli aralıklarla hızı kademeli artır
        if (this.gameStatus === GAME_STATUS.START) {
            const now = Date.now();
            if (now - this.lastSpeedIncreaseAt >= this.speedIncreaseIntervalMs) {
                this.runVelocity = Math.min(this.maxRunVelocity, this.runVelocity + 1);
                this.lastSpeedIncreaseAt = now;
            }
        }
        this.changeStatus(delta);
        this.handleLeftRightMove();
        this.checkPlayerDistance();
        this.collideCheckAll();
        this.frontCollideCheckStatus();
        this.coinRotate();
        this.checkGameStatus();
        if (this.gameStatus === GAME_STATUS.START) {
            this.game.emit('gameData', { score: this.score += 20, coin: this.coin, mistake: this.smallMistake });
        }
        // Yerçekimi ve zıplama hareketi
        if (this.isJumping || !this.downCollide) {
            // Toplam havada kalma biraz daha kısaltıldı
            const ratio = 0.10;
            this.fallingSpeed += -9.2 * ratio * delta;
            this.model.position.add(new THREE.Vector3(0, this.fallingSpeed, 0));
        }
        else {
            this.fallingSpeed = 0;
        }
    }
}
