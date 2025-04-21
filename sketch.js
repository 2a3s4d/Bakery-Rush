const DIRECTION = { // direction "enum"
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2
};

const GAME_STATE = { // Game state "enum"
	MAIN_MENU: 0,
	IN_GAME: 1,
	CRASHED: 2
};

const van = { // van data
	direction: DIRECTION.CENTER,
	vanX: 0,
	vanY: 0,
	speed: 60,
	acceleration: 0
};

let obstacleCars = [];
let obstacleSpawnTimer = 0;

var minSpeed = 10
var maxSpeed = 200;

let ani;
let vanAnchorX;
let vanAnchorY;
let roadAni;
var buttonHeldTime = 0;

let roadMarkersY = 0;

let gameState = GAME_STATE.PLAYING;

function preload () {
	// preload because otherwise it breaks sometimes
	vanAnims = loadImage("Sprites/BakeryRush_Van-Sheet.png");
	cityAnim = loadImage("Sprites/CityBackground.png");
	roadAnim = loadImage("Sprites/Road_Sprite.png");
	roadMarkers = loadImage("Sprites/Road_Markers.png");
	carSprites = loadImage("Sprites/Cars.png");
}

function setup() {
	new Canvas(windowWidth, windowHeight, "pixelated");

	ani = loadAni(vanAnims, {width: 256, height: 256, frames: 3});
	ani.pause();
	ani.frame = 1;
	roadAni = loadAni(roadAnim, {width: 768, height: 512, frames: 1});
	roadAni.scale.x = 2	;
	roadAni.scale.y = 1.2;
	roadAni.frameDelay = 20;

	carAni = loadAni(carSprites, {width: 256, height: 256, frames: 4});
	carAni.pause();

	cityAni = loadAni(cityAnim, {width: 768, height: 512, frames: 1});
	cityAni.scale.x = 2	;
	cityAni.scale.y = 1.2;
	vanAnchorX = (windowWidth / 2);
	vanAnchorY = windowHeight - roadAni.height / 2;
	//roadAni.scale.y = 2;
	textSize(20);
	frameRate(60);
}

function update() {
	background('lavender')
	//clear();
	if (gameState == GAME_STATE.PLAYING) {
		animation(roadAni, (windowWidth / 2), windowHeight - (roadAni.height * roadAni.scale.y) / 2);
		image(roadMarkers, (windowWidth / 2), roadMarkersY, 8, 768)
		image(roadMarkers, (windowWidth / 2), windowHeight - (roadAni.height * roadAni.scale.y) + roadMarkersY, 8, 768)
		roadMarkersY += lerp(1, 10, van.speed / 200);
		
		animation(cityAni, (windowWidth / 2), (cityAni.height * cityAni.scale.y) / 8);
		
		// DEBUG TEXT
		text(van.acceleration, 12, 30, 20, 6);
		text(van.speed, 12, 50, 20, 6);

		handleButtonPress()
		
		// set van speed based of acceleration
		van.speed = constrain(van.speed + van.acceleration, minSpeed, maxSpeed);
		//roadAni.frameDelay = ceil(lerp(25, 3, van.speed / maxSpeed));
		//print(ceil(lerp(3, 25, van.speed / maxSpeed)));

		// make van not go off screen
		van.vanY = constrain(van.vanY, -windowHeight / 10, windowHeight / 10);
		van.vanX = constrain(van.vanX, -windowWidth / 4, windowWidth / 4);

		// draw van
		animation(ani, vanAnchorX + van.vanX, vanAnchorY + van.vanY);

		obstacleSpawnTimer--;
		if (obstacleSpawnTimer <= 0) {
			spawnObstacle();
			obstacleSpawnTimer = 60 + random(30); // spawn new car at variable time
		}

		// draw obstacles
		for (let i = obstacleCars.length - 1; i >= 0; i--) {
			let obs = obstacleCars[i];
		
			// adjust Y gain relative on vans speed
			let relativeSpeed = obs.baseSpeed - van.speed;
			obs.y -= relativeSpeed;
			
			// Draw obstacle
			//fill('red');
			carAni.frame = obs.spriteIndex;
			
			animation(carAni, obs.x, obs.y);
		
			// Remove if offscreen
			if (obs.y + obs.height < windowHeight - (roadAni.height * roadAni.scale.y)) {
				obstacleCars.splice(i, 1);
			}
		}
	}
}

function spawnObstacle() {
	const laneOffsets = [-windowWidth / 4, 0, windowWidth / 4]; // LEFT, CENTER, RIGHT lanes
	let lane = floor(random(0, 3));
	let obs = {
		//sprite: new Sprite(),
		x: (windowWidth / 2) + laneOffsets[lane],
		y: windowHeight + 50,
		width: 60,
		height: 100,
		baseSpeed: random(van.speed - 5, van.speed + 5),
		spriteIndex: round(random(0, 3))
	};
	obstacleCars.push(obs);
}

function handleButtonPress () {
	// update van animation frame and direction based off button press
	if (kb.pressing('ArrowLeft')) {
		if (van.direction != DIRECTION.LEFT) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.LEFT;
			ani.frame = 0;
		}
		// update position based on how long button has been pressed
		van.vanX -= min(0.2 * buttonHeldTime, 10);
		buttonHeldTime++; // 
	}
	else if (kb.pressing('ArrowRight')) {
		if (van.direction != DIRECTION.RIGHT) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.RIGHT;
			ani.frame = 2;
		}
		van.vanX += min(0.2 * buttonHeldTime, 10);
		buttonHeldTime++;
	}
	else {
		if (van.direction != DIRECTION.CENTER) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.CENTER;
			ani.frame = 1;
		}
	}

	// add or remove acceleration based on button press
	if (kb.pressing('ArrowUp')) {
		van.acceleration = min(van.acceleration + 0.01, 0.5);
		van.vanY -= van.acceleration;
	} 
	else if (kb.pressing('ArrowDown')) {
		van.acceleration = max(van.acceleration - 0.01, -0.5);
		van.vanY -= van.acceleration;
	} 
	else {
		// kinda lerp to acceleration to 0 if button not pressed
		if (van.acceleration > 0) {
			van.acceleration = max(van.acceleration - 0.1, 0);
		} 
		else if (van.acceleration < 0) {
			van.acceleration = min(van.acceleration + 0.1, 0);
		}
		// return to middle smoothly
		van.vanY += (0 - van.vanY) * 0.05; 
	}
}