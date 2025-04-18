const DIRECTION = { // direction "enum"
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2
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
var buttonHeldTime = 0;

function preload () {
	// preload because otherwise it breaks sometimes
	vanAnims = loadImage("Sprites/BakeryRush_Van-Sheet.png");
}

function setup() {
	new Canvas(windowWidth, windowHeight);
	
	ani = loadAni(vanAnims, {width: 256, height: 256, frames: 3});
	ani.pause();
	ani.frame = 1;
	textSize(20);
	frameRate(60);
}

function update() {
	background('lavender')

	// DEBUG TEXT
	text(van.acceleration, 12, 30, 20, 6);
	text(van.speed, 12, 50, 20, 6);

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
	
	// set van speed based of acceleration
	van.speed = constrain(van.speed + van.acceleration, minSpeed, maxSpeed);

	// make van not go off screen
	van.vanY = constrain(van.vanY, -windowHeight / 10, windowHeight / 10);
	van.vanX = constrain(van.vanX, -windowWidth / 6, windowWidth / 6);

	// draw van
	animation(ani, (windowWidth / 2) + van.vanX, (windowHeight / 2) + van.vanY);

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
		fill('red');
		noStroke();
		rect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
	
		// Remove if offscreen
		if (obs.y + obs.height < 0) {
			obstacleCars.splice(i, 1);
		}
	}
}

function spawnObstacle() {
	let offset = random(-windowWidth / 6, windowWidth / 6);
	let obs = {
		x: (windowWidth / 2) + offset,
		y: windowHeight + 50,
		width: 60,
		height: 100,
		baseSpeed: random(60, 65)
	};
	obstacleCars.push(obs);
}
