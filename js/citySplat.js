var citySplat = function() {
    var figure;
    var margin;
    var figheight;
    var figwidth;
    var width;
    var height;
    var canvas;
    var x_max;
    var x_min;
    var y;
    var axes;
    var line_max;
    var line_min;
    var area_max;
    var area_min;
    
    var plot = function(tmax_avg,summer_teletherm_date,summer_teletherm_extent,tmax_smoothed_js,tmin_avg,winter_teletherm_date,winter_teletherm_extent,tmin_smoothed_js,div,this_year_range) {
        // globals that this function needs:
        // tmin_avg,tmax_avg,summer_teletherm_extent,winter_teletherm_extent,tmax_smoothed_js,tmin_smoothed_js,summer_teletherm_date,winter_teletherm_date

        figure = d3.select(div);
        margin = {top: 0, right: 0, bottom: 20, left: 0};

        // full width and height
        // use some jquery
        figwidth  = $(div).width();
        figheight = figwidth+margin.bottom;
        // don't shrink this
        width = figwidth - margin.left - margin.right;
        // tiny bit of space
        height = figheight - margin.top - margin.bottom;

        // remove an old figure if it exists
        figure.select(".canvas").remove();

        //Create SVG element
        canvas = figure
	    .append("svg")
	    .attr("class", "map canvas")
	    .attr("id", "stationsvg1")
	    .attr("width", figwidth)
	    .attr("height", figheight);

        x_max = d3.scale.linear()
	    .domain([1,365])
            // .domain([1,365+181])
	    // .range([0,width]);
            // .range([-2*Math.PI,0]);
            // .range([-5/2*Math.PI,Math.PI/2]);
            .range([-Math.PI/2,-Math.PI/2+2*Math.PI-(2*Math.PI/365)]);

        x_min = d3.scale.linear()
	    .domain([1-181,365-181])
	    // .range([-2*Math.PI,0]);
            // .range([-5/2*Math.PI,Math.PI/2]);
            .range([-Math.PI/2,-Math.PI/2+2*Math.PI]);
        
        y =  d3.scale.linear()
	   // .domain([-30,130]) // summer temps
	// .domain([d3.min(tmin_avg),d3.max(tmax_avg)])
            .domain([-20,120])
	    .range([0,d3.min([height/2,width/2])]);

        // create the axes themselves
        axes = canvas.append("g")
	    .attr("transform", "translate(" + (margin.left) + "," +
	          (margin.top) + ")") // 99 percent
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "main");

        // create the axes background
        // var bgrect = axes.append("svg:rect")
	//     .attr("width", width)
	//     .attr("height", height)
	//     .attr("class", "bg")
	//     .style({'stroke-width':'0','stroke':'rgb(0,0,0)'})
	//     .attr("fill", "#FCFCFC");

        // // axes creation functions
        // var create_xAxis = function() {
	//     return d3.svg.axis()
	//         .scale(x_max)
        //         .tickValues(month_lengths_cum_18_forward)
        //         .tickFormat(function(d,i) { return month_names[i % 12].slice(0,3) + " 1"; })
	//         .orient("bottom"); }

        // // axes creation functions
        // var create_xAxis_2 = function() {
	//     return d3.svg.axis()
	//         .scale(x_min)
        //         .tickValues(month_lengths_cum_18_backward)
        //         .tickFormat(function(d,i) { return month_names[i % 12].slice(0,3) + " 1"; })
	//         .orient("top"); }    

        // // axis creation function
        // var create_yAxis = function() {
	//     return d3.svg.axis()
	//         .ticks(5)
        //     	.scale(y) //linear scale function
	//         .orient("left"); }

        // // draw the axes
        // var yAxis = create_yAxis()
	//     .innerTickSize(6)
	//     .outerTickSize(0);

        // axes.append("g")
	//     .attr("class", "y axis")
	//     .attr("transform", "translate(0,0)")
	//     .attr("font-size", "14.0px")
	//     .call(yAxis);

        // // draw the axes
        // var xAxis = create_xAxis()
	//     .innerTickSize(6)
	//     .outerTickSize(0);

        // axes.append("g")
	//     .attr("class", "x axis ")
	//     .attr("font-size", "14.0px")
	//     .attr("transform", "translate(0," + (height) + ")")
	//     .call(xAxis);

        // // draw the axes
        // var xAxis_2 = create_xAxis_2()
	//     .innerTickSize(6)
	//     .outerTickSize(0);

        // axes.append("g")
	//     .attr("class", "x axis ")
	//     .attr("font-size", "14.0px")
	//     .attr("transform", "translate(0," + (0) + ")")
	//     .call(xAxis_2);

        // d3.selectAll(".tick line").style("stroke","black");

        // d3.selectAll(".tick text").style("font-size",10);    

        // var xlabel_text = "Summer Teletherm Day";
        var xlabel = canvas.append("text")
	    .html(this_year_range)
	    .attr("class","axes-text")
	    .attr("x",margin.left+width/2)  
	    .attr("y",figheight-5)
	    .attr("font-size", "15.0px")
	    .attr("fill", "rgb(100,100,100)")
	    .attr("style", "text-anchor: middle;");

        
        // var xlabel_text = "Winter Teletherm Day";
        // var xlabel = canvas.append("text")
	//     .text(xlabel_text)
	//     .attr("class","axes-text")
	//     .attr("x",margin.left+width/2)  
	//     .attr("y",14)
	//     .attr("font-size", "15.0px")
	//     .attr("fill", "#000000")
	//     .attr("style", "text-anchor: middle;");

        // var ylabel_text = "Temperature";
        // var ylabel = canvas.append("text")
	//     .text(ylabel_text)
	//     .attr("class","axes-text")
	//     .attr("x",18)
	//     .attr("y",figheight/2)
	//     .attr("font-size", "15.0px")
	//     .attr("fill", "#000000")
	//     .attr("transform", "rotate(-90.0," + (18) + "," + (figheight/2) + ")");

        function drawTarget() {
            var arc = d3.svg.arc()
                .outerRadius(y(0))
                .innerRadius(y(32));

            axes.append("path")
	        .attr({ "d": arc({"startAngle": 0, "endAngle": 2*Math.PI}),
                        "class": "arc",
                        "transform": "translate("+width/2+","+height/2+")",
	              })
                .style({"fill": "rgba(230,230,230,.5)"})

            var arc = d3.svg.arc()
                .outerRadius(y(60))
                .innerRadius(y(90));

            axes.append("path")
	        .attr({ "d": arc({"startAngle": 0, "endAngle": 2*Math.PI}),
                        "class": "arc",
                        "transform": "translate("+width/2+","+height/2+")",
	              })
                .style({"fill": "rgba(230,230,230,.5)"})
        }
        function drawLines(temps) {
            // should do this with a .data()
            for (var i=0; i<temps.length; i++) {
                axes.append("circle")
	            .attr({ "r": y(temps[i]),
                            "class": "",
                            "cx": width/2,
                            "cy": height/2,
	                  })
                    .style({"stroke": "rgba(210,210,210,1)","fill":"none"});
                var rotation = 3;
                axes.append("text")
	            .attr({ "transform": function() {
                        return "translate("+(width/2+y(temps[i])*Math.cos(rotation/180*Math.PI)+2)+","+(height/2+y(temps[i])*Math.sin(rotation/180*Math.PI)+2)+") rotate("+(rotation)+")"; // +","+(width/2)+","+(height/2)+
                    },
	                  })
                    .style({"fill": "rgba(160,160,160,1)","align":"left","font-size": "9px"})
                
                    .text(temps[i]+"F");
            }
            
        }
        var linetemps = [0,32,70,100];
        drawLines(linetemps);

        var angle_round = d3.scale.linear()
	    .domain([-Math.PI,Math.PI])
            // .domain([1,365+181])
	    // .range([0,width]);
            // .range([-2*Math.PI,0]);
            // .range([-5/2*Math.PI,Math.PI/2]);
            .range([-.25*365,.75*365]);

        var date_text = axes.append("text")
            .attr("class","date-text")
            .attr({"x": width-5, "y": 10})
            .style({"text-anchor": "end", "font-size": "10px", "fill": "rgb(160,160,160)"})
            .text("");
        var maxT_text = axes.selectAll(".maxT-text")
            .data([tmax_avg])
            .enter()
            .append("text")
            .attr("class","maxT-text")
            .attr({"x": width-5, "y": 20})
            .style({"text-anchor": "end", "font-size": "10px", "fill": "rgb(160,160,160)"})
            .text("");
        
        var minT_text = axes.selectAll(".minT-text")
            .data([tmin_avg])
            .enter()
            .append("text")
            .attr("class","minT-text")
            .attr({"x": width-5, "y": 30})
            .style({"text-anchor": "end", "font-size": "10px", "fill": "rgb(160,160,160)"})
            .text("");        

        axes.append("circle")
	    .attr({ "r": y(linetemps[linetemps.length-1]),
                    "class": "",
                    "cx": width/2,
                    "cy": height/2,
	          })
            .style({"stroke": "none","fill":"rgba(255, 248, 220, .2)"})
            .on("mousemove",function() {
		var m = d3.mouse(this);
		// console.log(m);
		// console.log(y(m[1]/width*data.length));
		// data.length
		// this is the percentage of the text at hover
		// console.log((m[0]-margin.left)/width);

                // console.log(height/2-m[1],m[0]-width/2);
                var angle = Math.atan2(m[1]-height/2,m[0]-width/2);
                // now let's round this to a day
                var rounded_day = (Math.round(angle_round(angle))+1+365)%365+1;
                var month = 0;
                while (rounded_day > month_lengths_cum[month]-1) {
                    month+=1;
                }
                // console.log(rounded_day);                
                // console.log(month);
                var day = rounded_day-month_lengths_cum[month-1]+1;
                // console.log(month);
                // console.log(day);

                var text = month_names[month-1].slice(0,3)+" "+day+" (day "+rounded_day+")";
                // date_text.text(text);
                d3.selectAll(".date-text").text(text);
                // maxT_text.text(tmax_smoothed_js[rounded_day]);
                // minT_text.text(tmin_smoothed_js[rounded_day]);
                // maxT_text.text(function(d) { return "Avg Max: "+d[rounded_day-1].toFixed(0)+"F"; });
                // minT_text.text(function(d) { return "Avg Min: "+d[(rounded_day-1+365-181)%365].toFixed(0)+"F"; });
                d3.selectAll(".maxT-text").text(function(d) { return "Avg Max: "+d[rounded_day-1].toFixed(0)+"F"; });
                d3.selectAll(".minT-text").text(function(d) { return "Avg Min: "+d[(rounded_day-1+365-181)%365].toFixed(0)+"F"; });
                
		var r = y(linetemps[linetemps.length-1]);
		// if ( m[0] > margin.left && m[0] < (width+margin.left)) {
		// axes.selectAll("line.hoverline")
                d3.selectAll("line.hoverline")
		    .attr("x1", width/2)
		    .attr("y1", height/2)
		    .attr("x2", Math.cos(x_max(rounded_day))*r+width/2)
		    .attr("y2", Math.sin(x_max(rounded_day))*r+height/2);
		    // d3.select("#fulltextdiv").style("top",-(m[0]-margin.left)/width*pheight+"px");
		    // d3.select("#formattedtextdiv")
		    //  	.html(scoredtextparts[Math.floor((m[0]-margin.left)/width*data.length)]);
		    
		// }
	    });

        // console.log("showing line")
        // console.log(tmax_avg)
        // console.log(tmin_avg)

        axes.append("line")
	    .attr({
	        "class": "hoverline",
	        "x1": 0,
	        "y1": 0,
	        "x2": 0,
	        "y2": 0,
	        "stroke": "#A8A8A8",
	        "stroke-width": "1.5px", });

        function getPathData(t,d1,d2) {
            // adjust the radius a little so our text's baseline isn't sitting directly on the circle
            // t is the temperature
            var r = y(t);
            return 'm' + (width/2+r*Math.cos(x_max(d1))) + ',' + (height/2+r*Math.sin(x_max(d1))) + ' ' +
                'A' + r + ',' + r + ' 0 0 1 ' + (width/2+r*Math.cos(x_max(d2))) + ',' + (height/2+r*Math.sin(x_max(d2)));
        }

        function round_ticks() {
            axes.selectAll("line.monthtick").data(month_lengths_cum)
                .enter()
                .append("line")
                .attr({"x1": function(d,i) { return Math.cos(x_max(d))*y(95)+width/2; },
                       "x2": function(d,i) { return Math.cos(x_max(d))*y(105)+width/2; },
                       "y1": function(d,i) { return Math.sin(x_max(d))*y(95)+height/2; },
                       "y2": function(d,i) { return Math.sin(x_max(d))*y(105)+height/2; },
                       "class": "monthtick",
                      })
                .style({"stroke": "rgba(210,210,210,1)",
                        "fill": "none"});

            axes.selectAll("defs").data(month_lengths_cum)
                .enter()
                .append("defs").append("path")
                .attr({"d": function(d,i) { return getPathData(102,d,d+30); },
                       "id": function(d,i) { return "curvedTextPath"+i; },
                      })
                .style({"stroke": "rgba(210,210,210,1)",
                        "fill": "none"});

            axes.selectAll("text.monthlabels").data(month_lengths_cum)
                .enter()
                .append('text')
                .append('textPath')
                .attr({
                    startOffset: '50%',
                    'xlink:href': function(d,i) { return '#curvedTextPath'+i; }
                })
                .style({
                    "font-size": "9px",
                    "text-anchor": "middle",
                    "fill": "rgba(160,160,160,1)"
                })
                .text(function(d,i) { return month_names[i]; });
        }
        round_ticks();
        // curved text:
        // http://bl.ocks.org/jebeck/196406a3486985d2b92e
        

        line_max = d3.svg.line()
	    .x(function(d,i) {
                // console.log(x_max(i+1));
                // console.log(y(d)*Math.cos(x_max(i+1)));
                return y(d)*Math.cos(x_max(i+1))+width/2;
            })
	       .y(function(d,i) { return height/2+y(d)*Math.sin(x_max(i+1)); })
	    .interpolate("linear"); // cardinal

        

        line_min = d3.svg.line()
	    .x(function(d,i) { return width/2+y(d)*Math.cos(x_min(i+1)); })
	    .y(function(d,i) { return y(d)*Math.sin(x_min(i+1))+height/2; })
	    .interpolate("linear"); // cardinal    

        area_max = d3.svg.area()
	    .x(function(d,i) { return x_max(d+1); })
	    .y0(function(d) { return height; })
	    .y1(function(d) { return y(tmax_smoothed_js[d]); })    
	    .interpolate("linear"); // cardinal

        area_min = d3.svg.area()
            .x0(function(d,i) { return width/2; })
	    .x1(function(d,i) { return width/2+y(tmin_smoothed_js[d])*Math.cos(x_min(d+1)); })
	    .y0(function(d,i) { return height/2; })
	    .y1(function(d,i) { return height/2+y(tmin_smoothed_js[d])*Math.sin(x_min(d+1)); })
	    .interpolate("linear"); // cardinal

        area_max = d3.svg.area()
            .x0(function(d,i) { return width/2; })
	    .x1(function(d,i) { return width/2+y(tmax_smoothed_js[d])*Math.cos(x_max(d+1)); })
	    .y0(function(d,i) { return height/2; })
	    .y1(function(d,i) { return height/2+y(tmax_smoothed_js[d])*Math.sin(x_max(d+1)); })
	    .interpolate("linear"); // cardinal        

        var summer_teletherm_extent_extended = Array(summer_teletherm_extent.length);
        for (var i=0; i<summer_teletherm_extent.length; i++) {
            summer_teletherm_extent_extended[i] = [summer_teletherm_extent[i][0]];
            while ((summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]) < summer_teletherm_extent[i][1]) { summer_teletherm_extent_extended[i].push(summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]+1);  }
        }

        axes.selectAll("path.summerextentarea")
            .data(summer_teletherm_extent_extended)
            .enter()
            .append("path")
            .attr("class", "summerextentarea")
            .attr("d", area_max)
            .attr("stroke","rgba(160,160,160,1)")
            .attr("stroke-width",1)
            .attr("fill","rgba(208, 58, 18,.2)")
            .on("mousemove",function() {
		var m = d3.mouse(this);
                var angle = Math.atan2(m[1]-height/2,m[0]-width/2);
                // now let's round this to a day
                var rounded_day = (Math.round(angle_round(angle))+1+365)%365+1;
                var month = 0;
                while (rounded_day > month_lengths_cum[month]-1) {
                    month+=1;
                }
                var day = rounded_day-month_lengths_cum[month-1]+1;
                var text = month_names[month-1].slice(0,3)+" "+day+" (day "+rounded_day+")";
                date_text.text(text);
                maxT_text.text("Avg Max: "+tmax_avg[rounded_day-1].toFixed(0)+"F");
                minT_text.text("Avg Min: "+tmin_avg[(rounded_day-1+365-181)%365].toFixed(0)+"F");
                
		var r = y(linetemps[linetemps.length-1]);
		axes.selectAll("line.hoverline")
		    .attr("x1", width/2)
		    .attr("y1", height/2)
		    .attr("x2", Math.cos(x_max(rounded_day))*r+width/2)
		    .attr("y2", Math.sin(x_max(rounded_day))*r+height/2);
	    });

        var winter_teletherm_extent_extended = Array(winter_teletherm_extent.length);
        for (var i=0; i<winter_teletherm_extent.length; i++) {
            winter_teletherm_extent_extended[i] = [winter_teletherm_extent[i][0]];
            while ((winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]) < winter_teletherm_extent[i][1]) { winter_teletherm_extent_extended[i].push(winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]+1);  }
        }

        // console.log(winter_teletherm_extent);
        // console.log(winter_teletherm_extent_extended);

        axes.selectAll("path.winterextentarea")
        // .data([tmin_smoothed_js.slice(winter_teletherm_extent[0][0],winter_teletherm_extent[0][1]),tmin_smoothed_js.slice(winter_teletherm_extent[1][0],winter_teletherm_extent[1][1])])
            .data(winter_teletherm_extent_extended)
            .enter()
            .append("path")        
            .attr("class", "winterextentarea")
            .attr("d", area_min)
            .attr("stroke","rgba(160,160,160,1)")
            .attr("stroke-width",1)
            .attr("fill","rgba(25, 96, 162,.2)")
            .on("mousemove",function() {
		var m = d3.mouse(this);
                var angle = Math.atan2(m[1]-height/2,m[0]-width/2);
                // now let's round this to a day
                var rounded_day = (Math.round(angle_round(angle))+1+365)%365+1;
                var month = 0;
                while (rounded_day > month_lengths_cum[month]-1) {
                    month+=1;
                }
                var day = rounded_day-month_lengths_cum[month-1]+1;
                var text = month_names[month-1].slice(0,3)+" "+day+" (day "+rounded_day+")";
                date_text.text(text);
                maxT_text.text("Avg Max: "+tmax_avg[rounded_day-1].toFixed(0)+"F");
                minT_text.text("Avg Min: "+tmin_avg[(rounded_day-1+365-181)%365].toFixed(0)+"F");
                
		var r = y(linetemps[linetemps.length-1]);
		axes.selectAll("line.hoverline")
		    .attr("x1", width/2)
		    .attr("y1", height/2)
		    .attr("x2", Math.cos(x_max(rounded_day))*r+width/2)
		    .attr("y2", Math.sin(x_max(rounded_day))*r+height/2);
	    });

        axes.append("path")
            // .datum([].concat(tmax_smoothed_js,tmax_smoothed_js.slice(0,181)))
            .datum(tmax_smoothed_js)        
            .attr("class", "tmaxsmoothed")
            .attr("d", line_max)
            .attr("stroke","rgb(208, 58, 18)")
            .attr("stroke-width",3)
            .attr("fill","none");

        axes.append("path")
            .datum(tmin_smoothed_js)
            .attr("class", "tminsmoothed")
            .attr("d", line_min)
            .attr("stroke","rgb(25, 96, 162)")
            .attr("stroke-width",3)
            .attr("fill","none");

        axes.selectAll("circle.avgmaxtemp")
	    .data(tmax_avg)
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return y(d)*Math.cos(x_max(i+1))+width/2; },
		    "cy": function(d,i) { return y(d)*Math.sin(x_max(i+1))+height/2; },
		    "r": 1,
                    "class": "avgmaxtemp",
	          });

        axes.selectAll("circle.avgmintemp")
	    .data(tmin_avg)
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return y(d)*Math.cos(x_min(i+1))+width/2; },
		    "cy": function(d,i) { return y(d)*Math.sin(x_min(i+1))+height/2; },        
		    "r": 1,
                    "class": "avgmintemp",
	          });
        
        axes.append("line")
	    .attr({ "x1": width/2,
		    "y1": height/2,
		    "x2": y(tmax_smoothed_js[summer_teletherm_date])*Math.cos(x_max(summer_teletherm_date+1))+width/2,
                    "y2": y(tmax_smoothed_js[summer_teletherm_date])*Math.sin(x_max(summer_teletherm_date+1))+height/2,
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "black",
                "stroke-width": 1,
                "stroke-dasharray": 3
            });
        axes.append("line")
	    .attr({ 
		"x1": y(tmax_smoothed_js[summer_teletherm_date])*Math.cos(x_max(summer_teletherm_date+1))+width/2,
                "y1": y(tmax_smoothed_js[summer_teletherm_date])*Math.sin(x_max(summer_teletherm_date+1))+height/2,
		"x2": y(linetemps[linetemps.length-1])*Math.cos(x_max(summer_teletherm_date+1))+width/2,
                "y2": y(linetemps[linetemps.length-1])*Math.sin(x_max(summer_teletherm_date+1))+height/2,                
                    "class": "summerteleline-extended",
	          })
            .style({
                "stroke": "rgba(160,160,160,1)",
                "stroke-width": 1,
                "stroke-dasharray": 3
            });
        // rgba(160,160,160,1)

        axes.append("line")
	    .attr({ "x1": width/2,
		    "y1": height/2,
		    "x2": y(tmin_smoothed_js[winter_teletherm_date])*Math.cos(x_min(winter_teletherm_date+1))+width/2,
                    "y2": y(tmin_smoothed_js[winter_teletherm_date])*Math.sin(x_min(winter_teletherm_date+1))+height/2,
                    "class": "winterteleline",
	          })
            .style({
                "stroke": "black",
                "stroke-width": 1,
                "stroke-dasharray": 3
            });
        axes.append("line")
	    .attr({
		"x1": y(tmin_smoothed_js[winter_teletherm_date])*Math.cos(x_min(winter_teletherm_date+1))+width/2,
                "y1": y(tmin_smoothed_js[winter_teletherm_date])*Math.sin(x_min(winter_teletherm_date+1))+height/2,
                "x2": y(linetemps[linetemps.length-1])*Math.cos(x_min(winter_teletherm_date+1))+width/2,
                "y2": y(linetemps[linetemps.length-1])*Math.sin(x_min(winter_teletherm_date+1))+height/2,                
                "class": "winterteleline-extended",
	          })
            .style({
                "stroke": "rgba(160,160,160,1)",
                "stroke-width": 1,
                "stroke-dasharray": 3
            });        

        // format the summer teletherm day
        // with our fixed months
        var month = 0;
        while (summer_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        var day = summer_teletherm_date-month_lengths_cum[month-1]+1;
        // console.log(month);
        // console.log(day);

        var summertext = "Summer Teletherm: "+month_names[month-1].slice(0,3)+" "+day+" (day "+summer_teletherm_date+"), "+(summer_teletherm_extent[summer_teletherm_extent.length-1][1]-summer_teletherm_extent[0][0])+" day extent";
        
        // axes.append("text")
        //     .attr({
        //         "x": function(d,i) { return x_max(summer_teletherm_extent[0][0]+1)-5; },
        //         "y": height-30,
        //         "transform": function(d,i) { return "rotate(-90 "+(x_max(summer_teletherm_extent[0][0]+1)-5)+","+(height-30)+")"; },
        //         "class": "summertext",
        //     })
        //     .style({
        //         "text-align": "left",
        //         "font-size": 11,
        //     })    
        //     .text(summertext);

        // format the winter teletherm day
        // with our fixed months
        month = 0;
        while (winter_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        day = winter_teletherm_date-month_lengths_cum[month-1]+1;

        var wintertext = "Winter Teletherm: "+month_names[month-1-6].slice(0,3)+" "+day+" (day "+winter_teletherm_date+"), "+(winter_teletherm_extent[winter_teletherm_extent.length-1][1]-winter_teletherm_extent[0][0])+" day extent";
        
        // axes.append("text")
        //     .attr({
        //         "x": function(d,i) { return x_min(winter_teletherm_extent[0][0]+1)-5; },
        //         "y": 290,
        //         "transform": function(d,i) { return "rotate(-90 "+(x_min(winter_teletherm_extent[0][0]+1)-5)+","+290+")"; },
        //     })
        //     .style({
        //         "text-align": "right",
        //         "font-size": 11,
        //         "class": "wintertext",
        //     })    
        //     .text(wintertext);

        axes.append("circle")
	    .attr({ "cx": function(d,i) { return width/2; },
		    "cy": function(d,i) { return height/2; },
		    "r": 4,
                    "fill": "rgba(160,160,160,.97)",
                    "class": "centercircle",
	          });

        // from the paper
        // we standardize the Summer and Winter
        // Solstices as falling on June 21 and December 21 (day
        // numbers 172 and 355).
        // axes.selectAll("line.solstice").data([172,355])
        //     .enter()
        //         .append("line")
        //         .attr({"x1": function(d,i) { return Math.cos(x_max(d))*y(97)+width/2; },
        //                "x2": function(d,i) { return Math.cos(x_max(d))*y(100)+width/2; },
        //                "y1": function(d,i) { return Math.sin(x_max(d))*y(97)+height/2; },
        //                "y2": function(d,i) { return Math.sin(x_max(d))*y(100)+height/2; },
        //                "class": "solstice",
        //               })
        //         .style({"stroke": "rgba(210,210,210,1)",
        //                 "fill": "none"});        
        var solstice_groups = axes.selectAll("g.solsticegroup").data([172,355])
            .enter()
            .append("g")
            .attr("class","solsticegroup");
        
        solstice_groups.append("line")
            .attr({
                "x1": function(d,i) { return Math.cos(x_max(d))*y(97)+width/2; },
                "x2": function(d,i) { return Math.cos(x_max(d))*y(100)+width/2; },
                "y1": function(d,i) { return Math.sin(x_max(d))*y(97)+height/2; },
                "y2": function(d,i) { return Math.sin(x_max(d))*y(100)+height/2; },
                "class": "solstice",
            })
            .style({
                "stroke": "rgba(210,210,210,1)",
                "fill": "none",
            });

        var solstice_symbols = ["\u264B","\u2651"];
        var solstice_filenames = ["Cancer","Capricorn"];

        // solstice_groups.append("text")
        //     .attr({
        //         "x": function(d,i) { return Math.cos(x_max(d))*y(97)+width/2; },
        //         "y": function(d,i) { return Math.sin(x_max(d))*y(97)+height/2; },
        //         "class": "solstice",
        //     })
        //     .style({
        //         // "stroke": "rgba(210,210,210,1)",
        //         "fill": "rgba(150,150,150,1)",
        //     })
        //     .html(function(d,i) { return solstice_symbols[i]; });

        solstice_groups.append("image")
            .attr({
                "x": function(d,i) { return Math.cos(x_max(d))*y(97)+width/2+2; },
                "y": function(d,i) { return Math.sin(x_max(d))*y(97)+height/2-1+((i<1) ? -7 : 0); },
                "width": 7,
                "height": 7, // function(d,i) { return (i<1) ? 16 : 19; },
                "preserveAspectRatio": "xMidYMid meet",
                "xlink:href": function(d,i) { return "images/40px-"+solstice_filenames[i]+".svg.png"; },
                "class": "solstice",
            });

        // var newgroup = solstice_groups.append("g")
        //     .attr({
        //         id: "Layer 1",
        //         // transform: "matrix(5.828176,0,0,5.82271,-19181.62,-26091.57)",
        //         transform: function(d,i) {
        //             var myx = Math.cos(x_max(d))*y(97)+width/2;
        //             var myy = Math.sin(x_max(d))*y(97)+height/2;
        //             return "translate("+myx+","+myy+")";
        //         }
        //     })
        // newgroup.append("path")
        //     .attr({
        //         fill: "black",
        //         transform: "scale(.0035) translate(0,0)",
        //         d: "M2720 6219l0 -218c420,192 827,287 1219,287 257,0 466,-33 627,-100 -102,-52 -179,-118 -230,-197 -51,-79 -77,-172 -77,-279 0,-140 51,-260 152,-361 100,-100 222,-150 362,-150 140,0 259,50 359,149 99,100 149,219 149,360 0,223 -136,409 -409,557 -273,148 -615,222 -1026,222 -356,0 -731,-89 -1126,-270zm1674 -506c0,102 37,190 112,264 74,74 164,111 267,111 104,0 192,-37 265,-108 72,-72 108,-160 108,-264 0,-106 -36,-196 -109,-270 -73,-74 -161,-111 -265,-111 -105,0 -194,37 -268,111 -73,73 -110,162 -110,267zm887 -961l0 218c-421,-192 -827,-288 -1220,-288 -256,0 -466,33 -628,101 104,52 181,118 231,197 52,79 77,172 77,279 0,140 -50,260 -151,361 -101,100 -222,150 -363,150 -140,0 -259,-49 -358,-149 -99,-99 -149,-219 -149,-359 0,-224 136,-411 409,-559 272,-148 615,-222 1026,-222 356,0 731,90 1126,271zm-1674 506c0,-103 -37,-191 -112,-265 -75,-73 -165,-110 -269,-110 -104,0 -192,36 -264,108 -72,72 -108,160 -108,264 0,106 37,196 110,270 72,74 161,111 265,111 104,0 194,-37 267,-111 74,-74 111,-163 111,-267z",
        //         id: "path630",
        //     });
    } // end plot() function

    replot = function() {
        // broken now, with multiple periods combing back
        axes.select("path.summerextentarea")
            .transition()
            .datum(tmax_smoothed_js.slice(summer_teletherm_extent[0][0],summer_teletherm_extent[0][1]))
            .attr("d", area_max);

        axes.select("path.winterextentarea")
            .transition()
            .datum(tmin_smoothed_js.slice(winter_teletherm_extent[0][0],winter_teletherm_extent[0][1]))
            .attr("d", area_min)
        
        axes.select("path.tmaxsmoothed")
            .transition()
            .datum([].concat(tmax_smoothed_js,tmax_smoothed_js.slice(0,181)))
            .attr("d", line_max)

        axes.select("path.tminsmoothed")
            .transition()
            .datum([].concat(tmin_smoothed_js.slice(184),tmin_smoothed_js))
            .attr("d", line_min)

        axes.selectAll("circle.avgmaxtemp")
            .transition()
	    .data([].concat(tmax_avg,tmax_avg.slice(0,181)))
	    .attr({ "cx": function(d,i) { return x_max(i+1); },
		    "cy": function(d,i) { return y(d); },
	          });

        axes.selectAll("circle.avgmintemp")
	    .data([].concat(tmin_avg.slice(184),tmin_avg))
            .transition()        
	    .attr({ "cx": function(d,i) { return x_min(i+1-181); },
		    "cy": function(d,i) { return y(d); },
	          });
        
        axes.select("line.summerteleline")
            .transition()
	    .attr({ "x1": x_max(summer_teletherm_date+1),
		    "x2": x_max(summer_teletherm_date+1),
                    "y2": y(tmax_smoothed_js[summer_teletherm_date]),
	          });

        axes.append("line.winterteleline")
            .transition()
	    .attr({ "x1": x_min(winter_teletherm_date+1),
		    "x2": x_min(winter_teletherm_date+1),
                    "y2": y(tmin_smoothed_js[winter_teletherm_date]),
	          });
        
        // format the summer teletherm day
        // with our fixed months
        var month = 0;
        while (summer_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        var day = summer_teletherm_date-month_lengths_cum[month-1]+1;
        // console.log(month);
        // console.log(day);
        
        axes.select("text.summertext")
            .transition()
            .attr({
                "x": function(d,i) { return x_max(summer_teletherm_extent[0]+1)-5; },
                "transform": function(d,i) { return "rotate(-90 "+(x_max(summer_teletherm_extent[0]+1)-5)+","+(height-30)+")"; },
            })
            .text("Summer Teletherm: "+month_names[month-1].slice(0,3)+" "+day+" (day "+summer_teletherm_date+"), "+(summer_teletherm_extent[1]-summer_teletherm_extent[0])+" day extent")

        // format the winter teletherm day
        // with our fixed months
        month = 0;
        while (winter_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        day = winter_teletherm_date-month_lengths_cum[month-1]+1;
        
        axes.select("text.wintertext")
            .transition()
            .attr({
                "x": function(d,i) { return x_min(winter_teletherm_extent[0]+1)-5; },
                "transform": function(d,i) { return "rotate(-90 "+(x_min(winter_teletherm_extent[0]+1)-5)+","+290+")"; },
            })
            .text("Winter Teletherm: "+month_names[month-1-6].slice(0,3)+" "+day+" (day "+winter_teletherm_date+"), "+(winter_teletherm_extent[1]-winter_teletherm_extent[0])+" day extent");        
    }
    
    // move the screen down to this
    // document.getElementById('station1').focus();
    // $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);

    return {plot: plot,
            replot: replot}
}

