var cityTimeseries = function() {
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

    var plot = function(min_years,flattened_summer_extents,flattened_winter_extents,local_window) {
        figure = d3.select("#figure");
        
        margin = {top: 2, right: 50, bottom: 40, left: 50};

        // full width and height
        figwidth  = parseInt(figure.style("width"));
        figheight = 2+40+80*4;
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

        x = d3.scale.linear()
	    .domain([0,min_years])
	    .range([0,width]);

        tmin_raw_mins = Array();
        tmin_raw_good_years = Array();
        for (var i=0; i<min_years; i++) {
            if (winter_data_coverage[i] > .50) {
                var my_min = 100;
                for (var j=0; j<tmin_raw[i].length; j++) {
                    if (tmin_raw[i][j] < my_min && tmin_raw[i][j] > -9000) {
                        my_min = tmin_raw[i][j];
                    }
                }
                tmin_raw_mins.push(my_min)
                tmin_raw_good_years.push(i);
            }
        }
        tmax_raw_maxs = Array();
        tmax_raw_good_years = Array();
        for (var i=0; i<min_years; i++) {
            if (summer_data_coverage[i] > .50) {
                tmax_raw_maxs.push(d3.max(tmax_raw[i]));
                tmax_raw_good_years.push(i);
            }
        }
        
        y_T =  d3.scale.linear()
	    .domain([d3.min(tmin_raw_mins),d3.max(tmax_raw_maxs)])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([height-10, 10]);

        y_T_summer =  d3.scale.linear()
	// .domain([d3.min(tmax_raw_maxs)-5,d3.max(tmax_raw_maxs)+2])
	    .domain([d3.min(all_tmax_avg_smoothed.map(function(d) { return d3.max(d); }))-5,d3.max(tmax_raw_maxs)+2])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([1*height/4,0*height/4]);

        y_T_winter =  d3.scale.linear()
	    .domain([d3.min(tmin_raw_mins)-5,d3.max(all_tmin_avg_smoothed.map(function(d) { return d3.min(d); }))+5])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([3*height/4, 2*height/4]);

        y_tele_summer = d3.scale.linear()
	    .domain([d3.min(flattened_summer_extents.map(function(d) { return d[1]; }))-5,d3.max(flattened_summer_extents.map(function(d) { return d[2]; }))+5])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
            .range([2*height/4, 1*height/4]);
	// .range([height-10, 10]);

        y_tele_winter = d3.scale.linear()
	// .domain([100,200])
            .domain([d3.min(flattened_winter_extents.map(function(d) { return d[1]; }))-5,d3.max(flattened_winter_extents.map(function(d) { return d[2]; }))+2])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
            .range([4*height/4, 3*height/4]);

        // create the axes themselves
        axes = canvas.append("g")
	    .attr("transform", "translate(" + (margin.left) + "," +
	          (margin.top) + ")") // 99 percent
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "main");

        // create the axes background
        var bgrect = axes.append("svg:rect")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("class", "bg")
	    .style({'stroke-width':'2','stroke':'rgb(0,0,0)'})
	    .attr("fill", "#FCFCFC");

        // axes creation functions
        var create_xAxis = function() {
	    return d3.svg.axis()
	        .scale(x)
	        .orient("bottom"); }

        // axis creation function
        var create_yAxis_T_summer = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_T_summer) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_T_summer = create_yAxis_T_summer()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(0,0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_T_summer);

        // axis creation function
        var create_yAxis_T_winter = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_T_winter) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_T_winter = create_yAxis_T_winter()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(0,0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_T_winter);

        // axis creation function
        var create_yAxis_tele_summer = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_tele_summer) //linear scale function
	        .orient("right"); }

        // draw the axes
        var yAxis_tele_summer = create_yAxis_tele_summer()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+width+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_tele_summer);

        // axis creation function
        var create_yAxis_tele_winter = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_tele_winter) //linear scale function
	        .orient("right"); }

        // draw the axes
        var yAxis_tele_winter = create_yAxis_tele_winter()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+width+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_tele_winter);

        // draw the axes
        var xAxis = create_xAxis()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "x axis ")
	    .attr("font-size", "14.0px")
	    .attr("transform", "translate(0," + (height) + ")")
	    .call(xAxis);

        d3.selectAll(".tick line").style("stroke","black");

        d3.selectAll(".tick text").style("font-size",10);    

        var xlabel_text = "Years";
        var xlabel = canvas.append("text")
	    .text(xlabel_text)
	    .attr("class","axes-text")
	    .attr("x",margin.left+width/2)  
	    .attr("y",figheight-5)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("style", "text-anchor: middle;");

        
        var ylabel_text = "Temperature";
        var ylabel = canvas.append("text")
	    .text(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",18)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("transform", "rotate(-90.0," + (18) + "," + (height/2) + ")");
        
        var ylabel_text = "Day of Year";
        var ylabel = canvas.append("text")
	    .text(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",width+margin.right+margin.left-15)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("transform", "rotate(90.0," + (width+margin.right+margin.left-15) + "," + (height/2) + ")");

        line_T = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T(d); })
	    .interpolate("linear"); // cardinal

        line_T_summer = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        line_T_winter = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T_winter(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw_summer = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw_summer = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        // var summer_teletherm_extent_extended = Array(summer_teletherm_extent.length);
        // for (var i=0; i<summer_teletherm_extent.length; i++) {
        //     summer_teletherm_extent_extended[i] = [summer_teletherm_extent[i][0]];
        //     while ((summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]) < summer_teletherm_extent[i][1]) { summer_teletherm_extent_extended[i].push(summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]+1);  }
        // }

        // var winter_teletherm_extent_extended = Array(winter_teletherm_extent.length);
        // for (var i=0; i<winter_teletherm_extent.length; i++) {
        //     winter_teletherm_extent_extended[i] = [winter_teletherm_extent[i][0]];
        //     while ((winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]) < winter_teletherm_extent[i][1]) { winter_teletherm_extent_extended[i].push(winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]+1);  }
        // }

        axes.append("path")
            .datum(all_tmax_avg.map(function(d) { return d3.max(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_summer)
            .attr("stroke","red")
            .attr("stroke-width",1)
            .attr("stroke-dasharray","10,10")
            .attr("fill","none");

        axes.append("path")
            .datum(all_tmax_avg_smoothed.map(function(d) { return d3.max(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_summer)
            .attr("stroke","red")
            .attr("stroke-width",2)
            .attr("fill","none");


        axes.selectAll("circle.tmax_raw")
            .data(tmax_raw_maxs)
            .enter()
            .append("circle")
            .attr({"class": "tmaxsmoothed",
                   "cx": function(d,i) { return x(tmax_raw_good_years[i]); },
                   "cy": function(d) { return y_T_summer(d); },
                   "r": 2,
                   "fill": "red",});

        axes.selectAll("line.tmax_raw")
            .data(flattened_summer_extents)
            .enter()
            .append("line")
	    .attr({ "x1": function(d) { return x(d[0]+local_window); },
		    "y1": function(d) { return y_tele_summer(d[1]); },
		    "x2": function(d) { return x(d[0]+local_window); },
                    "y2": function(d) { return y_tele_summer(d[2]); },
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "#C0C0C0",
                "stroke-width": 4,
            });

        axes.selectAll("line.tmax_raw")
            .data(flattened_winter_extents)
            .enter()
            .append("line")
	    .attr({ "x1": function(d) { return x(d[0]+local_window); },
		    "y1": function(d) { return y_tele_winter(d[1]); },
		    "x2": function(d) { return x(d[0]+local_window); },
                    "y2": function(d) { return y_tele_winter(d[2]); },
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "#C0C0C0",
                "stroke-width": 4,
            });

        axes.selectAll("rect.tmax_raw")
            .data(all_summer_dates)
            .enter()
            .append("rect")
	    .attr({ "x": function(d,i) { return x(i+local_window)-3; },
		    "y": function(d) { return y_tele_summer(d); },
		    "width": 6,
                    "height": 6,
                    "class": "summerteleline",
	          })
            .style({
                "fill": "darkgrey",
                // "stroke": "#C0C0C0",
                // "stroke-width": 4,
            });

        axes.selectAll("rect.tmax_raw")
            .data(all_winter_dates)
            .enter()
            .append("rect")
	    .attr({ "x": function(d,i) { return x(i+local_window)-3; },
		    "y": function(d) { return y_tele_winter(d); },
		    "width": 6,
                    "height": 6,
                    "class": "summerteleline",
	          })
            .style({
                "fill": "darkgrey",
                // "stroke": "#C0C0C0",
                // "stroke-width": 4,
            });
        
        axes.selectAll("circle.tmax_raw")
            .data(tmin_raw_mins)
            .enter()
            .append("circle")
            .attr({"class": "tmaxsmoothed",
                   "cx": function(d,i) { return x(tmin_raw_good_years[i]); },
                   "cy": function(d) { return y_T_winter(d); },
                   "r": 2,
                   "fill": "blue",});
        
        axes.append("path")
            .datum(all_tmin_avg.map(function(d) { return d3.min(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_winter)
            .attr("stroke","blue")
            .attr("stroke-width",1)
            .attr("stroke-dasharray","10,10")
            .attr("fill","none");

        axes.append("path")
            .datum(all_tmin_avg_smoothed.map(function(d) { return d3.min(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_winter)
            .attr("stroke","blue")
            .attr("stroke-width",2)
            .attr("fill","none");

    } // end plot() function

    var replot = function() {
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
    return {plot: plot,
            replot: replot}
}
    
