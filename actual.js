
var scene, camera, renderer;

var graphicsHost = document.getElementById('host'),
	ghWidth = graphicsHost.offsetWidth,
	ghHeight = graphicsHost.offsetHeight,
	aspectRatio = ghWidth / ghHeight;

init();
animate();

function init(){
	var dist = 100;
	camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 10000);
	camera.position.set(0, 0, dist);
	
	var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
	var height = 2 * Math.tan( vFOV / 2 ) * dist; // visible height

	var aspect = window.width / window.height;
	var width = height * aspectRatio;                  // visible width
	
	console.log('viewport width = ', width, 'viewport height = ', height);
	
	scene = new THREE.Scene();
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(ghWidth, ghHeight);
	
	graphicsHost.appendChild(renderer.domElement);
}

function drawPaddle1(){
	var leftX = -86, rightX = 86,
		bottomY = -41, topY = 41;
	
	var lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
	
	var topLineGeometry = new THREE.Geometry();
	topLineGeometry.vertices.push(new THREE.Vector3(leftX, topY, 0));
	topLineGeometry.vertices.push(new THREE.Vector3(rightX, topY, 0));
	var topLine = new THREE.Line(topLineGeometry, lineMaterial);
	scene.add(topLine);
	
	var rightLineGeometry = new THREE.Geometry();
	rightLineGeometry.vertices.push(new THREE.Vector3(rightX, topY, 0));
	rightLineGeometry.vertices.push(new THREE.Vector3(rightX, bottomY, 0));
	var rightLine = new THREE.Line(rightLineGeometry, lineMaterial);
	scene.add(rightLine);
	
	var bottomLineGeometry = new THREE.Geometry();
	bottomLineGeometry.vertices.push(new THREE.Vector3(rightX, bottomY, 0));
	bottomLineGeometry.vertices.push(new THREE.Vector3(leftX, bottomY, 0));
	var bottomLine = new THREE.Line(bottomLineGeometry, lineMaterial);
	scene.add(bottomLine);
	
	var leftLineGeometry = new THREE.Geometry();
	leftLineGeometry.vertices.push(new THREE.Vector3(leftX, bottomY, 0));
	leftLineGeometry.vertices.push(new THREE.Vector3(leftX, topY, 0));
	var leftLine = new THREE.Line(leftLineGeometry, lineMaterial);
	scene.add(leftLine);
}

function drawPaddle2(){
	var geometry = new THREE.PlaneGeometry( 500, 200, 320 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
	var plane = new THREE.Mesh( geometry, material );
	//scene.add( plane );
	
	var material = new THREE.LineBasicMaterial({
        color: 0xff0000
    });
	
	var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
    geometry.vertices.push(new THREE.Vector3(0, 10, 0));
    geometry.vertices.push(new THREE.Vector3(10, 0, 0));
	
	var line = new THREE.Line(geometry, material);
	
	//scene.add(line);
}

function animate(){
	drawPaddle1();
	drawPaddle2();
	renderer.render(scene, camera);
}


