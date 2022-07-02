var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
var isTouchSupported = 'ontouchstart' in window;
var startEvent = isTouchSupported ? 'touchstart' : 'mousedown';
var moveEvent = isTouchSupported ? 'touchmove' : 'mousemove';
var endEvent = isTouchSupported ? 'touchend' : 'mouseup';
var umd_plots_version = "2.0";
function umd_histogram(canvas_id,title,nb,xf,xl) {
        //
        // service the arguments, which should always be canvas, title, bins, fbin, lbin
        //
        this.numbins = nb;
        this.title = title;
        this.bin1_edge_lower = xf;
        this.binl_edge_upper = xl;
        this.bin_width = (this.binl_edge_upper-this.bin1_edge_lower)/this.numbins;
        //
        // instantiate the canvas
        //
        this.canvas_id = canvas_id;
        this.canvas = document.getElementById(canvas_id);
        this.c = this.canvas.getContext("2d");
        this.can_width = 400;
        this.can_height = 400;
        this.canvas.width = this.can_width;
        this.canvas.height = this.can_height;
        this.title_width = Math.floor(this.c.measureText(this.title).width+0.5);
        this.canvas.hdel = 1;
        this.canvas.bin_width = this.bin_width;
        this.canvas.plot = umd_histo_plot;
        //
        // attach these to the canvas so that the listener can easily access them
        // x_bin, y_bin, v_bin are all in canvas space.
        // x_bin is the upper left x coordinate of bin (rectangle for histograms)
        // y_bin is the upper left y coordinate of bin (   "  )
        // v_bin is the height of the histogram rectangle
        // for histograms: 
        //              binv is the value of the bin at the left edge (use bin_width to get the center)
        //              binc is the contents of the bin for histograms, 
        // for scatterplots:
        //              binv is the x-value, binc is the y-value
        //
        this.x_bin = [];
        this.y_bin = [];
        this.v_bin = [];
        this.binv = [];
        this.binc = [];
        //
        // set up the methods and listeners
        //
        this.plot = umd_histo_plot;
        this.overlay = umd_histo_overlay;
        this.version = umd_show_version;
        this.canvas.numbins = this.numbins;
        this.canvas.x_bin = this.x_bin;
        this.canvas.y_bin = this.y_bin;
        this.canvas.v_bin = this.v_bin;
        this.canvas.binv = this.binv;
        this.canvas.binc = this.binc;
        this.canvas.bin_width = this.bin_width;
        this.canvas.norm_value = 1;

        this.border = false;
        this.background_color = "#a5a5a5";
        this.debug = false;
        this.show_stats = true;
        this.overlay_type = 0;
        this.overlay_circle_radius = 1;
        this.overlay_circle_color = "red";
        this.overlay_rectangle_fraction = 0.25;
        this.overlay_rectangle_color = "blue";
        this.overlay_line_width = 2;
        this.overlay_line_color = "blue";
        this.overlay_character = "*";
        this.overlay_character_color = "green";
        this.stats_title_offset = 105;          // works ok for Courier 12 font
        this.stats_delta_y = 15;
        this.normalize = false;
        this.normalize_value = 1;

        this.hist_color = "#4070d0";
        this.title_x0 = 50;
        this.title_y0 = 15;
        this.xoff = 0.15;
        this.yoff = 0.15;
        this.xoff_yaxis = this.xoff * this.can_width;
        this.yoff_xaxis = this.yoff * this.can_height;
        this.canvas.yaxis_height = this.can_height*(1-this.yoff);
        this.xgrid = 5;
        this.ygrid = 6;
        this.grid = true;
        this.x_ticks_every = this.xgrid + 1;
        this.box_width = 0.9;
        this.f_labels = 5;
        this.r_fract = 0.9;
        this.ymin = 0;
        this.ymax = 0;

        this.bin_content = [];
        this.bin_value = [];
        this.underflow = 0;
        this.overflow = 0;

        this.xtitle = null;
        this.ytitle = "Number";
        this.log_scale = false;

        this.xtitle_position = "CENTER";        //center justify title
        this.canvas.active_precision = 3;
        this.canvas.active_exponential = false;
}

function umd_histo_plot(data,options) {
        if (options) {
                //
                // get all the options first, if appropriate
                //
                if (typeof options.normalize !== "undefined") {
                        this.normalize = true;
                        this.normalize_value = options.normalize;
                        this.canvas.norm_value = this.normalize_value;
                }
                var isactive = false;
                if (typeof options.active !== "undefined") isactive = options.active;
                if (isactive) {
                        //
                        // if it's active, then we set up a listener, and we HAVE to have a div to write to!
                        // that is, until I learn to put up a small popup....
                        //
                        this.canvas.addEventListener(startEvent, umd_histo_listener);
                        if (typeof options.active_div === "undefined") 
                                alert("You HAVE to have a <div> for reporting bin contents to if you enable 'active'!!!!");
                        else {
                                this.canvas.divid = document.getElementById(options.active_div); // used by listener
                                this.canvas.divid.innerHTML = "";
                        }
                        if (typeof options.active_precision !== "undefined") this.canvas.active_precision = options.active_precision;

                        if (typeof options.active_exponential !== "undefined")
                                this.canvas.active_exponential = options.active_exponential;
                }
                if (typeof options.debug !== "undefined") this.debug = options.debug;
                if (typeof options.background !== "undefined") this.background_color = options.background;
                if (typeof options.border !== "undefined") this.border = options.border;
                if (typeof options.title !== "undefined") this.title = options.title;

                if (typeof options.width !== "undefined") {
                        this.can_width = options.width;
                        this.canvas.width = this.can_width;
                }
                this.xoff_yaxis = this.xoff*this.can_width;

                if (typeof options.ymin !== "undefined") this.ymin = options.ymin;
                if (typeof options.ymax !== "undefined") this.ymax = options.ymax;
                if (typeof options.height !== "undefined") {
                        this.can_height = options.height;
                        this.canvas.height = this.can_height;
                        this.canvas.yaxis_height = this.can_height*(1-this.yoff);
                }
                this.yoff_xaxis = this.yoff*this.can_height;

                if (typeof options.hist_color !== "undefined") this.hist_color = options.hist_color;

                if (typeof options.title_font === "undefined") this.c.font = "12px Courier";
                else this.c.font = options.title_font;

                if (typeof options.show_stats !== "undefined") this.show_stats = options.show_stats;

                if (typeof options.grid !== "undefined") this.grid = options.grid;

                if (typeof options.xgrid !== "undefined") {
                        this.xgrid = options.xgrid;
                        this.x_ticks_every = options.xgrid + 1;
                }
                if (typeof options.ygrid !== "undefined") {
                        this.ygrid = options.ygrid;
                }

                if (typeof options.r_fract !== "undefined") this.r_fract = options.r_fract;
//
// f_labels is the 1/fraction of all bins that have a label
//      
                if (typeof options.f_labels !== "undefined") this.f_labels = options.f_labels;

                if (typeof options.xtitle !== "undefined") this.xtitle = options.xtitle;

//              if (typeof options.log !== "undefined") this.log_scale = options.log;

                if (typeof options.xtitle_position !== "undefined") {
                        this.xtitle_position = options.xtitle_position;
                        this.xtitle_position = this.xtitle_position.toUpperCase();
                }

                if (this.debug) {
                        console.log(" nbins:"+this.numbins);
                        console.log(" fbin: "+this.bin1_edge_lower);
                        console.log(" lbin: "+this.binl_edge_upper);
                        console.log(" bin width="+this.bin_width);
                        console.log(" canvas height="+this.can_height+"  width="+this.can_width);
                        console.log(" title= '"+this.title+"'");
                        console.log(" log scale = "+this.log_scale);
                }
        }
        var space_str = "\u0020";       //
        // set up the canvas
        //
        this.c.clearRect(0,0,this.canvas.width,this.canvas.height);
        umd_rectangle(this.c,0,0,this.canvas.width,this.canvas.height,true,this.background_color);
        if (this.border) umd_rectangle(this.c,0,0,this.canvas.width,this.canvas.height,false,"black");
        //
        // fill the histogram array from the array of points
        //
        this.underflow = 0;
        this.overflow = 0;
        this.bin_content.length = 0;
        for (var i=0; i<this.numbins; i++) this.bin_content.push(0);
        if (this.debug) console.log("Generating histogram from "+data.length+" data points");
        for (var i=0; i<data.length; i++ ) {
                var bin = Math.floor((data[i]-this.bin1_edge_lower)/this.bin_width)
                if (this.debug) console.log(" i="+i+" data="+round(data[i],2)+" bin="+bin);
                if (bin < 0) this.underflow++;
                else if (bin > this.numbins) this.overflow++;
                else this.bin_content[bin]++;
        }
        //
        // set up the pseudo button to get the data in an alert box
        //
        if (isactive) {
                var tstr_width = this.c.measureText(this.title).width;
                this.title_x0 = 5;
                var click_rad = tstr_width;
                var click_h = 12;       
                this.canvas.x0_click = this.title_x0;
                this.canvas.y0_click = this.title_y0 - click_h;
                this.canvas.x1_click = this.title_x0 + click_rad;
                this.canvas.y1_click = this.title_y0;
                umd_rectangle(this.c,this.title_x0,this.title_y0-10,click_rad,click_h,true,"#F5F5F5");
        }
        //
        // draw title top left corner
        //      
        this.c.fillText(this.title,this.title_x0,this.title_y0);
        //
        // draw x title bottom center
        //
        if (this.xtitle != null) {
                xtw = this.c.measureText(this.xtitle).width;
                var yp = this.can_height - this.yoff_xaxis/5;
                if (this.xtitle_position == "LEFT") var xp = 20;
                else if (this.xtitle_position == "CENTER") var xp = (this.can_width - (this.can_width - xtw)/2);
                if (this.xtitle_position == "RIGHT") var xp = (this.can_width - xtw - 20);
//              var xp = (this.can_width - xtw)/2;
                this.c.fillText(this.xtitle,xp,yp);
        }
        if (this.ytitle != null) {
                this.c.save();
                this.c.translate(0,this.can_height);
                this.c.rotate(-0.5*Math.PI);
                ytw = this.c.measureText(this.ytitle).width;
                var xp = (this.can_height - ytw)/2;
                var yp = this.xoff_yaxis/4;
                this.c.fillText(this.ytitle,xp,yp);
                this.c.restore();
        }
        //
        // some statistics....
        //
        var sumxy = 0;
        var sumx2y = 0;
        var sumy = 0;
        var miny = this.bin_content[0];
        var maxy = this.bin_content[0];
        this.bin_value.length = 0;
        var bin = this.bin1_edge_lower + 0.5*this.bin_width;
        for (var i=0; i<this.numbins; i++) {
                this.bin_value.push(bin);
                if (this.debug) console.log(" bin="+round(bin,2)+" value = "+this.bin_content[i]);
                sumxy = sumxy + bin*this.bin_content[i];
                sumx2y = sumx2y + bin*bin*this.bin_content[i];
                sumy = sumy + this.bin_content[i];
                if (this.bin_content[i] < miny) miny = this.bin_content[i];
                if (this.bin_content[i] > maxy) maxy = this.bin_content[i];
                bin = bin + this.bin_width;
        }
        this.bin_mean = sumxy/sumy;
        this.bin_sd = Math.sqrt( sumx2y/sumy - this.bin_mean*this.bin_mean );
        this.bin_sum = sumy;
        if (this.normalize) this.canvas.norm_value = this.normalize_value/sumy;
        if (this.show_stats) {
                var the_mean = this.bin_mean;
                if (this.bin_mean < 0.001) the_mean = the_mean.toExponential(2);
                else the_mean = round(the_mean,3);
                var mstr = "Mean"+space_str+space_str+space_str+the_mean;
                var mstr_width = this.c.measureText(mstr).width;
                var sstr = "SD"+space_str+space_str+space_str+space_str+space_str+round(this.bin_sd,3);
                var sstr_width = this.c.measureText(sstr).width;
                var mxstr = "vMax"+space_str+space_str+space_str+round(maxy,3);
                var mxstr_width = this.c.measureText(mxstr).width;
                var max_width = Math.max(mstr_width,sstr_width,mxstr_width);
                var xstats = this.can_width - max_width - 5;
                this.c.fillText(mstr,xstats,this.title_y0);
                this.c.fillText(sstr,xstats,this.title_y0+this.stats_delta_y);
                this.c.fillText(mxstr,xstats,this.title_y0+2*this.stats_delta_y);
                this.c.fillText(
                        "Sum"+space_str+space_str+space_str+space_str+round(sumy,3),
                        xstats,this.title_y0+3*this.stats_delta_y);
                this.c.fillText(
                        "Under"+space_str+space_str+this.underflow,
                        xstats,this.title_y0+4*this.stats_delta_y);
                this.c.fillText(
                        "Over"+space_str+space_str+space_str+this.overflow,
                        xstats,this.title_y0+5*this.stats_delta_y);
        }
        //
        // now draw the horizontal and vertical axes
        //
//      this.c.translate(0.5,0.5);      // do this so we can draw thinner lines
        this.c.lineWidth = 1;
        this.vl = this.can_height - 2*this.yoff_xaxis;
        umd_line(this.c,                                                                                        //vertical line
                this.xoff_yaxis,this.yoff_xaxis,
                this.xoff_yaxis,this.yoff_xaxis + this.vl,"black");
        this.hl = this.can_width - 2*this.xoff_yaxis;
        umd_line(this.c,                                                                                        //horizontal line
                this.xoff_yaxis,                                this.can_height-this.yoff_xaxis,
                this.xoff_yaxis + this.hl, this.can_height-this.yoff_xaxis,"black");
        //
        // draw horizontal and vertical grid (and vertical labels)
        //
        // horizontal grid....
        var del_x = this.hl/this.x_ticks_every;
        for (var i=0; i<this.x_ticks_every-1; i++ ) {
                if (this.grid) umd_line(this.c,
                        this.xoff_yaxis+(i+1)*del_x,this.yoff_xaxis,
                        this.xoff_yaxis+(i+1)*del_x,this.yoff_xaxis+this.vl,    "white");
        }
        // vertical grid
        if (this.ymax == 0) this.ymax = maxy;
//      this.y_ticks_every = this.ygrid;
        var dely_counts = (this.ymax-this.ymin)/this.ygrid;
        //
        // for histograms, we don't want floating points, so convert to integers.
        //
        dely_counts = Math.floor(dely_counts) + 1;
        this.ymax = this.ymin + this.ygrid*dely_counts;
//      this.y_ticks_every = (this.ymax-this.ymin)/dely_counts;
        var del_y = this.vl/this.ygrid;
        var ylab = this.ymax;// + dely_counts;
        var norm = this.normalize ? this.normalize_value/sumy : 1;
        for (var i=0; i<this.ygrid; i++ ) {
                ylab = ylab - dely_counts;
                var yv = this.yoff_xaxis+(i+1)*del_y;
                if (this.grid) umd_line(this.c,this.xoff_yaxis,yv,this.xoff_yaxis+this.hl,yv,   "white");
                if (this.normalize) {
                        var ylabn = norm*ylab;
                        ystr = round(ylabn,2);
                }
                else {
                        ystr = round(ylab,0);
                }
                var xoff = this.c.measureText(ystr).width + 5;
                this.c.fillText(ystr,this.xoff_yaxis-xoff,yv+5);
        }
        //
        // draw histogram boxes
        //
        //
        // this.vl and hl are the lengths of the vertical and horizontal axis lines
        //
        // this.hdel is this.hl divided by numbins is the width of each bin in pixels
        this.hdel = this.hl/this.numbins;
        this.canvas.hdel = this.hdel;
        //
        // this.hbox is the width of the histogram rectangle, set by parameter
        //
        this.hbox = this.r_fract*this.hdel;
        //
        // this.hbox_center is the center of the bin
        //
        this.hbox_center = this.hdel/2;
        //
        // this.hbox_xoff is the offset from the left edge of the box, the distance between
        // the edge of the bin and the edge of the rectangle inside the bin (which is smaller
        // by the amount r_fract)
        //
        this.hbox_xoff = this.hdel * (1-this.r_fract)/2;
        if (this.debug) {
                console.log(" bin width in pixels = "+round(this.hdel,2));
                console.log(" width of histogram box = "+round(this.hbox,2));
                console.log(" offset on left edge = "+round(this.hbox_xoff,2));
        }
        var binv = this.bin1_edge_lower;
        this.binv.length = 0;
        this.binc.length = 0;
        this.x_bin.length = 0;
        this.y_bin.length = 0;
        this.v_bin.length = 0;
        for (var i=0; i<this.numbins; i++) {
                this.binc.push(norm*this.bin_content[i]);               // bin content
                this.binv.push(binv);                                           // low edge of bin in units
                var r_hfrac = this.bin_content[i]/this.ymax;
                var r_height = r_hfrac * this.vl;
                this.v_bin.push(r_height);                                      // height of bin in pixels
                var x = this.xoff_yaxis + i*this.hdel + this.hbox_xoff;
                this.x_bin.push(x);                                                     // x value of bin in pixels
                var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                this.y_bin.push(y);                                                     // y value of bin in pixels
                umd_rectangle(this.c,x,y,this.hbox,r_height,true,this.hist_color);
                binv = binv + this.bin_width;
        }
        //
        // draw horizontal labels
        //
        // f_labels is the 1/fraction of all bins that have a label
        //
        if (this.debug) console.log(" f_labels="+this.f_labels);
        var binv = this.bin1_edge_lower;
        for (var i=0; i<this.numbins; i++) {
                if (i%this.f_labels == 0) {
                        var x = this.xoff_yaxis + i*this.hdel;
                        var y = this.can_height - this.yoff_xaxis + 15;
                        var bstr = round(binv,1);
                        var bstr_width = this.c.measureText(bstr).width;
//console.log(" i="+i+" binv="+bstr+" x/y="+round(x,2)+"/"+round(y,2));
                        this.c.fillText(bstr,x-.5*bstr_width,y+5);
                        umd_line(this.c,x,this.can_height-this.yoff_xaxis+5,
                                                x,this.can_height-this.yoff_xaxis-5,"black");
                }
                binv = binv + this.bin_width;
        }


        if (this.debug) {
                console.log(" number of data points="+data.length);
                console.log(" title_wdith = "+this.title_width);
                console.log(" title at x="+this.title_x0+" y="+this.title_y0);
                console.log(" mean title width "+mstr_width);
                console.log(" number of bins = "+this.numbins);
                console.log(" left edge of low bin = "+this.bin1_edge_lower);
                console.log(" right edge of high bin = "+this.binl_edge_upper);
                console.log(" bin width = "+this.bin_width);
                console.log(" mean = "+round(this.bin_mean,2)+"  SD="+round(this.bin_sd,2));
                console.log(" sum = "+sumy);
                console.log(" underflow="+this.underflow);
                console.log(" overflow="+this.overflow);
        }
}

function umd_histo_listener(ev) {
//      console.log(" event="+ev);
        //
        // this is a child of the canvas, to get the pointer directly
        //
        var canv = ev.target;
        var pr = canv.active_precision;
        var ex = canv.active_exponential;
        var mouse = getMouse(ev,canv,canv.width,canv.height);
        var xp = mouse[0];
        var yp = mouse[1];
        if (iOS) {
//console.log("c1Handler: IOS detected")
                ev.preventDefault();
        }
//      console.log(" xp/yp = "+xp+"/"+yp);
//      console.log(" numbins="+canv.numbins+" bin width="+canv.bin_width);
//      canv.plot();
        //
        // see if we are clicking for data
        //
        var xclick = xp > canv.x0_click && xp < canv.x1_click;
        var yclick = yp > canv.y0_click && yp < canv.y1_click;
        if (xclick && yclick) {
                var astr;
                astr = canv.divid.innerHTML;
                if (astr.length == 0) {
                        astr = "<textarea>x and y:\n";
                        for (var i=0; i<canv.numbins; i++) {
                                if (ex) {
                                        astr = astr + canv.binv[i].toExponential() + 
                                                "    " + canv.binc[i].toExponential() + "\n";
                                }
                                else {
                                        astr = astr + round(canv.binv[i],pr) + 
                                                "    " + round(canv.binc[i],pr) + "\n";
                                }
                        }
                        astr = astr + "</textarea>"
                }
                else {
                        astr = "";
                }
                canv.divid.innerHTML=astr;
                return;
        }
        for (var i=0; i<canv.numbins; i++ ) {
                var xhere = canv.x_bin[i];
                var xhere2 = xhere + canv.hdel;
                var xok = (xp >= xhere )&& (xp < xhere2)
                var yhere = canv.y_bin[i];
//              var yhere2 = yhere + canv.v_bin[i];
                var yhere2 = canv.yaxis_height;
                var yok = (yp >= yhere && yp) && (yp < yhere2);
//              console.log(" i="+i+" xp/yp="+xp+"/"+yp+" xh1/2="+round(xhere,1)+"/"+round(xhere2,1)+
//                      " yh1/2="+round(yhere,1)+"/"+round(yhere2,1));
                if (xok && yok) {
                        var b1 = canv.binv[i];
                        var b2 = canv.binc[i];
                        var lstr = "bin "+(i+1)+" of "+canv.numbins+": "+round(b1,2)+" to "+round(b1+canv.bin_width,2)+" = ";
                        if (canv.norm_value == 1) lstr = lstr + b2;
                        else lstr = lstr + round(b2,pr);
                        canv.divid.innerHTML=lstr;
//                      console.log(" found it!");
                }
        }
}

function umd_histo_overlay(data,options) {
        if (typeof options.overlay_type !== "undefined") this.overlay_type = options.overlay_type;
        if (this.overlay_type == 0) {
                //
                // plot a point at the center of each bin
                //
                if (typeof options.overlay_circle_radius !== "undefined") 
                        this.overlay_circle_radius = options.overlay_circle_radius;
                if (typeof options.overlay_circle_color !== "undefined") 
                        this.overlay_circle_color = options.overlay_circle_color;
                for (var i=0; i<this.numbins; i++) {
                        var r_hfrac = data[i]/this.ymax;
                        var r_height = r_hfrac * this.vl;
                        var x = this.xoff_yaxis + i*this.hdel + this.hbox_center;
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                        umd_circle(this.c,x,y,this.overlay_circle_radius,true,this.overlay_circle_color);
                }
        }
        if (this.overlay_type == 1) {
                //
                // plot a rectangle 
                //
                if (typeof options.overlay_rectangle_fraction !== "undefined") 
                        this.overlay_rectangle_fraction = options.overlay_rectangle_fraction;
                if (typeof options.overlay_rectangle_color !== "undefined") 
                        this.overlay_rectangle_color = options.overlay_rectangle_color;
                for (var i=0; i<this.numbins; i++) {
                        var r_hfrac = data[i]/this.ymax;
                        var r_height = r_hfrac * this.vl; 
                        var wrect = this.overlay_rectangle_fraction*this.hbox;
                        var offset = 0.5*wrect;
                        var x = this.xoff_yaxis + i*this.hdel + this.hbox_center - offset;
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                        umd_rectangle(this.c,x,y,wrect,wrect,true,this.overlay_rectangle_color);
                }
        }
        if (this.overlay_type == 2) {
                //
                // plot a virtual at the center of each bin and connect via line.
                // start at the first point and end on the last one
                //
                var ltemp = this.c.lineWidth;
                if (typeof options.overlay_line_width !== "undefined") 
                        this.overlay_line_width = options.overlay_line_width;
                if (typeof options.overlay_line_color !== "undefined") 
                        this.overlay_line_color = options.overlay_line_color;
                this.c.lineWidth = this.overlay_line_width;
                for (var i=0; i<this.numbins-1; i++) {
                        var r_hfrac1 = data[i]/this.ymax;
                        var r_height1 = r_hfrac1 * this.vl;
                        var x1 = this.xoff_yaxis + i*this.hdel + this.hbox_center;
                        var y1 = this.yoff_xaxis + this.vl*(1-r_hfrac1);

                        var r_hfrac2 = data[i+1]/this.ymax;
                        var r_height2 = r_hfrac2 * this.vl;
                        var x2 = this.xoff_yaxis + (i+1)*this.hdel + this.hbox_center;
                        var y2 = this.yoff_xaxis + this.vl*(1-r_hfrac2);
                        umd_line(this.c,x1,y1,x2,y2,this.overlay_line_color);
                }
                this.c.lineWidth = ltemp;
        }
        if (this.overlay_type == 3) {
                //
                // plot a character at the center of each bin
                //
                if (typeof options.overlay_character !== "undefined") 
                        this.overlay_character = options.overlay_character;
                if (typeof options.overlay_character_color !== "undefined") 
                        this.overlay_character_color = options.overlay_character_color;
                var cstr_width = this.c.measureText(this.overlay_character).width;              
                for (var i=0; i<this.numbins; i++) {
                        var r_hfrac = data[i]/this.ymax;
                        var r_height = r_hfrac * this.vl;
                        var x = this.xoff_yaxis + i*this.hdel + this.hbox_center - .5*cstr_width;
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                        this.c.fillText(this.overlay_character,x,y);
                }
        }
}
//=============================================================================//
//=============================================================================//
//=============================================================================//
//=============================================================================//

function umd_scatterplot(canvas_id,title) {
        //
        // service the arguments, which should always be canvas, title, bins, fbin, lbin
        //
        this.numbins = 0;               // this gets filled in when we know the data
        this.title = title;
        //
        // instantiate the canvas
        //
        this.canvas_id = canvas_id;
        this.canvas = document.getElementById(canvas_id);
        this.c = this.canvas.getContext("2d");
        this.can_width = 400;
        this.can_height = 400;
        this.canvas.width = this.can_width;
        this.canvas.height = this.can_height;
        this.title_width = Math.floor(this.c.measureText(this.title).width+0.5);
        this.canvas.hdel = 1;
        this.canvas.bin_width = this.bin_width;
        this.canvas.plot = umd_histo_plot;
        //
        // attach these to the canvas so that the listener can easily access them
        // x_bin, y_bin, v_bin are all in canvas space.
        // x_bin is the upper left x coordinate of bin (rectangle for histograms)
        // y_bin is the upper left y coordinate of bin (   "  )
        // v_bin is the height of the histogram rectangle
        // for histograms: 
        //              binv is the value of the bin at the left edge (use bin_width to get the center)
        //              binc is the contents of the bin for histograms, 
        // for scatterplots:
        //              binv is the x-value, binc is the y-value
        //
        this.x_bin = [];
        this.y_bin = [];
        this.v_bin = [];
        this.binv = [];
        this.binc = [];
        //
        // set up the methods and listeners
        //
        this.plot = umd_scatter_plot;
        this.overlay = umd_scatter_overlay;
        this.errorbars = umd_scatter_errorbars;
        this.version = umd_show_version;
        this.canvas.numbins = this.numbins;
        this.canvas.x_bin = this.x_bin;
        this.canvas.y_bin = this.y_bin;
        this.canvas.v_bin = this.v_bin;
        this.canvas.binv = this.binv;
        this.canvas.binc = this.binc;
        this.canvas.bin_width = this.bin_width;
        this.canvas.norm_value = 1;

        this.border = false;
        this.background_color = "#a5a5a5";
        this.debug = false;
        this.show_stats = true;
        this.overlay_type = 0;
        this.overlay_circle_radius = 1;
        this.overlay_circle_color = "red";
        this.overlay_rectangle_fraction = 0.25;
        this.overlay_rectangle_color = "blue";
        this.overlay_line_width = 2;
        this.overlay_line_color = "blue";
        this.overlay_character = "*";
        this.overlay_character_color = "green";
        this.stats_title_offset = 105;          // works ok for Courier 12 font
        this.stats_delta_y = 15;
        this.normalize = false;
        this.normalize_value = 1;

        this.title_x0 = 50;
        this.title_y0 = 15;
        this.xoff = 0.15;
        this.yoff = 0.15;
        this.xoff_yaxis = this.xoff * this.can_width;
        this.yoff_xaxis = this.yoff * this.can_height;
        this.canvas.yaxis_height = this.can_height*(1-this.yoff);
        this.xgrid = 5;
        this.ygrid = 6;
        this.grid = true;
        this.x_ticks_every = this.xgrid + 1;
        this.y_ticks_every = this.ygrid + 1;
        this.box_width = 0.9;
        this.nxlabels = 5;

        this.xmin = null;
        this.xmax = null;
        this.ymin = null;
        this.ymax = null;

        this.point_rad = 3;
        this.canvas.point_rad = this.point_rad;
        this.point_color = "#4070d0";
        this.xtitle = null;
        this.ytitle = null;
        this.log_scale = false;
        this.plot_type = "POINTS";              // 0=points, 1=line, 2=both

        this.overlay_circle_radius = 2;
        this.overlay_circle_color = "red";
        this.overlay_box_width = 3;
        this.overlay_box_color = "red";
        this.overlay_line_width = 1;
        this.overlay_line_color = "white";

        this.errorbar_color = "black";
        this.errorbar_width = 1;
        this.errorbar_barwidth = 5;

//      this.line_width = 1;
        this.line_color = "black";

        this.xtitle_position = "CENTER";        //center justify title
        this.canvas.active_precision = 3;
        this.canvas.active_exponential = false;
        this.xtick_unit = null;
        this.xtick_unit_precision = 3;
        this.ytick_unit = null;
        this.ytick_unit_precision = 3;
}

function umd_scatter_plot(datax,datay,options) {
        if (options) {
                //
                // get all the options first, if appropriate
                //
                var isactive = false;
                if (typeof options.active !== "undefined") isactive = options.active;
                if (isactive) {
                        //
                        // if it's active, then we set up a listener, and we HAVE to have a div to write to!
                        // that is, until I learn to put up a small popup....
                        //
                        this.canvas.addEventListener(startEvent, umd_scatter_listener);
                        if (typeof options.active_div === "undefined") 
                                alert("You HAVE to have a <div> for reporting bin contents to if you enable 'active'!!!!");
                        else {
                                this.canvas.divid = document.getElementById(options.active_div); // used by listener
                                this.canvas.divid.innerHTML = "";
                        }
                        if (typeof options.active_precision !== "undefined") 
                                this.canvas.active_precision = options.active_precision;

                        if (typeof options.active_exponential !== "undefined")
                                this.canvas.active_exponential = options.active_exponential;
                }
                //
                // if we don't have any of xmin, xmax, ymin, ymax, we use the data to figure it out
                //
                if (typeof options.xmin !== "undefined") this.xmin = options.xmin;
                if (typeof options.xmax !== "undefined") this.xmax = options.xmax;
                if (typeof options.ymin !== "undefined") this.ymin = options.ymin;
                if (typeof options.ymax !== "undefined") this.ymax = options.ymax;

                if (typeof options.debug !== "undefined") this.debug = options.debug;
                if (typeof options.background !== "undefined") this.background_color = options.background;
                        if (typeof options.border !== "undefined") this.border = options.border;
                if (typeof options.title !== "undefined") this.title = options.title;

                if (typeof options.width !== "undefined") {
                        this.can_width = options.width;
                        this.canvas.width = this.can_width;
                }
                this.xoff_yaxis = this.xoff*this.can_width;

                if (typeof options.height !== "undefined") {
                        this.can_height = options.height;
                        this.canvas.height = this.can_height;
                        this.canvas.yaxis_height = this.can_height*(1-this.yoff);
                }
                this.yoff_xaxis = this.yoff*this.can_height;

                if (typeof options.title_font === "undefined") this.c.font = "12px Courier";
                else this.c.font = options.title_font;

                if (typeof options.show_stats !== "undefined") this.show_stats = options.show_stats;

                if (typeof options.grid !== "undefined") this.grid = options.grid;
                if (typeof options.xgrid !== "undefined") {
                        this.xgrid = options.xgrid;
                        this.x_ticks_every = options.xgrid + 1;
                }

                if (typeof options.xtick_unit !== "undefined") this.xtick_unit = options.xtick_unit;
                if (typeof options.ytick_unit !== "undefined") this.ytick_unit = options.ytick_unit;
                if (typeof options.ytick_unit_precision !== "undefined")
                        this.ytick_unit_precision = options.ytick_unit_precision;
                if (typeof options.xtick_unit_precision !== "undefined")
                        this.xtick_unit_precision = options.xtick_unit_precision;

                if (typeof options.ygrid !== "undefined") {
                        this.ygrid = options.ygrid;
                        this.y_ticks_every = options.ygrid + 1;
                }
                //
                // hxabels is the number of labels in the horizontal interval between xmin and xmax
                // including the ends
                //      
                if (typeof options.nxlabels !== "undefined") this.nxlabels = options.nxlabels;

                if (typeof options.point_radius !== "undefined") {
                        this.point_rad = options.point_radius;
                        this.canvas.point_rad = this.point_rad;
                }
                if (typeof options.point_color !== "undefined") this.point_color = options.point_color;
                if (typeof options.line_color !== "undefined") this.line_color = options.line_color;

                if (typeof options.xtitle !== "undefined") this.xtitle = options.xtitle;
                if (typeof options.ytitle !== "undefined") this.ytitle = options.ytitle;

                if (typeof options.log !== "undefined") this.log_scale = options.log;

                if (typeof options.plot_type !== "undefined") {
                        this.plot_type = options.plot_type;
                        this.plot_type = this.plot_type.toUpperCase();
                }

                if (typeof options.xtitle_position !== "undefined") {
                        this.xtitle_position = options.xtitle_position;
                        this.xtitle_position = this.xtitle_position.toUpperCase();
                }

                if (this.debug) {
                        console.log(" canvas height="+this.can_height+"  width="+this.can_width);
                        console.log(" title= '"+this.title+"'");
                        console.log(" log scale = "+this.log_scale);
                }
        }
//
// debugging....remember that the coordinate system has y increasing DOWNWARD
//
// can_height/can_width   self explanatory!
// yoff_xaxis           vertical length offset of x axis from bottom of canvas,
//                                      and distance between top of canvas and drawing area of plot
// vertical_y_bot   y coord of drawable bottom (where the x-axis is drawn)
// vertical_y_top   y coord of drawable top (equal to yoff_xaxis)
// vl                   vertical length of drawable part of canvas, = vertical_y_bot-...top
//                  so if canvas is 400 and yoff_xaxis is 50, this.vl = 400-2*50=300
//
// xoff_yaxis           horizontal version of yoff_xaxis
// horizontal_x_left    x coord of drawable left (where y axis is drawn)
// horizontal_x_right   x coord of drawable right
// hl                           horitzontal version of vl
//
// canvas coordinates of the plot drawable:
//    top left:  xTL=horizontal_x_left, yTL=vertical_y_top
//    top right: xTR=horizontal_x_right,yTR=vertical_y_top
//    bot left:  xBL=horizontal_x_left, yBL=vertical_y_bot
//    bot right: xBR=horizontal_x_right,yBR=vertical_y_bot


// numbins              length of datax array
// bin_mean             mean using bin contents for histogram (or just contents for scatterplot)
// bin_sd               standard deviation
// bin_sum              sum, or area under the curve
        var space_str = "\u0020";
        //
        // set up the canvas
        //
        this.c.clearRect(0,0,this.canvas.width,this.canvas.height);
        umd_rectangle(this.c,0,0,this.canvas.width,this.canvas.height,true,this.background_color);
        if (this.border) umd_rectangle(this.c,0,0,this.canvas.width,this.canvas.height,false,"black");
        //
        // set up the pseudo button to get the data in an alert box
        //
        if (isactive) {
                var tstr_width = this.c.measureText(this.title).width;
                this.title_x0 = 5;
                var click_rad = tstr_width;
                var click_h = 12;       
                this.canvas.x0_click = this.title_x0;
                this.canvas.y0_click = this.title_y0 - click_h;
                this.canvas.x1_click = this.title_x0 + click_rad;
                this.canvas.y1_click = this.title_y0;
                umd_rectangle(this.c,this.title_x0,this.title_y0-10,click_rad,click_h,true,"#F5F5F5");
        }
        //
        // draw title top left corner
        //      
        this.c.fillText(this.title,this.title_x0,this.title_y0);
        //
        // draw x title bottom left/center/right as required
        //
        if (this.xtitle != null) {
//console.log(" xtitle="+this.xtitle+" position="+this.xtitle_position);
                xtw = this.c.measureText(this.xtitle).width;
                var yp = this.can_height - this.yoff_xaxis/5;
                if (this.xtitle_position == "LEFT") var xp = 20;
                else if (this.xtitle_position == "CENTER") var xp = (this.can_width - xtw)/2;
                if (this.xtitle_position == "RIGHT") var xp = (this.can_width - xtw - 20);
                this.c.fillText(this.xtitle,xp,yp);
        }
        if (this.ytitle != null) {
                this.c.save();
                this.c.translate(0,this.can_height);
                this.c.rotate(-0.5*Math.PI);
                ytw = this.c.measureText(this.ytitle).width;
                var xp = (this.can_height - ytw)/2;
                var yp = this.xoff_yaxis/4;
                this.c.fillText(this.ytitle,xp,yp);
                this.c.restore();
        }
        //
        // now draw the horizontal and vertical axes
        //
        this.c.translate(0.5,0.5);      // do this so we can draw thinner lines
        this.c.lineWidth = 1;
        this.vertical_y_bot = this.can_height - this.yoff_xaxis;
        this.vertical_y_top = this.yoff_xaxis;
        this.vl = this.vertical_y_bot - this.vertical_y_top;
        this.horizontal_x_left = this.xoff_yaxis;
        this.horizontal_x_right = this.can_width - this.xoff_yaxis;
        this.hl = this.horizontal_x_right - this.horizontal_x_left;
        var xTL=this.horizontal_x_left;
        var yTL=this.vertical_y_top;
        var xTR=this.horizontal_x_right;
        var yTR=this.vertical_y_top;
        var xBL=this.horizontal_x_left;
        var yBL=this.vertical_y_bot;
        var xBR=this.horizontal_x_right;
        var yBR=this.vertical_y_bot;
        // vertical line:
        umd_line(this.c, xTL,yTL, xBL, yBL, "black");
        // horizontal line
        umd_line(this.c, xBL,yBL, xBR, yBR, "black");
        //
        // some statistics....
        //
        this.numbins = datax.length;
        this.canvas.numbins = this.numbins;
        var sumxy = 0;
        var sumx2y = 0;
        var sumy = 0;
        var miny = datay[0];
        var maxy = datay[0];
        var minx = datax[0];
        var maxx = datax[0];
        if (this.debug) console.log(" number of points: "+this.numbins);
        for (var i=0; i<this.numbins; i++) {
                var x = datax[i];
                var y = datay[i];
                if (this.debug) console.log(" x/y="+round(x,2)+"/"+round(y,2));
                sumxy = sumxy + x*y;
                sumx2y = sumx2y + x*x*y;
                sumy = sumy + y;
                if (!(this.log_scale && y==0) ) {
                        //
                        // what does the above do?  well, if this is log scale, and there's a y=0 points,
                        // then don't use it for the min/max
                        //
                        if (y < miny) miny = y;
                        if (y > maxy) maxy = y;
                        if (x < minx) minx = x;
                        if (x > maxx) maxx = x;
                }
        }
        this.bin_mean = sumxy/sumy;
        this.bin_sd = Math.sqrt( sumx2y/sumy - this.bin_mean*this.bin_mean );
        this.bin_sum = sumy;
        //
        // if we have not set the min and max in x and y explicitly in the options, use the real values
        //
        if (this.ymax == null) this.ymax = maxy;
        if (this.ymin == null) this.ymin = miny;
        if (this.log_scale) {
                //
                // ymin is tricky.   we can't let the min value of 0 be used!
                //
                if (this.ymin == 0) this.ymin = miny;
        }
        else {
        }
        if (this.xmax == null) this.xmax = maxx;
        if (this.xmin == null) this.xmin = minx;
        //
        // show stats?
        //
        if (this.show_stats) {
                var the_mean = this.bin_mean;
                if (this.bin_mean < 0.001) the_mean = the_mean.toExponential(2);
                else the_mean = round(the_mean,3);
                var mstr = "Mean"+space_str+space_str+space_str+the_mean;
                var mstr_width = this.c.measureText(mstr).width;
                var sstr = "SD"+space_str+space_str+space_str+space_str+space_str+round(this.bin_sd,3);
                var sstr_width = this.c.measureText(sstr).width;
                var mxstr = "vMax"+space_str+space_str+space_str+round(maxy,3);
                var mxstr_width = this.c.measureText(mxstr).width;
                var max_width = Math.max(mstr_width,sstr_width,mxstr_width);
                var xstats = this.can_width - max_width - 5;
                this.c.fillText(mstr,xstats,this.title_y0);
                this.c.fillText(sstr,xstats,this.title_y0+this.stats_delta_y);
                this.c.fillText(mxstr,xstats,this.title_y0+2*this.stats_delta_y);
                this.c.fillText(
                        "Sum"+space_str+space_str+space_str+space_str+round(sumy,3),
                        xstats,this.title_y0+3*this.stats_delta_y);
        }
        //
        // now, treat log and linear scale separately just to make the code easier
        //
        if (this.log_scale) {
                //
                // log scale here.  all we need to do is to redefine ymin and ymax and go
                // from there, using the log10(datay)
                //
                this.ymax = Math.floor(Math.log10(this.ymax)) + 1;
                this.ymin = Math.floor(Math.log10(this.ymin));

                var x_interval = this.xmax - this.xmin;
                var y_interval = this.ymax - this.ymin;
                //
                // draw vertical grid lines, tick marks, and labels along x-axis
                //
                var x_interval = this.xmax - this.xmin;
                if (this.xtick_unit == null) this.xtick_unit = x_interval/this.xgrid;
                var ns = Math.floor(this.xmin/this.xtick_unit);
                var nf = Math.floor(this.xmax/this.xtick_unit)+1;
                var delx = this.xtick_unit;
                var xs = delx + delx*ns;
                var nticks = nf - ns + 1;
//console.log(this.title);
//console.log(" this.xtick="+this.xtick_unit);
                for (var i=1; i<nticks-1; i++ ) {
                        var xc = xTL + (xs-this.xmin)*this.hl/x_interval;
                        if (this.grid) umd_line(this.c, xc,yTL, xc,yBL, "white");
                        var bstr = round(xs,this.xtick_unit_precision);
                        var bstr_width = this.c.measureText(bstr).width;
                        this.c.fillText(bstr,xc-.5*bstr_width,yBL+15);
                        umd_line(this.c,xc,yBL+3, xc,yBL-3,"black");                    
                        xs = xs + delx;
                }

                //
                // now draw horizontal lines, parallel to x-axis, and draw the y labels
                //
                var ylab = this.ymax;
                var dely_counts = 1;
                var nyticks = y_interval;
                var del_y = this.vl/nyticks;
                for (var i=0; i<nyticks-1; i++ ) {
                        ylab = ylab - dely_counts;
                        var y = yTL + (i+1)*del_y;
                        if (this.grid) umd_line(this.c, xBL,y,  xBR,y,  "white");
                        if (maxy < 1) ystr = round(ylab,3);
                        else ystr = round(ylab,1);
                        ystr = "1E" + ystr;
                        var xoff = this.c.measureText(ystr).width + 5;
                        this.c.fillText(ystr,xBL-xoff,y+5);
                }
                //
                // draw the scatter plot next
                //
                this.canvas.binv.length = 0;
                this.canvas.binc.length = 0;
                this.canvas.x_bin.length = 0;
                this.canvas.y_bin.length = 0;
//      console.log(" this.plot_type="+this.plot_type);
                for (var i=0; i<this.numbins; i++) {
                        //
                        // x,y is the data pair. save it in binv,binc for the listener to access
                        //
                        var x = datax[i];
                        var y = datay[i];
                        this.canvas.binv.push(x);
                        this.canvas.binc.push(datay[i]);
                        //
                        // xc,yc is canvas coordinates for the data pair. save it in x_bin,y_bin
                        // for the listener to access
                        //
                        var yl = Math.log10(y);
                        if (yl > this.ymin) {
                                var xc = xBL + (x-this.xmin)*this.hl/x_interval;
                                var yc = yBL - (yl-this.ymin)*this.vl/y_interval;
                                this.canvas.x_bin.push(xc);
                                this.canvas.y_bin.push(yc);
                                //
                                // now do what the plot_type option tells you
                                //
                                switch (this.plot_type) {
                                        case "POINTS":
                                                umd_circle(this.c,xc,yc,this.point_rad,true,this.point_color);
                                                break;
                                        case "LINE":
                                                if (i > 0) {
                                                        umd_line(this.c,this.canvas.x_bin[i-1],this.canvas.y_bin[i-1],
                                                                                xc,yc,this.line_color);
                                                }
                                                break;
                                        case "BOTH":
                                                umd_circle(this.c,xc,yc,this.point_rad,true,this.point_color);
                                                if (i > 0) {
                                                        umd_line(this.c,this.canvas.x_bin[i-1],this.canvas.y_bin[i-1],
                                                                                xc,yc,this.point_color);
                                                }
                                                break;
                                        default: 
                                                console.log("Illegal plot type: "+this.plot_type);
                                }
                        }
                }
        }
        else {
                //
                // linear scale here
                //
                // draw vertical grid lines, tick marks, and labels along x-axis
                //
                var x_interval = this.xmax - this.xmin;
                if (this.xtick_unit == null) this.xtick_unit = x_interval/this.xgrid;
                var ns = Math.floor(this.xmin/this.xtick_unit);
                var nf = Math.floor(this.xmax/this.xtick_unit)+1;
                var delx = this.xtick_unit;
                var xs = delx + delx*ns;
                var nticks = nf - ns + 1;
//console.log(this.title);
//console.log(" this.xtick="+this.xtick_unit);
                for (var i=1; i<nticks-1; i++ ) {
                        var xc = xTL + (xs-this.xmin)*this.hl/x_interval;
                        if (this.grid) umd_line(this.c, xc,yTL, xc,yBL, "white");
                        var bstr = round(xs,this.xtick_unit_precision);
                        var bstr_width = this.c.measureText(bstr).width;
                        this.c.fillText(bstr,xc-.5*bstr_width,yBL+15);
                        umd_line(this.c,xc,yBL+3, xc,yBL-3,"black");                    
                        xs = xs + delx;
                }
                //
                // draw horizontal grid lines, tick marks, and labels along y-axis
                //
                var y_interval = this.ymax - this.ymin;
                if (this.ytick_unit == null) this.ytick_unit = round(y_interval/this.ygrid,2);
                ns = Math.floor(this.ymin/this.ytick_unit);
                nf = Math.floor(this.ymax/this.ytick_unit)+1;
                var dely = this.ytick_unit;
                var ys = dely + dely*ns;
                nticks = nf - ns + 1;
//console.log(" this.ytick="+this.ytick_unit);
                for (var i=1; i<nticks-1; i++ ) {
                        var yc = yBL - (ys-this.ymin)*this.vl/y_interval;
                        if (this.grid) umd_line(this.c, xBL,yc, xBR,yc, "white");
                        var bstr = round(ys,this.ytick_unit_precision);
                        var bstr_width = this.c.measureText(bstr).width;
                        this.c.fillText(bstr,xBL-bstr_width-5,yc);
                        umd_line(this.c,xBL-3,yc, xBL+3,yc,"black");                    
                        ys = ys + dely;
                }
                //
                // draw the scatter plot next
                //
                this.canvas.binv.length = 0;
                this.canvas.binc.length = 0;
                this.canvas.x_bin.length = 0;
                this.canvas.y_bin.length = 0;
//      console.log(" this.plot_type="+this.plot_type);
                for (var i=0; i<this.numbins; i++) {
                        //
                        // x,y is the data pair. save it in binv,binc for the listener to access
                        //
                        var x = datax[i];
                        var y = datay[i];
                        this.canvas.binv.push(x);
                        this.canvas.binc.push(datay[i]);
                        //
                        // xc,yc is canvas coordinates for the data pair. save it in x_bin,y_bin
                        // for the listener to access
                        //
                        var xc = xTL + (x-this.xmin)*this.hl/x_interval;
                        var yc = yBL - (y-this.ymin)*this.vl/y_interval;
                        this.canvas.x_bin.push(xc);
                        this.canvas.y_bin.push(yc);
                        //
                        // now do what the plot_type option tells you
                        //
                        switch (this.plot_type) {
                                case "POINTS":
                                        umd_circle(this.c,xc,yc,this.point_rad,true,this.point_color);
                                        break;
                                case "LINE":
                                        if (i > 0) {
                                                umd_line(this.c,this.canvas.x_bin[i-1],this.canvas.y_bin[i-1],
                                                                        xc,yc,this.line_color);
                                        }
                                        break;
                                case "BOTH":
                                        umd_circle(this.c,xc,yc,this.point_rad,true,this.point_color);
                                        if (i > 0) {
                                                umd_line(this.c,this.canvas.x_bin[i-1],this.canvas.y_bin[i-1],
                                                                        xc,yc,this.point_color);
                                        }
                                        break;
                                default: 
                                        console.log("Illegal plot type: "+this.plot_type);
                        }
                }
        }



}

function umd_scatter_overlay(datax,datay,options) {
        if (typeof options.overlay_type !== "undefined") this.overlay_type = options.overlay_type;
        if (this.overlay_type == 0) {
                //
                // plot a point
                //
                if (typeof options.overlay_circle_radius !== "undefined") 
                        this.overlay_circle_radius = options.overlay_circle_radius;
                if (typeof options.overlay_circle_color !== "undefined") 
                        this.overlay_circle_color = options.overlay_circle_color;
                for (var i=0; i<datax.length; i++) {
                        var r_hfrac = (datay[i]-this.ymin)/(this.ymax-this.ymin);
                        var r_height = r_hfrac * this.vl;
                        var x = this.xoff_yaxis + this.hl*(datax[i]-this.xmin)/(this.xmax-this.xmin);
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
//                      console.log("overlay: i="+i+" x/y data="+datax[i]+"/"+datay[i]+" x/y coords="+
//                              round(x, )+"/"+round(y,2));
                        umd_circle(this.c,x,y,this.overlay_circle_radius,true,this.overlay_circle_color);
                }
        }
        if (this.overlay_type == 1) {
                //
                // draw a box 
                //
                if (typeof options.overlay_box_width !== "undefined") 
                        this.overlay_box_width = options.overlay_box_width;
                if (typeof options.overlay_box_color !== "undefined") 
                        this.overlay_box_color = options.overlay_box_color;
                for (var i=0; i<datax.length; i++) {
                        var r_hfrac = (datay[i]-this.ymin)/(this.ymax-this.ymin);
                        var r_height = r_hfrac * this.vl;
                        var x = this.xoff_yaxis + this.hl*(datax[i]-this.xmin)/(this.xmax-this.xmin);
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                        umd_rectangle(this.c,x-0.5*this.overlay_box_width,y-0.5*this.overlay_box_width,
                                this.overlay_box_width,this.overlay_box_width,this.overlay_box_color);
                }
        }
        if (this.overlay_type == 2) {
                //
                // plot a virtual point and connect via a line
                //
                var ltemp = this.c.lineWidth;
                if (typeof options.overlay_line_width !== "undefined") 
                        this.overlay_line_width = options.overlay_line_width;
                if (typeof options.overlay_line_color !== "undefined") 
                        this.overlay_line_color = options.overlay_line_color;
                this.c.lineWidth = this.overlay_line_width;
                var x_p, y_p;
                for (var i=0; i<datax.length; i++) {
                        var r_hfrac = (datay[i]-this.ymin)/(this.ymax-this.ymin);
                        var r_height = r_hfrac * this.vl;
                        var x = this.xoff_yaxis + this.hl*(datax[i]-this.xmin)/(this.xmax-this.xmin);
                        var y = this.yoff_xaxis + this.vl*(1-r_hfrac);
                        if (i > 0) umd_line(this.c,x_p,y_p,x,y,this.overlay_line_color);
                        x_p = x;
                        y_p = y;
                }
                this.c.lineWidth = ltemp;
        }
}

function umd_scatter_listener(ev) {
//console.log(" event="+ev.type);
        //
        // this is a child of the canvas, to get the pointer directly
        //
        var canv = ev.target;
        var pr = canv.active_precision;
        var ex = canv.active_exponential;
        var mouse = getMouse(ev,canv,canv.width,canv.height);
        var xp = mouse[0];
        var yp = mouse[1];
//console.log(" xp/yp="+xp+"/"+yp);
        if (iOS) {
//console.log("c1Handler: IOS detected")
                ev.preventDefault();
        }
//      console.log(" xp/yp = "+xp+"/"+yp);
//      console.log(" numbins="+canv.numbins+" bin width="+canv.bin_width);
//      canv.plot();
        //
        // see if we've clicked on the white title to dump all data out
        //
        var xclick = xp > canv.x0_click && xp < canv.x1_click;
        var yclick = yp > canv.y0_click && yp < canv.y1_click;
        if (xclick && yclick) {
                var astr;
                astr = canv.divid.innerHTML;
                if (astr.length == 0) {
                        astr = "<textarea>x and y:\n";
                        for (var i=0; i<canv.numbins; i++) {
                                if (ex) {
                                        astr = astr + canv.binv[i].toExponential() + 
                                                "    " + canv.binc[i].toExponential() + "\n";
                                }
                                else {
                                        astr = astr + round(canv.binv[i],pr) + 
                                                "    " + round(canv.binc[i],pr) + "\n";
                                }
                        }
                        astr = astr + "</textarea>"
                }
                else {
                        //
                        // clear it
                        //
                        astr = "";
                }
                canv.divid.innerHTML=astr;
                return;
        }
        //
        // if we got to here then we are clicking on individual data points
        //
        for (var i=0; i<canv.numbins; i++ ) {
//console.log(" i="+i+"  x/y="+round(canv.x_bin[i],1)+"/"+round(canv.y_bin[i],1));
                var xhere = canv.x_bin[i] - xp;
                var yhere = canv.y_bin[i] - yp;
//console.log(" xh/yh="+xhere+"/"+yhere);
                var rhere = Math.sqrt( xhere*xhere + yhere*yhere );
                if (rhere < 2*canv.point_rad) {
                        var b1 = canv.binv[i];
                        var b2 = canv.binc[i];
                        if (b2 < 0.001) b2 = b2.toExponential(2);
                        else b2 = round(b2,pr);
                        var lstr = "data "+(i+1)+" of "+canv.numbins+": x="+round(b1,pr)+", y="+round(b2,pr);
                        canv.divid.innerHTML=lstr;
//                      console.log(" found it!");
                }
        }
}

function umd_scatter_errorbars(yerrors,options) {
        //
        // as of May 2017, error bars will be symmetric and it is required that you have exactly
        // the same number of points in your error bar array as you have for the real x/y data.
        // they should line up exactly.
        //
        // ultimately I can add something that will enable/disable error bars for particular points
        //
        //
        // get options, if applied
        //
        if (options) {
                if (typeof options.errorbar_width !== "undefined") 
                        this.errorbar_width = options.errorbar_width;
                if (typeof options.errorbar_color !== "undefined") 
                        this.errorbar_color = options.errorbar_color;
                if (typeof options.errorbar_barwidth !== "undefined") 
                        this.errorbar_barwidth = options.errorbar_barwidth;
        }
        var temp = this.c.lineWidth;
        this.c.lineWidth = this.errorbar_width;
        var scale = (this.ymax-this.ymin)/this.vl;
        for (var i=0; i<yerrors.length; i++) {
//console.log("errorsbars: i="+i);
//console.log("    y error: "+yerrors[i]);
                var xc = this.canvas.x_bin[i];
                var yc = this.canvas.y_bin[i];
//console.log("    data x/y ="+round(this.canvas.binv[i],1)+"/"+round(this.canvas.binc[i],1));
//console.log("    canvas x/y="+round(this.canvas.x_bin[i],1)+"/"+round(this.canvas.y_bin[i],1));
                var yec = yerrors[i]/scale;
                var x = xc;
                var y = yc + yec;
//console.log("    new canvas x/y="+round(x,1)+"/"+round(y,1));
                umd_line(this.c,x,yc+yec,x,yc-yec,this.errorbar_color);
                umd_line(this.c,x-this.errorbar_barwidth,yc+yec,x+this.errorbar_barwidth,yc+yec,this.errorbar_color);
                umd_line(this.c,x-this.errorbar_barwidth,yc-yec,x+this.errorbar_barwidth,yc-yec,this.errorbar_color);
        }
//console.log("  this.numbins="+this.numbins+"  yerrors.length="+yerrors.length);
//console.log("scale="+round(scale,2)+"  ymin="+this.ymin+" ymax="+this.ymax+"  vl="+this.vl);
        this.c.lineWidth = temp;
}

//=============================================================================//
//=============================================================================//
//=============================================================================//
//=============================================================================//

function umd_function(canvas_id,title,xfunction,xoptions) {
        //
        // number of points is arbitrary, just need enough so it looks continuous
        //
        var pnum = 100;
        if (xoptions) {
                if (typeof xoptions.width !== "undefined") this.can_width = xoptions.width;
                if (typeof xoptions.height !== "undefined") this.can_height = xoptions.height;
                if (typeof xoptions.xlow === "undefined") {
                        alert("Sorry but you MUST define the low x value for the function!");
                        return;
                }
                else this.xlow = xoptions.xlow;

                if (typeof xoptions.xhigh === "undefined") {
                        alert("Sorry but you MUST define the high x value for the function!");
                        return;
                }
                else this.xhigh = xoptions.xhigh;

                if (typeof xoptions.numpoints !== "undefined") pnum = xoptions.numpoints;
        }
        //
        // this works by creating a umd_scatterplot and drawing the curve in line mode
        //
        var fplot = new umd_scatterplot(canvas_id,title);
        //
        // now generate a bunch of points between xlow and xhigh
        //
        var pdx = (this.xhigh-this.xlow)/pnum;
        var pxt = (this.xhigh-this.xlow)/5;
        var px = this.xlow;
        var xdat = [];
        var ydat = [];
        for (var i=0; i<pnum; i++) {
                xdat.push(px);
                var py = xfunction(px);
                ydat.push(py);
                px = px + pdx;
        }
        //
        // use xoptions but add a few key items to it
        //
        var popt = xoptions;
        popt.plot_type = "line";
        popt.show_stats = false;
        popt.xtick_unit = pxt;
        fplot.plot(xdat,ydat,popt);
}
function umd_function2(canvas_id,title,xfunction1,xfunction2,xoptions) {
        //
        // number of points is arbitrary, just need enough so it looks continuous
        //
        var pnum = 100;
        if (xoptions) {
                if (typeof xoptions.width !== "undefined") this.can_width = xoptions.width;
                if (typeof xoptions.height !== "undefined") this.can_height = xoptions.height;
                if (typeof xoptions.xlow1 === "undefined") {
                        alert("Sorry but you MUST define the low x value for the 1st function!");
                        return;
                }
                else this.xlow = xoptions.xlow1;

                if (typeof xoptions.xhigh1 === "undefined") {
                        alert("Sorry but you MUST define the high x value for the 1st function!");
                        return;
                }
                else this.xhigh = xoptions.xhigh1;

                if (typeof xoptions.xlow2 == "undefined") this.xlow2 = xoptions.xlow1;
                else this.xlow2 = xoptions.xlow2;
                if (typeof xoptions.xhigh2 == "undefined") this.xhigh2 = xoptions.xhigh1;
                else this.xhigh2 = xoptions.xhigh2;

                if (typeof xoptions.numpoints !== "undefined") pnum = xoptions.numpoints;
        }
        //
        // this works by creating a umd_scatterplot and drawing the curve in line mode
        //
        var fplot = new umd_scatterplot(canvas_id,title);
        //
        // now generate a bunch of points between xlow and xhigh
        //
        var pdx = (this.xhigh-this.xlow)/pnum;
        var pxt = (this.xhigh-this.xlow)/5;
        var px = this.xlow;
        var xdat = [];
        var ydat = [];
        var xdat2 = [];
        var ydat2 = [];
        for (var i=0; i<pnum; i++) {
                xdat.push(px);
                var py = xfunction1(px);
                ydat.push(py);
                if (px > this.xlow2 && px < this.xhigh2) {
                        xdat2.push(px);                 
                        var py2 = xfunction2(px)
                        ydat2.push(py2)
                }
                px = px + pdx;
        }
        //
        // use xoptions but add a few key items to it
        //
        var popt = xoptions;
        popt.plot_type = "line";
        popt.show_stats = false;
        popt.xtick_unit = pxt;
        fplot.plot(xdat,ydat,popt);
        //
        // now do function 2, with overlay
        //
        var opt2 = {
                overlay_line_color : "blue",
                overlay_type : 2,
                overlay_line_width : 1
        }
        fplot.overlay(xdat2,ydat2,opt2);
}
//=============================================================================//
//=============================================================================//
//=============================================================================//
//=============================================================================//

function umd_show_version() {
        return umd_plots_version;
}

//
// auxiliary functions next:
//
function round(n, d) {return Math.round(n * Math.pow(10, d)) / Math.pow(10,d);}
function umd_rectangle(cl,x,y,w,h,fors,color) {
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
function umd_line(cl,x0,y0,x1,y1,color) {
        temp = cl.strokeStyle;
        cl.strokeStyle = color;
        cl.beginPath();
        cl.moveTo(x0,y0);
        cl.lineTo(x1,y1);
        cl.stroke();
        cl.strokeStyle = temp;
}
function umd_circle(cl,x,y,r,fors,color) {
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

