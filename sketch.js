const DIRECTION = { // direction "enum"
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2
};

const GAME_STATE = { // Game state "enum"
	MAIN_MENU: 0,
	IN_GAME: 1,
	CRASHED: 2,
	PAUSED: 3, // not used
	DEATH_SCREEN: 4 // not used
};

const van = { // van data
	direction: DIRECTION.CENTER,
	x: 0,
	y: 0,
	speed: 7.5,
	acceleration: 0,
	distance: 0,
	collider: null,
	ani: null,
};
// van min and max speeds
var minSpeed = 5;
var maxSpeed = 10;
let vanSprite;
// make van in middle of screen
let vanAnchorX;
let vanAnchorY;

// other car array + timer
let cars = [];
let carSpawnTimer = 0;

// for left and right movement
var buttonHeldTime = 0;

let roadOffset = 0; // scroll road

// game state
let gameState = GAME_STATE.MAIN_MENU;

// fade when crashed
let fadeOpacity = -150;
let fading = false;

let dropDistance;
let dropSide = DIRECTION.LEFT;

let points = 0;

let highScore = 0;
let gameLength = 120;
let timeRemaining = 60 * gameLength;

function preload () {
	// preload images
	vanAnims = loadImage("Sprites/BakeryRushVan_TopDown.png");
	roadImage = loadImage("Sprites/Road_TopDown.png");
	carSprites = loadImage("Sprites/Cars_TopDown.png");
	cookieImage = loadImage("Sprites/Cookie.png");
}

function setup() {
	new Canvas(windowWidth, windowHeight, "pixelated");
	van.ani = loadAni(vanAnims, {width: 256, height: 256, frames: 3});
	van.ani.pause();
	van.ani.frame = 1;
	van.collider = new Sprite(0, 0, van.ani.width / 2, van.ani.height / 2, STATIC);
	van.collider.visible = false;

	carAni = loadAni(carSprites, {width: 256, height: 256, frames: 4});
	carAni.pause();

	vanAnchorX = windowWidth / 2;
	vanAnchorY = windowHeight / 2;
	droppedGoods = new Group();
}

function update() {
	
	background('lavender')
	//clear();
	if (gameState == GAME_STATE.MAIN_MENU) {
		drawMainMenu();
	}
	else if (gameState == GAME_STATE.PLAYING) {

		if (timeRemaining <= 0) {
			if (points > highScore) {
				highScore = points;
			}
			van.speed = 0;
			gameState = GAME_STATE.CRASHED;
			fading = true;
		}

		if (dropDistance == null) {
			dropDistance = floor(10000 + random(-5 * 500, 5 * 500));
			if (random(0, 2) <= 1) {
				dropSide = DIRECTION.LEFT;
			}
			else {
				dropSide = DIRECTION.RIGHT;
			}
		}
		drawRoad();
		
		handleButtonPress();

		// draw image from group
		for (let i = droppedGoods.length - 1; i >= 0; i--) { // decrementing better for removing items
			let box = droppedGoods[i];
			box.position.x += box.velocity.x;
			box.position.y += box.velocity.y;
			box.rotation += box.rotationSpeed;
		
			box.velocity.y += 0.3;
		
			push();
			translate(box.position.x, box.position.y);
			rotate(box.rotation);
			imageMode(CENTER);
			image(cookieImage, 0, 0);
			pop();
		
			box.life--;
			if (box.life <= 0) {
				droppedGoods.splice(i, 1);
			}
		}
		
		// DEBUG TEXT
		textAlign(LEFT, CENTER);
		fill(0);
		text(`Time Remaining: ${floor(timeRemaining / 60 )}`,10, 30);
		text(`Drop Distance: ${floor(dropDistance)}`, 10, 60);
		text(`Points: ${points}`, 10, 90);


		// draw van
		drawVan();

		handleCars();

		handleGoal();

		if (dropDistance < -1000) {
			dropDistance = null;
		}

		timeRemaining -= 1;
		
	}
	else if (gameState == GAME_STATE.CRASHED) {
		// not using draw road since the offset lerp is still above 0 and it looks werid
		image(roadImage, (windowWidth / 2) - 512, roadOffset - 1920, 1024, 1920);
		image(roadImage, (windowWidth / 2) - 512, roadOffset, 1024, 1920);
		drawVan();
		carSpawnTimer--;
		if (carSpawnTimer <= 0) {
			spawnObstacle();
			carSpawnTimer = 60 + random(30); // spawn new car at variable time
		}

		// didn't use handleCars because not detecting collision and not using relative speed
		for (let i = cars.length - 1; i >= 0; i--) {
			let car = cars[i];
		
			// adjust Y gain relative on vans speed
			car.y -= car.speed;
			
			// draw car based on colour
			carAni.frame = car.spriteIndex;

			animation(carAni, car.x, car.y);
			car.collider.x = car.x;
			car.collider.y = car.y;
			
		}
		if (fading) { // fade camera after a second or so
		
			if (fadeOpacity < 255) {
				fill(0, fadeOpacity);
				rect(0, 0, width, height);
				fadeOpacity += 5;
			} else {
				// Fade completed switch back to main menu
				fadeOpacity = 0;
				fading = false;
				gameState = GAME_STATE.MAIN_MENU;
				cars = [];
				van.x = 0;
				van.speed = 7.5;
				dropDistance = null;
			}
		}
		
	}
	
}

function drawMainMenu() {
	
	textAlign(CENTER, CENTER);
	
	// draw play button
	if (mouse.x > width / 2 - 80 && mouse.x < width / 2 + 80 &&
		mouse.y > height / 2 - 10 && mouse.y < height / 2 + 50) {
		fill(230, 230, 230);
	}
	else {
		fill(255, 255, 255);
	}
	stroke(1);
	rectMode(CENTER);
	rect(windowWidth / 2, windowHeight / 2 + 20, 160, 60); // yargg
	noStroke();
	// Button text
	fill(0);
	textSize(24);
	text("Play", width / 2, height / 2 + 20);
  
	// handle click with bounds (createButton was being weird)
	if (mouseIsPressed &&
		mouse.x > width / 2 - 80 && mouse.x < width / 2 + 80 &&
		mouse.y > height / 2 - 10 && mouse.y < height / 2 + 50) {
		rectMode(CORNER);
		gameState = GAME_STATE.PLAYING;
		timeRemaining = 60 * gameLength;
		let points = 0;
	}

	text(`High Score ${highScore}`, width / 2, height / 2 + 80);

	textSize(48);
	fill(0);
	text("Bakery Rush", width / 2, height / 2 - 100);
	textSize(24);


	text("How to play", windowWidth / 2, height / 2 + 100);
	text("Arrow keys to move, accelerate and decelerate", windowWidth / 2, height / 2 + 160)
	text("\"DROP\" will appear on the side where you have to drop off the cookies", windowWidth / 2, height / 2 + 190)
	text("Move to the corresponding lane and click space while \"Drop Distance\" is negative", windowWidth / 2, height / 2 + 220)
	text("The game will end if you crash or when the remaining time goes to 0", windowWidth / 2, height / 2 + 250)
}

function drawVan() {
	van.speed = constrain(van.speed + van.acceleration, minSpeed, maxSpeed);

	// make van not go off screen
	van.y = constrain(van.y, -windowHeight / 8, windowHeight / 8);
	van.x = constrain(van.x, -330, 330);
	animation(van.ani, vanAnchorX + van.x, vanAnchorY + van.y);
	van.collider.x = vanAnchorX + van.x;
	van.collider.y = vanAnchorY + van.y;
	van.distance += van.speed;
}

function drawRoad () {
	image(roadImage, (windowWidth / 2) - 512, roadOffset - 1920, 1024, 1920);
	image(roadImage, (windowWidth / 2) - 512, roadOffset, 1024, 1920);
	roadOffset = (roadOffset + lerp(5, 7, van.speed - 5, 5)) % 1920;
}

function handleCars () {
	carSpawnTimer--;
	if (carSpawnTimer <= 0) {
		spawnObstacle();
		carSpawnTimer = 60 + random(30); // spawn new car at variable time
	}

	// draw cars
	for (let i = cars.length - 1; i >= 0; i--) {
		let car = cars[i];
	
		// adjust Y gain relative on vans speed
		let relativeSpeed = car.speed - van.speed;
		car.y -= relativeSpeed;
		
		// draw car based on colour
		carAni.frame = car.spriteIndex;

		animation(carAni, car.x, car.y);
		car.collider.x = car.x;
		car.collider.y = car.y;
		
		if (car.collider.colliding(van.collider)) {
			if (points > highScore) {
				highScore = points;
			}
			car.speed = 0;
			van.speed = 0;
			gameState = GAME_STATE.CRASHED;
			fading = true;
		}
	}
}

function handleGoal () {
	dropDistance -= van.speed;

	// Arrow warning appears when within 10,000 units of drop
	if (dropDistance < 2500 && dropDistance > 0) {
		fill(0);
		noStroke();
		textSize(32);
		textAlign(CENTER, CENTER);
		
		if (dropSide == DIRECTION.LEFT) {
			text("← DROP", 100, height / 2); // left side
		} else if (dropSide == DIRECTION.RIGHT) {
			text("DROP →", width - 100, height / 2); // right side
		}
	}

	// Drop zone indicator
	if (dropDistance <= 0 && dropDistance > -1000) {
		text("DROP NOW!", 100, height / 2);
	}
}

function dropGoods() {
	let box = createSprite(vanAnchorX + van.x, vanAnchorY + van.y); // Correct position
	box.addAni('Sprites/Cookie.png', 1);

	let force = 10;
	box.velocity.x = (dropSide == DIRECTION.LEFT) ? -force : force; // ternary operator because of coolness reasons
	box.velocity.y = -5;
	box.rotationSpeed = random(-10, 10);
	box.life = 60;

	droppedGoods.add(box);

	if (dropSide == DIRECTION.LEFT && van.x <= -225) {
		points += 1;
	}
	else if (dropSide == DIRECTION.RIGHT && van.x >= 225) {
		points += 1;
	}

}

function spawnObstacle() {
	const laneOffsets = [-300, 0, 300]; // LEFT, CENTER, RIGHT lanes
	let lane = floor(random(0, 3));
	let car = {
		x: (windowWidth / 2) + laneOffsets[lane],
		y: windowHeight + 50,
		speed: van.speed + 2,
		collider: null,
		spriteIndex: round(random(0, 3))
	};
	car.collider = new Sprite(0, 0, van.ani.width / 2, van.ani.height / 2, DYNAMIC);
	car.collider.visible = false;
	cars.push(car);
}

function handleButtonPress () {
	// update van animation frame and direction based off button press
	if (kb.pressing('ArrowLeft') || kb.pressing('a')) {
		if (van.direction != DIRECTION.LEFT) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.LEFT;
			van.ani.frame = 0;

		}
		// update position based on how long button has been pressed
		van.x -= min(0.2 * buttonHeldTime, 10);
		buttonHeldTime++; // 
	}
	else if (kb.pressing('ArrowRight') || kb.pressing('d')) {
		if (van.direction != DIRECTION.RIGHT) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.RIGHT;
			van.ani.frame = 2;

		}
		van.x += min(0.2 * buttonHeldTime, 10);
		buttonHeldTime++;
	}
	else {
		if (van.direction != DIRECTION.CENTER) {
			buttonHeldTime = 0;
			van.direction  = DIRECTION.CENTER;
			van.ani.frame = 1;
		}
	}

	// add or remove acceleration based on button press
	if (kb.pressing('ArrowUp') || kb.pressing('w')) {
		van.acceleration = min(van.acceleration + 0.01, 0.5);
		van.y -= van.acceleration;
	} 
	else if (kb.pressing('ArrowDown') || kb.pressing('s')) {
		van.acceleration = max(van.acceleration - 0.01, -0.5);
		van.y -= van.acceleration;
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
		van.y += (0 - van.y) * 0.05; 
	}

	if (kb.pressed('q')) {
			gameState = GAME_STATE.MAIN_MENU;
	}
	if (kb.pressed('Space')) {
		if (dropDistance <= 0 && dropDistance >= -1000) {
			dropGoods();
		}
	}
}
