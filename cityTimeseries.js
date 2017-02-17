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

    var this_city_name = city_name;
    var this_city_id = city_id;
    // figure = d3.select("#figure");
    // var setup_T
    var this_citybox = d3.select("#cityboxcities").append("div").attr("class","shown city"+city_id);
    this_citybox.text(city_name);
    this_citybox.append("button").attr({
        "type":"button",
        "class":"close",
        "data-dismiss":"modal",
        "aria-label":"Close",})
        .append("span").attr("aria-hidden","true").text("×")
        .on("click",function(d) {
            // alert("closing "+this_city_name);
            d3.selectAll(".city"+this_city_id).remove();
        });

    var plot_T = function(local_window,season,line_color,all_avg,all_avg_smoothed,extremes_years,extremes,good_years) {
        // uses tmin_raw_years, tmax_raw_years...
        figure = d3.select("#"+season+"_T");

        margin = {top: 2, right: 0, bottom: 18, left: 50};

        // full width and height
        figwidth  = parseInt(figure.style("width"));
        figheight = 2+40+80*1;
        // don't shrink this
        width = figwidth - margin.left - margin.right;
        // tiny bit of space
        height = figheight - margin.top - margin.bottom;

        // remove an old figure if it exists
        // figure.select("#T_time_series").remove();

        //Create SVG element
        canvas = figure
	    .append("svg")
	    .attr("class", "city"+city_id)
	    .attr("id", "T_time_series_"+season)
	    .attr("width", figwidth)
	    .attr("height", figheight);

        x = d3.scale.linear()
            // .domain([0,min_years])
	    .domain([0,full_year_range.length-1])
	    .range([0,width]);

        var x_years = d3.scale.linear()
	    // .domain([d3.min([tmin_raw_years[0],tmax_raw_years[0]]),d3.min([tmin_raw_years[tmin_raw_years.length-1],tmax_raw_years[tmax_raw_years.length-1]])])
            .domain(d3.extent(full_year_range))
	    .range([0,width]);

        min_T = d3.min([d3.min(all_avg_smoothed)-5,d3.min(extremes)-5])
        max_T = d3.max([d3.max(extremes)+5,d3.max(all_avg_smoothed)+5])
        y_T =  d3.scale.linear()
	    .domain([min_T,max_T])
	    .range([1*height,0*height]);

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
            .attr("fill", "rgba(255, 248, 220, 0.2)");

        // axis creation function
        var create_yAxis_T = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_T) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_T = create_yAxis_T()
	    .innerTickSize(6)
	    .outerTickSize(0);

        var create_xAxis = function() {
	    return d3.svg.axis()
	        .scale(x_years)
                .tickFormat(d3.format("g"))
	        .orient("bottom"); }

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

        // var xlabel_text = "Years";
        // var xlabel = canvas.append("text")
	//     .html(xlabel_text)
	//     .attr("class","axes-text")
	//     .attr("x",margin.left+width/2)  
	//     .attr("y",figheight-5)
	//     .attr("font-size", "15.0px")
	//     .attr("fill", "#000000")
	//     .attr("style", "text-anchor: middle;");

        line_T = d3.svg.line()
	    .x(function(d,i) { return x_years(good_years[i]); })        
	    // .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T(d); })
	    .interpolate("linear"); // cardinal

        axes.append("path")
            .datum(all_avg)
            .attr("class", "t")
            .attr("d", line_T)
            .attr("stroke",line_color)
            .attr("stroke-width",1)
            .attr("stroke-dasharray","10,10")
            .attr("fill","none");

        axes.append("path")
            .datum(all_avg_smoothed)
            .attr("class", "tsmoothed")
            .attr("d", line_T)
            .attr("stroke",line_color)
            .attr("stroke-width",2)
            .attr("fill","none");


        axes.selectAll("circle.raw")
            .data(extremes)
            .enter()
            .append("circle")
            .attr({"class": "extreme",
                   "cx": function(d,i) { return x_years(extremes_years[i]); },
                   "cy": function(d) { return y_T(d); },
                   "r": 2,
                   "fill": line_color,});

        var axeslabelbg = canvas.append("svg:rect")
            .attr("width", margin.left-2)
	    .attr("height", height)
	    .attr("class", "bg")
	    // .style({'stroke-width':'2','stroke':'rgb(0,0,0)'})
            .attr("fill", "rgba(255, 255, 255, 0.9)");

        canvas.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+margin.left+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_T);

        canvas.append("text")
	    .html(city_name)
	    .attr("class","axes-text")
	    .attr("x",margin.left+10)
	    .attr("y",(season === "summer") ? height+margin.top-8 : 20+margin.top)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000");

        
        var ylabel_text = "T (&#176;F)";
        var ylabel = canvas.append("text")
	    .html(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",18)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
            .attr("style", "text-anchor: middle;")
	    .attr("transform", "rotate(-90.0," + (18) + "," + (height/2) + ")");
        
    }

    var plot_tele = function(years,flattened_extents,all_dates,local_window,season) {
        figure = d3.select("#"+season+"_tele");
                
        margin = {top: 6, right: 0, bottom: 18, left: 50};

        // full width and height
        figwidth  = parseInt(figure.style("width"));
        figheight = 2+40+80*1;
        // don't shrink this
        width = figwidth - margin.left - margin.right;
        // tiny bit of space
        height = figheight - margin.top - margin.bottom;

        // remove an old figure if it exists
        // figure.select(".canvas").remove();

        //Create SVG element
        canvas = figure
	    .append("svg")
	    .attr("class", "city"+city_id)
	    .attr("id", "teledates_"+season)
	    .attr("width", figwidth)
	    .attr("height", figheight);

        x = d3.scale.linear()
            // .domain([0,min_years])
	    .domain([0,full_year_range.length-1])
	    .range([0,width]);

        var x_years = d3.scale.linear()
	    // .domain([d3.min([tmin_raw_years[0],tmax_raw_years[0]]),d3.min([tmin_raw_years[tmin_raw_years.length-1],tmax_raw_years[tmax_raw_years.length-1]])])
            .domain(d3.extent(full_year_range))
	    .range([0,width]);

        y_tele = d3.scale.linear()
	    .domain([d3.min(flattened_extents.map(function(d) { return d[1]; }))-5,d3.max(flattened_extents.map(function(d) { return d[2]; }))+5])
            .range([height, 0]);

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
	    .attr("fill", "rgba(255, 248, 220, 0.2)");

        // axes creation functions
        var create_xAxis = function() {
	    return d3.svg.axis()
	        .scale(x_years)
                .tickFormat(d3.format("g"))
	        .orient("bottom"); }

        // axis creation function
        var create_yAxis_tele = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_tele) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_tele = create_yAxis_tele()
	    .innerTickSize(6)
	    .outerTickSize(0);

        // draw the axes
        var xAxis = create_xAxis()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "x axis ")
	    .attr("font-size", "14.0px")
	    .attr("transform", "translate(0," + (height) + ")")
	    .call(xAxis);

        axes.selectAll("line.tmax_raw")
            .data(flattened_extents)
            .enter()
            .append("line")
	    .attr({ "x1": function(d) { return x_years(years[d[0]]); },
		    "y1": function(d) { return y_tele(d[1]); },
		    "x2": function(d) { return x_years(years[d[0]]); },
                    "y2": function(d) { return y_tele(d[2]); },
                    "class": "teleline",
	          })
            .style({
                "stroke": "#C0C0C0",
                "stroke-width": 4,
            });
        
        axes.selectAll("rect.tmax_raw")
            .data(all_dates)
            .enter()
            .append("rect")
	    .attr({ "x": function(d,i) { return x_years(years[i])-3; },
		    "y": function(d) { return y_tele(d); },
		    "width": 6,
                    "height": 6,
                    "class": "teleline",
	          })
            .style({
                "fill": "darkgrey",
                // "stroke": "#C0C0C0",
                // "stroke-width": 4,
            });        

        var axeslabelbg = canvas.append("svg:rect")
            .attr("width", margin.left-2)
	    .attr("height", height)
	    .attr("class", "bg")
	    // .style({'stroke-width':'2','stroke':'rgb(0,0,0)'})
            .attr("fill", "rgba(255, 255, 255, 0.9)");

        canvas.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+margin.left+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_tele);

        canvas.append("text")
	    .html(city_name)
	    .attr("class","axes-text")
	    .attr("x",margin.left+10)
	    .attr("y",height+margin.top-8)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000");

        var ylabel_text = "Day of Year";
        var ylabel = canvas.append("text")
	    .html(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",18)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
            .attr("style", "text-anchor: middle;")
	    .attr("transform", "rotate(-90.0," + (18) + "," + (height/2) + ")");

        d3.selectAll(".tick line").style("stroke","black");
        d3.selectAll(".tick text").style("font-size",10);

    }

    var plot_all = function(min_years,flattened_summer_extents,flattened_winter_extents,local_window) {
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
    return {plot_all: plot_all,
            plot_T: plot_T,
            plot_tele: plot_tele,
            replot: replot}
}
