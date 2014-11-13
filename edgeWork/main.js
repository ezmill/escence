var gl, canvas, fbo, edgeFbo1, edgeFbo2, baseTexture;
var baseProgram, edgeProgram1, edgeProgram2;
var baseVs, baseFs, edgeFs1, edgeFs2;
var camTex;
var videoLoaded = false;
var delay = 0;
var video = document.createElement('video'),
    canvas = document.getElementById("canvas");



var radius = document.querySelector('#radius').value;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

init();

function init(){
	initGl();
	initFbosAndShaders();
	getCamAsTexture();
	loop();
}

function initGl(){
	gl = getWebGLContext(canvas);
}

function initFbosAndShaders(){
	baseTexture = new pxBB();
	fbo = new pxFbo();
	edgeFbo1 = new pxFbo();
	edgeFbo2 = new pxFbo();

	fbo.allocate(canvas.width, canvas.height);
	edgeFbo1.allocate(canvas.width, canvas.height);
	edgeFbo2.allocate(canvas.width, canvas.height);

	baseVs = createShaderFromScriptElement(gl, "baseVs");
	translateVs = createShaderFromScriptElement(gl, "translateVs");

	baseFs = createShaderFromScriptElement(gl, "baseFs");
	edgeFs1 = createShaderFromScriptElement(gl, "edgeFs1");
	edgeFs2 = createShaderFromScriptElement(gl, "edgeFs2");

	baseProgram = createProgram(gl, [translateVs, baseFs]);
	edgeProgram1 = createProgram(gl, [baseVs, edgeFs1]);
	edgeProgram2 = createProgram(gl, [baseVs, edgeFs2]);

	
}

function getCamAsTexture(){
	camTex = createAndSetupTexture(gl);
	// camTex.image = new Image();
	camTex.image = video;
	// camTex.image.src = "4.png"
	gl.bindTexture(gl.TEXTURE_2D, camTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camTex.image);
}

function loop(){
	window.requestAnimationFrame(loop);
	if(videoLoaded){
		if(delay < 50){
		    getNewImg();
		    delay++;
		    // console.log(delay);
		}
		gl.useProgram(edgeProgram1);
		gl.uniform2f(gl.getUniformLocation(edgeProgram1, "delta"), radius / canvas.width, 0);
		gl.useProgram(edgeProgram2);
		gl.uniform2f(gl.getUniformLocation(edgeProgram2, "delta"), 0, radius / canvas.height);
		// radius += 0.5;
		radius = document.querySelector('#radius').value;

		fbo.start();
		baseTexture.draw(baseProgram, camTex);

		edgeFbo1.start();
		edgeFbo2.draw(baseProgram);

		edgeFbo2.start();
		fbo.draw(edgeProgram1);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		fbo.draw(edgeProgram2);

		gl.bindTexture(gl.TEXTURE_2D, camTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camTex.image);
	}
}

function getNewImg(){
   //gets a new frame
   // requestAnimationFrame(getNewImg);
   fbo.start();
   baseTexture.draw(baseProgram, camTex);
}

window.addEventListener("click", function(){
  getNewImg();
});

window.addEventListener('DOMContentLoaded', function(){ 
	navigator.getUserMedia = navigator.getUserMedia || 
							 navigator.webkitGetUserMedia || 
							 navigator.mozGetUserMedia || 
							 navigator.msGetUserMedia || 
							 navigator.oGetUserMedia;
 
    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true, audio: false}, handleVideo, videoError);
    }
 
    function handleVideo(stream) {
        var url = window.URL || window.webkitURL;
        video.src = url ? url.createObjectURL(stream) : stream;
		video.play();
        videoLoaded = true;
    }
 
    function videoError(e) {
    	alert("There seems to be something wrong with your webcam :(");
	}
});