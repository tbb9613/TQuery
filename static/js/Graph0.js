//axios.<method> will now provide autocomplete and parameter typings

// define data
var nodeList //top node list
var nodeMap //nodemap data
var subNodeMap

var nodeMap_c
var subNodeMap_c

var probHeatmap //heatmap data
var queryNode
var timeTrans // time selector data 
var timeSelection // time selector
var timeSec // var for time axis

var isMultiMode = false // initialize tool area boolean
var isSelectMode = false;
var drawDirectedLineMode = false;
var drawUnDirectedLineMode = false;
//define list to store node pairs
var packList = new Array(); // [pack id, [[node id, node class], [node id, node class], ...]]
var packLinkList = new Array();

var linkmapList = new Array(); // linkmaplist
var packLinks = new Array();
var packNodes = new Array();
// var udList = new Array();// undirected pair list
var packCount = 1;

var mainContainer = document.getElementById("mainContainer");
var width = mainContainer.clientWidth;
var height = mainContainer.clientHeight;
// console.log(width, height);
var topSpaceHeight = 0.25 * height;
var topSpaceWidth = 0.7 * width;
var workSpaceHeight = 0.75 * height;
var workSpaceWidth = width;
var staSpaceWidth = 0.3 * width

var graphExist = false;
var secondGraphExist = false;
var conditionCount = 0;

var MCCDict
// console.log(MCCDict)

window.onresize = function () {
    getSize()
}

function getSize() {
    width = mainContainer.clientWidth;
    height = mainContainer.clientHeight;
    topSpaceHeight = 0.3 * height;
    topSpaceWidth = 0.7 * width;
    workSpaceHeight = 0.7 * height;
    workSpaceWidth = width;
    staSpaceWidth = 0.3 * width
}

var globalDragLayer = d3.select("#globalDrag")
    .attr("x", 0).attr("y", 0)
    .style("position", "absolute")
    .style("z-index", "10")
    .attr("height", 0).attr("width", 0);

var brushLayer = d3.select("#brushLayer")
    .attr("x", 0).attr("y", 0)
    .style("position", "absolute")
    .attr("height", 0).attr("width", 0);

var drawLayer = d3.select("#drawLayer")
    .attr("x", 0).attr("y", 0)
    .style("position", "absolute")
    .attr("height", 0).attr("width", 0);

var scatterFilter = d3.select("#scatterFilter")
    .append("svg");

//append arrow
drawLayer.append("svg:defs").append("svg:marker")
    .attr("id", "triangleArrow")
    .attr("refX", 6)
    .attr("refY", 6)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "black");

var topContainer = d3.select("#topContainer")
var workContainer = d3.select("#workContainer")

var topSpace = topContainer.append("svg")
    .attr("id", "top")
    .attr("width", "100%")
    .attr("height", "100%");

//Draw topspace bg
topSpace.append("g")
    .attr("id", "topSpace")
    .append("rect")
    .attr("fill", "#F9F9F9")
    // .attr("opacity", .1)
    .attr("width", "100%")
    .attr("height", "100%");

var workSpace = workContainer.append("svg")
    .attr("id", "work")
    .attr("width", "100%")
    .attr("height", "100%");

//Preview def
workSpace.append("svg:defs").append("svg:marker") 
    .attr("id", "triangleArrow-p")
    .attr("refX", 6)
    .attr("refY", 6)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "white");

//horizontal def
workSpace.append("svg:defs").append("svg:marker") 
    .attr("id", "triangleArrow-hor")
    .attr("refX", 3)
    .attr("refY", 3)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 6 3 0 6 1.5 3")
    .style("fill", "black");

//sfilter def
scatterFilter.append("svg:defs").append("svg:marker") 
    .attr("id", "triangleArrow-sfilter")
    .attr("refX", 3)
    .attr("refY", 3)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 6 3 0 6 1.5 3")
    .style("fill", "black");

var nodeMenu = d3.select(".node-menu");
//make the workspace under topspace

var collapseButton = new mdui.Collapse('#showFullNodeList'); //config mdui

//Add workspace text(interpretation of node map)
var titletext = d3.select("#queryTitleContainer").select(".query-title").selectAll("span");

var mapContainer = d3.select("#mapContainer")

//Draw map
var map = L.map("mapContainer").setView([51.505, -0.09], 13);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    // id: "mapbox/satellite-v9",
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidGJiOTYxMyIsImEiOiJjazk3ODBldjkwbWNwM29wY2dwc3Y5MzBpIn0.gQo8BJUk8CfAIsNFJNmy7A'
}).addTo(map);
//get displaying area box
map.on('moveend', function () {
    let northEast = [map.getBounds()._northEast.lat, map.getBounds()._northEast.lng];
    let southWest = [map.getBounds()._southWest.lat, map.getBounds()._southWest.lng];
    // console.log(northEast, southWest);
});

var staContainer = d3.select("#staContainer");

var fullList = d3.select("#nodeListContainter");

// var initialNodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];

//define brush
var brush = d3.brush()
    .extent([
        [0, 0],
        [workSpaceWidth, workSpaceHeight]
    ])

// drawTopNodes(initialNodeList);
getHeatmap();
drawHeatmap();

//draw full node name tooltip 
var tooltipFullNodeName = d3.select("#mainContainer").append("div")
        // .attr("x", 0).attr("y", 0)
        .attr("class", "tooltip-full-node-name hide");
function showFullName(d){
    let pgX = event.pageX, pgY = event.pageY;
    tooltipFullNodeName.style("left", `${pgX+5}px`)
        .style("top", `${pgY+5}px`)
        .html(d+ " (" + MCCDict.filter(m => m.edited_description === d)[0].mcc + ")")
        .classed("hide", false)
}

function moveFullName(){
    let pgX = event.pageX, pgY = event.pageY;
    tooltipFullNodeName.style("left", `${pgX+5}px`)
        .style("top", `${pgY+5}px`);
}

function hideFullName(d){
    tooltipFullNodeName.classed("hide", true);
}
//add other tooltips
var shiftTooltip = workContainer.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)

var inNodeTooltip = workContainer.append("div")
    .attr("class", "tooltip innode-tooltip")
    .style("opacity", 0)

//TIME SELECTOR
function getTimeData(timeScale) {
    axios.post("http://127.0.0.1:5000/timetrans", {
            scale: timeScale
        })
        .then(function (response) {

            timeTrans = response.data;
            let time2 = response.data;
            // console.log(response.data);
            let parse;
            let parse_s = d3.timeParse("%Y-%m-%d %H:%M:%S")
            let parse_d = d3.timeParse("%Y-%m-%d")
            // console.log(timeScale, timeScale == "total" || timeScale == "year");
            // console.log(timeTrans);
            if (timeScale == "total" || timeScale == "year") {
                timeTrans.forEach(function (d, i) {

                    d.date = parse_d(d.date)
                })
            } else {
                timeTrans.forEach(function (d, i) {
                    d.date = parse_s(d.date)
                })
            }

            drawTimeSelector(timeTrans, timeScale,
                document.getElementById("dataType").options[document.getElementById("dataType").options.selectedIndex].value);
            
            switch (timeScale) {
                case "total":
                    laydate.render({
                        elem: "#calendar",
                        lang: "en",
                        theme: "#393261",
                        type: 'datetime',
                        range: true
                    });
                    timeFormat = "%Y-%m-%d";
                    break;
                case "year":
                    laydate.render({
                        elem: "#calendar",
                        lang: "en",
                        theme: "#393261",
                        type: 'year'
                    });
                    timeFormat = "%Y-%m-%d";
                    break;
                case "month":
                    laydate.render({
                        elem: "#calendar",
                        lang: "en",
                        theme: "#393261",
                        type: 'month'
                    });
                    timeFormat = "%Y-%m-%d";
                    break;
                case "week":
                    laydate.render({
                        elem: "#calendar",
                        lang: "en",
                        theme: "#393261",
                    });
                    timeFormat = "%c";
                    break;
                case "day":
                    laydate.render({
                        elem: "#calendar",
                        lang: "en",
                        theme: "#393261",
                    });
                    timeFormat = "%c";
                    break;
            };
        }).catch(function (error) {
            // handle error
            console.log(error);
        })
}

document.getElementById("timePeriod").onchange = function () {
    topSpace.selectAll("#timeSelector").remove();

    getTimeData(this.options[this.options.selectedIndex].value);
    console.log(secondGraphExist)
    if (secondGraphExist) {
        d3.selectAll(".brush-child").classed("hide", false);
    }
}

getTimeData("total");


var timeFormat = "%Y-%m-%d";
document.getElementById("dataType").onchange = function (e) {
    topSpace.selectAll("#timeSelector").remove();
    let timeScale = document.getElementById("timePeriod").options[document.getElementById("timePeriod").options.selectedIndex].value;

    drawTimeSelector(timeTrans,
        timeScale,
        this.options[this.options.selectedIndex].value);

    switch (timeScale) {
        case "total":
            laydate.render({
                elem: "#calendar",
                lang: "en",
                theme: "#393261",
                type: 'datetime',
                range: true
            });
            timeFormat = "%Y-%m-%d";
            break;
        case "year":
            laydate.render({
                elem: "#calendar",
                lang: "en",
                theme: "#393261",
                type: 'year'
            });
            timeFormat = "%Y-%m-%d";
            break;
        case "month":
            laydate.render({
                elem: "#calendar",
                lang: "en",
                theme: "#393261",
                type: 'month'
            });
            timeFormat = "%Y-%m-%d";
            break;
        case "week":
            laydate.render({
                elem: "#calendar",
                lang: "en",
                theme: "#393261",
            });
            timeFormat = "%c";
            break;
        case "day":
            laydate.render({
                elem: "#calendar",
                lang: "en",
                theme: "#393261",
            });
            timeFormat = "%c";
            break;
    };

    if (secondGraphExist) {
        d3.selectAll(".brush-child").classed("hide", false);
    }
}
function getMCCDict(){
    axios.get('http://127.0.0.1:5000/MCCdict')
    .catch(function (error) {
        console.log(error);
    })
    .then(function (response) { // if success then update data
        MCCDict = response.data;
        console.log(MCCDict);
        getNodeList("MCC");
    });
}
getMCCDict();

function getNodeList(name) {
    axios.post('http://127.0.0.1:5000/nodelist', {
            name: name
        })
        .then(function (response) { // if success then update data
            nodeList = response.data;
            drawTopNodes(nodeList);
            
        })
    // return nodeList;
}

function drawTimeSelector(data, timeScale, type) {
    // getTimeData();
    let selectorWidth = 0.86 * topSpaceWidth;
    let selectorHeight = 0.25 * topSpaceHeight;

    let selectorMargin = ({
        top: topSpaceHeight * 0.15,
        right: 20,
        bottom: 30,
        left: topSpaceHeight * 0.1
    })
    
    // let data = timeTrans;
    let dtype
    switch (type) {
        case "TTV":
            dtype = "total_transaction";
            break;
        case "ATV":
            dtype = "avg_transaction";
            break;
    }
    d3.selectAll("#calendar").remove();
    d3.selectAll(".layui-laydate").remove();

    let selectorDiv = d3.select("#timeSelectorDropdown");
    selectorDiv.append("input").attr("id", "calendar")
        .attr("type", "text")
        .classed("mdui-textfield-input", true)
        .attr("placeholder", "Select Date")
        .raise();


    var areachart = topSpace.append("g")
        .attr("id", "timeSelector")
        .attr("transform", `translate(${selectorMargin.left}, ${selectorMargin.top})`)

    // console.log(data);

    let x = d3.scaleUtc()
        .domain(d3.extent(data, d => d.date))
        .range([0, selectorWidth])

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[dtype])]).nice()
        .range([selectorHeight - selectorMargin.bottom, 0])

    let xAxis = areachart.append("g")
        .attr("transform", `translate(0, ${selectorHeight-selectorMargin.bottom})`)
        .attr("class", "timeselector-axis")

    if (timeScale === "year" || timeScale === "total") {
        xAxis.call(d3.axisBottom(x).ticks(selectorWidth / 50).tickSize(3).tickSizeOuter(0)
            .tickFormat(date => (d3.timeYear(date) < date) ?
                d3.timeFormat('%b')(date) :
                d3.timeFormat('%Y')(date))
        )
    } else {
        xAxis.call(d3.axisBottom(x).ticks(selectorWidth / 50).tickSize(3).tickSizeOuter(0))
    }

    let yAxis = areachart.append("g")
        .attr("class", "timeselector-axis")
        .attr("transform", `translate(${selectorWidth},0)`)
        .call(d3.axisRight(y).ticks(selectorHeight / 30).tickSize(0)
            .tickFormat(d3.format("~s")))

    areachart
        .append("g")
        .attr("class", "areapath")
        .datum(data)
        .append("path")
        .attr("fill", "#85869E")
        .attr("opacity", .5)
        .attr("d", d3.area()
            .curve(d3.curveBasis)
            .x(d => x(d.date))
            .y0(y(0))
            .y1(d => y(d[dtype]))
        )

    //Brush
    function callFirstBrush() {

        var isBrushInitialized

        const brushParent = d3.brushX()
            .extent([
                [0, 0],
                [selectorWidth, selectorHeight - selectorMargin.bottom]
            ])
            .on("start brush", brushmoved)
            .on("end", brushend);

        let gBrushFirst = areachart.append("g")
            .attr("class", "brush-parent")

        // style brush resize handle

        let brushResizePath = function (d) {
            let e = +(d.type == "e"),
                x = e ? 1 : -1,
                y = (selectorHeight - selectorMargin.bottom) / 2;
            return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
        }

        var handle = gBrushFirst.selectAll(".handle-custom")
            .data([{
                type: "w"
            }, {
                type: "e"
            }])
            .enter().append("path")
            .attr("class", "handle-custom")
            // .attr("stroke", "#999")
            .attr("fill", "#393261")
            .attr("cursor", "ew-resize")
            .attr("d", brushResizePath)


        gBrushFirst.call(brushParent)
            .call(brushParent.move, [200, 300]);
        
        // console.log(handle);

        let lefttooltip = topContainer
            .append("div")
            .classed("tooltip-handle hide", true)
            // .style("opacity", 0)

        let righttooltip = topContainer
            .append("div")
            .classed("tooltip-handle hide", true)
            // .style("opacity", 0)

        gBrushFirst.selectAll(".handle--w")
            .on("mouseover", leftHandleOver)
            .on("mouseout", handleMouseLeave);

        gBrushFirst.selectAll(".handle--e")
            .on("mouseover", rightHandleOver)
            .on("mouseout", handleMouseLeave);

        gBrushFirst.selectAll(".selection")
            .attr("fill", "white")
            .attr("stroke", "#393261")

        areachart.select(".overlay").remove()

        function brushmoved() {
            timeSelection = d3.event.selection;
            // const [x0, x1] = s.map(x.invert);
            if (timeSelection == null) {
                handle.attr("display", "none");
            } else {
                // lefttooltip.style("opacity", 1)
                handle.attr("display", null).attr("transform", (d, i) => "translate(" + [timeSelection[i], -(selectorHeight - 30) / 4] + ")");
            }
        };

        function brushend() {
            timeSelection = d3.event.selection;
            timeSec = (x.invert(timeSelection[1]) - x.invert(timeSelection[0]))/ 1000
            if (graphExist === true && secondGraphExist === false) {
                // workSpace.selectAll("#graph-first").remove();
                workContainer.selectAll(".tooltip").remove();
                graphLeftPlusExist = false;
                graphRightPlusExist = false;

                const [x0, x1] = timeSelection;
                console.log(x0, x1);
                var randomConverter = d3.scaleLinear()
                    .range([1, 10])
                    .domain([0, selectorWidth])

                createQuery(queryNode, Math.floor(randomConverter(x1)), "single", nodeList);
                console.log(randomConverter(x1));
            }
        }

        function leftHandleOver() {
            let format = d3.timeFormat(timeFormat)
            lefttooltip.classed("hide", false)
                .html("Start: " + format(x.invert(timeSelection[0])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
            // let selection = d3.brushSelection();
            // console.log("start",x.invert(timeSelection[0]));
        };

        function rightHandleOver() {
            // let selection = d3.brushSelection();
            let format = d3.timeFormat(timeFormat)
            righttooltip.classed("hide", false)
                .html("End: " + format(x.invert(timeSelection[1])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
        };

        function handleMouseLeave(){
            lefttooltip.classed("hide", true);
            righttooltip.classed("hide", true);
        }


    }

    function callSecondBrush() {
        // let selectorWidth = 0.7 * workSpaceWidth;
        // let selectorHeight = 0.2 * topSpaceHeight;
        // let areachart = d3.select("#timeSelector")

        const brushChild = d3.brushX()
            .extent([
                [0, 0],
                [selectorWidth, selectorHeight - 30]
            ])
            .on("start brush end", brushmoved);

        let gBrushSecond = areachart.append("g")
            .attr("class", "brush-child")

        // style brush resize handle

        let brushResizePath = function (d) {
            let e = +(d.type == "e"),
                x = e ? 1 : -1,
                y = (selectorHeight - 30) / 2;
            return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
        }

        var handle = gBrushSecond.selectAll(".handle-custom")
            .data([{
                type: "w"
            }, {
                type: "e"
            }])
            .enter().append("path")
            .attr("class", "handle-custom")
            // .attr("stroke", "#999")
            .attr("fill", "#C56C00")
            .attr("cursor", "ew-resize")
            .attr("d", brushResizePath)

        gBrushSecond.call(brushChild)
            .call(brushChild.move, [400, 500]);
        // console.log(handle);

        let lefttooltip = topContainer
            .append("div")
            .classed("tooltip-handle-child", true)
            .style("opacity", 0)
        // .attr("class", "tooltip")

        let righttooltip = topContainer
            .append("div")
            .classed("tooltip-handle-child", true)
            .style("opacity", 0)
        // .attr("class", "tooltip")

        gBrushSecond.selectAll(".handle--w")
            .on("mouseover", leftHandleOver)
            .on("mouseout", function () {
                lefttooltip.style("opacity", 0)
            });

        gBrushSecond.selectAll(".handle--e")
            .on("mouseover", rightHandleOver)
            .on("mouseout", function () {
                righttooltip.style("opacity", 0)
            });;

        gBrushSecond.selectAll(".selection")
            .attr("fill", "white")
            .attr("stroke", "#C56C00")

        function brushmoved() {
            timeSelectionSecond = d3.event.selection;
            // const [x0, x1] = s.map(x.invert);
            if (timeSelectionSecond == null) {
                handle.attr("display", "none");
            } else {
                // lefttooltip.style("opacity", 1)
                handle.attr("display", null).attr("transform", (d, i) => "translate(" + [timeSelectionSecond[i], -(selectorHeight - 30) / 4] + ")");
            }
        };

        function leftHandleOver() {
            let format = d3.timeFormat(timeFormat)
            lefttooltip.style("opacity", 1)
                .html("Start: " + format(x.invert(timeSelectionSecond[0])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
            // let selection = d3.brushSelection();
            // console.log("start",x.invert(timeSelection[0]));
        };

        function rightHandleOver() {
            // let selection = d3.brushSelection();
            let format = d3.timeFormat(timeFormat)
            righttooltip.style("opacity", 1)
                .html("End: " + format(x.invert(timeSelectionSecond[1])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
        };

        areachart.select(".overlay").remove();
    }

    callFirstBrush();
    callSecondBrush();
    if (!secondGraphExist) {
        d3.selectAll(".brush-child").classed("hide", true);
    }    
}

function topNodeTab() {
    let tab = d3.select("#topNodesTab");
    let button = tab.selectAll(".toptab")
    button.on("click", topTabCLicked)

    d3.selectAll(".toptab-custom").on("click", customWindow);

    function topTabCLicked(d) {
        button.classed("toptab-active", false);
        d3.select(this).classed("toptab-active", true);
        let listName = d3.select(this).node().innerHTML;
        getNodeList(listName);
    }

    function customWindow() {
        var editContainer = d3.selectAll(".nodelist-edit-container")
        editContainer.classed("hide", false);
        var noClickLayer = d3.selectAll(".noclick");
        noClickLayer.classed("hide", false);
        editContainer.selectAll(".button-close")
            .on("click", function () {
                editContainer.classed("hide", true);
                noClickLayer.classed("hide", true);
            });
        editContainer.selectAll(".add-node-list")
            .on("click", function () {
                editContainer.selectAll(".nodelist-edit").classed("hide", false)
            })
    }
}
topNodeTab();

function clearToolState() {
    brushLayer.on(".brush", null);
    brushLayer.attr("width", 0)
        .attr("height", 0)
    drawLayer
        .on("mousedown", null)
        .on("mouseup", null);
    d3.selectAll(".tool-btn").classed("tool-active", false);
    d3.selectAll(".brush-menu-container").remove();

    isSelectMode = false;
    drawDirectedLineMode = false;
    drawUnDirectedLineMode = false;
}

function drawTopNodeDropDown(nodelist){
    mdui.mutation();
    let nodeListMCC = new(Array);
        nodelist.forEach(
            function(item){
                nodeListMCC.push({"node_name":item,
                    "mcc":MCCDict.filter(m => m.edited_description === item)[0].mcc }
                )
            }
        ); 
    let inputdata = {list: nodeListMCC};
    console.log(inputdata)
    let html = template("nodeListTemp", inputdata)
    document.getElementById("nodeListContainter").innerHTML=html;
    
    d3.select("#showFullListButton").on("click", function(){
        fullList.classed("node-list-show", !fullList.classed("node-list-show"));
    })
}

function creatQueryFromList(a){
    let d = a.children[1].children[0].innerHTML; //get the node name
    setTimeout(() => {
            if (graphExist == false) {
        createQuery(d, 4, "single", nodeList);
        } else {
            createQuery(d, 4, "single", nodeList);
            graphLeftPlusExist = false;
            graphRightPlusExist = false;
        }
    }, 250
    )

    fullList.classed("node-list-show", !fullList.classed("node-list-show"));
    collapseButton.closeAll();
}

function drawTopNodes(list) {
    drawTopNodeDropDown(list);
    // console.log(MCCDict)
    topSpace.selectAll(".topnodes").remove();
    var nodeList = list;
    let topNodeXOffset = 0.6 * topSpaceHeight - 20, topNodeRadius = 20;
    let nodesyPos = 0.65 * topSpaceHeight + topNodeRadius

    // console.log(nodeList)
    // const xPosition = i * 50 + 60;
    // console.log(d);

    var node = topSpace.selectAll(".topnodes")
        .data(nodeList)
        .enter().append("g")
        .attr("class", "topnodes")
        .attr("transform", (d,i) => "translate("+ (i * 50 + 40) + "," + nodesyPos+")")
        .on("mouseover", d => showFullName(d))
        .on("mouseout", hideFullName);

    //multinodes
    d3.select(".multi-nodes").on("click", function () {
        if (!isMultiMode) {
            console.log("multi-mode")
            isMultiMode = true;
            graphExist = false;
            drawLayer.attr("height", "100%").attr("width", "100%");
            workSpace.selectAll("g").remove();
            d3.selectAll("#queryTitleContainer").classed("hide", true);
            node.remove();
            drawTopNodes(nodeList);
            d3.select(this).classed("tool-active", true);
            d3.select(".draw-undirected-line").on("click", drawUndirectedLine);
            d3.select(".draw-directed-line").on("click", drawDirectedLine);
            workContainer.append("button")
                .classed("build-query-btn", true)
                .html("Create Query")
                .on("click", packedQuery);
            d3.select("#multiNodeText").selectAll("p").remove();
            d3.select("#multiNodeText").classed("hide", false);
            d3.select("#staContainer").classed("hide", true);
        } else {
            clearToolState();
            isMultiMode = false;
            drawLayer.attr("height", 0).attr("width", 0);
            drawLayer.selectAll("g").remove();
            drawLayer.selectAll("circle").remove();
            drawLayer.selectAll("rect").remove();
            drawLayer.selectAll("line").remove();
            drawLayer.selectAll("path").remove();
            workSpace.selectAll("g").remove();
            workContainer.selectAll("button").remove();
            node.remove();
            drawTopNodes(nodeList);
            d3.select(this).classed("tool-active", false);
            d3.select(".draw-undirected-line").on("click", null);
            d3.select(".draw-directed-line").on("click", null);
            //reset array
            packList.length = 0;
            linkmapList.length = 0;
            packLinks.length = 0;
            packCount = 1;
            d3.select("#multiNodeText").selectAll("p").remove();
            d3.select("#multiNodeText").classed("hide", true);
        }
    })

    if (!isMultiMode) {
        node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
    } else {
        node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragendedMulti));
    }

    node
        .append("circle")
        .attr("r", topNodeRadius);

    node
        .append('text')
        .attr("class", "top-node-text")
        .attr("y", -topNodeRadius/3)
        .text(d => MCCDict.filter(m => m.edited_description === d)[0].mcc);
    
    node
        .append('text')
        .attr("class", "top-node-text")
        .attr("y", topNodeRadius/4)
        .text(d => nodeMultiWordsFormat(d));
    
    function nodeMultiWordsFormat(d) {
        if (multiWordsFormat(d).length < 7) {
            return multiWordsFormat(d)
        } else {
            return d.slice(0,5)+".."
        }
    }
    // getHeatmap()

    //Data exchange
    function packedQuery(d) {
        // console.log(nodeList);
        // console.log(linkmapList);
        console.log(packList);
        console.log(packLinks);
        console.log(packNodes);
        createQuery("Bakeries", 4, "packed", nodeList);

        // setTimeout(drawPreview(),210)
        clearToolState();
        isMultiMode = false;
        drawLayer.attr("height", 0).attr("width", 0);
        drawLayer.selectAll("g").remove();
        drawLayer.selectAll("circle").remove();
        drawLayer.selectAll("rect").remove();
        drawLayer.selectAll("line").remove();
        drawLayer.selectAll("path").remove();
        workContainer.selectAll("button").remove();
        node.remove();
        drawTopNodes(nodeList);
        d3.selectAll(".tool-active").classed("tool-active", false);
        //reset array
        packCount = 1;

        d3.select("#multiNodeText").selectAll("p").remove();
        d3.select("#multiNodeText").classed("hide", true);
    }
    //drag top nodes
    function dragstarted(d) { 
        globalDragLayer
            .attr("height", "100%")
            .attr("width", "100%")
        let draggingNode = globalDragLayer
            .append("g")
            .attr("class", "dragging-node topnodes")
            .attr("transform", d3.select(this).attr("transform"))
            .datum(d)
            .on("mouseover", d => showFullName(d))
            .on("mousemove", moveFullName);
            // .on("mouseout", hideFullName);

        draggingNode.append("circle")
            .attr("r", topNodeRadius + 5);
        // .attr("stroke", "#CCC");

        draggingNode.append("text")
            .attr("class", "top-node-text dragging-node")
            .style('font-size', '12px')
            .attr("y", -topNodeRadius/3)
            .text(d => MCCDict.filter(m => m.edited_description === d)[0].mcc);

        draggingNode.append('text')
            .attr("class", "top-node-text dragging-node")
            .style('font-size', '12px')
            .attr("y", topNodeRadius/4)
            .text(d => nodeMultiWordsFormat(d))

        d3.select(this)
            .attr("opacity", 0.3)
    }

    function dragged(d) {
        dpx = event.pageX;
        dpy = event.pageY;
        moveFullName();

        globalDragLayer.select(".dragging-node").attr("transform", `translate(${dpx},${dpy})`)
    }; //???????

    function dragended(d) {
        let endXPos = event.pageX,
            endYPos = event.pageY;

        if (endYPos > topSpaceHeight) { //judge height space

            globalDragLayer.selectAll(".text").select("text").remove();
            globalDragLayer.select(".dragging-node")
                .transition().duration(200)
                .attr("transform", `translate(${workSpaceWidth / 2},${topSpaceHeight + workSpaceHeight / 2})`)
            globalDragLayer.select(".dragging-node").select("circle")
                .attr("opacity", 1)
                .transition().duration(500)
                .attr("r", 200)
                .attr("opacity", 0);
            globalDragLayer.select(".dragging-node").selectAll("text").remove();

            setTimeout(() => {
                globalDragLayer.selectAll("g").remove();
                globalDragLayer.attr("width", 0).attr("height", 0);
                let thisNode = d;
                nodeList = nodeList.filter((d, i) => d !== thisNode) // filter this node id, remove from top nodes
                console.log(nodeList)
                hideFullName();
                if (graphExist == false) {
                    createQuery(d, 4, "single", nodeList);
                } else {
                    createQuery(d, 4, "single", nodeList);
                    graphLeftPlusExist = false;
                    graphRightPlusExist = false;
                }
            }, 500)

        } else {
            drawTopNodes(nodeList);
            globalDragLayer.selectAll("g").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
        }
        hideFullName();
        console.log("end");
    }

    function dragendedMulti(d) {
        let endXPos = event.pageX,
            endYPos = event.pageY;

        let counter = 0

        if (endYPos > topSpaceHeight) { //judge height space

            globalDragLayer.select(".text").select("text").remove();
            globalDragLayer.select(".dragging-node").select("circle")

            globalDragLayer.selectAll("g").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            let thisNode = d;
            nodeList = nodeList.filter((d, i) => d !== thisNode); // filter this node id, remove from top nodes
            // console.log(nodeList)
            node.remove();
            drawTopNodes(nodeList)

            //draw ndoes on draw layer
            let drawLayerNode = drawLayer
                .append("g")
                .attr("class", "node-multi")
                .datum(d)
                .on("mouseover", d => showFullName(d))
                // .on("mousemove", moveFullName)
                .on("mouseout", hideFullName);
                
                // .attr("transform", `translate(${endXPos}, ${endYPos-topSpaceHeight})`)


            drawLayerNode.call(d3.drag().on("drag", draggedInMultiDraw))

            // console.log(d, typeof(d));
            drawLayerNode
                .append("circle")
                .attr("cx", endXPos)
                .attr("cy", endYPos - topSpaceHeight)
                .attr("r", topNodeRadius + 5)
                .attr("fill", "#4F4688")
                .attr("stroke", "#CCC")
                .attr("stroke-width", 1.5)

            drawLayerNode.append("text")
                .attr("class", "draw-layer-mcc")
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr("x", endXPos)
                .attr("y", endYPos - topSpaceHeight - topNodeRadius/3)
                .attr("fill", "#fff")
                .style('font-size', '12px')
                .text(d => MCCDict.filter(m => m.edited_description === d)[0].mcc);

            drawLayerNode.append('text')
                .attr("class", "draw-layer-name")
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr("fill", "#fff")
                .style('font-size', '12px')
                .attr("x", endXPos)
                .attr("y", endYPos - topSpaceHeight + topNodeRadius/4)
                .text(d => nodeMultiWordsFormat(d));

        } else {
            topSpace.selectAll(".topnodes").remove();
            globalDragLayer.selectAll("g").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            drawTopNodes(nodeList)
            // .call(d3.drag().on("drag",draggedInMultiDraw))
        }
        hideFullName();


        // console.log("end");
    }

    function draggedInMultiDraw(d) {
        let dx = d3.event.x,
            dy = d3.event.y;

        d3.select(this).select("circle").attr("cx", dx);
        d3.select(this).select("circle").attr("cy", dy);
        d3.select(this).selectAll("text").attr("x", dx);
        d3.select(this).select(".draw-layer-mcc").attr("y", dy - topNodeRadius/3);
        d3.select(this).select(".draw-layer-name").attr("y", dy + topNodeRadius/4);

        moveFullName();
    }

    function drawUndirectedLine() {
        var line
        var lineCount = 1;

        if (!drawUnDirectedLineMode) {
            clearToolState();
            drawLayer
                .on("mousedown", mousedown)
                .on("mouseup", mouseup);
            drawUnDirectedLineMode = true;
            drawLayer.selectAll(".node-multi")
                .on(".drag", null);
            d3.select(this).classed("tool-active", true);
        } else {
            drawLayer
                .on("mousedown", null)
                .on("mouseup", null);
            drawUnDirectedLineMode = false;
            drawLayer.selectAll(".node-multi")
                .call(d3.drag().on("drag", draggedInMultiDraw));
            d3.select(this).classed("tool-active", false);
        }

        function mousedown() {
            let m = d3.mouse(this);
            // console.log("down", m)
            line = drawLayer.append("line")
                .attr("x1", m[0])
                .attr("y1", m[1])
                .attr("x2", m[0])
                .attr("y2", m[1])
                .attr("stroke", "black")
                .attr("id", `ud-line${lineCount}`);
            // line.attr("marker-end", "url(#triangleArrow)");
            // 
            drawLayer.on("mousemove", mousemove);
        }

        function mousemove() {
            let m = d3.mouse(this);
            line.attr("x2", m[0])
                .attr("y2", m[1]);
        }

        function mouseup() {
            drawLayer.on("mousemove", null)
            //first detect if there is a rect, if yes, piror line between rect and class them
            if (drawLayer.selectAll(".con-rect").size() > 1) {
                drawLayer.selectAll(".con-rect")
                    .classed(`ud-con-from-${lineCount}`, function (d) {
                        return isInLogicContainer(
                            parseFloat(line.attr("x1")),
                            parseFloat(line.attr("y1")),
                            parseFloat(d3.select(this).attr("x")),
                            parseFloat(d3.select(this).attr("y")),
                            parseFloat(d3.select(this).attr("width")),
                            parseFloat(d3.select(this).attr("height"))
                        )
                    });

                drawLayer.selectAll(".con-rect")
                    .classed(`ud-con-to-${lineCount}`, function (d) {
                        return isInLogicContainer(
                            parseFloat(line.attr("x2")),
                            parseFloat(line.attr("y2")),
                            parseFloat(d3.select(this).attr("x")),
                            parseFloat(d3.select(this).attr("y")),
                            parseFloat(d3.select(this).attr("width")),
                            parseFloat(d3.select(this).attr("height"))
                        )
                    });
            }
            //first if there is a rect
            if ((document.getElementsByClassName(`ud-con-from-${lineCount}`).length != 0) &&
                (document.getElementsByClassName(`ud-con-to-${lineCount}`).length != 0)) {
                let fromRect = drawLayer.select(`.ud-con-from-${lineCount}`);
                let toRect = drawLayer.select(`.ud-con-to-${lineCount}`);
                line.attr("x1", parseFloat(fromRect.attr("x")) + parseFloat(fromRect.attr("width")) / 2)
                    .attr("y1", parseFloat(fromRect.attr("y")) + parseFloat(fromRect.attr("height")) / 2)
                    .attr("x2", parseFloat(toRect.attr("x")) + parseFloat(toRect.attr("width")) / 2)
                    .attr("y2", parseFloat(toRect.attr("y")) + parseFloat(toRect.attr("height")) / 2)
                    .attr("stroke", "black")
                    .transition().duration(100)
                    .attr("stroke", "#999")

                lineCount += 1;
                line.lower();
            } else {
                //if no rect, then it is a link between nodes
                drawLayer.selectAll("circle")
                    .classed(`ud-from-${lineCount}`, function (d) {
                        return isInCircle(
                            line.attr("x1"),
                            line.attr("y1"),
                            d3.select(this).attr("cx"),
                            d3.select(this).attr("cy"),
                            d3.select(this).attr("r"))
                    })
                    .classed(`ud-to-${lineCount}`, function (d) {
                        return isInCircle(
                            line.attr("x2"),
                            line.attr("y2"),
                            d3.select(this).attr("cx"),
                            d3.select(this).attr("cy"),
                            d3.select(this).attr("r"))
                    })

                console.log(document.getElementsByClassName(`ud-from-${lineCount}`).length)
                if ((document.getElementsByClassName(`ud-from-${lineCount}`).length != 0) &&
                    (document.getElementsByClassName(`ud-to-${lineCount}`).length != 0)) {
                    line.attr("x1", drawLayer.select(`.ud-from-${lineCount}`).attr("cx"))
                        .attr("y1", drawLayer.select(`.ud-from-${lineCount}`).attr("cy"))
                        .attr("x2", drawLayer.select(`.ud-to-${lineCount}`).attr("cx"))
                        .attr("y2", drawLayer.select(`.ud-to-${lineCount}`).attr("cy"))
                        .attr("stroke", "black")
                        .transition().duration(100)
                        .attr("stroke", "#999")
                    // .attr("stroke-width", 1.5)

                    let fromNode = drawLayer.select(`.ud-from-${lineCount}`).datum();
                    let toNode = drawLayer.select(`.ud-to-${lineCount}`).datum();

                    console.log(`${fromNode} to ${toNode}`);
                    d3.select("#multiNodeText").append("p")
                        .lower()
                        .html(`[ <u>${fromNode} (${getMCC(fromNode)})</u> <b>to</b> <u>${toNode} (${getMCC(toNode)})</u> ] 
                        OR  [ <u>${toNode} (${getMCC(toNode)})</u> <b>to</b> <u>${fromNode} (${getMCC(fromNode)})</u> ]`)
                    linkmapList.push({
                        "source": fromNode,
                        "target": toNode,
                        "type": "undirected"
                    })
                    console.log(linkmapList);
                    lineCount += 1;
                    line.lower();
                } else {
                    drawLayer.selectAll("circle")
                        .classed(`ud-from-${lineCount}`, false)
                        .classed(`ud-to-${lineCount}`, false);
                    line.remove();
                }
            }
        }

        function isInCircle(x, y, cx, cy, r) {
            return ((cx - x) ** 2 + (cy - y) ** 2) <= r ** 2;
        }

        function isInLogicContainer(lineX, lineY, boxX, boxY, boxWitdth, boxHeight) {
            return lineX > boxX && lineY > boxY && lineX < (boxX + boxWitdth) && lineY < (boxY + boxHeight)
        }
    }

    function drawDirectedLine() {
        var line;
        var lineCount = 1;

        var startPoint = new Array();

        if (!drawDirectedLineMode) {
            clearToolState();
            drawLayer
                .on("mousedown", mousedown)
                .on("mouseup", mouseup);
            drawDirectedLineMode = true;
            drawLayer.selectAll(".node-multi")
                .on(".drag", null)
            d3.select(this).classed("tool-active", true)
        } else {
            drawLayer
                .on("mousedown", null)
                .on("mouseup", null);
            drawDirectedLineMode = false;
            drawLayer.selectAll(".node-multi")
                .call(d3.drag().on("drag", draggedInMultiDraw))
            d3.select(this).classed("tool-active", false)
        }

        function mousedown() {
            // startPoint.length=0;
            let m = d3.mouse(this);

            line = drawLayer.append("line")
                .attr("x1", m[0])
                .attr("y1", m[1])
                .attr("x2", m[0])
                .attr("y2", m[1])
                .attr("stroke", "black")
                .attr("id", `d-line${lineCount}`);
            line.attr("marker-end", "url(#triangleArrow)");
            // 
            drawLayer.on("mousemove", mousemove);
        }

        function mousemove() {
            let m = d3.mouse(this);
            line.attr("x2", m[0])
                .attr("y2", m[1]);
        }

        function mouseup() {
            drawLayer.on("mousemove", null)

            if (drawLayer.selectAll(".con-rect").size() > 1) {
                drawLayer.selectAll(".con-rect")
                    .classed(`d-con-from-${lineCount}`, function (d) {
                        return isInLogicContainer(
                            parseFloat(line.attr("x1")),
                            parseFloat(line.attr("y1")),
                            parseFloat(d3.select(this).attr("x")),
                            parseFloat(d3.select(this).attr("y")),
                            parseFloat(d3.select(this).attr("width")),
                            parseFloat(d3.select(this).attr("height"))
                        )
                    });

                drawLayer.selectAll(".con-rect")
                    .classed(`d-con-to-${lineCount}`, function (d) {
                        return isInLogicContainer(
                            parseFloat(line.attr("x2")),
                            parseFloat(line.attr("y2")),
                            parseFloat(d3.select(this).attr("x")),
                            parseFloat(d3.select(this).attr("y")),
                            parseFloat(d3.select(this).attr("width")),
                            parseFloat(d3.select(this).attr("height"))
                        )
                    });
            }

            if ((document.getElementsByClassName(`d-con-from-${lineCount}`).length != 0) &&
                (document.getElementsByClassName(`d-con-to-${lineCount}`).length != 0)) {

                let fromRect = drawLayer.select(`.d-con-from-${lineCount}`);
                let toRect = drawLayer.select(`.d-con-to-${lineCount}`);
                let x1 = parseFloat(fromRect.attr("x")) + parseFloat(fromRect.attr("width")) / 2,
                    y1 = parseFloat(fromRect.attr("y")) + parseFloat(fromRect.attr("height")) / 2,
                    x2 = parseFloat(toRect.attr("x")) + parseFloat(toRect.attr("width")) / 2,
                    y2 = parseFloat(toRect.attr("y")) + parseFloat(toRect.attr("height")) / 2;

                let midX = x1 + (x2 - x1) / 2,
                    midY = y1 + (y2 - y1) / 2;
                let linePath = `M${x1},${y1} L${midX},${midY} L${x2},${y2}`

                line.remove();
                drawLayer.append("path")
                    .attr("id", `d-line${lineCount}`)
                    .attr("d", linePath)
                    .attr("stroke", "black")
                    .attr("marker-mid", "url(#triangleArrow)")
                    .lower()
                    .transition().duration(100)
                    .attr("stroke", "#999")

                lineCount += 1;
            } else {
                drawLayer.selectAll("circle")
                    .classed(`d-from-${lineCount}`, function (d) {
                        return isInCircle(
                            line.attr("x1"),
                            line.attr("y1"),
                            d3.select(this).attr("cx"),
                            d3.select(this).attr("cy"),
                            d3.select(this).attr("r"))
                    })
                    .classed(`d-to-${lineCount}`, function (d) {
                        return isInCircle(
                            line.attr("x2"),
                            line.attr("y2"),
                            d3.select(this).attr("cx"),
                            d3.select(this).attr("cy"),
                            d3.select(this).attr("r"))
                    })

                console.log(document.getElementsByClassName(`d-from-${lineCount}`).length)
                if ((document.getElementsByClassName(`d-from-${lineCount}`).length != 0) && (document.getElementsByClassName(`d-to-${lineCount}`).length != 0)) {
                    let x1 = parseFloat(drawLayer.select(`.d-from-${lineCount}`).attr("cx")),
                        y1 = parseFloat(drawLayer.select(`.d-from-${lineCount}`).attr("cy")),
                        x2 = parseFloat(drawLayer.select(`.d-to-${lineCount}`).attr("cx")),
                        y2 = parseFloat(drawLayer.select(`.d-to-${lineCount}`).attr("cy"));

                    let midX = x1 + (x2 - x1) / 2,
                        midY = y1 + (y2 - y1) / 2;
                    let linePath = `M${x1},${y1} L${midX},${midY} L${x2},${y2}`

                    line.remove();
                    drawLayer.append("path")
                        .attr("id", `d-line${lineCount}`)
                        .attr("d", linePath)
                        .attr("stroke", "black")
                        .attr("marker-mid", "url(#triangleArrow)")
                        .lower()
                        .transition().duration(100)
                        .attr("stroke", "#999");
                    let fromNode = drawLayer.select(`.d-from-${lineCount}`).datum();
                    let toNode = drawLayer.select(`.d-to-${lineCount}`).datum();
                    d3.select("#multiNodeText").append("p")
                        .lower()
                        .html(`[ <u>${fromNode} (${getMCC(fromNode)})</u> <b>to</b> <u>${toNode} (${getMCC(toNode)})</u> ]`)
                    //push to linkmaplist for drawing
                    linkmapList.push({
                        "source": fromNode,
                        "target": toNode,
                        "type": "directed"
                    })
                    console.log(linkmapList);
                    lineCount += 1;
                } else {
                    drawLayer.selectAll("circle")
                        .classed(`d-from-${lineCount}`, false)
                        .classed(`d-to-${lineCount}`, false);
                    line.remove();
                }
            }
        }

        function isInCircle(x, y, cx, cy, r) {
            return ((cx - x) ** 2 + (cy - y) ** 2) <= r ** 2;
        }

        function isInLogicContainer(lineX, lineY, boxX, boxY, boxWitdth, boxHeight) {
            return lineX > boxX && lineY > boxY && lineX < (boxX + boxWitdth) && lineY < (boxY + boxHeight)
        }
    }

    //brush
    if (!graphExist) {
        brush.on("start", brushstart)
            .on("brush", brushed)
            .on("end", brushpopup);

        function brushstart() {
            workContainer.selectAll(".brush-menu-container").remove();
            // console.log("start")
        };

        function brushed() {
            let selection = d3.event.selection;
            if (selection != null) {
                var nodes = drawLayer.selectAll("circle")
                nodes.classed("selected", function (d) {
                    return isInSelection(selection,
                        this.getBoundingClientRect().x + 0.5 * this.getBoundingClientRect().width,
                        this.getBoundingClientRect().y + 0.5 * this.getBoundingClientRect().height)
                })
            }

            function isInSelection(brush_coords, cx, cy) {
                let x0 = brush_coords[0][0],
                    x1 = brush_coords[1][0],
                    y0 = brush_coords[0][1] + topSpaceHeight,
                    y1 = brush_coords[1][1] + topSpaceHeight;
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
            }
        }

        function brushpopup() {
            var selection = d3.event.selection;
            var selectedNodes = d3.selectAll(".selected")
            // console.log(selection)
            if (selection != null) {
                let [
                    [x0, y0],
                    [x1, y1]
                ] = selection;
                let menuContainer = workContainer.append("div")
                    .attr("class", "brush-menu-container")
                    .style("position", "absolute")
                    .style("top", `${y0+topSpaceHeight}px`)
                    .style("left", `${x1}px`)

                let menuPack = menuContainer
                    .append("button")
                    .attr("class", "brush-menu")
                    .html("PACK")

                // let selectedNodes = d3.selectAll(".selected")
                var lineList = new Array();
                var xPosList = new Array();
                var yPosList = new Array();
                selectedNodes.each(function (d) {
                    lineList.push([d, d3.select(this).attr("class").replace(" selected", "")]);
                    xPosList.push(parseFloat(d3.select(this).attr("cx")));
                    yPosList.push(parseFloat(d3.select(this).attr("cy")));
                })
                //Calculate min rect surrounding the nodes
                let rectPadding = 10;
                var xPos = d3.min(xPosList) - rectPadding - (topNodeRadius + 5);
                var yPos = d3.min(yPosList) - rectPadding - (topNodeRadius + 5);
                var rectWidth = d3.max(xPosList) - d3.min(xPosList) + 2 * (rectPadding + (topNodeRadius + 5));
                var rectHeight = d3.max(yPosList) - d3.min(yPosList) + 2 * (rectPadding + (topNodeRadius + 5));
                menuPack.on("click", packClick);
            } else {
                console.log("not enough nodes")
                // brushLayer.call(brush.clear);
                // drawLayer.selectAll("circle").classed("selected", false);
            }

            function packClick() {
                console.log(selectedNodes.data());
                // console.log(selectedNodes.data().length);
                if (selectedNodes.size() > 1) {
                    console.log("packclick");
                    let conContainer = drawLayer
                        .append("g")

                    conContainer.append("rect")
                        .attr("class", "con-rect")
                        .attr("x", xPos).attr("y", yPos)
                        .attr("height", rectHeight)
                        .attr("width", rectWidth)
                        .attr("stroke", "#393261")
                        .datum(packCount);
                    conContainer.append("text")
                        .text("OR")
                        .attr("x", xPos + rectWidth/2).attr("y", yPos - 5)
                        .attr("fill", "#393261")
                        .style("text-anchor", "middle")
                        .style("font-size", 17)
                        // .attr("class", "")
                    conContainer
                        .lower()
                        .transition().delay(150).duration(200)
                        .attr("stroke", "#855B9C");
                    drawLayer.selectAll(".selected")
                        .transition().duration(300)
                        .attr("fill", "#5F5985");
                    packList.push([packCount, lineList]);
                    // console.log(packList);
                    packLinks.push(linkmapList);
                    selectedNodes.data().forEach(d => packNodes.push({
                        "id": d
                    }))

                    // console.log(packNodes);
                    // linkmapList.length = 0;
                    d3.select("#multiNodeText").append("p")
                        .lower()
                        .html(`PACK${packCount}: ${selectedNodes.data()}`)
                    packCount += 1;
                    clearBrushLayer();
                } else {
                    clearBrushLayer();
                }
            }
        }

        function clearBrushLayer() {
            workContainer.selectAll(".brush-menu-container").remove();
            brushLayer.call(brush.clear);
            drawLayer.selectAll("circle").classed("selected", false)
        }
    }

    let selectModeButton = d3.select(".select-mode")
    selectModeButton.on("click", selectMode)

    function selectMode() {
        if (!isSelectMode) {
            clearToolState();
            selectModeButton.classed("tool-active", true);
            isSelectMode = true;
            brushLayer.attr("width", "100%")
                .attr("height", "100%")
            brush(brushLayer);
            console.log("select-multi!")
        } else {
            clearToolState();
            selectModeButton.classed("tool-active", false);
            isSelectMode = false;
            brushLayer.on(".brush", null);
            brushLayer.attr("width", 0)
                .attr("height", 0);
        }
    }
};


// drawLine("directed");
function getHeatmap() {
    axios.get('http://127.0.0.1:5000/heatmap')
        .then(function (response) { // if success then update data
            probHeatmap = response.data;
        });
}

function multiWordsFormat(d) {
    if (d.split(' ').length > 1) {
        return d.split(' ')[0] + ".."
    } else {
        return d.split(' ')[0]
    }
}

function getMCC(d){
    return MCCDict.filter(m => m.edited_description === d)[0].mcc;
}

function drawHeatmap(d) {
    let heatmapContainer = workContainer.select(".heatmap-container")
    let heatmapWidth = 0.2 * width;
    let heatmapHeight = 0.2 * height;
    setTimeout(() => {
        let heatmap = heatmapContainer.append("svg")
            .attr("id", "heatmap")
            .attr("width", 1.2 * heatmapWidth)
            .attr("height", 1.2 * heatmapHeight)
            .attr("fill", "white");
        let heatmap_x = d3.map(probHeatmap, d => d.place2).keys();
        let heatmap_y = d3.map(probHeatmap, d => d.place1).keys();

        //x axis
        let x = d3.scaleBand()
            .range([0, heatmapWidth])
            .domain(heatmap_x)
            .padding(0.05)
        heatmap.append("g")
            .attr("transform", `translate(${0.2 * heatmapWidth + 5},${0.85 * heatmapHeight + 3})`)
            .classed("heatmap-axis", true)
            .call(d3.axisBottom(x).tickSize(0).tickFormat(d => multiWordsFormat(d)))
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(90)")
            .select(".domamin").remove()
            .attr("stroke", "white")
            
        //y axis
        let y = d3.scaleBand()
            .range([0.85 * heatmapHeight, 0])
            .domain(heatmap_y)
            .padding(0.05)

        heatmap.append("g")
            .attr("transform", `translate(${0.2 * heatmapWidth},${0 * heatmapHeight})`)
            .classed("heatmap-axis", true)
            .call(d3.axisLeft(y).tickSize(0).tickFormat(d => multiWordsFormat(d)))
            .select(".domamin").remove()

        let heatmapColorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(probHeatmap, d => d.prob)])
        let heatmapTextColorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([-d3.max(probHeatmap, d => d.prob), 0])

        let tooltip = heatmapContainer
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip");

        let heatRect = heatmap.selectAll(".heatmap-rect")
            .data(probHeatmap, d => d.place1 + ":" + d.place2)
            .enter().append("g")
            .attr("class","heatmap-rect")
            .on("mouseover", heatmapMouseover)
            .on("mousemove", heatmapMousemove)
            .on("mouseleave", heatmapMouseleave);

        heatRect.append("rect")
            .attr("x", d => x(d.place2) + 0.2 * heatmapWidth)
            .attr("y", d => y(d.place1) + 0 * heatmapHeight)
            // .attr("rx", 4)
            // .attr("ry", 4)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => heatmapColorScale(d.prob))
            .style("stroke-width", 3)
            .style("stroke", "none")
            .style("opacity", 0.9);

        
        heatRect.append("text")
            .text(d => d3.format(".2%")(d.prob))
            .attr("x", d => x(d.place2) + x.bandwidth()/2 + 0.2 * heatmapWidth)
            .attr("y", d => y(d.place1) + y.bandwidth()/2)
            .attr("class", "heatmap-text")
            .attr("fill", d => (d.prob < d3.max(probHeatmap, d => d.prob) * 0.75 && d.prob > d3.max(probHeatmap, d => d.prob) * 0.35) ? "black" : heatmapTextColorScale(-d.prob));

        function heatmapMouseover(d) {
            tooltip
                .style("opacity", 1)
            d3.select(this).select("rect")
                .style("stroke", "#154360")
                .style("opacity", 1)
        }
    
        function heatmapMousemove(d) {
            tooltip
                .html("The prob from " + d.place1 + " to " + d.place2 + " is: " + "<span style='color:darkblue'> "+ d3.format(".2%")(d.prob) + "</span>")
                .style("left", (d3.mouse(this)[0] + 10) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
    
        function heatmapMouseleave(d) {
            tooltip
                .style("opacity", 0)
            d3.select(this).select("rect")
                .style("stroke", "none")
                .style("opacity", 0.9)
        }
    }, 300);

    isHeatmapActive = true;
}

function drawScatterFilter(){
    var fakeData_scatter = d3.range(100)
        .map(function() { return [Math.random()*2-1, Math.random()*2-1]; });
    let sfilterHeight = 0.6 * topSpaceHeight, sfilterWidth = 0.6 * topSpaceHeight;
    let sfilterMargin = 0.025 * topSpaceHeight, sfilterTop = 0.4 * topSpaceHeight;
    let xlabelOffset = 6, ylabelOffset = 3;
    scatterFilter
        .attr("height", sfilterHeight).attr("width", sfilterWidth)
        .call(d3.drag()
            .on("start drag",changePointPos)
            .on("end", endPoint));
    scatterFilter.append("rect")
        .attr("x", sfilterMargin)
        .attr("y", sfilterMargin)
        .attr("height", sfilterHeight).attr("width", sfilterWidth)
        .attr("fill", "#F9F9F9");

    let x = d3.scaleLinear()
        .range([2 * sfilterMargin, sfilterWidth - sfilterMargin])
        .domain([-1,1]);
    let y = d3.scaleLinear()
        .range([sfilterWidth - sfilterMargin, 2 * sfilterMargin])
        .domain([-1,1]);

    let xAxis = scatterFilter.append("g")
        
    xAxis.append("line")
        .attr("class", "sfilter-axis")
        .attr("x1", 2 * sfilterMargin).attr("x2", sfilterWidth-sfilterMargin)
        .attr("y1", (sfilterHeight+sfilterMargin)/2).attr("y2", (sfilterHeight+sfilterMargin)/2)
        .attr("marker-end", "url(#triangleArrow-sfilter)");
    //add x labels
    xAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", sfilterWidth-sfilterMargin)
        .attr("y", (sfilterHeight+sfilterMargin)/2 + xlabelOffset)
        .text("Freq");

    xAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", sfilterWidth-sfilterMargin)
        .attr("y", (sfilterHeight+sfilterMargin)/2 - xlabelOffset)
        .style("opacity", .5)
        .text("High");

    xAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", 2 * sfilterMargin)
        .attr("y", (sfilterHeight+sfilterMargin)/2 - xlabelOffset)
        .style("opacity", .5)
        .style("text-anchor", "start")
        .text("Low");

    let yAxis = scatterFilter.append("g")

    yAxis.append("line")
        .attr("class", "sfilter-axis")
        .attr("x1", (sfilterWidth+sfilterMargin)/2).attr("x2", (sfilterWidth+sfilterMargin)/2)
        .attr("y1", sfilterHeight-sfilterMargin).attr("y2", 2 * sfilterMargin)
        .attr("marker-end", "url(#triangleArrow-sfilter)");
    //add y labels
    yAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", (sfilterWidth+sfilterMargin)/2 - ylabelOffset)
        .attr("y", 2 * sfilterMargin)
        .text("ATV");

    yAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", (sfilterWidth+sfilterMargin)/2 + ylabelOffset)
        .attr("y", 2 * sfilterMargin)
        .style("opacity", .5)
        .style("text-anchor", "start")
        .text("High");

    yAxis.append("text")
        .attr("class", "sfilter-axis")
        .attr("x", (sfilterWidth+sfilterMargin)/2 + ylabelOffset)
        .attr("y", sfilterHeight-sfilterMargin)
        .style("opacity", .5)
        .style("text-anchor", "start")
        .text("Low")

    let drawPointLayer = scatterFilter.append("g")
        .attr("class", "draw-point")
        
        // let radius = 2;
    let selectPoint = drawPointLayer.append("circle")
        .attr("class", "scfilter-select-point")
        .attr("cx", (sfilterWidth+sfilterMargin)/2)
        .attr("cy", (sfilterHeight+sfilterMargin)/2)
        .attr("r", 3)
        .attr("fill", "red");
    
    let scatters = scatterFilter.append("g")
        .selectAll(".scfilter-scatter")
        .data(fakeData_scatter)
        .enter().append("circle")
        .attr("class", "scfilter-scatter")
        .attr("cx", d=> x(d[0])).attr("cy", d=> y(d[1]))
        .attr("r", 1.5);
    
    console.log(fakeData_scatter)
        
    
    function changePointPos(d){
        let xPos = d3.event.x, yPos = d3.event.y;
        // console.log(xPos, yPos)
        selectPoint
            .attr("cx", xPos).attr("cy", yPos)
    }

    function endPoint(){
        let xValue = x.invert(d3.event.x), yValue = y.invert(d3.event.y);
        console.log(xValue, yValue);
        drawTopNodes(nodeList.reverse());
    }
}

drawScatterFilter();
