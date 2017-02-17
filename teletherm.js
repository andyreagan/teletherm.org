// on page load, queue's up the geo json and draps the map on return (using dataloaded())
// at the end of this function, queue's up the map data and calls updatedMap() to put points on the map.
// updateMap() is the end of the road for the initial load
//
// the year window buttons, and the variable dropdown will trigger updateMap()
// the year drop down ... (#yeardroplist) calls changeYear()
// the play button ...  calls changeYear()

// globally namespace these things
var geoJson;
var stateFeatures;
var station_dynamics = false;

var arrowradius = 16;
var rmin = 4;
var rmax = 6;

var month_names = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December", ];
var month_lengths = [31,28,31,30,31,30,31,31,30,31,30,31,];
// this will be the first day of every month
var month_lengths_cum = [1,31,28,31,30,31,30,31,31,30,31,30,];
for (var i=1; i<month_lengths_cum.length; i++) {
    month_lengths_cum[i] += month_lengths_cum[i-1];
}
// first day of every month for 18 months
var month_lengths_cum_18_forward = [1,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_forward.length; i++) {
    month_lengths_cum_18_forward[i] += month_lengths_cum_18_forward[i-1];
}
// note, the above ends at 517, which is short of the xrange of 365+181 = 546
// first day of every month for 18 months, starting backward 1
var month_lengths_cum_18_backward = [1-181,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_backward.length; i++) {
    month_lengths_cum_18_backward[i] += month_lengths_cum_18_backward[i-1];
}

// the main variables for the file load
// careful not to overload "window"
var windowEncoder = d3.urllib.encoder().varname("window"); //.varval(...);
var windowDecoder = d3.urllib.decoder().varname("window").varresult("25");
var windows = ["10","25","50"];
var windowIndex = 0;
var currentWindow;
for (var i=0; i<windows.length; i++) {
    if (windowDecoder().cached === windows[i]) {
	windowIndex = i;
    }
}
currentWindow = windowDecoder().cached;
windowEncoder.varval(currentWindow);

// the main variables for the file load
// careful not to overload "window"
var cityEncoder = d3.urllib.encoder().varname("city"); //.varval(...);
var cityDecoder = d3.urllib.decoder().varname("city").varresult("No city");
var currentCityIndex = -1;
if (cityDecoder.cached !== "No city") {
    for (var i=0; i<locations.length; i++) {
        if (cityDecoder().cached === locations[i][3]) {
	    currentCityIndex = i;
        }
    }
}

var city_clicked_initial_load = function(d) {
    
    cityEncoder.varval(d[3]);
    
    $('#myModal').modal('show');
    
    var city_name_split = d[3].split(",");
    var proper_city_name = city_name_split[0].split(" ");
    for (var i=0; i<proper_city_name.length; i++) {
        proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
    }
    var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+" from "+full_year_range[yearIndex]+"&ndash;"+(full_year_range[yearIndex]+parseInt(windowDecoder().cached))+":";

    // document.getElementById("stationname").innerHTML = city_name;
    var city_link = city_name+" <a href=\"city-timeseries.html?cityid="+d[4]+"\">(click for city page)</a>"
    document.getElementById("stationname").innerHTML = city_link;
    
    console.log(d);
    
    // queue()
    //     .defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")
    //     .awaitAll(cityTimePlot);

    $('#myModal').on('shown.bs.modal', function (e) {
        queue()
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")
            .awaitAll(cityTimePlot);
    })
}


// need to select the right one
// do something like this:
// http://stackoverflow.com/questions/19541484/bootstrap-set-initial-radio-button-checked-in-html
d3.select("#yearbuttons").selectAll("input").attr("checked",function(d,i) { if (i===windowIndex) { return "checked"; } else { return null; } });

// now you can close a city
$('#myModal').on('hidden.bs.modal', function (e) {
    $("#figure").empty();
    $("#stationname").html("");
    cityEncoder.destroy();
});

var variableLong = ["Summer Teletherm Day & Extent","Winter Teletherm Day & Extent","Summer Teletherm Temperature","Winter Teletherm Temperature"];
var variableShort = ["summer_day","winter_day","maxT","minT",]
var variableHover = variableLong;
// ranges are pre-computed from the data like this:
// allMins = Array(data.length-2);
// allMaxes = Array(data.length-2);
// for (var i=0; i<data.length-2; i++) { min = 150; max = -100; for (var j=0; j<data[i+1].length; j++) { if (data[i+1][j] > -9998) { if (data[i+1][j] > max) { max = data[i+1][j]; } if (data[i+1][j] < min) { min = data[i+1][j]; } } } allMins[i] = min; allMaxes[i] = max; }
// console.log("["+d3.min(allMins)+","+d3.max(allMaxes)+"]");
// these are the 1 year ranges
// var variableRanges = [[60.802142,125.425581],[-41.824669,64.654411],[18,339],[85-184,301-184],[1,57],[2,60],];
var variableRanges = [[144,295],[145-184,257-184],[61.598812,110.425581],[-15.488525,65.002232],]
// var variableRanges = [[144,295],[145-184,257-184],[-10,105],[-10,105],]
var maxYear = 2012;
var variableIndex = 0;
var variableEncoder = d3.urllib.encoder().varname("var");
var variableDecoder = d3.urllib.decoder().varname("var").varresult("summer_day");
// now this is going to be the short one
var variable;
variable = variableDecoder().cached;
variableEncoder.varval(variable);
// get the index
for (var i=0; i<variableShort.length; i++) {
    if (variable === variableShort[i]) {
	variableIndex = i;
    }
}
$("#variabledropvis").html(variableLong[variableIndex]+" <span class=\"caret\"></span>");

var year;
var yearIndex;
var allyears;
var full_year_range = [1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1915,1916,1917,1918,1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,1929,1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940,1941,1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013];
var yearEncoder = d3.urllib.encoder().varname("year");
var yearDecoder = d3.urllib.decoder().varname("year").varresult("1960");
yearEncoder.varval(yearDecoder().cached);
// yearIndex = parseFloat(yearDecoder().cached);
// can't really get the index until we have the years loaded
for (var i=0; i<full_year_range.length; i++) {
    if ((full_year_range[i]+"") === yearDecoder().cached) {
        yearIndex = i;
        break;
    }
}
// yearEncoder.varval(yearIndex);

$("#yearbuttons input").click(function() {
    console.log("calling updatewindow()");
    updatewindow(1000);
    
    // console.log($(this).val());
    currentWindow = $(this).val();
    windowEncoder.varval(currentWindow);

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
});

$("#variabledrop a").click(function() {
    console.log($(this).text());
    variable = $(this).text();
    for (var i=0; i<variableLong.length; i++) {
	if (variable === variableLong[i]) {
	    variableIndex = i;
	}
    }
    variableEncoder.varval(variableShort[variableIndex]);
    $("#variabledropvis").html(variable+" <span class=\"caret\"></span>");
    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    
    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
});

        // $("#yeardrop a").click(function() {
//     console.log($(this).text());
//     year = $(this).text();
//     $("#yeardropvis").html(year+" <span class=\"caret\"></span>");
// });

var cities;
var citygroups;
var cityarrows;
var data;
var extradata = [];

// special color scale for maxT
var maxTcolor = function(i) { 
    return d3.rgb(Math.floor(tempScale(data[i+1][0])*255),0,0).toString();
}

// diverging red blue color map from colorbrewer
var divredblue10 = ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"];
var divredblue11 = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f",];
var divredblue11_through_yellow = ['rgb(165,0,38)','rgb(215,48,39)','rgb(244,109,67)','rgb(253,174,97)','rgb(254,224,144)','rgb(255,255,191)','rgb(171,217,233)','rgb(116,173,209)','rgb(69,117,180)','rgb(49,54,149)','rgb(44,46,108)'].reverse();
// var divredblue = [
//     [1.0000000e+00,0.0000000e+00,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-02,0.0000000e+00],
//     [1.0000000e+00,1.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,1.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,2.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,5.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,8.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.6000000e-01,0.0000000e+00],
//     [9.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [9.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [7.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [4.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [1.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-02],
//     [0.0000000e+00,1.0000000e+00,1.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,3.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,6.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,9.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.0000000e+00],
//     [0.0000000e+00,9.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,6.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,3.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-02,1.0000000e+00],
//     [2.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [1.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [4.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [7.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [1.0000000e+00,0.0000000e+00,9.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,9.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,8.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,5.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,2.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-02],];
var rainbow = ["rgb(255,0,0)","rgb(255,15,0)","rgb(255,31,0)","rgb(255,46,0)","rgb(255,61,0)","rgb(255,77,0)","rgb(255,92,0)","rgb(255,107,0)","rgb(255,122,0)","rgb(255,138,0)","rgb(255,153,0)","rgb(255,168,0)","rgb(255,184,0)","rgb(255,199,0)","rgb(255,214,0)","rgb(255,230,0)","rgb(255,245,0)","rgb(250,255,0)","rgb(235,255,0)","rgb(219,255,0)","rgb(204,255,0)","rgb(189,255,0)","rgb(173,255,0)","rgb(158,255,0)","rgb(143,255,0)","rgb(128,255,0)","rgb(112,255,0)","rgb(97,255,0)","rgb(82,255,0)","rgb(66,255,0)","rgb(51,255,0)","rgb(36,255,0)","rgb(20,255,0)","rgb(5,255,0)","rgb(0,255,10)","rgb(0,255,26)","rgb(0,255,41)","rgb(0,255,56)","rgb(0,255,71)","rgb(0,255,87)","rgb(0,255,102)","rgb(0,255,117)","rgb(0,255,133)","rgb(0,255,148)","rgb(0,255,163)","rgb(0,255,179)","rgb(0,255,194)","rgb(0,255,209)","rgb(0,255,224)","rgb(0,255,240)","rgb(0,255,255)","rgb(0,240,255)","rgb(0,224,255)","rgb(0,209,255)","rgb(0,194,255)","rgb(0,179,255)","rgb(0,163,255)","rgb(0,148,255)","rgb(0,133,255)","rgb(0,117,255)","rgb(0,102,255)","rgb(0,87,255)","rgb(0,71,255)","rgb(0,56,255)","rgb(0,41,255)","rgb(0,26,255)","rgb(0,10,255)","rgb(5,0,255)","rgb(20,0,255)","rgb(36,0,255)","rgb(51,0,255)","rgb(66,0,255)","rgb(82,0,255)","rgb(97,0,255)","rgb(112,0,255)","rgb(128,0,255)","rgb(143,0,255)","rgb(158,0,255)","rgb(173,0,255)","rgb(189,0,255)","rgb(204,0,255)","rgb(219,0,255)","rgb(235,0,255)","rgb(250,0,255)","rgb(255,0,245)","rgb(255,0,230)","rgb(255,0,214)","rgb(255,0,199)","rgb(255,0,184)","rgb(255,0,168)","rgb(255,0,153)","rgb(255,0,138)","rgb(255,0,122)","rgb(255,0,107)","rgb(255,0,92)","rgb(255,0,77)","rgb(255,0,61)","rgb(255,0,46)","rgb(255,0,31)","rgb(255,0,15)",];

var gray = ["rgb(100,100,100)"];

var dark_sky = ["rgba(0, 0, 0, 255)", "rgba(7, 1, 0, 255)", "rgba(15, 2, 0, 255)", "rgba(27, 4, 0, 255)", "rgba(40, 6, 0, 255)", "rgba(54, 10, 0, 255)", "rgba(69, 13, 0, 255)", "rgba(84, 17, 0, 255)", "rgba(98, 21, 1, 255)", "rgba(111, 26, 2, 255)", "rgba(127, 30, 4, 255)", "rgba(143, 34, 6, 255)", "rgba(161, 40, 9, 255)", "rgba(177, 44, 11, 255)", "rgba(194, 51, 14, 255)", "rgba(208, 58, 18, 255)", "rgba(222, 64, 22, 255)", "rgba(233, 73, 26, 255)", "rgba(242, 82, 31, 255)", "rgba(248, 93, 38, 255)", "rgba(249, 107, 45, 255)", "rgba(249, 123, 54, 255)", "rgba(249, 139, 62, 255)", "rgba(249, 155, 71, 255)", "rgba(249, 171, 80, 255)", "rgba(249, 184, 90, 255)", "rgba(249, 197, 99, 255)", "rgba(249, 209, 113, 255)", "rgba(249, 225, 141, 255)", "rgba(249, 238, 169, 255)", "rgba(249, 247, 195, 255)", "rgba(245, 250, 210, 255)", "rgba(236, 251, 212, 255)", "rgba(225, 249, 209, 255)", "rgba(211, 245, 198, 255)", "rgba(195, 239, 188, 255)", "rgba(178, 231, 177, 255)", "rgba(160, 222, 172, 255)", "rgba(143, 213, 172, 255)", "rgba(123, 204, 175, 255)", "rgba(102, 192, 180, 255)", "rgba(80, 181, 186, 255)", "rgba(61, 168, 189, 255)", "rgba(44, 155, 190, 255)", "rgba(30, 143, 190, 255)", "rgba(25, 131, 188, 255)", "rgba(25, 120, 181, 255)", "rgba(25, 108, 173, 255)", "rgba(25, 96, 162, 255)", "rgba(25, 83, 151, 255)", "rgba(25, 71, 139, 255)", "rgba(25, 59, 128, 255)", "rgba(25, 49, 118, 255)", "rgba(25, 39, 109, 255)", "rgba(26, 32, 102, 255)", "rgba(32, 27, 99, 255)", "rgba(37, 27, 99, 255)", "rgba(47, 27, 102, 255)", "rgba(59, 27, 107, 255)", "rgba(72, 28, 114, 255)", "rgba(84, 32, 122, 255)", "rgba(96, 35, 129, 255)", "rgba(107, 39, 135, 255)", "rgba(116, 42, 138, 255)", "rgba(121, 44, 138, 255)", "rgba(121, 43, 135, 255)", "rgba(119, 43, 132, 255)", "rgba(116, 41, 128, 255)", "rgba(112, 39, 123, 255)", "rgba(106, 37, 116, 255)", "rgba(101, 35, 109, 255)", "rgba(93, 33, 101, 255)", "rgba(87, 29, 93, 255)", "rgba(79, 27, 85, 255)", "rgba(72, 24, 77, 255)", "rgba(64, 22, 69, 255)", "rgba(56, 20, 61, 255)", "rgba(49, 17, 53, 255)", "rgba(42, 14, 46, 255)", "rgba(35, 12, 38, 255)", "rgba(29, 10, 31, 255)", "rgba(18, 4, 20, 255)"].reverse();

var inferno = ["#000004","#010005","#010106","#010108","#02010a","#02020c","#02020e","#030210","#040312","#040314","#050417","#060419","#07051b","#08051d","#09061f","#0a0722","#0b0724","#0c0826","#0d0829","#0e092b","#10092d","#110a30","#120a32","#140b34","#150b37","#160b39","#180c3c","#190c3e","#1b0c41","#1c0c43","#1e0c45","#1f0c48","#210c4a","#230c4c","#240c4f","#260c51","#280b53","#290b55","#2b0b57","#2d0b59","#2f0a5b","#310a5c","#320a5e","#340a5f","#360961","#380962","#390963","#3b0964","#3d0965","#3e0966","#400a67","#420a68","#440a68","#450a69","#470b6a","#490b6a","#4a0c6b","#4c0c6b","#4d0d6c","#4f0d6c","#510e6c","#520e6d","#540f6d","#550f6d","#57106e","#59106e","#5a116e","#5c126e","#5d126e","#5f136e","#61136e","#62146e","#64156e","#65156e","#67166e","#69166e","#6a176e","#6c186e","#6d186e","#6f196e","#71196e","#721a6e","#741a6e","#751b6e","#771c6d","#781c6d","#7a1d6d","#7c1d6d","#7d1e6d","#7f1e6c","#801f6c","#82206c","#84206b","#85216b","#87216b","#88226a","#8a226a","#8c2369","#8d2369","#8f2469","#902568","#922568","#932667","#952667","#972766","#982766","#9a2865","#9b2964","#9d2964","#9f2a63","#a02a63","#a22b62","#a32c61","#a52c60","#a62d60","#a82e5f","#a92e5e","#ab2f5e","#ad305d","#ae305c","#b0315b","#b1325a","#b3325a","#b43359","#b63458","#b73557","#b93556","#ba3655","#bc3754","#bd3853","#bf3952","#c03a51","#c13a50","#c33b4f","#c43c4e","#c63d4d","#c73e4c","#c83f4b","#ca404a","#cb4149","#cc4248","#ce4347","#cf4446","#d04545","#d24644","#d34743","#d44842","#d54a41","#d74b3f","#d84c3e","#d94d3d","#da4e3c","#db503b","#dd513a","#de5238","#df5337","#e05536","#e15635","#e25734","#e35933","#e45a31","#e55c30","#e65d2f","#e75e2e","#e8602d","#e9612b","#ea632a","#eb6429","#eb6628","#ec6726","#ed6925","#ee6a24","#ef6c23","#ef6e21","#f06f20","#f1711f","#f1731d","#f2741c","#f3761b","#f37819","#f47918","#f57b17","#f57d15","#f67e14","#f68013","#f78212","#f78410","#f8850f","#f8870e","#f8890c","#f98b0b","#f98c0a","#f98e09","#fa9008","#fa9207","#fa9407","#fb9606","#fb9706","#fb9906","#fb9b06","#fb9d07","#fc9f07","#fca108","#fca309","#fca50a","#fca60c","#fca80d","#fcaa0f","#fcac11","#fcae12","#fcb014","#fcb216","#fcb418","#fbb61a","#fbb81d","#fbba1f","#fbbc21","#fbbe23","#fac026","#fac228","#fac42a","#fac62d","#f9c72f","#f9c932","#f9cb35","#f8cd37","#f8cf3a","#f7d13d","#f7d340","#f6d543","#f6d746","#f5d949","#f5db4c","#f4dd4f","#f4df53","#f4e156","#f3e35a","#f3e55d","#f2e661","#f2e865","#f2ea69","#f1ec6d","#f1ed71","#f1ef75","#f1f179","#f2f27d","#f2f482","#f3f586","#f3f68a","#f4f88e","#f5f992","#f6fa96","#f8fb9a","#f9fc9d","#fafda1","#fcffa4"];

var magma = ["#000004","#010005","#010106","#010108","#020109","#02020b","#02020d","#03030f","#030312","#040414","#050416","#060518","#06051a","#07061c","#08071e","#090720","#0a0822","#0b0924","#0c0926","#0d0a29","#0e0b2b","#100b2d","#110c2f","#120d31","#130d34","#140e36","#150e38","#160f3b","#180f3d","#19103f","#1a1042","#1c1044","#1d1147","#1e1149","#20114b","#21114e","#221150","#241253","#251255","#271258","#29115a","#2a115c","#2c115f","#2d1161","#2f1163","#311165","#331067","#341069","#36106b","#38106c","#390f6e","#3b0f70","#3d0f71","#3f0f72","#400f74","#420f75","#440f76","#451077","#471078","#491078","#4a1079","#4c117a","#4e117b","#4f127b","#51127c","#52137c","#54137d","#56147d","#57157e","#59157e","#5a167e","#5c167f","#5d177f","#5f187f","#601880","#621980","#641a80","#651a80","#671b80","#681c81","#6a1c81","#6b1d81","#6d1d81","#6e1e81","#701f81","#721f81","#732081","#752181","#762181","#782281","#792282","#7b2382","#7c2382","#7e2482","#802582","#812581","#832681","#842681","#862781","#882781","#892881","#8b2981","#8c2981","#8e2a81","#902a81","#912b81","#932b80","#942c80","#962c80","#982d80","#992d80","#9b2e7f","#9c2e7f","#9e2f7f","#a02f7f","#a1307e","#a3307e","#a5317e","#a6317d","#a8327d","#aa337d","#ab337c","#ad347c","#ae347b","#b0357b","#b2357b","#b3367a","#b5367a","#b73779","#b83779","#ba3878","#bc3978","#bd3977","#bf3a77","#c03a76","#c23b75","#c43c75","#c53c74","#c73d73","#c83e73","#ca3e72","#cc3f71","#cd4071","#cf4070","#d0416f","#d2426f","#d3436e","#d5446d","#d6456c","#d8456c","#d9466b","#db476a","#dc4869","#de4968","#df4a68","#e04c67","#e24d66","#e34e65","#e44f64","#e55064","#e75263","#e85362","#e95462","#ea5661","#eb5760","#ec5860","#ed5a5f","#ee5b5e","#ef5d5e","#f05f5e","#f1605d","#f2625d","#f2645c","#f3655c","#f4675c","#f4695c","#f56b5c","#f66c5c","#f66e5c","#f7705c","#f7725c","#f8745c","#f8765c","#f9785d","#f9795d","#f97b5d","#fa7d5e","#fa7f5e","#fa815f","#fb835f","#fb8560","#fb8761","#fc8961","#fc8a62","#fc8c63","#fc8e64","#fc9065","#fd9266","#fd9467","#fd9668","#fd9869","#fd9a6a","#fd9b6b","#fe9d6c","#fe9f6d","#fea16e","#fea36f","#fea571","#fea772","#fea973","#feaa74","#feac76","#feae77","#feb078","#feb27a","#feb47b","#feb67c","#feb77e","#feb97f","#febb81","#febd82","#febf84","#fec185","#fec287","#fec488","#fec68a","#fec88c","#feca8d","#fecc8f","#fecd90","#fecf92","#fed194","#fed395","#fed597","#fed799","#fed89a","#fdda9c","#fddc9e","#fddea0","#fde0a1","#fde2a3","#fde3a5","#fde5a7","#fde7a9","#fde9aa","#fdebac","#fcecae","#fceeb0","#fcf0b2","#fcf2b4","#fcf4b6","#fcf6b8","#fcf7b9","#fcf9bb","#fcfbbd","#fcfdbf"];

var plasma = ["#0d0887","#100788","#130789","#16078a","#19068c","#1b068d","#1d068e","#20068f","#220690","#240691","#260591","#280592","#2a0593","#2c0594","#2e0595","#2f0596","#310597","#330597","#350498","#370499","#38049a","#3a049a","#3c049b","#3e049c","#3f049c","#41049d","#43039e","#44039e","#46039f","#48039f","#4903a0","#4b03a1","#4c02a1","#4e02a2","#5002a2","#5102a3","#5302a3","#5502a4","#5601a4","#5801a4","#5901a5","#5b01a5","#5c01a6","#5e01a6","#6001a6","#6100a7","#6300a7","#6400a7","#6600a7","#6700a8","#6900a8","#6a00a8","#6c00a8","#6e00a8","#6f00a8","#7100a8","#7201a8","#7401a8","#7501a8","#7701a8","#7801a8","#7a02a8","#7b02a8","#7d03a8","#7e03a8","#8004a8","#8104a7","#8305a7","#8405a7","#8606a6","#8707a6","#8808a6","#8a09a5","#8b0aa5","#8d0ba5","#8e0ca4","#8f0da4","#910ea3","#920fa3","#9410a2","#9511a1","#9613a1","#9814a0","#99159f","#9a169f","#9c179e","#9d189d","#9e199d","#a01a9c","#a11b9b","#a21d9a","#a31e9a","#a51f99","#a62098","#a72197","#a82296","#aa2395","#ab2494","#ac2694","#ad2793","#ae2892","#b02991","#b12a90","#b22b8f","#b32c8e","#b42e8d","#b52f8c","#b6308b","#b7318a","#b83289","#ba3388","#bb3488","#bc3587","#bd3786","#be3885","#bf3984","#c03a83","#c13b82","#c23c81","#c33d80","#c43e7f","#c5407e","#c6417d","#c7427c","#c8437b","#c9447a","#ca457a","#cb4679","#cc4778","#cc4977","#cd4a76","#ce4b75","#cf4c74","#d04d73","#d14e72","#d24f71","#d35171","#d45270","#d5536f","#d5546e","#d6556d","#d7566c","#d8576b","#d9586a","#da5a6a","#da5b69","#db5c68","#dc5d67","#dd5e66","#de5f65","#de6164","#df6263","#e06363","#e16462","#e26561","#e26660","#e3685f","#e4695e","#e56a5d","#e56b5d","#e66c5c","#e76e5b","#e76f5a","#e87059","#e97158","#e97257","#ea7457","#eb7556","#eb7655","#ec7754","#ed7953","#ed7a52","#ee7b51","#ef7c51","#ef7e50","#f07f4f","#f0804e","#f1814d","#f1834c","#f2844b","#f3854b","#f3874a","#f48849","#f48948","#f58b47","#f58c46","#f68d45","#f68f44","#f79044","#f79143","#f79342","#f89441","#f89540","#f9973f","#f9983e","#f99a3e","#fa9b3d","#fa9c3c","#fa9e3b","#fb9f3a","#fba139","#fba238","#fca338","#fca537","#fca636","#fca835","#fca934","#fdab33","#fdac33","#fdae32","#fdaf31","#fdb130","#fdb22f","#fdb42f","#fdb52e","#feb72d","#feb82c","#feba2c","#febb2b","#febd2a","#febe2a","#fec029","#fdc229","#fdc328","#fdc527","#fdc627","#fdc827","#fdca26","#fdcb26","#fccd25","#fcce25","#fcd025","#fcd225","#fbd324","#fbd524","#fbd724","#fad824","#fada24","#f9dc24","#f9dd25","#f8df25","#f8e125","#f7e225","#f7e425","#f6e626","#f6e826","#f5e926","#f5eb27","#f4ed27","#f3ee27","#f3f027","#f2f227","#f1f426","#f1f525","#f0f724","#f0f921"];

var viridis = ["#440154","#440256","#450457","#450559","#46075a","#46085c","#460a5d","#460b5e","#470d60","#470e61","#471063","#471164","#471365","#481467","#481668","#481769","#48186a","#481a6c","#481b6d","#481c6e","#481d6f","#481f70","#482071","#482173","#482374","#482475","#482576","#482677","#482878","#482979","#472a7a","#472c7a","#472d7b","#472e7c","#472f7d","#46307e","#46327e","#46337f","#463480","#453581","#453781","#453882","#443983","#443a83","#443b84","#433d84","#433e85","#423f85","#424086","#424186","#414287","#414487","#404588","#404688","#3f4788","#3f4889","#3e4989","#3e4a89","#3e4c8a","#3d4d8a","#3d4e8a","#3c4f8a","#3c508b","#3b518b","#3b528b","#3a538b","#3a548c","#39558c","#39568c","#38588c","#38598c","#375a8c","#375b8d","#365c8d","#365d8d","#355e8d","#355f8d","#34608d","#34618d","#33628d","#33638d","#32648e","#32658e","#31668e","#31678e","#31688e","#30698e","#306a8e","#2f6b8e","#2f6c8e","#2e6d8e","#2e6e8e","#2e6f8e","#2d708e","#2d718e","#2c718e","#2c728e","#2c738e","#2b748e","#2b758e","#2a768e","#2a778e","#2a788e","#29798e","#297a8e","#297b8e","#287c8e","#287d8e","#277e8e","#277f8e","#27808e","#26818e","#26828e","#26828e","#25838e","#25848e","#25858e","#24868e","#24878e","#23888e","#23898e","#238a8d","#228b8d","#228c8d","#228d8d","#218e8d","#218f8d","#21908d","#21918c","#20928c","#20928c","#20938c","#1f948c","#1f958b","#1f968b","#1f978b","#1f988b","#1f998a","#1f9a8a","#1e9b8a","#1e9c89","#1e9d89","#1f9e89","#1f9f88","#1fa088","#1fa188","#1fa187","#1fa287","#20a386","#20a486","#21a585","#21a685","#22a785","#22a884","#23a983","#24aa83","#25ab82","#25ac82","#26ad81","#27ad81","#28ae80","#29af7f","#2ab07f","#2cb17e","#2db27d","#2eb37c","#2fb47c","#31b57b","#32b67a","#34b679","#35b779","#37b878","#38b977","#3aba76","#3bbb75","#3dbc74","#3fbc73","#40bd72","#42be71","#44bf70","#46c06f","#48c16e","#4ac16d","#4cc26c","#4ec36b","#50c46a","#52c569","#54c568","#56c667","#58c765","#5ac864","#5cc863","#5ec962","#60ca60","#63cb5f","#65cb5e","#67cc5c","#69cd5b","#6ccd5a","#6ece58","#70cf57","#73d056","#75d054","#77d153","#7ad151","#7cd250","#7fd34e","#81d34d","#84d44b","#86d549","#89d548","#8bd646","#8ed645","#90d743","#93d741","#95d840","#98d83e","#9bd93c","#9dd93b","#a0da39","#a2da37","#a5db36","#a8db34","#aadc32","#addc30","#b0dd2f","#b2dd2d","#b5de2b","#b8de29","#bade28","#bddf26","#c0df25","#c2df23","#c5e021","#c8e020","#cae11f","#cde11d","#d0e11c","#d2e21b","#d5e21a","#d8e219","#dae319","#dde318","#dfe318","#e2e418","#e5e419","#e7e419","#eae51a","#ece51b","#efe51c","#f1e51d","#f4e61e","#f6e620","#f8e621","#fbe723","#fde725"];

var chosen_color_scale = dark_sky;

var summerTScale = d3.scale.quantize()
 // celsius domain
 // .domain([63,117])
 // for fake data
    .range(chosen_color_scale);

var fullExtent;
var angle_offset = 0;

var updateMap = function(error,results) {
    console.log("update the map!");
    console.log("here is the result from queue for the map update:");
    console.log(results);
    data = results[0].split("\n");
    if (results.length > 1) {
        extradata = results[1].split("\n").map(function(d) { return d.split(" ").map(parseFloat); });
    }
    else {
        extradata = [];
    }
    // console.log("first result split on newlines:");
    // console.log(data);
    data = data.map(function(d) { return d.split(" ").map(parseFloat); });
    // console.log("each of those split on space:");
    // console.log(data);    

    // set the years from the first line of the dynamics file
    allyears = data[0];
    // console.log("this is all the years:");
    // console.log(allyears);

    for (var i=0; i<allyears.length; i++) {
        if ((allyears[i]+"") === yearDecoder().cached) {
            yearIndex = i;
            break;
        }
    }
    
    d3.select("#yeardroplist").selectAll("li").remove();
    d3.select("#yeardroplist")
	.selectAll("li")
	.data(allyears)
	.enter()
        .append("li")
        .append("a")
	.html(function(d) { return d+""+"&ndash;"+(d+parseInt(windowDecoder().cached)); })
        .on("click",function(d,i) {
	    yearIndex = i;
            console.log(yearIndex);
	    // yearEncoder.varval(yearIndex.toFixed(0));
            yearEncoder.varval(allyears[i]+"");
	    changeYear();
            if (yearIndex < allyears.length) {
	        var play_button = d3.select("#playButton")
                play_button.attr("class","btn btn-default");
                // play_button.select("i").attr("class","fa fa-play");
            }            
	})

    // console.log("variableIndex="+variableIndex);

    // set the domain for the scale based on this year's min/max
    // var localExtent;
    // localExtent = [d3.min(data.map(function(d) { return d3.min(d); } )),d3.max(data.map(function(d) { return d3.max(d); } ))];
    // // localExtent = d3.extent([].concat.apply([], data.slice(1,1300)))
    // fullExtent = localExtent;
    if (variableIndex === 1) {
        angle_offset = -180;
    }
    else {
        angle_offset = 0;
    }
    
    summerTScale.domain(variableRanges[variableIndex]);
    
    changeYear();

    // console.log("variableIndex="+variableIndex);    
    // draw a scale on the map
    // only need the circular scale for days of the year
    var pagewidth = parseInt(d3.select("#mapsvg").style("width"));
    if (pagewidth > 600) {
        if (variableIndex < 2) {
            drawScale(variableRanges[variableIndex],"polar");
        }
        else {
            drawScale(variableRanges[variableIndex],"linear");
        }
    }
}

var playTimer;
var playing = false;

d3.select("#playButton").on("click",function(d,i) {
    if (playing) {
	playing = false;
	d3.select(this).select("i").attr("class","fa fa-play");
	clearInterval(playTimer);
    }
    else {
	d3.select(this).select("i").attr("class","fa fa-pause");
	playing = true;
	playTimer = setInterval(play,200);
    }
});

var play = function() {
    yearIndex++;
    changeYear();
}

var changeYear = function() {
    var loop = true;
    var update_time = 1000;
    if (yearIndex > allyears.length-1) {
        if (loop) {
            yearIndex = 0;
            updatetime = 3000;
        }
        else{
	    clearInterval(playTimer);
	    var play_button = d3.select("#playButton")
            play_button.attr("class","btn btn-default disabled");
            play_button.select("i").attr("class","fa fa-play");
	    playing = false;
	    yearIndex--;
	    return 0;
        }
    }

    
    // console.log("changing year index to");
    // console.log(yearIndex);
    // console.log(allyears[yearIndex]);
    $("#yeardropvis").html(allyears[yearIndex]+""+"&ndash;"+(allyears[yearIndex]+parseInt(windowDecoder().cached))+" <span class=\"caret\"></span>");
    yearEncoder.varval(allyears[yearIndex]+"");
    

    console.log("calling updatewindow() to update the top timeline");
    updatewindow(update_time);

    cities.attr("fill",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return summerTScale(data[i+1][yearIndex]+angle_offset);
        }
        else {
            return summerTScale(75);
        }})
        .attr("value",function(d,i) {
            return data[i+1][yearIndex];
        });

    if (extradata.length > 0) {
        cities.attr("r",function(d,i) {
            if (extradata[i+1][yearIndex] > -9998) {
                return Math.sqrt(extradata[i+1][yearIndex]);
            }
            else {
                return rmin;
            }})
            .attr("extravalue",function(d,i) {
                return extradata[i+1][yearIndex];
            });
    }
    else {
        cities.attr("r",function(d,i) {
                return rmin;
        });
    }

    cities.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });

    cityarrows.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });
    
    if (variableIndex < 2) {
	cityarrows.attr({
	    "x2": function(d,i) { return arrowradius*Math.cos((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "y2": function(d,i) { return arrowradius*Math.sin((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "stroke-width": "1.5",
	    "stroke": function(d,i) { return summerTScale(data[i+1][yearIndex]+angle_offset); },
	});
    }
    else {
	cityarrows.style("visibility","hidden");        
	// cityarrows.attr({
	//     "x2": 0,
	//     "y2": 0,	    
	// });
    }
}

var drawScale = function(extent,type) {
    console.log("adding scale to the map of type:");
    console.log(type);
    // console.log(extent);
    var legendwidth = 200;
    var legendheight = 20;
    var legendradius = 50;
    // var legendwidth = 50;
    var textsize = 10;
    var legendarray = Array(chosen_color_scale.length);
    // var legendstringslen = [legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,];
    // var initialpadding = 0;
    // var boxpadding = 0.25;
    d3.selectAll(".legendgroup").remove();
    if (type === "linear") {
	var legendgroup = canvas.append("g")
	    .attr({"class": "legendgroup",
		   "transform": "translate("+(w-50-legendwidth)+","+(h-2*legendheight-2)+")",});

	legendgroup.selectAll("rect.legendrect")
    	    .data(legendarray)
    	    .enter()
    	    .append("rect")
    	    .attr({"class": function(d,i) { return "q"+i+"-8"; },
    		   "x": function(d,i) { return i*legendwidth/chosen_color_scale.length; },
    		   "y": 0,
		   // "rx": 3,
		   // "ry": 3,
    		   "width": function(d,i) { return legendwidth/chosen_color_scale.length; },
    		   "height": legendheight,
		   "fill": function(d,i) { return chosen_color_scale[i]; },
		   // "stroke-width": "1",
		   // "stroke": "rgb(0,0,0)"
		  });

	legendgroup.selectAll("text.legendtext")
	    .data(extent.map(function(d) { return d.toFixed(2); }))
	    .enter()
	    .append("text")
	    .attr({"x": function(d,i) {
		if (i==0) { return 0; }
		else { return legendwidth-d.width(textsize+"px arial"); } },
    		   "y": legendheight+legendheight, 
    		   "class": function(d,i) { return "legendtext"; },
		   "font-size": textsize+"px",
		  })
    	    .text(function(d,i) { return d; });
    }
    else {
	var legendgroup = canvas.append("g")
	    .attr({"class": "legendgroup",
		   "transform": "translate("+(w-20-legendradius)+","+(h-legendradius-30)+")",});

	var arc = d3.svg.arc()
	    .outerRadius(legendradius-5)
	    .innerRadius(0);

	var pie = d3.layout.pie()
	    .sort(null)
	    .startAngle((extent[0]-1)/365*2*Math.PI)
	    .endAngle((extent[1]-1)/365*2*Math.PI)
	    .value(function(d) { return d; });

        var ones = Array(chosen_color_scale.length);
        for (var i=0; i<ones.length; i++) { ones[i] = 1; }
	legendgroup.selectAll(".arc")
	    .data(pie(ones))
	    .enter()
	    .append("path")
	    .attr({"d": arc,
		   "fill": function(d,i) { return chosen_color_scale[i]; },
		  });

        // now go and convert all of the dates to an angle
        var radial_scale = d3.scale.linear()
            .domain([1,365/4+1])
            .range([Math.PI/2,0]);

        var rotation_scale = d3.scale.linear()
            .domain([1,365/4+1])
            .range([90,180]);

        var num_labels = 11;

        // let's linspace out the ticks
        var increments = Array(num_labels);
        var increments_moved = Array(increments.length);        
        var spacing = (extent[1]-extent[0])/(increments.length-1);
        for (var i=0; i<increments.length; i++) {
            increments[i] = extent[0]+i*spacing;
            increments_moved[i] = extent[0]+i*spacing-spacing/4;
        }
        console.log("increments:");
        console.log(increments);
        
        legendgroup.selectAll(".label")
	    .data(increments_moved)
	    .enter()
	    .append("text")
	    .attr({ // "text-align": "right",
                   "x": function(d,i) { return (legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y": function(d,i) { return -(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)); },
                // "transform": function(d,i) { return "rotate("+(((rotation_scale(((d + 365/4) % 365) - 365/4) + 90) % 180) -90)+" "+((legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ))+","+(-(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)))+")"; },
                "transform": function(d,i) { return "rotate("+(rotation_scale(((d + 365/4) % 365) - 365/4))+" "+((legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ))+","+(-(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)))+")"; },
		  })
            .style({"font-size": "8px"})
            .text(function(d,i) { 
                var date = new Date(1900,0,1);
                date.setTime( date.getTime() + increments[i] * 86400000 );
                if ( date.getDate() < 10 ) {
                    return month_names[date.getMonth()].slice(0,3)+" 0"+date.getDate();
                }
                else {
                    return month_names[date.getMonth()].slice(0,3)+" "+date.getDate();
                }
            });
        
        legendgroup.selectAll(".tick")
	    .data(increments)
	    .enter()
	    .append("line")
	    .attr({
                   "x1": function(d,i) { return (legendradius-5)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y1": function(d,i) { return -(legendradius-5)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "x2": function(d,i) { return (legendradius)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y2": function(d,i) { return -(legendradius)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4) ); },
		  })
                .style({
            "stroke": "black",
            "stroke-width": 1,            
        });
    }
}

var w;
var h;
var canvas;

var plot_timeline = function() {

    var figure = d3.select("#timeline");
    
    var margin = {top: 0, right: 10, bottom: 0, left: 10};

    // full width and height
    var figwidth  = parseInt(figure.style("width"));
    var figheight = 20;
    var width = figwidth - margin.left - margin.right;
    var height = figheight - margin.top - margin.bottom;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    var canvas = figure
	.append("svg")
	.attr("class", "canvas")
	.attr("id", "timelinesvg")
	.attr("width", figwidth)
	.attr("height", figheight);

    var x = d3.scale.linear()
	.domain([full_year_range[0],full_year_range[full_year_range.length-1]])
	.range([10,width-10]);

    var y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	.domain([0,1])
	.range([0,height]);

    var centerline = canvas.append("line")
        .attr({
            "x1": x(1900),
            "y1": y(0.25),
            "x2": x(2013),
            "y2": y(0.25),
        })
        .style({
            "stroke": "black",
            "stroke-width": 2,            
        });

    var ticks = canvas.selectAll("line.yeartick")
        .data([1900,1905,1910,1915,1920,1925,1930,1935,1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010,2013])
        .enter()
        .append("line")
        .attr({
            "x1": function(d,i) { return x(d); },
            "y1": y(0.0),
            "x2": function(d,i) { return x(d); },
            "y2": y(0.5),
        })
        .style({
            "stroke": "black",
            "stroke-width": 1,            
        });

    var ticklabels = canvas.selectAll("line.yearticklabel")
        .data([1900,1905,1910,1915,1920,1925,1930,1935,1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010,2013])
        .enter()
        .append("text")
        .attr({
            "x": function(d,i) { return x(d-1.3); },
            "y": height-2,
        })
        .style({
            // "stroke": "black",
            "text-align": "center",
            "font-size": 9,
        })
        .text(function(d) { return d; });
    

    var curr_window = canvas.append("rect")
        .attr({
            "x": x(full_year_range[yearIndex]),
            "y": y(0.0),
            "width": x(parseFloat(currentWindow)+full_year_range[0])-x(full_year_range[0]),
            "height": y(0.5),
            "class": "currentwindow",
        })
        .style({
            "border": "blue",
            "fill": "blue",
            "opacity": 0.5,
        });

    updatewindow = function(t) {
        console.log("updating the top window slider");
        console.log(yearIndex);
        // curr_window.transition().duration(t).attr("x",x(full_year_range[yearIndex]));
        curr_window.transition().attr("x",x(full_year_range[yearIndex]))
            .attr("width",x(parseFloat(currentWindow)+full_year_range[0])-x(full_year_range[0]));
    }
    
    // currentWindow
    // yearIndex
}

var dataloaded = function(error,results) { 
    // console.log("map data loaded, these are the results (should just be the geojson in a list of length 1):");
    // console.log(results);
    console.log("map data loaded, drawing map");
    geoJson = results[0];
    stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;

    // go ahead and draw the map right here.
    // worry about separating logic later

    var fisheye = d3.fisheye.circular()
        .radius(4)
        .distortion(3);
    
    var figure = d3.select("#map");
    
    //Width and height
    w = parseInt(figure.style("width"));
    h = w*580/900;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    canvas = figure
	.append("svg")
	.attr("class", "map canvas")
	.attr("id", "mapsvg")
	.attr("width", w)
	.attr("height", h);
    
    projection = d3.geo.albersUsa()
	.translate([w/2, h/2-10])
	.scale(w*1.2); // 1.37 is max size

    var path = d3.geo.path()
	.projection(projection);

    states = canvas.selectAll("path")
	.data(stateFeatures);
    
    states.enter()
	.append("path")
	.attr("d", function(d,i) { return path(d.geometry); } )
	.attr("id", function(d,i) { return d.properties.name; } )
	.attr("class",function(d,i) { return "state"; } );

    // states.exit().remove();

    // states
    // 	.attr("stroke","black")
    // 	.attr("stroke-width",".7");



    var popuptimer;

    var hovergroup = figure.append("div").attr({
	"class": "hoverinfogroup",
	// "transform": "translate("+(x+hoverboxxoffset+axeslabelmargin.left)+","+(d3.min([d3.max([0,y-hoverboxheight/2-hoverboxyoffset]),height-hoverboxheight]))+")", 
    })
	.style({
	    "position": "absolute",
	    "top": "100px",
	    "left": "100px",
	    "visibility": "hidden",
	});

    function hidehover() {
	// console.log("hiding hover");
        canvas.selectAll("circle").transition().duration(500).style("opacity","1.0");
	// canvas.selectAll("circle").attr("r",rmin);
        canvas.selectAll("line").transition().duration(500).style("opacity","1.0");        
	hovergroup.style({
	    "visibility": "hidden",
	});
    }

    var city_hover = function(d,i) {
	// console.log(this);
	// d3.select(this).select("circle").attr("r",rmax);
        

	// canvas.selectAll("circle").transition().duration(500).style("opacity","0.1");
	// canvas.selectAll("line").transition().duration(500).style("opacity","0.1");

        // d3.select(this).select("circle").interrupt(); //.style("opacity","1.0");
	// d3.select(this).select("line").interrupt(); //.style("opacity","1.0");
        
	// var hoverboxheight = 90;
	// var hoverboxwidth = 200;
	var hoverboxyoffset = 5;
	var hoverboxxoffset = -20;

        // thiscircle = d3.select(this);

	// var x = d3.mouse(this)[0];
	// var y = d3.mouse(this)[1];
        // console.log(d3.mouse(this));
        // console.log(x);
        // console.log(y);

        var x = d3.select(this).attr("my_x");
        var y = d3.select(this).attr("my_y");
        // console.log(x);
        // console.log(y);        

        // var hoverboxheightguess = 190;
	// if ((y+hoverboxheightguess)>h) { y-=(y+hoverboxheightguess-h); }
	
	// tip.show;
	// console.log(d);

	hovergroup.style({
	    "position": "absolute",
	    "top": (parseFloat(y)+hoverboxyoffset)+"px",
	    "left": (parseFloat(x)+hoverboxxoffset)+"px",
	    "visibility": "visible",
	});
        
	hovergroup.selectAll("p,h3,button,br").remove();

        var city_name_split = d[3].split(",");
        var proper_city_name = city_name_split[0].split(" ");
        for (var i=0; i<proper_city_name.length; i++) {
            proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
        }
        var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",");

	hovergroup.append("h3")
	    .attr("class","cityname")
	    .text(city_name);

        hovergroup.append("p")
            .html(variableHover[variableIndex]+" from "+allyears[yearIndex]+"&ndash;"+(parseFloat(windows[windowIndex])+allyears[yearIndex])+": ");

        if (variableIndex < 2) {
            // go convert the day to an actual date
            var teletherm_day = (data[parseFloat(d[0])][yearIndex]+angle_offset);
            var date = new Date(1900,0,1);
            date.setTime( date.getTime() + teletherm_day * 86400000 );
            
            var teletherm_extent = extradata[parseFloat(d[0])][yearIndex];
            if (teletherm_extent === -9999) {
                teletherm_extent = "unknown";
            }
	    hovergroup.append("p")
                .text(month_names[date.getMonth()]+" "+date.getDate()+", with "+teletherm_extent+" day extent.");

        }
        else {
            hovergroup.append("p")
                .html(data[parseFloat(d[0])][yearIndex].toFixed(2)+" degrees F.");
        }

        hovergroup.append("p")
            .html("Click the city for more info.");

        // clearTimeout(popuptimer);
	// popuptimer = setTimeout(hidehover,10000);
        
    };
    
    var city_unhover = function(d,i) {
        // console.log(this);
        // d3.select(this).attr("r",rmin);
        hidehover();
    };
    
    var city_clicked = function(d,i) {
        city_clicked_initial_load(d);
    };

    citygroups = canvas.selectAll("circle.city")
	.data(locations)
	.enter()
	.append("g")
        .attr("class","citygroup")
	.attr("transform",function(d) { return "translate("+projection([d[2],d[1]])[0]+","+projection([d[2],d[1]])[1]+")"; })
	.attr("my_x",function(d) { return projection([d[2],d[1]])[0]; })
	.attr("my_y",function(d) { return projection([d[2],d[1]])[1]; })
        .on("mouseover",city_hover)
        .on("mouseout",city_unhover);    

    cities = citygroups
    	.append("circle")
        .attr({
	    "class": "city",
	    "cx": 0,
	    "cy": 0,
	    // "r": rmin,
	})
        .on("mousedown",city_clicked);

    cityarrows = citygroups.append("line")
        .attr({
	    "x1": 0,
	    "y1": 0,
	    "x2": 0,
	    "y2": 0,
    	});

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    console.log("plotting timeline");
    plot_timeline(); 
    console.log("queueing up the data for the circles on the map");

    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }    

    console.log("drawing the city data");
    
    if (currentCityIndex > 0) {
        city_clicked_initial_load(locations[currentCityIndex]);
    }

    canvas.on("mousemove", function() {
        // console.log("mouse:");
        // console.log(d3.mouse(this));
        var here = d3.mouse(this);
        // console.log(here); // [1030, 125]
        // fisheye.focus([here[0]-w/2,here[1]-h/2]);
        // console.log(projection.invert(here)); // [-72.4713375653601, 45.14035261565636]
        // console.log(projection.invert([here[1],here[0]])); // [-112.1040289366678, 12.156636670355539]
        var inverted = projection.invert([here[0],here[1]]); // [-72.4713375653601, 45.14035261565636]
        // console.log(inverted); // [-72.4713375653601, 45.14035261565636]
        // burlington is lat 44, lon -73
        fisheye.focus(inverted);

        // of course, the path function takes [longitude, latitude], so -72, 44 for burlington
        // https://github.com/mbostock/d3/wiki/Geo-Paths
        // (so that's what it gives back)

        // states.attr("d", function(d) { return path(d.geometry); });
        // canvas.selectAll("path").data(stateFeatures)
        // states = canvas.selectAll("path").data(stateFeatures).attr("d", function(d) {
        states.attr("d",null)
            .attr("d", function(d) {
                // console.log("original:");
                // console.log(d.geometry);

                if (d.geometry.type === "Polygon") {
                    var b = d.geometry.coordinates.map(function(d) { return d.map(function(f) { return fisheye(f);}); });
                }
                else {
                    var b = d.geometry.coordinates.map(function(d) { return d.map(function(f) { return f.map(function(g) { return fisheye(g); }); }); });
                }
                // console.log(b);
                var c = {type: d.geometry.type, coordinates: b};
                
                // console.log("new:");
                // console.log(c);

                return path(c);
        });

        // states.exit();

        citygroups.attr("transform",function(d) { return "translate("+projection(fisheye([d[2],d[1]])).join(",")+")"; });
    });
}

// // can just use the d3.csv,json
// function request(url, callback) {
//   var req = new XMLHttpRequest;
//   req.open("GET", url, true);
//   req.setRequestHeader("Accept", "application/json");
//   req.onreadystatechange = function() {
//     if (req.readyState === 4) {
//       if (req.status < 300) callback(null, JSON.parse(req.responseText));
//       else callback(req.status);
//     }
//   };
//   req.send(null);
// }

window.onload = function() {

    console.log("page loaded");
    // start using queue for the loads here
    
    
    // d3.json("http://hedonometer.org/data/geodata/us-states.topojson", function(data) {
    // 	geoJson = data;
    // 	stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;
    // 	// if (!--csvLoadsRemaining) initializePlotPlot(lens,words);
    // }); // d3.json
    
    queue()
    // .defer(request,"http://hedonometer.org/data/geodata/us-states.topojson")
        // switch to this for local devel
	.defer(d3.json,"/data/teledata/us-states.topojson")
	.awaitAll(dataloaded);

} // window.onload



