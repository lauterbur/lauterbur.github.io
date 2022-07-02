var pycan, pyc;
var pyw = 700;
var pyh = 300;
var audioPy = new(window.AudioContext || window.webkitAudioContext)();
var xpyoff = 20;
//
var x1node1 = xpyoff;
var x2node1 = pyw - xpyoff;
var lenpy1 = x2node1 - x1node1;
var ynode1 = 100;
var amp1 = 50;
var py1period = 1000;		// period in ms
var py1amptime;
var freq1 = 220;			// 220Hz
//
var x1node2 = xpyoff;
var x2node2;
var lenpy2;
var amp2 = 50;
var ynode2 = 220;
var py2period = 1000;		// period in ms
var py2amptime;
var freq2;
//
var npyts = 100;
var rnode = 6;
var tpy1, tpy2;
var osc1 = null;
var osc2 = null;

function pyth() {
	pyth_init();
	pyth_draw();
}

function pyreset() {
	py1amptime = amp1;
	py2amptime = amp2;
	tpy1 = 0;
	tpy2 = 0;
	x2node2 = pyw-xpyoff;
	lenpy2 = x2node2 - x1node2;
	py2period = py1period;
	freq2 = freq1;
	pystop();
	pyth_draw();
}

function pyth_init() {
	pycan = document.getElementById("pycan");
	pyc = pycan.getContext("2d");
	pycan.width = pyw;
	pycan.height = pyh;
	pyc.font = "14px Times";
	py1amptime = amp1;
	py2amptime = amp2;
	tpy1 = 0;
	tpy2 = 0;
	x2node2 = pyw-xpyoff;
	lenpy2 = x2node2 - xpyoff;
	freq2 = freq1;
	pycan.addEventListener(startEvent, w2Handler);
	pycan.addEventListener(moveEvent, w2Handler);
	pycan.addEventListener(endEvent, w2Handler);	
}

var pyhamdown = false;
var xppt, yppt;
function w2Handler(ev) {
//	console.log("handler:  event="+ev.type);
	if (iOS) {
//		console.log("Handler: IOS detected")
		ev.preventDefault();
	}
//	else {
//		console.log("Handler: no IOS!")
//	}
	mouse = getMouse(ev, pycan, pyw, pyh);
	xppt = mouse[0];
	yppt = mouse[1];
	if (ev.type == startEvent) {
		let dy = ynode2-yppt;
		let dx = x2node2-xppt;
		let dr = Math.sqrt( dx*dx + dy*dy );
		if (dr < 10) {
			pyhamdown = true;
//			pystop();
//			console.log("yes!!!!");
		}
	}
	else if (ev.type == moveEvent) {
		if (pyhamdown) {
			pystop();
			x2node2 = Math.max(xppt,pyw/2);
			x2node2 = Math.min(x2node1,x2node2);
			lenpy2 = x2node2 - x1node2;
			py2period = py1period * lenpy2/lenpy1;
			freq2 = freq1 * lenpy1/lenpy2;
			let pyrat = lenpy1/lenpy2;
//			py1amptime = amp1;
//			py2amptime = amp2;
			document.getElementById("pyrat").innerHTML = round(pyrat,3);
			let fra = real_to_fraction(pyrat);
			document.getElementById("pynum").innerHTML = fra.N;
			document.getElementById("pydenom").innerHTML = fra.D;
			pyth_draw();
			pystart();
		}
	}
	else if (ev.type == endEvent) {
		pystart();
		pyhamdown = false;
	}
}

function pyth_draw() {
	pyc.clearRect(0,0,pyw,pyh);
//	rectangle(pyc,0,0,pyw,pyh,false,"black");
	//
	// draw the top wave, which is the fundamental
	//
	let dxw = lenpy1/npyts;
	let x1w1 = x1node1;
	let x2w1 = x1node1 + dxw;
	while (x2w1 <= x2node1) {
		let y1w1 = ynode1-py1amptime*Math.sin(Math.PI*(x1w1-x1node1)/lenpy1);
		let y2w1 = ynode1-py1amptime*Math.sin(Math.PI*(x2w1-x1node1)/lenpy1);
		line(pyc,x1w1,y1w1,x2w1,y2w1,"blue");
		//
		x1w1 = x1w1 + dxw;
		x2w1 = x2w1 + dxw;
	}
	dline(pyc,x1node1,ynode1,x2node1,ynode1,1,"black");
	circle(pyc,x1node1,ynode1,rnode,true,"black");
	circle(pyc,x2node1,ynode1,rnode,true,"black");
	//
	// draw the bottom wave
	//
	dxw = lenpy2/npyts;
	let x1w2 = x1node2;
	let x2w2 = x1node2 + dxw;
	while (x2w2 <= x2node2) {
		let y1w2 = ynode2-py2amptime*Math.sin(Math.PI*(x1w2-x1node2)/lenpy2);
		let y2w2 = ynode2-py2amptime*Math.sin(Math.PI*(x2w2-x1node2)/lenpy2);
		line(pyc,x1w2,y1w2,x2w2,y2w2,"blue");
		//
		x1w2 = x1w2 + dxw;
		x2w2 = x1w2 + dxw;
	}
	dline(pyc,x1node2,ynode2,x2node2,ynode2,1,"black");
	circle(pyc,x1node2,ynode2,rnode,true,"black");
	circle(pyc,x2node2,ynode2,rnode,true,"yellow");

}

function pyptop() {
	if (document.getElementById("playtop").checked) osc1 = start_tone(audioPy,0.1,freq1);
	else stop_tone(osc1);	
}
function pypbot() {
	if (document.getElementById("playbot").checked) osc2 = start_tone(audioPy,0.1,freq2);
	else stop_tone(osc2);	
}
function pyamp() {
	py1amptime = amp1*Math.cos(2*Math.PI*tpy1/py1period);
	py2amptime = amp2*Math.cos(2*Math.PI*tpy2/py2period);
	tpy1 = tpy1 + py1period/100;
	tpy2 = tpy2 + py1period/100;
	pyth_draw();
}

var pyinterval = 10;
var pytimer = null;
function pystart() {
	if (pytimer != null) return;
	py1amptime = amp1;
	py2amptime = amp2;
	pytimer = setInterval("pyamp()",pyinterval);
	if (document.getElementById("playtop").checked) osc1 = start_tone(audioPy,0.1,freq1);
	if (document.getElementById("playbot").checked) osc2 = start_tone(audioPy,0.1,freq2);
}

function pystop() {
	if (pytimer != null) {
		clearInterval(pytimer);
		pytimer = null;
		if (document.getElementById("playtop").checked) stop_tone(osc1);
		if (document.getElementById("playbot").checked) stop_tone(osc2);
	}

}



pyth();