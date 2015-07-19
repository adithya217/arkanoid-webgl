
var keyboard = new THREEx.KeyboardState();


var paddle = {
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
		
		paddle.position.rightX = (paddle.dimensions.width / 2);
		paddle.position.leftX = -paddle.position.rightX;
		paddle.position.bottomY = -((game.visibleArea.y - paddle.dimensions.height) / 2);
		paddle.position.topY = paddle.position.bottomY + (paddle.dimensions.height / 2);
		
		paddle.vertices = [
			new THREE.Vector3(paddle.position.leftX, paddle.position.topY, 0), // top left vertex
			new THREE.Vector3(paddle.position.rightX, paddle.position.topY, 0), // top right vertex
			new THREE.Vector3(paddle.position.rightX, paddle.position.bottomY, 0), // bottom right vertex
			new THREE.Vector3(paddle.position.leftX, paddle.position.bottomY, 0) // bottom left vertex
		];
		
		// VERY IMPORTANT - Three.js Faces must have their vertex order counter-clockwise for their fronts to be shown to the camera.
		// If A,B,C,D are the vertices, one triangle face can have any reverse order of (A,B,C) and the other triangle face can have any reverse order of (B,C,D).
		// If we have to use normal clockwise vertex ordering for faces like (A,B,C) and (B,C,D), then we can use DoubleSided Mesh Material.
		paddle.faces = [
			new THREE.Face3(0,3,1),
			new THREE.Face3(1,3,2)
		];
		
		var geometry = new THREE.Geometry();
		geometry.vertices = paddle.vertices;
		geometry.faces = paddle.faces;
		geometry.computeBoundingBox();
		
		//var material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, transparent: false, opacity: 1, side: THREE.DoubleSide });
		var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		paddle.item = new THREE.Mesh(geometry, material);
		
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
			if(rightBorder >= paddle.position.rightX){
				actionNeeded = true;
				paddle.direction = 0.1 * paddle.dimensions.width;
			}
		} else if(keyboard.pressed('left')){
			if(leftBorder <= paddle.position.leftX){
				actionNeeded = true;
				paddle.direction = -0.1 * paddle.dimensions.width;
			}
		}
		
		if(actionNeeded){
			paddle.inMotion = true;
			
			paddle.position.leftX += paddle.direction;
			paddle.position.rightX += paddle.direction;
			
			paddle.item.translateX(paddle.direction);
		}
	}
};


var ball = {
	isDestructable : false, // to be used later
	launched : false, // flag for ball launched from paddle
	
	radius : 0, // must be computed
	
	ballRadiusRatio : 0.1, // ball radius ratio relative to paddle height
	
	movementDirection : { x: 0, y: 0 }, // direction of movement of ball
	
	item : null, // the actual ball object
	
	
	init : function(){
		// about 1/5 of the paddle height
		ball.radius = ball.ballRadiusRatio * paddle.dimensions.height;
		
		// more segments would make a smoother circle
		var geometry = new THREE.CircleGeometry(ball.radius, 32);
		geometry.computeBoundingBox();
		
		var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		
		ball.item = new THREE.Mesh(geometry, material);
		
		ball.reset();
		
		game.scene.add(ball.item);
	},
	
	
	reset : function(){
		// reset all flags to default values
		ball.launched = false;
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
		
		console.log('moving with paddle X = ', newBallX);
		ball.item.position.setX(newBallX);
	},
	
	
	launchBall : function(){
		if(!keyboard.pressed('space')){
			return;
		}
		
		console.log('ball launch triggered');
		
		ball.launched = true;
		
		ball.movementDirection.x = Math.random() <= 0.5 ? -1 : 1;
		ball.movementDirection.y = 1;
	},
	
	checkCollisions : function(){
		var rightBorder = (game.visibleArea.x / 2) - ball.radius,
			leftBorder = -rightBorder,
			topBorder = (game.visibleArea.y / 2) - ball.radius,
			bottomBorder = -topBorder,
			currentBallPosition = ball.item.position;
		
		// check collision with horizontal borders
		if(currentBallPosition.x <= leftBorder){
			// check for ball collision with left border
			ball.movementDirection.x = 1;
		} else if(currentBallPosition.x >= rightBorder){
			// check for ball collision with right border
			ball.movementDirection.x = -1;
		}
		
		// check collision with vertical borders
		if(currentBallPosition.y >= topBorder){
			// check for ball collision with left border
			ball.movementDirection.y = -1;
		} else if(currentBallPosition.y <= bottomBorder){
			// check for ball collision with right border
			//ball.movementDirection.y = 1;
			ball.reset();
			return;
		}
		
		// check collision with paddle
		var ballBB = new THREE.Box3().setFromObject(ball.item),
			paddleBB = new THREE.Box3().setFromObject(paddle.item);
			
		ballBB.min.x -= ball.radius;
		ballBB.min.y -= ball.radius;
		
		if(paddleBB.containsPoint(ballBB.min)){
			console.log('ball -- paddle collision detected');
			
			var ballPositionX = ball.item.position.x,
				ballDirectionX = ball.movementDirection.x,
				paddleMidPoint = (paddleBB.min.x + paddleBB.max.x) / 2;
			
			if(((ballDirectionX == 1) && (ballPositionX <= paddleMidPoint))
				|| ((ballDirectionX == -1) && (ballPositionX >= paddleMidPoint))){
				ball.movementDirection.x *= -1;
			}
			
			//ball.movementDirection.x *= -1;
			ball.movementDirection.y = 1;
		}
	},
	
	
	computePath : function(){
		var newBallX = ball.movementDirection.x * ball.radius,
			newBallY = ball.movementDirection.y * ball.radius;
		
		ball.item.translateX(newBallX);
		ball.item.translateY(newBallY);
	}
};


var brick = {
	isDestructable : true, // to be used later
	vertices : [],
	init : function(){},
	update : function(){}
};


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

		game.scene = new THREE.Scene();
		
		// this keeps the item.position values updated with the transforms applied later during item movements
		game.scene.updateMatrixWorld(true);

		game.renderer = new THREE.WebGLRenderer();
		game.renderer.setSize(game.ghWidth, game.ghHeight);

		game.graphicsHost.appendChild(game.renderer.domElement);
		
		paddle.init();
		ball.init();
	},
	
	
	update : function(){
		paddle.update();
		ball.update();
		
		for(var index in game.items){
			game.items[index].update();
		}
		
		game.renderer.render(game.scene, game.camera);
		requestAnimationFrame(game.update);
	}
};



game.init();
game.update();
















