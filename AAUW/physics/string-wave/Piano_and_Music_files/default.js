//var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
var iOS = /iPad|iPhone|iPod/.test(navigator.platform)
|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
var isTouchSupported = 'ontouchstart' in window;
var startEvent = isTouchSupported ? 'touchstart' : 'mousedown';
var moveEvent = isTouchSupported ? 'touchmove' : 'mousemove';
var endEvent = isTouchSupported ? 'touchend' : 'mouseup';
//
// some standard useful functions.  to use, insert
// <script src="default.js">
// inside <head>...</head>
//
//var 2pi = 2*Math.PI;
function setStr(val,precision,title) {
	var num = round(val,precision);
	var snum = num.toFixed(precision);
//	console.log("g="+num+" length="+snum.length);
	document.getElementById(title).innerHTML=snum;
}
function line(cl,x0,y0,x1,y1,color) {
	temp = cl.strokeStyle;
	cl.strokeStyle = color;
	cl.beginPath();
	cl.moveTo(x0,y0);
	cl.lineTo(x1,y1);
	cl.stroke();
	cl.strokeStyle = temp;
}
function dline(cl,x0,y0,x1,y1,width,color) {
	//
	// x0,y0,x1,y1 are in the javascript frame - y increases downwards
	//
	var temp = cl.strokeStyle;
	cl.strokeStyle = color;
	var temp2 = cl.lineWidth;
	cl.lineWidth = width;
	//
	// first estimate number of dots by taking the distance between the endpoints and
	// letting the distance between dots be around 4 pixels
	//
	var ndots = Math.floor(distance(x0,y0,x1,y1)/4);
	//
	// we start at the leftmost point and increment accordingly
	//
	var xleft = x0;
	var yleft = y0;
	var xadd = 1;
	var yadd = 1;
	if (x0 > x1) xadd = -1; 
	if (y0 > y1) yadd = -1; 
	var dx = Math.abs(x0-x1)/ndots;
	var dy = Math.abs(y0-y1)/ndots;
	for (var i=0; i<ndots; i++) {
		xleft = xleft + xadd*dx;
		yleft = yleft + yadd*dy;
		circle(cl,xleft,yleft,1,true,color);
	}
	cl.strokeStyle = temp;
	cl.lineWidth = temp2;

}
function dashline(cl,xL0,yL0,xL1,yL1,type,dashLength,spaceLength) {
	//
	// draws a line, can be solid (type=0) or dashed (type=1)
	//
	//
//	console.log("type="+type);
//	console.log("x0/y0 ="+round(xL0,1)+"/"+round(yL0,1)+" x1/y1 ="+round(xL1,1)+"/"+
//				round(yL1,1)+" length="+round(length,1)+" nseg="+nseg);
	if (!type) type = 0;
	//
//	c.save();
//	c.strokeStyle = color;
	if (type == 0) {
		cl.beginPath();
		cl.moveTo(xL0,yL0);
		cl.lineTo(xL1,yL1);
		cl.stroke();
	}
	else {
		//
		// draws the line in "n" chunks with spaces in between to simulate dashed lines
		//
		var xd,yd;
		//
		// handle special case of horizontal or vertical lines
		//
		var vertical = false;
		if (xL1 == xL0) vertical = true;
		var horizontal = false;
		if (yL1 == yL0) horizontal = true;
		if (horizontal || vertical) {
			//
			// number of segments = length divided by dashLength + spaceLength
			//
			if (horizontal) var length = Math.abs(xL1-xL0);
			if (vertical) var length = Math.abs(yL1-yL0);
			var nseg = Math.floor( length/(dashLength + spaceLength) );
			cl.beginPath();
			xd = xL0;
			yd = yL0;
			for (i=0; i<nseg; i++) {
				cl.moveTo(xd,yd);
				if (horizontal) cl.lineTo(xd+dashLength,yd);
				if (vertical) cl.lineTo(xd,yd+dashLength);
				cl.stroke();
				if (horizontal) xd = xd + dashLength + spaceLength;
				if (vertical) yd = yd + dashLength + spaceLength;
			}
		}
	}
//	c.restore();

}

function distance(x1,y1,x2,y2) {return Math.sqrt( Math.pow(x1-x2,2) + Math.pow(y1-y2,2));}
function arc(cl,x,y,r,th1,th2,ccw,color) {
	//
	// set up the arc
	//
	cl.beginPath();
	cl.arc(x,y,r,th1,th2,ccw);
	temp = cl.strokeStyle;
	cl.strokeStyle = color;
	cl.stroke();
	cl.strokeStyle = temp;
}
function circle(cl,x,y,r,fors,color) {
	//
	// set up the arc
	//
	cl.beginPath();
	cl.arc(x,y,r,0,2*Math.PI,false);
	//
	// if fors is true, then we fill.  otherwise, we stroke
	//
	if (fors) {
		temp = cl.fillStyle;
		cl.fillStyle = color;
		cl.fill();
		cl.fillStyle = temp;
	}
	else {
		temp = cl.strokeStyle;
		cl.strokeStyle = color;
		cl.stroke();
		cl.strokeStyle = temp;
	}	
}
function rectangle(cl,x,y,w,h,fors,color) {
	//
	// draw a rectangle, with or without fill
	//
	cl.beginPath();
	cl.rect(x,y,w,h);
	if (fors) {
		temp = cl.fillStyle;
		cl.fillStyle = color;
		cl.fill();
		cl.fillStyle = temp;
	}
	else {
		temp = cl.strokeStyle;
		cl.strokeStyle = color;
		cl.stroke();
		cl.strokeStyle = temp;
	}	
}
function cosAng(angle) {return Math.cos(angle*Math.PI/180);}
function sinAng(angle) {return Math.sin(angle*Math.PI/180);}
function tanAng(angle) {return Math.tan(angle*Math.PI/180);}
function rotateX(x1,y1,angle) {
	//
	// returns the x2 coordinate of rotating x1,y1 by angle, which is in radians
	//
	return x1*Math.cos(angle) - y1*Math.sin(angle);
}
function rotateY(x1,y1,angle) {
	//
	// returns the y2 coordinate of rotating x1,y1 by angle, which is in radians
	//
	return x1*Math.sin(angle) + y1*Math.cos(angle);
}

function draw_arrow(cl,x1,y1,x2,y2,ends,oorc,color) {
	//
	// draws a line with arrowheads at both ends 
	// rotate the canvas, then draw a horizontal line with arrows at both ends, then restore
	// ends = 1 means draw at the entpoint x2,y2, ends = 2 means both ends
	// oorc is open or closed.   true = closed
	//
	let angle = Math.atan2(y2-y1,x2-x1);
	let len = Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
	cl.save();
	temp = cl.strokeStyle;
	cl.strokeStyle = color;
	cl.translate(x1,y1);
	cl.rotate(angle);
	// draw the line segment
	cl.beginPath();
	cl.moveTo(0,0);
	cl.lineTo(len,0);
	cl.stroke();
	cl.strokeStyle = temp;
	//
	// draw arrowhead at the endpoint
	//
	if (ends === 0 || ends === 2) {
		cl.beginPath();
		cl.moveTo(len-5,5);
		cl.lineTo(len,0);
		cl.lineTo(len-5,-5);
		if (oorc) {
			// draw closed arrows
			temp = cl.fillStyle;
			cl.fillStyle = color;
			cl.lineTo(len,0);
			cl.fill();
			cl.fillStyle = temp;
		}
		else {
			temp = cl.strokeStyle;
			cl.strokeStyle = color;
			cl.stroke();
			cl.strokeStyle = temp;
		}
	}
	if (ends === 1 || ends === 2) {
		// draw arrowhead at the startpoint
		cl.beginPath();
		cl.moveTo(5,5);
		cl.lineTo(0,0);
		cl.lineTo(5,-5);
		if (oorc) {
			// draw closed arrows
			temp = cl.fillStyle;
			cl.fillStyle = color;
			cl.lineTo(0,0);
			cl.fill();
			cl.fillStyle = temp;
		}
		else {
			temp = cl.strokeStyle;
			cl.strokeStyle = color;
			cl.stroke();
			cl.strokeStyle = temp;
		}
	}
	cl.restore();
}
function varrow(cl,x,y,len,angle,color) {
	//
	// angle is in radians, cl is the canvas context
	//
	// if len is too small, just forget it
	//
	if (len < 1) return;
	//
	// draw the stem first
	//
	var x1 = len*Math.cos(angle);
	var y1 = len*Math.sin(angle);
	var x2 = x + x1;
	var y2 = y - y1;   // remember, the canvas y coord is positive down!
	line(cl,x,y,x2,y2,color);
	//
	// now draw the arrowheads.   just add and subtract a small angle and 
	// reduce the endpoints accordingly.  this gives us arrows where the
	// heads scale with the stem, so to keep the head from getting a lot 
	// bigger than it needs to be, set a max value and cap it there
	//
	// but if the length is less than some value, let the arrow lengths scale
	//
	var hlen;
	if (len < 20) hlen = .5*len
	else hlen = 15;
	var arrowA = 0.4;
	var xr1 = len - hlen*Math.cos(arrowA);
	var yr1 = -hlen*Math.sin(arrowA);
//console.log(" xr1/yr1="+round(xr1,1)+"/"+round(yr1,1));
	var xh1 = x + rotateX(xr1,yr1,angle);
	var yh1 = y - rotateY(xr1,yr1,angle);
//	var hlen = .8*len;
//	var xh1 = x + hlen*Math.cos(angle-0.1);
//	var yh1 = y + hlen*Math.sin(angle-0.1);
	line(cl,x2,y2,xh1,yh1,color); 
	var yr1 = +hlen*Math.sin(arrowA);
	var xh2 = x + rotateX(xr1,yr1,angle);
	var yh2 = y - rotateY(xr1,yr1,angle);
//	var xh2 = x + hlen*Math.cos(angle+0.1);
//	var yh2 = y + hlen*Math.sin(angle+0.1);
	line(cl,x2,y2,xh2,yh2,color); 
}
function round(n, d) {return Math.round(n * Math.pow(10, d)) / Math.pow(10,d);}

function drawGrid(cl,w,h,dx,dy) {
	//
	// draws a grid onto the canvas, every dx and dy
	//
	var ny = Math.ceil(h/dy);
	for (var i=0; i<ny; i++) line(cl,0,dy*(i+1)+.5,w,dy*(i+1)+.5);
	var nx = Math.ceil(w/dx);
	for (var i=0; i<nx; i++) line(cl,dx*(i+1)+.5,0,dx*(i+1)+.5,h);
}
function drawGridL(cl,w,h,dx,dy,lw,color) {
	//
	// draws a grid onto the canvas, every dx and dy
	// lw = linewidth
	//
	var temp = cl.lineWidth;
	cl.lineWidth = lw;
	var ny = Math.ceil(h/dy);
	for (var i=0; i<ny; i++) line(cl,0,dy*(i+1)+.5,w,dy*(i+1)+.5,color);
	var nx = Math.ceil(w/dx);
	for (var i=0; i<nx; i++) line(cl,dx*(i+1)+.5,0,dx*(i+1)+.5,h,color);
	cl.lineWidth = temp;
}
function EulerX(phi,psi,theta,xin,yin,zin) {
	//
	// phi,psi,theta are the rotation angles
	// xin/yin/zin are the inputs, returns the new output X variable
	//
	var a = Math.cos(psi)*Math.cos(phi) - Math.cos(theta)*Math.sin(phi)*Math.sin(psi);
	var b = Math.cos(psi)*Math.sin(phi) + Math.cos(theta)*Math.cos(phi)*Math.sin(psi);
	var c = Math.sin(psi)*Math.sin(theta);
	return a*xin + b*yin + c*zin;
}
function EulerY(phi,psi,theta,xin,yin,zin) {
	//
	// phi,psi,theta are the rotation angles
	// xin/yin/zin are the inputs, returns the new output X variable
	//
	var a = -Math.sin(psi)*Math.cos(phi) - Math.cos(theta)*Math.sin(phi)*Math.cos(psi);
	var b = -Math.sin(psi)*Math.sin(phi) + Math.cos(theta)*Math.cos(phi)*Math.cos(psi);
	var c = Math.cos(psi)*Math.sin(theta);
	return a*xin + b*yin + c*zin;
}
function EulerZ(phi,psi,theta,xin,yin,zin) {
	//
	// phi,psi,theta are the rotation angles
	// xin/yin/zin are the inputs, returns the new output X variable
	//
	var a = Math.sin(theta)*Math.sin(psi);
	var b = -Math.sin(theta)*Math.cos(psi);
	var c = Math.cos(theta);
	return a*xin + b*yin + c*zin;
}
function getTrueOffsetLeft(ele) {
	var n = 0;
	while (ele)	{
		n += ele.offsetLeft || 0;
		ele = ele.offsetParent;
	}
	return n;
}
function getTrueOffsetTop(ele) {
	var offset = 0;
	var nextEle = ele;
	do {
		offset = offset + nextEle.offsetTop;
		nextEle = nextEle.offsetParent;
	} while (nextEle);
	return offset;
/*
	var n = 0;
	while (ele)	{
		n += ele.offsetTop || 0;
		ele = ele.offsetParent;
	}
	return n;
*/
}
function getMouse(e,can,W,H){
//	console.log("getMouse: e="+e+" can="+can+" W="+W+" H="+H);
	if (iOS) {
		//
		// be careful here, there is no e.eouches[0] if e.type is touchend!
		//
		if (e.type == 'touchend') {
			var x = e.changedTouches[0].clientX - getTrueOffsetLeft(can) + window.pageXOffset;
			var y = e.changedTouches[0].clientY - getTrueOffsetTop(can) + window.pageYOffset;
		}
		else {
			var x = e.touches[0].clientX - getTrueOffsetLeft(can) + window.pageXOffset;
			var y = e.touches[0].clientY - getTrueOffsetTop(can) + window.pageYOffset;
		}
	}
	else {
		var x = e.clientX - getTrueOffsetLeft(can) + window.pageXOffset;
		var y = e.clientY - getTrueOffsetTop(can) + window.pageYOffset;
//		console.log("getMouse: e.clientX/Y="+e.clientX+"/"+e.clientY);
//		console.log("          window.pageX/YOffset="+window.pageXOffset+"/"+window.pageYOffset);
//		console.log("          getTrueOffsetLeft="+getTrueOffsetLeft(can));
//		console.log("           getTrueOffsetTop="+getTrueOffsetTop(can));
	}
	return [
		Math.min(W-3, Math.max(3, x)),
		Math.min(H-3, Math.max(3, y)),
	];
}
function pad(width, string, padding) { 
  return (width <= string.length) ? string : pad(width, padding + string, padding)
}
function factorial (nf) {
	if (nf == 0) return 1;
	var m = 1;
	for (var i=nf; i>0; i--) m = m*i;
	return m;
}
function mynormal(mu, sig, ns){
//	console.log("mynormal: mu="+mu+" sig="+sig+" ns="+ns);
    if(!ns) ns = 20
    if(!sig) sig = 1
    if(!mu) mu=0
    var run_total = 0
    for(var i=0 ; i<ns ; i++){
       run_total += Math.random()
    }
    //
    // if we ggenerate M random numbers between 0 and 1, the RMS will come out to be
    //
    //  sigma = (1 - (1/M^2))/sqrt(12)
    //
    var true_sigma = Math.sqrt(ns/12)*Math.sqrt(1 - 1/(ns*ns));
	var xdist = sig*(run_total - ns/2)/true_sigma + mu;
	return xdist;
}
function gaussianIntegral(g1,g2,gmin,gmax,Npts) {
	//
	// integrates a gaussian between gmin and gmax with Npts steps, and returns
	// the ratio of the area between g1 and g2 to the total
	//
	var x = gmin;
	var total = 0;
	var totalT = 0;
	var dx = (gmax-gmin)/Npts;
//	var norm = Math.sqrt(2*Math.PI);
	for (var i=0; i<Ng; i++) {
		var garg = -0.5*x*x;
//		var G = norm*Math.exp(garg);
		var G = Math.exp(garg);
		if ( (x > g1) && (x<g2) ) total = total + G;
		totalT = totalT + G;
		x = x + dx;
	}
	prob = total/totalT;
//	console.log(" total is "+prob);
	return prob;
}
function Create2DArray(rows,columns) {
	//
	// you make a variable, call it "array", and initialize it by:
	//
	// nrows = 20;
	// ncolumns = 30;
	// array = Create2DArray(nrows,ncolumns)  (e.g. 20 rows, 30 columns)
	//
	// then to use it:
	//
	//	for (var i=0; i<nrows; i++) {
	//		var row = array[i];
	//		for (var j=0; j<ncolumns; j++) {
	//			var contents = row[j];
	//		}
	//	}
//	console.log("row="+rows+" columns="+columns);
	var x = new Array(rows);
	for (var i = 0; i < rows; i++) {
		x[i] = new Array(columns);
	}
	return x;
}
function anastring(num) {
//	console.log("ANA:"+num+"  isNaN="+isNaN(num));
	//
	// this function looks for numbers that are like this:
	//	0.49999999999999994
	//  0.7500000000000001
	//
	// and does the right thing
	//
	// if the argument is a number, turn it into a string
	//
	var str = " ";
	if (isNaN(num)) {
		str = num;
		num.toString();
	}
	else {
		str = num.toString();
		if (Math.abs(num) < 1E-10) return "0.0";
	}
	len = str.length;
//	console.log("  str='"+str+"' string of length "+len);
	//
	// if the length is less than something like 10, it's probably ok as is
	//
	if (len < 10) {
//		console.log("  1 result should be "+str);
		return str;
	}
	//
	// count the number of 0's or 9's
	//
	var n0 = 0;
	var n9 = 0;
	for (var i=0; i<len; i++) {
		var cat = str.charAt(i);
//		console.log("    char at "+i+" is "+cat);
		if (cat == "0") n0++;
		if (cat == "9") n9++;
	}
//	console.log("   number of 0 = "+n0+"   9 = "+n9);
	//
	// if the number of 0's is greater than some reasonable value like 8, then 
	// find the first non-zero character working backwards but ignore the last one
	//
	if (n0 > 8) {
		for (var i=len-2; i>0; i--) {
			var cat0 = str.charAt(i);
//			console.log("  working back i="+i+" char="+cat0);
			if (cat0 != "0") break;
		}
//		console.log("  ok i="+i+" and char is "+str.charAt(i));
		strret = str.substring(0,i+1);
//		console.log("  2 result should be "+strret);
		return strret;
	}
	//
	// for numbers like 5.49999999999994 we strip off the last digit and round up
	//
	if (n9 > 8) {
		var x9 = str.substring(0,len-1);
//		console.log("  x9 substring is "+x9);
		//
		// find out where the 9's start
		//
		for (var i=len-2; i>0; i--) {
			var cat9 = str.charAt(i);
			if (cat9 != "9") break;
		}
		strret = str.substring(0,i+2);
		lenr = strret.length;
		var dot = str.indexOf(".");
//		console.log("  3 result should be "+strret+"  dot is at "+dot+"  lenr="+lenr);
		//
		// convert back to a number and then round off and convert back to a string and return
		//
		// the last digit is 9, the length is lenr, and the "." is at dot so we round accordingly:
		//
		num2 = round(num,lenr-dot-1);
		strret = num2.toString();
//		console.log("   3 result is "+strret);
		return strret;
	}
}
function numObjProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}
function real_to_fraction(x) {
	//
	// this function takes a real and returns the best guess as to the fraction,
	// a rational number
	//
	// to use:  f = real_to_fraction(x)   then f.N and f.D are numerator and denominator
	//
	let error = 0.000001;
	let n = Math.floor(x);
	let z = x - n;
	if (z < error) return { N:n, D:1 };
	else if (1-error < z) return{ N:n+1, D:1 };
	//
	// The lower fraction is 0/1
	//
    let lower_n = 0
    let lower_d = 1
    //
    // The upper fraction is 1/1
    //
    let upper_n = 1
    let upper_d = 1
    while (true) {
    	//
        // The middle fraction is (lower_n + upper_n) / (lower_d + upper_d)
        //
        let middle_n = lower_n + upper_n
        let middle_d = lower_d + upper_d
        //
        // If x + error < middle
        //
        let test1 = middle_d * (z + error);
       	let test2 = (z - error) * middle_d;
        if (test1 < middle_n) {
            //
            // middle is our new upper
            //
            upper_n = middle_n
            upper_d = middle_d
        }
        //
        // else if (middle < x - error) 
        //
        else if (middle_n < test2) {
            //
            // middle is our new lower
            //
            lower_n = middle_n
            lower_d = middle_d
        }
        //
        // Else middle is our best fraction
        //
        else {
        	let N = n * middle_d + middle_n;
        	let D = middle_d;
        	return{ N:N, D:D };
        }
    }
}
function filltext(ctx,x,y,text,color) {
	let ctemp = ctx.fillStyle;
	ctx.fillStyle = color;
	ctx.fillText(text,x,y);
	ctx.fillStyle = ctemp;
}
//
// these two functions use the ability to generate tones
// start_tone returns the pointer to the oscillator, and
// stop_tone stops it.   look at ~/.../music/pyth.js for examples
//
function start_tone(ctx,vol,freq) {
//	console.log("starting...");
	//
	// start the tone
	// 
 	let osc = ctx.createOscillator();
	let oscg = ctx.createGain();

	osc.connect(oscg);
	oscg.connect(ctx.destination);

	oscg.gain.value = vol;
	osc.frequency.value = freq;
	osc.type = "sine";

	osc.start();
	return osc;
}
function stop_tone(osc) {
	osc.stop();
//	console.log("onoff="+onoff);
}
function intstocolor(r1,r2,r3) {
    s1 = r1.toString(16).toUpperCase();
    if (r1 < 16) s1 = "0"+s1;
    s2 = r2.toString(16).toUpperCase();
    if (r2 < 16) s2 = "0"+s2;
    s3 = r3.toString(16).toUpperCase();
    if (r3 < 16) s3 = "0"+s3;
    let newc = "#"+s1+s2+s3;
    return newc;    
}
function rgbtox2(r,g,b) {
	return r/255;
}
function xtorgb2(x) {
	let y = Math.max(x,0.0);
	y = Math.min(y,1.0);
	//
	//	green to red
	//
	let r = Math.floor(255*x);
	let g = 255-r;	
	let b = 0;
	//
	//	blue to red
	//
/*	let r = Math.floor(255*y);
	let b = 255-r;	
	let g = 0;*/
	return {r:r, g:g, b:b}
}
function rgtox(r,g,b) {
//
	x = r/255;
//	if (r == 0) x = (255 - g)*0.75/255;
//	else x = 0.25 + 0.75*r/255;
	return x;
}
function xtorg(x) {
	let y = Math.max(x,0.0);
	y = Math.min(y,1.0);
	let r = Math.floor(255*x);
	let g = 255-r;
/*	let r=0;
	let g=0;
	if (y < 0.25) {
		g = Math.floor(255 - (255*x/0.75));
	}
	else if (y < 0.75) {
		r = Math.floor((x-0.25)*255/0.75);
		g = Math.floor(255 - (255*x/0.75));
	}
	else {
		r = Math.floor((x-0.25)*255/0.75);
		g = 0;
	}
	*/
	return {r:r, g:g}
}
function rgbtox(r,g,b) {
  let x = -1;
  if (g == 0) {
    if (b == 0) x = (0.4*r/255) + 0.6;
    else x = .3*b/255;
  }
  else {
    if (b == 0) x = (0.4*r/255) + 0.6;
    else {
      if (b < 255/3) x = (0.3*(1-g/255)) + 0.5;
      else x = (0.3*g/255) + 0.2;
    }
  }
  return x;
}
function xtorgb(x) {
  //
  // x goes between 0 and 1, and we have blue "colder" and red "hotter" with green in the middle
  //
  let y = Math.max(x,0.0)
  y = Math.min(y,1.0)
  let r=0, g=0, b=0;
  if (y < 0.2) {
    b = Math.floor( 255*y/0.3 );
    g = 0;
    r = 0;
  }
  else if (y < 0.3) {
    b = Math.floor( 255*y/0.3 );
    g = Math.floor( 255*(y-0.2)/0.3 );
    r = 0;
  }
  else if (y < 0.4) {
    b = Math.floor( 255*(1-(y-0.3)/0.3) );
    g = Math.floor( 255*(y-0.2)/0.3 );
    r = 0;
  }
  else if (y < 0.5) {
    b = Math.floor( 255*(1-(y-0.3)/0.3) );
    g = Math.floor( 255*(y-0.2)/0.3 );
    r = 0;
  }
  else if (y < 0.6) {
    b = Math.floor( 255*(1-(y-0.3)/0.3) );
    g = Math.floor( 255*(1-(y-0.5)/0.3) );
    r = 0;
//    b = Math.floor( 255*(y-0.4)/0.3 );
  }
  else if (y < 0.7) {
    b = 0;
    g = Math.floor( 255*(1-(y-0.5)/0.3) );
    r = Math.floor( 255*(y-0.6)/0.4 );
  }
  else if (y < 0.8) {
    b = 0;
    g = Math.floor( 255*(1-(y-0.5)/0.3) );
    r = Math.floor( 255*(y-0.6)/0.4 );
  }
  else {
    b = 0;
    g = 0;
    r = Math.floor( 255*(y-0.6)/0.4 );
  }
  return {r:r, g:g, b:b}
}
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
