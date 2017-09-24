$(document).foundation();
$(document).ready(function(){
	anim.play();
	anim.addEventListener('complete', function(){
		anim.pause();
	});
});