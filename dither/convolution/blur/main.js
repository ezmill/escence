var gl, canvas, fbo,  ditherFbo, blurFbo, baseTexture;
var baseProgram,  ditherProgram, blurProgram;
var baseVs, baseFs, ditherFs, blurFs;
var camTex;
var videoLoaded = false;
var delay = 0;
var mouseX,mouseY, mapMouseX, mapMouseY;
var video = document.createElement('video'),
    canvas = document.getElementById("canvas");
var pressCount = 0;
var spacePressed = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

init();

// video.src = "satin.mp4";
// video.loop = true;
// video.playbackRate = 0.25;
// video.play();
// videoLoaded = true;

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
	ditherFbo = new pxFbo();
	blurFbo = new pxFbo();
	

	fbo.allocate(canvas.width, canvas.height, true);
	ditherFbo.allocate(canvas.width, canvas.height, true);
	blurFbo.allocate(canvas.width, canvas.height, true);

	baseVs = createShaderFromScriptElement(gl, "baseVs");
	translateVs = createShaderFromScriptElement(gl, "translateVs");

	baseFs = createShaderFromScriptElement(gl, "baseFs");
	ditherFs = createShaderFromScriptElement(gl, "ditherFs");
	blurFs = createShaderFromScriptElement(gl, "blurFs");

	baseProgram = createProgram(gl, [translateVs, baseFs]);
	ditherProgram = createProgram(gl, [baseVs, ditherFs]);
	blurProgram = createProgram(gl, [baseVs, blurFs]);

	gl.useProgram(blurProgram);
	gl.uniform1f(gl.getUniformLocation(blurProgram, "step_w"), 1.0/canvas.width);
	gl.uniform1f(gl.getUniformLocation(blurProgram, "step_h"), 1.0/canvas.height);
	gl.useProgram(baseProgram);
	gl.uniform1f(gl.getUniformLocation(baseProgram, "step_w"), 1.0/canvas.width);
	gl.uniform1f(gl.getUniformLocation(baseProgram, "step_h"), 1.0/canvas.height);
	
}

function getCamAsTexture(){
	camTex = createAndSetupTexture(gl);
	camTex.image = video;
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

		if(!spacePressed){
			gl.useProgram(baseProgram);
		    gl.uniform2f(gl.getUniformLocation(baseProgram, "mouse"), mapMouseX, mapMouseY);
		} else{
			gl.uniform2f(gl.getUniformLocation(baseProgram, 'mouse'), 1.0,1.0);
		}
		
		fbo.start();
		ditherFbo.draw(baseProgram)

		ditherFbo.start();
		blurFbo.draw(ditherProgram);

		blurFbo.start();
		fbo.draw(blurProgram);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		blurFbo.draw(baseProgram);

		gl.bindTexture(gl.TEXTURE_2D, camTex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camTex.image);
	}
}

function getNewImg(){
   //gets a new frame
   // requestAnimationFrame(getNewImg);
   blurFbo.start();
	// gl.enable(gl.BLEND);
    // gl.blendFunc(gl.ONE_MINUS_DST_COLOR,gl.DST_COLOR); 
    // gl.blendFunc(gl.ONE_MINUS_SRC_COLOR,gl.CONSTANT_COLOR); 
   baseTexture.draw(baseProgram, camTex);
   			   // gl.disable(gl.BLEND);
}
function map(value,max,minrange,maxrange) {
    return ((max-value)/(max))*(maxrange-minrange)+minrange;
}

function pauseResume(){
	if(pressCount % 2 == 0){
		spacePressed = true;

	} else {
		spacePressed = false;
	}
	pressCount++;
}
window.addEventListener("click", function(){
  getNewImg();
});

window.addEventListener("mousemove", function(event){
	mouseX = (event.clientX );
    mouseY = (event.clientY );
    mapMouseX = map(mouseX, window.innerWidth, 0.9, 1.1);
    mapMouseY = map(mouseY, window.innerHeight, 0.9,1.1);

});
window.addEventListener("keydown",function(event){
	if(event.keyCode === 32){
		pauseResume();
	}
})

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