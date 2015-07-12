

var ball = {
	isDestructable : false, // to be used later
	center : {},
	init : function(){},
	update : function(){}
};


var paddle = {
	isDestructable : false, // to be used later
	vertices : [],
	faces : [],
	
	dimensions : {}, // must be computed
	position : { leftX: 0, rightX: 0, topY: 0, bottomY: 0 }, // must be computed
	
	direction : 0, // direction in which the paddle is moving
	
	paddleWidthRatio : 0.1, // paddle width ratio relative to visible area
	paddleHeightRatio : 0.1, // paddle height ratio relative to visible area
	paddleBottomBufferRatio : 0.1, // empty space below the paddle, ratio relative to visible area
	
	item : null, // the actual paddle object
	
	init : function(){
		paddle.dimensions.width = game.visibleArea.x * paddle.paddleWidthRatio
		paddle.dimensions.height = game.visibleArea.y * paddle.paddleHeightRatio;
		
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
		
		//var material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, transparent: false, opacity: 1, side: THREE.DoubleSide });
		var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		paddle.item = new THREE.Mesh(geometry, material);
		
		game.scene.add(paddle.item);
		
		paddle.direction = 1;
	},
	
	
	update : function(){
		var rightBorder = (game.visibleArea.x / 2),
			leftBorder = -rightBorder;
		
		if(rightBorder <= paddle.position.rightX){
			paddle.direction = -1;
		}
		
		if(leftBorder >= paddle.position.leftX){
			paddle.direction = 1;
		}
		
		paddle.position.leftX += paddle.direction;
		paddle.position.rightX += paddle.direction;
		
		paddle.item.translateX(paddle.direction);
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

		game.renderer = new THREE.WebGLRenderer();
		game.renderer.setSize(game.ghWidth, game.ghHeight);

		game.graphicsHost.appendChild(game.renderer.domElement);
		
		paddle.init();
		
		game.items.push(paddle);
	},
	
	
	update : function(){
		for(var index in game.items){
			game.items[index].update();
		}
		
		game.renderer.render(game.scene, game.camera);
		requestAnimationFrame(game.update);
	}
};



game.init();
game.update();
















