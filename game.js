
var keyboard = new THREEx.KeyboardState();


var paddle = {
	objetType : 'paddle',
	removeItem : false, // to be used later
	isDestructable : false, // to be used later
	inMotion : false, // to indicate paddle movement
	vertices : [],
	faces : [],
	
	dimensions : {}, // must be computed
	position : { leftX: 0, rightX: 0, topY: 0, bottomY: 0, farZ: 0, nearZ: 0 }, // must be computed
	
	direction : 0, // direction in which the paddle is moving
	
	paddleWidthRatio : 0.1, // paddle width ratio relative to visible area
	paddleHeightRatio : 0.1, // paddle height ratio relative to visible area
	
	item : null, // the actual paddle object
	
	init : function(){
		paddle.dimensions.width = paddle.paddleWidthRatio * game.visibleArea.x;
		paddle.dimensions.height = paddle.paddleHeightRatio * game.visibleArea.y;
		paddle.dimensions.depth = game.aspectRatio;
		
		paddle.position.rightX = (paddle.dimensions.width / 2);
		paddle.position.leftX = -paddle.position.rightX;
		paddle.position.bottomY = -((game.visibleArea.y - paddle.dimensions.height) / 2);
		paddle.position.topY = paddle.position.bottomY + (paddle.dimensions.height / 2);
		
		// VERY IMPORTANT - Three.js Faces must have their vertex order counter-clockwise for their fronts to be shown to the camera.
		// If A,B,C,D are the vertices, one triangle face can have any reverse order of (A,B,C) and the other triangle face can have any reverse order of (B,C,D).
		// If we have to use normal clockwise vertex ordering for faces like (A,B,C) and (B,C,D), then we can use DoubleSided Mesh Material.
				
		var geometry = new THREE.BoxGeometry(paddle.dimensions.width, paddle.dimensions.height/2, paddle.dimensions.depth);
		
		//var material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, transparent: false, opacity: 1, side: THREE.DoubleSide });
		var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		paddle.item = new THREE.Mesh(geometry, material);
		
		var paddleYPosition = -(game.visibleArea.y/2) + paddle.dimensions.height;
		paddle.item.position.setY(paddleYPosition);
		
		game.scene.add(paddle.item);
	},
	
	
	update : function(){
		if(paddle.item === null){
			// don't do anything, paddle not yet initialised
			return;
		}
		
		paddle.inMotion = false;
		
		var rightBorder = (game.visibleArea.x / 2),
			leftBorder = -rightBorder,
			actionNeeded = false;
			
		if(keyboard.pressed('right')){
			if(rightBorder <= paddle.position.rightX){
				return;
			}
			
			actionNeeded = true;
			var moveDist = 0.1 * paddle.dimensions.width;
			
			if(rightBorder >= (paddle.position.rightX + moveDist)){
				paddle.direction = moveDist;
			} else {
				paddle.direction = rightBorder - paddle.position.rightX;
			}
		} else if(keyboard.pressed('left')){
			if(leftBorder >= paddle.position.leftX){
				return;
			}
			
			actionNeeded = true;
			var moveDist = -0.1 * paddle.dimensions.width;
			
			if(leftBorder <= (paddle.position.leftX + moveDist)){
				paddle.direction = moveDist;
			} else {
				paddle.direction = leftBorder - paddle.position.leftX;
			}
		}
		
		if(actionNeeded){
			paddle.inMotion = true;
			
			paddle.position.leftX += paddle.direction;
			paddle.position.rightX += paddle.direction;
			
			paddle.item.position.x += paddle.direction;
		}
	}
};


var ball = {
	objectType : 'ball',
	removeItem : false, // to be used later
	isDestructable : false, // to be used later
	launched : false, // flag for ball launched from paddle
	firstCollision : true, // flag to be used for checking collsions with paddle
	
	radius : 0, // must be computed
	
	ballRadiusRatio : 0.1, // ball radius ratio relative to paddle height
	
	movementDirection : { x: 0, y: 0 }, // direction of movement of ball
	maxSpeed : { x: 1, y: 1}, // to govern max speed of the ball
	
	item : null, // the actual ball object
	
	
	init : function(){
		// about 1/5 of the paddle height
		ball.radius = ball.ballRadiusRatio * paddle.dimensions.height;
		
		// more segments would make a smoother circle
		var geometry = new THREE.CircleGeometry(ball.radius, 32);
		geometry.computeBoundingBox();
		
		var material = new THREE.MeshPhongMaterial({color: 0xff0000});
		
		ball.item = new THREE.Mesh(geometry, material);
		
		ball.reset();
		
		game.scene.add(ball.item);
	},
	
	
	reset : function(){
		// reset all flags to default values
		ball.launched = false;
		ball.firstCollision = true;
		
		// set ball movement to 0
		ball.movementDirection.x = ball.movementDirection.y = 0;
		
		// set the ball on top of the paddle
		var paddleBB = new THREE.Box3().setFromObject(paddle.item),
			newBallX = (paddleBB.min.x + paddleBB.max.x) / 2,
			newBallY = paddleBB.max.y + (ball.radius * 1.1);
		
		ball.item.position.set(newBallX, newBallY, 0);
	},
	
	
	update : function(){
		if(ball.item === null){
			// don't do anything, ball not yet initialised
			return;
		}
		
		if(!ball.launched){
			ball.moveWithPaddle();
			ball.launchBall();
			return;
		}
		
		ball.checkCollisions();
		
		ball.computePath();
	},
	
	
	moveWithPaddle : function(){
		if(!paddle.inMotion){
			return;
		}
		
		var paddleBB = new THREE.Box3().setFromObject(paddle.item),
			newBallX = (paddleBB.max.x + paddleBB.min.x) / 2;
		
		ball.item.position.setX(newBallX);
	},
	
	
	launchBall : function(){
		if(!keyboard.pressed('space')){
			return;
		}
		
		ball.launched = true;
		
		ball.movementDirection.x = (Math.random() <= 0.5 ? -1 : 1) * ball.radius;
		ball.movementDirection.y = 1 * ball.radius;
	},
	
	checkCollisions : function(){
		var rightBorder = (game.visibleArea.x / 2) - ball.radius,
			leftBorder = -rightBorder,
			topBorder = (game.visibleArea.y / 2) - ball.radius,
			bottomBorder = -topBorder,
			currentBallPosition = ball.item.position;
		
		// check collision with horizontal borders
		if((currentBallPosition.x <= leftBorder) || (currentBallPosition.x >= rightBorder)){
			ball.movementDirection.x *= -1;
			ball.firstCollision = false;
		}
		
		// check collision with vertical borders
		if(currentBallPosition.y >= topBorder){
			ball.movementDirection.y *= -1;
			ball.firstCollision = false;
		} else if(currentBallPosition.y <= bottomBorder){
			ball.reset();
			return;
		}
		
		var ballBB = new THREE.Box3().setFromObject(ball.item);
		
		for(var index in game.items){
			var gameObject = game.items[index];
			
			if(gameObject.objectType !== 'brick')
				continue;
				
			if(gameObject.startRemoval)
				continue;
			
			var itemBB = gameObject.item.geometry.boundingBox;
			
			if(itemBB.containsPoint(ballBB.min) || itemBB.containsPoint(ballBB.max)){
				ball.firstCollision = true;
				
				gameObject.startRemoval = true;
				
				if(ball.item.position.y > itemBB.max.y) {
					if(ball.item.position.x < itemBB.min.x) {
						// ball center at top left of brick
						if(ball.movementDirection.x > 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else if(ball.item.position.x > itemBB.max.x) {
						// ball center at top right of brick
						if(ball.movementDirection.x < 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else {
						// ball center at top center of brick
						ball.movementDirection.y *= -1;
					}
				} else if(ball.item.position.y < itemBB.min.y) {
					if(ball.item.position.x < itemBB.min.x) {
						// ball center at bottom left of brick
						if(ball.movementDirection.x > 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else if(ball.item.position.x > itemBB.max.x) {
						// ball center at bottom right of brick
						if(ball.movementDirection.x < 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else {
						// ball center at bottom center of brick
						ball.movementDirection.y *= -1;
					}
				} else {
					if(ball.item.position.x < itemBB.min.x) {
						// ball center at middle left of brick
						if(ball.movementDirection.x > 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else if(ball.item.position.x > itemBB.max.x) {
						// ball center at middle right of brick
						if(ball.movementDirection.x < 0) {
							ball.movementDirection.x *= -1;
						} else {
							ball.movementDirection.y *= -1;
						}
					} else {
						// ball center at middle of brick
						// ball shouldn't come here. If it comes, it is a bug.
						// reflect it vertically, just in case
						ball.movementDirection.y *= -1;
					}
				}
								
				return;
			}
		}
		
		// check collision with paddle
		var	paddleBB = new THREE.Box3().setFromObject(paddle.item);
		
		// expanding paddle's bounding box, to prevent the ball from going inside the paddle
		paddleBB.min.x -= ball.radius;
		paddleBB.max.x += ball.radius;
		paddleBB.max.y += ball.radius;
		
		if(paddleBB.containsPoint(ballBB.min) || paddleBB.containsPoint(ballBB.max)){
			// because items updates are in a loop, checking is very fast.
			// as soon the ball is launched from paddle in the beginning, in the first frame, ball is still
			// on/inside the paddle and is picked up as a collision in this implementation.
			// hence this first collision check with the paddle is required
			if(ball.firstCollision){
				ball.firstCollision = false;
				return;
			}
			
			var ballDirectionX = ball.movementDirection.x,
				ballPositionX = ball.item.position.x,
				paddleMidPoint = (paddleBB.min.x + paddleBB.max.x) / 2;
				
			var newBallMovementX = Math.abs((Math.abs(paddleMidPoint) - Math.abs(ballPositionX))) / (paddle.dimensions.width / 2);
			
			if(ballPositionX <= paddleMidPoint){
				ball.movementDirection.x = -1 * newBallMovementX * ball.radius;
			} else {
				ball.movementDirection.x = 1 * newBallMovementX * ball.radius;
			}
			
			ball.movementDirection.y = 1 * ball.radius;
		}
	},
	
	
	computePath : function(){
		var newBallX = ball.movementDirection.x * 0.9,
			newBallY = ball.movementDirection.y * 0.9;
			
		// VERY IMPORTANT NOTE: rotating and translating do not go hand in hand.
		// roatating an object also rotates its axes. Translating an object actually uses it local axes,
		// so for example, rotating an object on its x and y axes and then translating it on its x-axis
		// does NOT result in the object's movement along the WORLD's x-axis. Change the object's position
		// instead of translation for this purpose.
		
		ball.item.position.x += newBallX;
		ball.item.position.y += newBallY;
	}
};


var brick = function(){
	var context = this;
	
	this.objectType = 'brick';
	this.removeItem = false; // to be used later
	this.isDestructable = true; // to be used later
	
	this.startRemoval = false;
	
	this.item = null; // the brick item
	
	this.init = function(options){
		var geometry = new THREE.BoxGeometry(brick.brickWidth, brick.brickHeight, game.aspectRatio);
		
		var material = new THREE.MeshPhongMaterial({color: options.color, transparent: true, opacity: 1});
		
		context.item = new THREE.Mesh(geometry, material);
		
		context.item.position.set(options.position.x, options.position.y, options.position.z);
		
		var tempBB = new THREE.Box3().setFromObject(context.item);
		
		// expanding the bounding box of the bricks a little bit for better collision detection
		tempBB.min.x -= ball.radius;
		tempBB.min.y -= ball.radius;
		tempBB.max.x += ball.radius;
		tempBB.max.y += ball.radius
		
		context.item.geometry.boundingBox = tempBB;
		
		game.scene.add(context.item);
	};
	
	this.update = function(){
		if(context.removeItem){
			return;
		}
		
		if(context.startRemoval){
			if(context.item.material.opacity <= 0){
				context.removeItem = true;
				return;
			}
			
			context.item.material.opacity -= 0.1;
		}
	};
	
};

// some random values to start with
brick.brickWidth = 6;
brick.brickHeight = 2;


var game = {
	scene : null,
	camera : null,
	cameraZDistance : 100,
	renderer : null,
	
	graphicsHost : null,
	ghWidth : 0,
	ghHeight : 0,
	aspectRatio : 0,
	visibleArea : {},
	
	items : [],
	lights : [],
	
	brickLayerInfo : {},
	
	init : function(){
		game.graphicsHost = document.getElementById('host'),
		game.ghWidth = game.graphicsHost.offsetWidth,
		game.ghHeight = game.graphicsHost.offsetHeight,
		game.aspectRatio = game.ghWidth / game.ghHeight;
	
		game.camera = new THREE.PerspectiveCamera(45, game.aspectRatio, 0.1, 10000);
		game.camera.position.set(0, 0, game.cameraZDistance);

		// convert vertical fov to radians
		var vFOV = game.camera.fov * Math.PI / 180;
		// visible height
		var height = 2 * Math.tan( vFOV / 2 ) * game.cameraZDistance;
		// visible width
		var width = height * game.aspectRatio;
		
		game.visibleArea = { x: width, y: height };
		
		game.brickLayerInfo.rows = 6;
		game.brickLayerInfo.cols = (Math.floor(width / brick.brickWidth) / 2) - 1;

		game.scene = new THREE.Scene();
		
		// this keeps the item.position values updated with the transforms applied later during item movements
		game.scene.updateMatrixWorld(true);

		game.renderer = new THREE.WebGLRenderer({antialias: true});
		game.renderer.shadowMapEnabled = true;
		game.renderer.setSize(game.ghWidth, game.ghHeight);

		game.graphicsHost.appendChild(game.renderer.domElement);
		
		paddle.init();
		game.items.push(paddle);
		
		ball.init();
		game.items.push(ball);
		
		game.addLights();
		
		game.generateBricks();
	},
	
	
	update : function(){
		for(var index in game.items){
			var gameItem = game.items[index];
			
			gameItem.update();
			
			if(gameItem.removeItem){
				game.items.splice(index--, 1);
			}
		}
		
		game.renderer.render(game.scene, game.camera);
		requestAnimationFrame(game.update);
	},
	
	generateBricks : function(){
		var rows = game.brickLayerInfo.rows,
			cols = game.brickLayerInfo.cols;
			
		for(var rc=0; rc<rows; rc++){
			var options = {
				color : '#'+((Math.random() * 0xffffff) << 0).toString(16),
				position : {
					x: -(game.visibleArea.x / 2),
					y: (rows - (rc * 2)) * brick.brickHeight,
					z: 0
				}
			};
			
			for(var cc=0; cc<cols; cc++){
				options.position.x += (2 * brick.brickWidth);
				
				var brickItem = new brick();
				brickItem.init(options);
				
				game.items.push(brickItem);
			}
		}
	},
	
	addLights : function(){
		var ambientLight = new THREE.AmbientLight({color: 0x444444});
		game.scene.add(ambientLight);
		
		var lightFadingDistance = Math.sqrt(Math.pow(game.visibleArea.x/2, 2) + Math.pow(game.visibleArea.y/2, 2));
		
		var topLeftLight = new THREE.DirectionalLight(0x777777, 0.5, lightFadingDistance);
		topLeftLight.position.set(-game.visibleArea.x/2, game.visibleArea.y/2, 0);
		game.scene.add(topLeftLight);
		
		var topRightLight = new THREE.DirectionalLight(0x777777, 0.5, lightFadingDistance);
		topRightLight.position.set(game.visibleArea.x/2, game.visibleArea.y/2, 0);
		game.scene.add(topRightLight);
		
		var bottomLeftLight = new THREE.DirectionalLight(0x777777, 0.5, lightFadingDistance);
		bottomLeftLight.position.set(-game.visibleArea.x/2, -game.visibleArea.y/2, 0);
		game.scene.add(bottomLeftLight);
		
		var bottomRightLight = new THREE.DirectionalLight(0x777777, 0.5, lightFadingDistance);
		bottomRightLight.position.set(game.visibleArea.x/2, -game.visibleArea.y/2, 0);
		game.scene.add(bottomRightLight);
	}
};



game.init();
game.update();
















