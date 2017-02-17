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
    var combined_years = Array();
    var i = 0;
    var j = 0;
    // merge two sorted list
    while ((i<tmin_raw_years.length) && (j<tmax_raw_years.length)) {
        // console.log(i);
        // console.log(j);
        if (tmin_raw_years[i] < tmax_raw_years[j]) {
            combined_years.push(tmin_raw_years[i]);
            i++;
        }
        else if (tmin_raw_years[i] > tmax_raw_years[j]) {
            combined_years.push(tmax_raw_years[j]);
            j++;
        }
        else {
            combined_years.push(tmin_raw_years[i]);
            i++;
            j++;
        }
    }
    if (i<tmin_raw_years.length) {
        combined_years = combined_years.concat(tmin_raw_years.slice(i,tmin_raw_years.length));
    }
    else if (j<tmax_raw_years.length) {
        combined_years = combined_years.concat(tmax_raw_years.slice(j,tmax_raw_years.length));
    }

    var yearOffset = 0;
    // go get the year offset from the allyears
    for (var i=0; i<full_year_range.length; i++) {
        if (combined_years[0] === full_year_range[i]) {
            yearOffset = i;
            break;
        }
    }

    var good_tmax_count = Array(365);
    var good_tmin_count = Array(365);
    var tmax_avg = Array(365);
    var tmin_avg = Array(365);

    var local_window = parseInt(windowDecoder().cached);

    // storage for average values across each year!
    // var all_tmax_avg = Array(min_years-local_window+1);
    // var all_tmin_avg = Array(min_years-local_window+1);
    var all_tmax_avg = Array(combined_years.length-local_window+1);
    var all_tmin_avg = Array(combined_years.length-local_window+1);

    var summer_data_coverage = Array(combined_years);
    var winter_data_coverage = Array(combined_years);

    // initialize them. could do this in the loop...
    for (var j=0; j<all_tmax_avg.length; j++) {
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
        // console.log(j);
        var year = combined_years[j];
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        if (tmax_raw_years.indexOf(year) > -1) {
            var tmax_year_index = tmax_raw_years.indexOf(year);
            for (var i=0; i<365; i++) {
                if (tmax_raw[tmax_year_index][i] > -9998) {
                    tmax_avg[i] = tmax_avg[i] + tmax_raw[tmax_year_index][i];
                    good_tmax_count[i]++;
                    good_tmax_this_year++;
                }
            }
        }
        else {
            // console.log("year "+year+" not found in tmax");
        }
        if (tmin_raw_years.indexOf(year) > -1) {
            var tmin_year_index = tmin_raw_years.indexOf(year);
            for (var i=0; i<365; i++) {            
                if (tmin_raw[tmin_year_index][i] > -9998) {
                    tmin_avg[i] = tmin_avg[i] + tmin_raw[tmin_year_index][i];
                    good_tmin_count[i]++;
                    good_tmin_this_year++;
                }
            }
        }
        else {
            // console.log("year "+year+" not found in tmin");
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

    // do the rest of the years...
    for (var j=local_window; j<combined_years.length; j++) {
        // console.log(j);
        var year = combined_years[j];
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        // go through the year and add
        if (tmax_raw_years.indexOf(year) > -1) {
            var tmax_year_index = tmax_raw_years.indexOf(year);        
            for (var i=0; i<365; i++) {
                if (tmax_raw[tmax_year_index][i] > -9998) {
                    tmax_avg[i] = tmax_avg[i] + tmax_raw[tmax_year_index][i];
                    good_tmax_count[i]++;
                    good_tmax_this_year++;
                }
                if (tmax_raw[tmax_year_index-local_window][i] > -9998) {
                    tmax_avg[i] = tmax_avg[i] - tmax_raw[tmax_year_index-local_window][i];
                    good_tmax_count[i]--;
                }
            }
        }
        else {
            // console.log("year "+year+" not found in tmax");
        }
        if (tmin_raw_years.indexOf(year) > -1) {
            var tmin_year_index = tmin_raw_years.indexOf(year);        
            for (var i=0; i<365; i++) {            
                if (tmin_raw[tmin_year_index][i] > -9998) {
                    tmin_avg[i] = tmin_avg[i] + tmin_raw[tmin_year_index][i];
                    good_tmin_count[i]++;
                    good_tmin_this_year++;
                }
                if (tmin_raw[tmin_year_index-local_window][i] > -9998) {
                    tmin_avg[i] = tmin_avg[i] - tmin_raw[tmin_year_index-local_window][i];
                    good_tmin_count[i]--;
                }
            }
        }
        else {
            // console.log("year "+year+" not found in tmin");
        }
        for (var i=0; i<365; i++) {                        
            if (good_tmin_count[i] > 0) {
                all_tmin_avg[j-local_window+1][i] = tmin_avg[i]/good_tmin_count[i];
            }
            if (good_tmax_count[i] > 0) {
                all_tmax_avg[j-local_window+1][i] = tmax_avg[i]/good_tmax_count[i];
            }
        }
        summer_data_coverage[j] = good_tmax_this_year/365;
        winter_data_coverage[j] = good_tmin_this_year/365;
    }

    // store the full averaged values too
    var all_tmax_avg_smoothed = Array(combined_years.length-local_window+1);
    var all_tmin_avg_smoothed = Array(combined_years.length-local_window+1);

    var all_winter_dates = Array(combined_years.length-local_window+1);
    var all_winter_extents = Array(combined_years.length-local_window+1);
    var all_summer_dates = Array(combined_years.length-local_window+1);
    var all_summer_extents = Array(combined_years.length-local_window+1);

    // smooth everything
    var smoothed_years = Array(combined_years.length-local_window+1);
    var average_coverage = Array(combined_years.length-local_window+1);
    var acceptable_years = Array();
    for (var j=local_window; j<combined_years.length+1; j++) {
        // console.log(combined_years[j-local_window]+"-"+combined_years[j]);
        var summer_smoother = smooth_timeseries_gaussian([15],all_tmax_avg[j-local_window],"summer");
        all_summer_dates[j-local_window] = summer_smoother.teletherm_dates[0];
        all_summer_extents[j-local_window] = summer_smoother.teletherm_extents[0];
        all_tmax_avg_smoothed[j-local_window]  = summer_smoother.smoothed_timeseries[0];
        // console.log(all_summer_dates[j-local_window]);
        var winter_smoother = smooth_timeseries_gaussian([15],all_tmin_avg[j-local_window],"winter");
        all_winter_dates[j-local_window] = winter_smoother.teletherm_dates[0];
        all_winter_extents[j-local_window] = winter_smoother.teletherm_extents[0];
        all_tmin_avg_smoothed[j-local_window]  = winter_smoother.smoothed_timeseries[0];
        // // console.log(combined_years[j-1]);
        smoothed_years[j-local_window] = combined_years[j-1];
        average_coverage[j-local_window] = (d3.sum(summer_data_coverage.slice(j-local_window,j))+d3.sum(winter_data_coverage.slice(j-local_window,j)))/(2*local_window);
        // console.log("av cov: "+average_coverage[j-local_window]);
        // average_coverage[j-local_window] = d3.min([d3.min(summer_data_coverage.slice(j-local_window,j)),d3.min(winter_data_coverage.slice(j-local_window,j))])
        if (average_coverage[j-local_window] > .8) {
            acceptable_years.push(combined_years[j-1]);
        }
    }

    console.log(all_summer_extents);

    var flattened_summer_extents = [];
    for (var i=0; i<all_summer_extents.length; i++) {
        if (acceptable_years.indexOf(smoothed_years[i]) > -1) {
            for (var j=0; j<all_summer_extents[i].length; j++) {
                flattened_summer_extents.push([acceptable_years.indexOf(smoothed_years[i])].concat(all_summer_extents[i][j]))
            }
        }
    }

    var flattened_winter_extents = [];
    for (var i=0; i<all_winter_extents.length; i++) {
        if (acceptable_years.indexOf(smoothed_years[i]) > -1) {        
            for (var j=0; j<all_winter_extents[i].length; j++) {
                flattened_winter_extents.push([acceptable_years.indexOf(smoothed_years[i])].concat(all_winter_extents[i][j]))
            }
        }
    }

    // callback function here...
    // var a_index = 0;
    // var index = smoothed_years.indexOf(acceptable_years[a_index]);
    // end_year = acceptable_years[a_index];
    index = yearIndex;
    console.log(yearIndex);
    end_year = full_year_range[yearIndex]+25;
    start_year = end_year-local_window;
    var viz1 = citySplat();
    console.log(index);
    console.log(all_summer_extents[index]);
    viz1.plot(all_tmax_avg[index],all_summer_dates[index],all_summer_extents[index],all_tmax_avg_smoothed[index],all_tmin_avg[index],all_winter_dates[index],all_winter_extents[index],all_tmin_avg_smoothed[index],"#figure",start_year+"&ndash;"+end_year);    


    // tmin_raw_mins = Array();
    // tmin_raw_good_years = Array();
    // for (var i=0; i<combined_years.length; i++) {
    //     if (winter_data_coverage[i] > .50) {
    //         var my_min = 100;
    //         for (var j=0; j<tmin_raw[i].length; j++) {
    //             if (tmin_raw[i][j] < my_min && tmin_raw[i][j] > -9000) {
    //                 my_min = tmin_raw[i][j];
    //             }
    //         }
    //         tmin_raw_mins.push(my_min)
    //         tmin_raw_good_years.push(combined_years[i]);
    //     }
    // }
    // tmax_raw_maxs = Array();
    // tmax_raw_good_years = Array();
    // for (var i=0; i<combined_years.length; i++) {
    //     if (summer_data_coverage[i] > .50) {
    //         tmax_raw_maxs.push(d3.max(tmax_raw[i]));
    //         tmax_raw_good_years.push(combined_years[i]);
    //     }
    // }

    // var get_good_years = function(all,acceptable,data) {
    //     var filtereddata = Array();
    //     for (var i=0; i<all.length; i++) {
    //         if (acceptable.indexOf(all[i]) > -1) {
    //             filtereddata.push(data[i]);
    //         }
    //     }
    //     return filtereddata;
    // }

    // var timeseries = cityTimeseries();
    // d3.selectAll("#T_time_series_summer").remove();
    // d3.selectAll("#teledates_summer").remove();
    // d3.selectAll("#T_time_series_winter").remove();
    // d3.selectAll("#teledates_winter").remove();
    // timeseries.plot_all(combined_years.length,flattened_summer_extents,flattened_winter_extents,local_window);
    // timeseries.plot_T(local_window,"summer","red",
    //                   get_good_years(smoothed_years,acceptable_years,all_tmax_avg.map(function(d) { return d3.max(d); })),
    //                   get_good_years(smoothed_years,acceptable_years,all_tmax_avg_smoothed.map(function(d) { return d3.max(d); })),
    //                   tmax_raw_good_years,tmax_raw_maxs,
    //                   acceptable_years);
    // timeseries.plot_tele(acceptable_years,flattened_summer_extents,get_good_years(smoothed_years,acceptable_years,all_summer_dates),local_window,"summer");
    // timeseries.plot_T(local_window,"winter","blue",
    //                   get_good_years(smoothed_years,acceptable_years,all_tmin_avg.map(function(d) { return d3.min(d); })),
    //                   get_good_years(smoothed_years,acceptable_years,all_tmin_avg_smoothed.map(function(d) { return d3.min(d); })),
    //                   tmin_raw_good_years,tmin_raw_mins,
    //                   acceptable_years);
    // timeseries.plot_tele(acceptable_years,flattened_winter_extents,get_good_years(smoothed_years,acceptable_years,all_winter_dates),local_window,"winter");  



}


    
