// two functions, smooth_timeries_gaussian and cityTimePlot
//
// smooth_timeseries_gaussian is used by cityPlot to take the raw data
// and average it
//
// cityPlot takes the raw data load, a total of 4 files, and uses the year stored in yearIndex
// and parseInt(windowDecoder().cached) (the number of years) to add up the data

var smooth_timeseries_gaussian = function(windows,t,season) {
    // store the compute teletherm day for each window
    var teletherm_dates = Array(windows.length);
    var teletherm_extents = Array(windows.length);
    // store the gaussian
    var g = Array(365);
    var alpha = 2;
    // extra long T vector, just handy for indexing
    var longer_t = [].concat(t,t,t);
    var range_t = d3.extent(t)[1]-d3.extent(t)[0];
    // save things for all timeseries
    var smoothed_timeseries = Array(windows.length);
    for (var i=0; i<windows.length; i++) {
        var my_window = windows[i];
	for (var j=0; j<g.length; j++) {
	    // gaussian kernel
	    // g[j] = Math.exp(-1/2*((182-j)/my_window*(182-j)/my_window));
	    // parameterized a la matlab
	    // http://www.mathworks.com/help/signal/ref/gausswin.html
	    g[j] = Math.exp(-1/2*(alpha*(182-j)/((my_window-1)/2)*alpha*(182-j)/((my_window-1)/2)));
	}
	var gsum = d3.sum(g);
	g = g.map(function(d) { return d/gsum; });
        smoothed_timeseries[i] = Array(365);
        for (var j=0; j<365; j++) {
	    smoothed_timeseries[i][j] = science.lin.dot(g,longer_t.slice((j+365)-182,(j+1+365)+182));
	}
	// now find the max for the summer teletherm
	// this is the max T, but need to grab that day
        if (season === "summer") {
            var T_teletherm = d3.max(smoothed_timeseries[i]);
        }
        else {
            var T_teletherm = d3.min(smoothed_timeseries[i]);
        }
	teletherm_dates[i] = smoothed_timeseries[i].indexOf(T_teletherm)+1;
        
        // then look out for the days within 2% of that temperature range
        // now it's a list of length 1
        teletherm_extents[i] = [[teletherm_dates[i]-1,teletherm_dates[i]+1]];
        var all_extent_days = [];
        for (var j=0; j<smoothed_timeseries[i].length; j++) {
            if (Math.abs(smoothed_timeseries[i][j] - T_teletherm) < .02*range_t) {
                all_extent_days.push(j);
            }
        }
        // console.log(all_extent_days);
        // now go find the intervals in all the days
        // start the first interval
        teletherm_extents[i][0][0] = all_extent_days[0];
        for (var j=1; j<all_extent_days.length; j++) {
            if ((all_extent_days[j]-all_extent_days[j-1]) !== 1) {
                // end the previous interval
                teletherm_extents[i][teletherm_extents[i].length-1][1] = all_extent_days[j-1];
                // start another
                teletherm_extents[i].push([all_extent_days[j],all_extent_days[j]]);
            }
        }
        // end the last interval
        teletherm_extents[i][teletherm_extents[i].length-1][1] = all_extent_days[all_extent_days.length-1];
    }

    return {"smoothed_timeseries": smoothed_timeseries, "teletherm_dates": teletherm_dates, "teletherm_extents": teletherm_extents,};
}

var processData = function(error,results) {
    // function(i) {
    // console.log("plotting individual city data for city number:");
    // console.log(i);
    // console.log(results);

    // just for reference, these are the files that are being loaded
    // 
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
    // this one has the values for each day in the year, with rows as the years, and values going across
    //
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
    // this one has the years for the above file, going down
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")

    // just to take a look
    // global_city_result = results;

    // get out the data I want

    var split_results_precomputed_small = function() {
        tmax_raw = results[0].split("\n").map(function(d) { return d.split(" ").map(parseFloat).slice(0,365); });
        tmax_raw_years = results[1].split("\n").map(parseFloat);
        if (isNaN(tmax_raw_years[tmax_raw_years.length-1])) {
            tmax_raw_years = tmax_raw_years.slice(0,tmax_raw_years.length-1);
            tmax_raw = tmax_raw.slice(0,tmax_raw.length-1);
        }
        tmin_raw = results[2].split("\n").map(function(d) { return d.split(" ").map(parseFloat).slice(0,365); });
        tmin_raw_years = results[3].split("\n").map(parseFloat);
        if (isNaN(tmin_raw_years[tmin_raw_years.length-1])) {
            tmin_raw_years = tmin_raw_years.slice(0,tmin_raw_years.length-1);
            tmin_raw = tmin_raw.slice(0,tmin_raw.length-1);
        }
    }

    split_results_precomputed_small();

    // check that the tmin and tmax start at the same year
    if (tmin_raw_years[0] !== tmax_raw_years[0]) {
        console.log("first years are  off");
    }

    // check that the tmin and tmax have the same # of years
    if (tmin_raw_years.length !== tmax_raw_years.length) {
        console.log("lengths are off");
        console.log(tmin_raw_years.length);
        console.log(tmax_raw_years.length);
    }

    var min_years = Math.min(tmin_raw_years.length,tmax_raw_years.length);

    var yearOffset = 0;
    // go get the year offset from the allyears
    for (var i=0; i<full_year_range.length; i++) {
        if (tmin_raw_years[0] === full_year_range[i]) {
            yearOffset = i;
            break;
        }
    }

    var good_tmax_count = Array(365);
    var good_tmin_count = Array(365);
    tmax_avg = Array(365);
    tmin_avg = Array(365);

    var local_window = parseInt(windowDecoder().cached);

    // storage for average values across each year!
    // var all_tmax_avg = Array(min_years-local_window+1);
    // var all_tmin_avg = Array(min_years-local_window+1);
    all_tmax_avg = Array(min_years-local_window+1);
    all_tmin_avg = Array(min_years-local_window+1);

    summer_data_coverage = Array(min_years);
    winter_data_coverage = Array(min_years);
    
    for (var j=0; j<min_years-local_window+1; j++) {
        all_tmax_avg[j] = Array(365);
        all_tmin_avg[j] = Array(365);
        for (var i=0; i<365; i++) {
            all_tmax_avg[j][i] = 0;
            all_tmin_avg[j][i] = 0;
        }
    }

    // store the values at the end
    for (var i=0; i<365; i++) {
        tmax_avg[i] = 0;
        tmin_avg[i] = 0;
        good_tmax_count[i] = 0;
        good_tmin_count[i] = 0;
    }

    // add the first local_window of the raw dates
    for (var j=0; j<local_window; j++) {
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        for (var i=0; i<365; i++) {
            if (tmax_raw[j][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] + tmax_raw[j][i];
                good_tmax_count[i]++;
                good_tmax_this_year++;
            }
            if (tmin_raw[j][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] + tmin_raw[j][i];
                good_tmin_count[i]++;
                good_tmin_this_year++;
            }
        }
        summer_data_coverage[j] = good_tmax_this_year/365;
        winter_data_coverage[j] = good_tmin_this_year/365;
    }

    // take the average into the first year
    for (var i=0; i<365; i++) {
        if (good_tmax_count[i] > 0) {
            all_tmax_avg[0][i] = tmax_avg[i]/good_tmax_count[i];
        }
        if (good_tmin_count[i] > 0) {
            all_tmin_avg[0][i] = tmin_avg[i]/good_tmin_count[i];
        }
    }

    // add the first local_window of the raw dates
    for (var j=local_window; j<min_years; j++) {
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        // go through the year and add
        for (var i=0; i<365; i++) {
            if (tmax_raw[j][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] + tmax_raw[j][i];
                good_tmax_count[i]++;
                good_tmax_this_year++;
            }
            if (tmin_raw[j][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] + tmin_raw[j][i];
                good_tmin_count[i]++;
                good_tmin_this_year++;
            }
        }
        // go through the year-window and subtract
        for (var i=0; i<365; i++) {
            if (tmax_raw[j-local_window][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] - tmax_raw[j-local_window][i];
                good_tmax_count[i]--;
            }
            if (tmin_raw[j-local_window][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] - tmin_raw[j-local_window][i];
                good_tmin_count[i]--;
            }
        }
        // console.log(j);
        // take the new average
        for (var i=0; i<365; i++) {
            if (good_tmax_count[i] > 0) {
                all_tmax_avg[j-local_window+1][i] = tmax_avg[i]/good_tmax_count[i];
            }
            if (good_tmin_count[i] > 0) {
                all_tmin_avg[j-local_window+1][i] = tmin_avg[i]/good_tmin_count[i];
            }
        }
        // console.log(j);
        summer_data_coverage[j] = good_tmax_this_year/365;
        winter_data_coverage[j] = good_tmin_this_year/365;
    }

    // tmin_avg = all_tmin_avg[0];
    // tmax_avg = all_tmax_avg[0];

    // var summer_smoother = smooth_timeseries_gaussian([15],tmax_avg,"summer");
    // summer_teletherm_date = summer_smoother.teletherm_dates[0];
    // summer_teletherm_extent = summer_smoother.teletherm_extents[0];
    // console.log(summer_teletherm_extent);
    // tmax_smoothed_js  = summer_smoother.smoothed_timeseries[0];

    // var winter_smoother = smooth_timeseries_gaussian([15],tmin_avg,"winter");
    // winter_teletherm_date = winter_smoother.teletherm_dates[0];
    // winter_teletherm_extent = winter_smoother.teletherm_extents[0];
    // console.log(winter_teletherm_extent);
    // tmin_smoothed_js  = winter_smoother.smoothed_timeseries[0];

    // screw it, store the full averaged values too
    all_tmax_avg_smoothed = Array(min_years-local_window+1);
    all_tmin_avg_smoothed = Array(min_years-local_window+1);
    // for (var j=0; j<min_years; j++) {
    //     all_tmax_avg[j] = Array(365);
    //     all_tmin_avg[j] = Array(365);
    //     for (var i=0; i<365; i++) {
    //         all_tmax_avg[j][i] = 0;
    //         all_tmin_avg[j][i] = 0;
    //     }
    // }

    all_winter_dates = Array(min_years-local_window+1);
    all_winter_extents = Array(min_years-local_window+1);
    all_summer_dates = Array(min_years-local_window+1);
    all_summer_extents = Array(min_years-local_window+1);

    // smooth everything
    for (var j=local_window; j<min_years+1; j++) {
        var summer_smoother = smooth_timeseries_gaussian([15],all_tmax_avg[j-local_window],"summer");
        all_summer_dates[j-local_window] = summer_smoother.teletherm_dates[0];
        all_summer_extents[j-local_window] = summer_smoother.teletherm_extents[0];
        all_tmax_avg_smoothed[j-local_window]  = summer_smoother.smoothed_timeseries[0];

        var winter_smoother = smooth_timeseries_gaussian([15],all_tmin_avg[j-local_window],"winter");
        all_winter_dates[j-local_window] = winter_smoother.teletherm_dates[0];
        all_winter_extents[j-local_window] = winter_smoother.teletherm_extents[0];
        all_tmin_avg_smoothed[j-local_window]  = winter_smoother.smoothed_timeseries[0];
    }

    var flattened_summer_extents = [];
    for (var i=0; i<all_summer_extents.length; i++) {
        for (var j=0; j<all_summer_extents[i].length; j++) {
            flattened_summer_extents.push([i].concat(all_summer_extents[i][j]))
        }
    }

    var flattened_winter_extents = [];
    for (var i=0; i<all_winter_extents.length; i++) {
        for (var j=0; j<all_winter_extents[i].length; j++) {
            flattened_winter_extents.push([i].concat(all_winter_extents[i][j]))
        }
    }

    // callback function here...
    var viz = cityNYT();
    viz.plot(all_tmax_avg[0],all_summer_dates[0],all_summer_extents[0],all_tmax_avg_smoothed[0],all_tmin_avg[0],all_winter_dates[0],all_winter_extents[0],all_tmin_avg_smoothed[0],"#figure");
}


    
