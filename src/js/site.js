window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
    return window.setTimeout(callback, 1000 / swGame.settings.cycle);
  };
})();

window.onload = function(){

  // display characters

  var color = "#000"
  var timing = 20; //ms between each char
  var charCount = 0;
  var searchContent = function(el) {
    var children = el.children;
    var content = el.innerHTML;
    if (children.length > 0) {
      for(var i = 0, child; child = children[i]; i++) {
        searchContent(child);
      }
    } else if (content.length > 0) {
      el.innerHTML = ""
      el.style.color = color;
      setTimeout(function(){ displayContent(el, content); }, timing*charCount);
      charCount+=content.length;
    }
  };
  var displayContent = function(el, content) {
    setTimeout(function(){
      el.innerHTML += content[el.innerHTML.length]
      if (el.innerHTML.length<content.length) displayContent(el, content);
    }, timing);
  };

  // trail animation

  var position = 0;
  var cycle = 30;
  var step = 0.02;
  var trailSize = 0.005;
  var canvasEl = document.getElementById("canvas");
  var ctx = canvasEl.getContext("2d");
  var lastTime = +new Date();
  var opacityStepCount = 40;
  var counter = 0;
  var counterLimit = 120;
  var paused = false;
  ctx.lineWidth = 20;
  var animloop = function(){
    requestAnimFrame(animloop);
    var newTime = +new Date();
    if (newTime-lastTime > cycle) {
      ctx.clearRect(0,0,600,680);
      lastTime = newTime;
      if (!paused) {
        showRedTrail();
      }
      if (counter++ == counterLimit) {
        counter = 0;
        paused = !paused;
      }
    }
  };
  var showRedTrail = function() {
    var opacity = fadeEffect(counter);
    for (var i=0; i<opacityStepCount; i++) {
      showRedTrailPart(opacity*(1-i/opacityStepCount), -i);
    }
    position += step;
    if (position>=1) position -= 1;
  };
  var fadeEffect = function(counter) {
      if (counter>counterLimit*0.5) {
        return 1 - (counter - counterLimit*0.5)/(counterLimit*0.5)
      } else {
        return counter/(counterLimit*0.5)
      }
  };
  var showRedTrailPart = function(opacity, offset){
    var trailPos = position+trailSize*offset
    var startAngle = (trailPos*360)%360;
    var stopAngle = ((trailPos+trailSize)*360)%360;
    ctx.strokeStyle = "hsla("+(startAngle*255/360)+", 100%, 50%, "+opacity+")";
    ctx.beginPath();
    ctx.arc(300, 300, 270, startAngle*2*Math.PI/360, stopAngle*2*Math.PI/360, false); 
    ctx.stroke();
  };

  // main
  searchContent(document.getElementById("wrap"));
  setTimeout(animloop, timing*charCount);
};