//axios.<method> will now provide autocomplete and parameter typings

// define data
var nodeMap //nodemap data
var subNodeMap

var nodeMap_c
var subNodeMap_c

var probHeatmap //heatmap data
var queryNode
var timeTrans // time selector data 
var timeSelection // time selector

var isMultiMode = false // initialize tool area boolean
var isSelectMode = false;
var drawDirectedLineMode = false;
var drawUnDirectedLineMode = false;
//define list to store node pairs

// var dList = new Array(); // directed pair list
var packList = new Array(); // [pack id, [[node id, node class], [node id, node class], ...]]
var packLinkList = new Array(); // undirected pair list
var packCount = 1;

var mainContainer = document.getElementById("mainContainer");
var width = mainContainer.clientWidth;
var height = mainContainer.clientHeight;
// console.log(width, height);
var topSpaceHeight = 0.3 * height;
var workSpaceHeight = 0.7 * height;
var workSpaceWidth = 0.7 * width;
var staSpaceWidth = 0.3 * width

var graphExist = false;
var secondGraphExist = false;
var conditionCount = 0;

window.onresize = function () {
    getSize()
}

function getSize() {
    width = mainContainer.clientWidth;
    height = mainContainer.clientHeight;
    topSpaceHeight = 0.3 * height;
    workSpaceHeight = 0.7 * height;
    workSpaceWidth = 0.7 * width;
    staSpaceWidth = 0.3 * width

}

var globalDragLayer = d3.select("#globalDrag")
    .attr("x", 0)
    .attr("y", 0)
    .style("position", "absolute")
    .attr("height", 0)
    .attr("width", 0)

var brushLayer = d3.select("#brushLayer")
    .attr("x", 0)
    .attr("y", 0)
    .style("position", "absolute")
    .attr("height", 0)
    .attr("width", 0)

var drawLayer = d3.select("#drawLayer")
    .attr("x", 0)
    .attr("y", 0)
    .style("position", "absolute")
    .attr("height", 0)
    .attr("width", 0)

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

var leftContainer = d3.select("#leftContainer")
var rightContainer = d3.select("#rightContainer")

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
    .attr("fill", "#CCC")
    .attr("opacity", .1)
    .attr("width", "100%")
    .attr("height", "100%");

var workSpace = workContainer.append("svg")
    // .append("g")
    .attr("id", "work")
    .attr("width", "100%")
    .attr("height", "100%");

//make the workspace under topspace

//Add workspace text(interpretation of node map)
var titletext = workSpace.append("text")
    .attr("y", 50)
    .attr("x", 100)

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

var staContainer = d3.select("#staContainer")

var staSpace = staContainer.append("svg")
    .attr("id", "staSpace")
    .attr("width", "100%")
    .attr("overflow", "visible")

var text = staSpace.append("text")
    .attr("x", 100)
    .attr("y", 50)
    .attr("fill", "white")

var initialNodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];

//define brush
var brush = d3.brush()
    .extent([
        [0, 0],
        [workSpaceWidth, workSpaceHeight]
    ])

drawTopNodes(initialNodeList);
getHeatmap();

let isHeatmapActive = false;
d3.select(".heatmap-button").on("click", drawHeatmap)



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
        }).catch(function (error) {
            // handle error
            console.log(error);
        })
}

document.getElementById("timePeriod").onchange = function () {
    topSpace.selectAll("#timeSelector").remove();
    
    getTimeData(this.options[this.options.selectedIndex].value);
    console.log(secondGraphExist)
    if(secondGraphExist){
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

    if(secondGraphExist){
        d3.selectAll(".brush-child").classed("hide", false);
    }
}



function drawTimeSelector(data, timeScale, type) {
    // getTimeData();
    let selectorWidth = 0.7 * workSpaceWidth;
    let selectorHeight = 0.2 * topSpaceHeight;
    let selectorMargin = ({
        top: 20,
        right: 20,
        bottom: 30,
        left: 30
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
    d3.selectAll("layui-laydate").remove();
    let selectorDiv = d3.select("#timeSelectorDropdown");
    selectorDiv.append("input").attr("id", "calendar")
        .attr("type", "text")
        .classed("mdui-textfield-input", true)
        .attr("placeholder", "Select Date")
        .raise();


    var areachart = topSpace.append("g")
        .attr("id", "timeSelector")
        .attr("transform", `translate(40, ${topSpaceHeight * 0.1})`)

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
        const brushParent = d3.brushX()
            .extent([
                [0, 0],
                [selectorWidth, selectorHeight - 30]
            ])
            .on("start brush end", brushmoved);

        let gBrushFirst = areachart.append("g")
            .attr("class", "brush-parent")

        // style brush resize handle

        let brushResizePath = function (d) {
            let e = +(d.type == "e"),
                x = e ? 1 : -1,
                y = (selectorHeight - 30) / 2;
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
            .classed("tooltip-handle", true)
            .style("opacity", 0)
        // .attr("class", "tooltip")

        let righttooltip = topContainer
            .append("div")
            .classed("tooltip-handle", true)
            .style("opacity", 0)
        // .attr("class", "tooltip")

        gBrushFirst.selectAll(".handle--w")
            .on("mouseover", leftHandleOver)
            .on("mouseout", function () {
                lefttooltip.style("opacity", 0)
            });

        gBrushFirst.selectAll(".handle--e")
            .on("mouseover", rightHandleOver)
            .on("mouseout", function () {
                righttooltip.style("opacity", 0)
            });;

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

        function leftHandleOver() {
            let format = d3.timeFormat(timeFormat)
            lefttooltip.style("opacity", 1)
                .html("Start: " + format(x.invert(timeSelection[0])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
            // let selection = d3.brushSelection();
            // console.log("start",x.invert(timeSelection[0]));
        };

        function rightHandleOver() {
            // let selection = d3.brushSelection();
            let format = d3.timeFormat(timeFormat)
            righttooltip.style("opacity", 1)
                .html("End: " + format(x.invert(timeSelection[1])))
                .style("left", (d3.mouse(this)[0]) + "px")
                .style("top", "20px")
        };
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
    if(!secondGraphExist){
        d3.selectAll(".brush-child").classed("hide", true);
    }
    
    // console.log(d3.selectAll(".brush-child").classed("hide"))


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

        topSpace.selectAll(".topnodes").remove();
        getNodeList(listName)
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


function getNodeList(name) {
    axios.post('http://127.0.0.1:5000/nodelist', {
            name: name
        })
        .then(function (response) { // if success then update data
            let nodeList = response.data;
            drawTopNodes(nodeList);
        })

    // return nodeList;
}

function clearToolState() {
    brushLayer.on(".brush", null);
    brushLayer.attr("width", 0)
        .attr("height", 0)
    drawLayer
        .on("mousedown", null)
        .on("mouseup", null);
    d3.selectAll(".tool-active").classed("tool-active", false);
    d3.selectAll(".brush-menu-container").remove();

    isSelectMode = false;
    drawDirectedLineMode = false;
    drawUnDirectedLineMode = false;

}

function drawTopNodes(list) {

    var nodeList = list;

    let nodesyPos = 0.7 * topSpaceHeight
    let topNodeRadius = 20;

    // console.log(nodeList)
    const xPosition = (d, i) => i * 50 + 60;
    // console.log(d);

    var node = topSpace.selectAll(".topnodes")
        .data(nodeList)
        .enter()
        .append("g")
        .attr("class", "topnodes")
        .attr("x", xPosition)
        .attr("y", "50%");


    d3.select(".multi-nodes").on("click", function () {
        if (!isMultiMode) {
            console.log("multi-mode")
            isMultiMode = true;
            graphExist = false;
            drawLayer.attr("height", "100%").attr("width", "100%");
            workSpace.selectAll("g").remove();
            workSpace.selectAll("text").text(null);
            node.remove();
            drawTopNodes(nodeList);
            d3.select(this).classed("multi-nodes-active", true);
            d3.select(".draw-undirected-line").on("click", drawUndirectedLine);
            d3.select(".draw-directed-line").on("click", drawDirectedLine);
            workContainer.append("button")
                .classed("build-query-btn", true)
                .html("Create Query")
                .on("click", packedQuery)
        } else {
            clearToolState();
            isMultiMode = false;
            drawLayer.attr("height", 0).attr("width", 0);
            drawLayer.selectAll("circle").remove();
            drawLayer.selectAll("line").remove();
            workSpace.selectAll("g").remove();
            workContainer.selectAll("button").remove();
            node.remove();
            drawTopNodes(nodeList);
            d3.select(this).classed("multi-nodes-active", false);
            //reset array
            // udList.length = 0
            // dList.length = 0
            packList.length = 0
            packCount = 1;
        }
    })

    if (!isMultiMode) {
        node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
    } else {
        node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragendedMulti));
    }

    node
        .append("circle")
        .attr("cx", xPosition)
        .attr("cy", nodesyPos)
        .attr("r", topNodeRadius);

    node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr("x", xPosition)
        .attr("y", nodesyPos)
        .style('font-size', '13px')
        .attr('fill', 'white')
        .text(d => d.slice(0, 3))

    // getHeatmap()

    //Data exchange
    function createQuery(d) {
        // postQuery(d, 4);
        postQuery(d, 4);
        postSubQuery(7);
        // console.log(postQuery(d, 4));
        topSpace.selectAll(".topnodes").remove();
        drawTopNodes(nodeList)
        setTimeout(() => {
            // drawGraph("graph-first", nodeMap);
            console.log(nodeMap_c);
            drawGraph("graph-first", nodeMap_c);
            secondGraphExist = false;
        }, 200);
    }

    function packedQuery() {
        clearToolState();
        isMultiMode = false;
        drawLayer.attr("height", 0).attr("width", 0);
        drawLayer.selectAll("circle").remove();
        drawLayer.selectAll("line").remove();
        workSpace.selectAll("g").remove();
        workContainer.selectAll("button").remove();
        node.remove();
        drawTopNodes(nodeList);
        d3.select(this).classed("multi-nodes-active", false);
        //reset array
        packCount = 1;
        drawLayer.selectAll("rect").each(
            function (d) {
                packLinkList.push([d, d3.select(this).attr("class").replace(" con-rect", "")]);
            }
        )
        console.log(packLinkList);
        createQuery("Theatre");
    }
    //drag top nodes
    function dragstarted(d) {
        let draggingNode = globalDragLayer
            .attr("height", "100%")
            .attr("width", "100%")
            .append("g")
            .attr("class", "dragging-node topnodes");

        draggingNode.append("circle")
            .attr("cx", d3.select(this).select("circle").attr("cx"))
            .attr("cy", d3.select(this).select("circle").attr("cy"))
            .attr("r", topNodeRadius + 5);
        // .attr("stroke", "#CCC");

        draggingNode.append("text")
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr("x", d3.select(this).select("text").attr("x"))
            .attr("y", d3.select(this).select("text").attr("y"))
            .attr("fill", d3.select(this).select("text").attr("fill"))
            .style('font-size', '15px')
            .text(d.slice(0, 3))

        d3.select(this)
            .attr("opacity", 0)

    }

    function dragged(d) {
        dpx = event.pageX;
        dpy = event.pageY;
        globalDragLayer.select(".dragging-node").select("circle")
            .attr("cx", dpx).attr("cy", dpy)

        globalDragLayer.select(".dragging-node").select("text")
            .attr("x", dpx).attr("y", dpy)

        d3.select(this).select("text").attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
        d3.select(this).select("circle").attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }; //???????


    function dragended(d) {
        let endXPos = event.pageX,
            endYPos = event.pageY;

        if (endYPos > topSpaceHeight) { //judge height space

            globalDragLayer.select(".text").select("text").remove();
            globalDragLayer.select(".dragging-node").select("circle")
                .transition().duration(200)
                .attr("cx", workSpaceWidth / 2)
                .attr("cy", topSpaceHeight + workSpaceHeight / 2)
                .attr("opacity", 1)
                .transition().duration(300)
                .attr("r", 80)
                .attr("opacity", 0.1);

            setTimeout(() => {
                globalDragLayer.selectAll("g").remove();
                globalDragLayer.attr("width", 0).attr("height", 0);
                let thisNode = d;
                nodeList = nodeList.filter((d, i) => d !== thisNode) // filter this node id, remove from top nodes
                console.log(nodeList)
                if (graphExist == false) {
                    createQuery(d);
                } else {
                    workSpace.selectAll("g").remove();
                    leftContainer.selectAll(".tooltip").remove();
                    createQuery(d);
                    graphLeftPlusExist = false;
                    graphRightPlusExist = false;
                }
            }, 500)

        } else {
            topSpace.selectAll(".topnodes").remove();
            globalDragLayer.selectAll("g").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            drawTopNodes(nodeList)
        }
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


            drawLayerNode.call(d3.drag().on("drag", draggedInMultiDraw))

            // console.log(d, typeof(d));
            drawLayerNode
                // .selectAll("circle")
                .datum(d)
                // .enter()
                .append("circle")
                .attr("cx", endXPos)
                .attr("cy", endYPos - topSpaceHeight)
                .attr("r", topNodeRadius + 5)
                .attr("fill", "#4F4688")
                .attr("stroke", "#CCC")
                .attr("stroke-width", 1.5)

            drawLayerNode.append("text")
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .attr("x", endXPos)
                .attr("y", endYPos - topSpaceHeight)
                .attr("fill", "#fff")
                .style('font-size', '15px')
                .text(d.slice(0, 3))

        } else {
            topSpace.selectAll(".topnodes").remove();
            globalDragLayer.selectAll("g").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            drawTopNodes(nodeList)
            // .call(d3.drag().on("drag",draggedInMultiDraw))
        }


        // console.log("end");
    }

    function draggedInMultiDraw(d) {
        let dx = d3.event.x,
            dy = d3.event.y;
        d3.select(this).select("circle").attr("cx", dx);
        d3.select(this).select("circle").attr("cy", dy);
        d3.select(this).select("text").attr("x", dx);
        d3.select(this).select("text").attr("y", dy);
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

            console.log(drawLayer.selectAll(".con-rect"));
            // console.log(drawLayer.select("rect").attr("x"))
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
                    console.log([fromNode, toNode]);
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
            console.log(lineX, lineY, boxX, boxY, boxWitdth, boxHeight)
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
                        .attr("stroke", "#999")
                    // .attr("stroke-width", 1.5)
                    lineCount += 1;
                    // line.lower();
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
            leftContainer.selectAll(".brush-menu-container").remove();
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
                let menuContainer = leftContainer.append("div")
                    .attr("class", "brush-menu-container")
                    .style("position", "absolute")
                    .style("top", `${y0+topSpaceHeight}px`)
                    .style("left", `${x1}px`)

                let menuPack = menuContainer
                    .append("button")
                    .attr("class", "brush-menu")
                    // .append("span")
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

                menuPack.on("click", function () {
                    console.log(selectedNodes.data());
                    // console.log(selectedNodes.data().length);
                    if (selectedNodes.size() > 1) {
                        // console.log(lineList);
                        // let xPos = d3.min(xPosList)

                        let conContainer = drawLayer
                            .append("rect")
                            .attr("class", "con-rect")
                            .attr("x", xPos).attr("y", yPos)
                            .attr("height", rectHeight)
                            .attr("width", rectWidth)
                            .attr("stroke", "#393261")
                            .datum(packCount)

                        conContainer
                            .lower()
                            .transition().delay(150).duration(200)
                            .attr("stroke", "#855B9C");

                        drawLayer.selectAll(".selected")
                            .transition().duration(300)
                            .attr("fill", "#5F5985");
                        packList.push([packCount, lineList]);
                        console.log(packList);
                        packCount += 1;
                        clearBrushLayer();
                    } else {
                        clearBrushLayer();
                    }


                })
            } else {
                console.log("not enough nodes")
                // brushLayer.call(brush.clear);
                // drawLayer.selectAll("circle").classed("selected", false);
            }

            function clearBrushLayer() {
                leftContainer.selectAll(".brush-menu-container").remove();
                // brushLayer.selectAll("rect").remove();
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
                // graphBg.on(".zoom", null);
                brushLayer.attr("width", "100%")
                    .attr("height", "100%")
                // .attr("y", "30%")
                brush(brushLayer);
                console.log("select-multi!")
            } else {
                selectModeButton.classed("tool-active", false);
                isSelectMode = false;
                brushLayer.on(".brush", null);
                brushLayer.attr("width", 0)
                    .attr("height", 0)
                // .attr("y", 0)
                // graphBg.call(zoom).on("dblclick.zoom", null);
            }
        }
    }

};


function postSubQuery(t) {
    axios.post('http://127.0.0.1:5000/receivedatac', {
            name: queryNode,
            time: t
        })
        .then(function (response) { // if success then update data
            subNodeMap = response.data;
        })
    // titletext.text("Routes of people who go to " + queryNode);

}

function postQuery(d, t) {
    queryNode = d;
    // console.log(d);
    axios.post('http://127.0.0.1:5000/receivedatac', {
            name: queryNode,
            time: t
        })
        .then(function (response) { // if success then update data
            nodeMap_c = response.data
            console.log(nodeMap_c)
        })
}
// drawLine("directed");

function getHeatmap() {

    axios.get('http://127.0.0.1:5000/heatmap')
        .then(function (response) { // if success then update data
            probHeatmap = response.data;
        });
}

function drawHeatmap(d) {
    let heatmapContainer = leftContainer.select(".heatmap-container")
    if (!isHeatmapActive) {
        // console.log(heatmap);
        d3.select(this).classed("heatmap-button-active", true);
        d3.select(this).select("path").attr("fill", "#fff")
        heatmapContainer.classed("heatmap-container-active", true);
        let heatmapWidth = 0.4 * width;
        let heatmapHeight = 0.6 * height;
        // let heatmap = heatmapContainer.append("svg")
        setTimeout(() => {
            let heatmap = heatmapContainer.append("svg")
                .attr("id", "heatmap")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("fill", "white");
            let heatmap_x = d3.map(probHeatmap, d => d.place2).keys();
            let heatmap_y = d3.map(probHeatmap, d => d.place1).keys();

            //x axis
            let x = d3.scaleBand()
                .range([0, 0.7 * heatmapWidth])
                .domain(heatmap_x)
                .padding(0.05)
            heatmap.append("g")
                .attr("transform", `translate(${0.2 * heatmapWidth},${0.85 * heatmapHeight})`)
                .classed("heatmap-axis", true)
                .call(d3.axisBottom(x).tickSize(0))
                .select(".domamin").remove()
                .attr("stroke", "white")

            //y axis
            let y = d3.scaleBand()
                .range([0.7 * heatmapHeight, 0])
                .domain(heatmap_y)
                .padding(0.05)
            heatmap.append("g")
                .attr("transform", `translate(${0.2 * heatmapWidth},${0.15 * heatmapHeight})`)
                .classed("heatmap-axis", true)
                .call(d3.axisLeft(y).tickSize(0))
                .select(".domamin").remove()

            let heatmapColorScale = d3.scaleSequential(d3.interpolateBlues)
                .domain([0, d3.max(probHeatmap, d => d.prob)])

            let tooltip = heatmapContainer
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")

            function heatmapMouseover(d) {
                tooltip
                    .style("opacity", 1)
                d3.select(this)
                    .style("stroke", "#154360")
                    .style("opacity", 1)
            }

            function heatmapMousemove(d) {
                tooltip
                    .html("The prob from " + d.place1 + " to " + d.place2 + " is: " + parseFloat(d.prob).toFixed(2))
                    .style("left", (d3.mouse(this)[0] + 70) + "px")
                    .style("top", (d3.mouse(this)[1]) + "px")
            }

            function heatmapMouseleave(d) {
                tooltip
                    .style("opacity", 0)
                d3.select(this)
                    .style("stroke", "none")
                    .style("opacity", 0.9)
            }

            heatmap.selectAll()
                .data(probHeatmap, d => d.place1 + ":" + d.place2)
                .enter()
                .append("rect")
                .attr("x", d => x(d.place2) + 0.2 * heatmapWidth)
                .attr("y", d => y(d.place1) + 0.15 * heatmapHeight)
                // .attr("rx", 4)
                // .attr("ry", 4)
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", d => heatmapColorScale(d.prob))
                .style("stroke-width", 3)
                .style("stroke", "none")
                .style("opacity", 0.9)
                .on("mouseover", heatmapMouseover)
                .on("mousemove", heatmapMousemove)
                .on("mouseleave", heatmapMouseleave)
        }, 300);

        isHeatmapActive = true;

    } else {
        isHeatmapActive = false;
        d3.select(this).classed("heatmap-button-active", false);
        heatmapContainer.selectAll("svg").remove();
        heatmapContainer.classed("heatmap-container-active", false);
        d3.select(this).select("path").attr("fill", "#4F4688")
    }
}
// drawGraph();





function drawGraph(graphid, graph) {

    let graphRightPlusExist = false;
    let graphLeftPlusExist = false;

    staSpace.selectAll("g").remove();

    graphExist = true;
    
    d3.selectAll(".brush-child").classed("hide", true);

    const graphCenter = [workSpaceWidth / 2, workSpaceHeight / 2];
    // console.log(graphCenter[0], graphCenter[1])
    //Draw workspace background
    let graphBg = workSpace
        .append("g")
        .attr("id", graphid)
    // .attr("y", "30%");

    graphBg
        .append("rect")
        .classed("graph-background", true)
        .attr("fill", "#CCC")
        .attr("opacity", .25)
        .attr("width", "100%")
        .attr("height", "100%")
    // .attr("y", "30%");

    let graphContainer = graphBg.append("g")
        .attr("id", "graphContainer");

    //Create zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 1.5])
        .on("zoom", zoom_actions);

    function zoom_actions() {
        graphContainer.attr("transform", d3.event.transform)
    }

    // zoom(graphBg);
    graphBg.call(zoom).on("dblclick.zoom", null);

    //display side tab menu
    d3.select("#staTab").classed("hide", false)
    //draw sta cards
    let staCardHeight = 2 * staSpaceWidth / 3;

    function drawStaCards() {
        //Create sta cards
        const staCardList = [{
            "category": "general",
            "type": "pie",
            "name": "sta1"
        }, {
            "category": "general",
            "type": "bar",
            "name": "sta2"
        }, {
            "category": "business",
            "type": "pie",
            "name": "sta3"
        }, {
            "category": "business",
            "type": "bar",
            "name": "sta4"
        }, {
            "category": "consumer",
            "type": "pie",
            "name": "sta5"
        }, {
            "category": "consumer",
            "type": "bar",
            "name": "sta6"
        }]

        //Create background   
        var staCards = staSpace.selectAll(".stacard")
            .data(staCardList).enter()
            .append("g")
            .classed("stacard", true)
            .attr("class", d => (d.category + " " + d.type))
            .attr("id", d => d.name)
            .attr("width", "100%")
            .attr("height", staCardHeight)
            // .attr("fill", "#CCC")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))

        staCards
            .append("rect")
            .attr("class", "stacard-bg")
            .attr("x", "2.5%")
            .attr("width", "95%")
            .attr("height", staCardHeight)
            .attr("fill", "#EEE")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))

        staSpace.attr("height", 300 + staCardList.length * (30 + staCardHeight))
    }

    drawStaCards();
    var supplierHeight = parseFloat(d3.select("#sta2").attr("y")) + 2 * staCardHeight / 3
    var customerHeight = parseFloat(d3.select("#sta4").attr("y")) + 2 * staCardHeight / 3

    d3.selectAll(".sta-button")
        .on("click", clickStaTab)
    var isTabClicked = false;

    function clickStaTab() {
        isTabClicked = true;
        let id = d3.select(this).attr("id");
        if (id === "G") {
            staContainer.node().scrollTo({
                top: 0,
                behavior: "smooth"
            });
            d3.select("#G").classed("sta-button-active", true);
            d3.select("#S").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "S") {
            staContainer.node().scrollTo({
                top: supplierHeight,
                behavior: "smooth"
            })
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#S").classed("sta-button-active", true);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "C") {
            staContainer.node().scrollTo({
                top: customerHeight,
                behavior: "smooth"
            })
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#S").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", true);
        }
        setTimeout(() => {
            isTabClicked = false;
            checkScroll();
        }, 1500)

    }
    staContainer.node().onscroll = checkScroll;

    function checkScroll() {
        let sTop = staContainer.node().scrollTop;
        if (!isTabClicked) {
            if (sTop < supplierHeight) {
                d3.select("#G").classed("sta-button-active", true);
                d3.select("#S").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", false);
            } else if (sTop >= supplierHeight && sTop < customerHeight) {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#S").classed("sta-button-active", true);
                d3.select("#C").classed("sta-button-active", false);
            } else {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#S").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", true);
            }
        }

        console.log("scroll!", sTop);
    }
    //brush - select

    brush.on("start", brushstart)
        .on("brush", brushed)
        .on("end", brushpopup);

    function brushstart() {
        leftContainer.selectAll(".brush-menu").remove();
        console.log("start")
    };

    function brushed() {
        let selection = d3.event.selection;
        if (selection != null) {
            let [
                [x0, y0],
                [x1, y1]
            ] = selection;
            var nodes = workSpace.selectAll("circle")
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
        let selection = d3.event.selection;

        if (selection != null) {
            let [
                [x0, y0],
                [x1, y1]
            ] = selection;

            let menuContainer = leftContainer.append("div")
                .attr("class", "brush-menu-container")
                .style("position", "absolute")
                .style("top", `${y0+topSpaceHeight}px`)
                .style("left", `${x1}px`)

            let menuAnd = menuContainer
                .append("button")
                .attr("class", "brush-menu")
                // .append("span")
                .html("PACK")

            let selectedNodes = d3.selectAll(".selected")

            menuAnd.on("click", function () {
                console.log(selectedNodes);
            })

        }
    }

    // var isSelectMode = false;
    let selectModeButton = d3.select(".select-mode")
    selectModeButton.on("click", selectMode)

    function selectMode() {
        if (!isSelectMode) {
            clearToolState();
            selectModeButton.classed("tool-active", true);
            isSelectMode = true;
            graphBg.on(".zoom", null);
            brushLayer.attr("width", "100%")
                .attr("height", "100%")
            // .attr("y", "30%")
            brush(brushLayer);
            console.log("select!")
        } else {
            selectModeButton.classed("tool-active", false);
            isSelectMode = false;
            brushLayer.on(".brush", null);
            brushLayer.attr("width", 0)
                .attr("height", 0)
                .attr("y", 0)
            graphBg.call(zoom).on("dblclick.zoom", null);
        }
    }

    //add graph
    if (graphid === "graph-first") {
        d3.select(".add-graph")
            .on("click", addGraph)

        function addGraph() {
            secondGraphExist = true;

            graphBg.attr("width", "50%")
            graphBg.selectAll(".graph-background")
                .attr("width", "50%");
            graphBg.selectAll(".after-controller")
                .attr("x", "45%")

            zoom.transform(graphBg, d3.zoomIdentity.translate(-workSpaceWidth / 4, 0))
            zoom.scaleBy(graphBg, 0.7, [workSpaceWidth / 4, workSpaceHeight / 2])

            drawGraph("graph-second", subNodeMap)
            // callSecondBrush();
            console.log("clicked!")

            //Display second brush
            d3.selectAll(".brush-child").classed("hide", false)
        }
    } else if (graphid === "graph-second") {
        d3.select(".add-graph")
            .classed("hide", true);

        graphBg.attr("width", "50%")
        graphBg.selectAll(".graph-background")
            .attr("width", "50%")
            .attr("x", "50%");
        const scalePoint = [0, 0]
        zoom.transform(graphBg, d3.zoomIdentity.translate(workSpaceWidth / 4, 0))
        zoom.scaleBy(graphBg, 0.7, [3 * workSpaceWidth / 4, workSpaceHeight / 2])

        workSpace.append("g")
            .append("line")
            .attr("x1", graphCenter[0])
            .attr("y1", 0.15 * workSpaceHeight)
            .attr("x2", graphCenter[0])
            .attr("y2", 0.85 * workSpaceHeight)
            .attr("stroke", "black")
            .attr("stroke-width", "3px");
    }

    //Pie around center node
    //Calculate pie chart data
    //Draw links & nodes
    function MainLayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-workSpaceHeight / 4, workSpaceHeight / 4])
            .domain([0, subC - 1]);
        return scaler(subID);
    }


    let linkScaler = d3.scaleLinear()
        .range([1, 5])
        .domain([1, d3.max(graph.link, d => d.count)])

    let rightCountSum = d3.sum(graph.link.filter(d => d.sequence == 1), d => d.count)
    let leftCountSum = d3.sum(graph.link.filter(d => d.sequence == -1), d => d.count)

    let link = graphContainer.append('g')
        .attr("id", "link")

    let linkRight = link.append("g")
        .selectAll("line")
        .data(graph.link.filter(d => d.sequence == 1))
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => linkScaler(d.count))
        .attr("x1", d => graphCenter[0])
        .attr("y1", d => graphCenter[1])
        .attr("x2", d => graphCenter[0] + d.sequence * 100)
        .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, d.sublink_count));

    var txtOffset = -20

    let linkLeft = link.append("g")
        .selectAll("line")
        .data(graph.link.filter(d => d.sequence == -1))
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => linkScaler(d.count))
        .attr("x1", d => graphCenter[0])
        .attr("y1", d => graphCenter[1])
        .attr("x2", d => graphCenter[0] + d.sequence * 100)
        .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, d.sublink_count));

    let rightText = link.append("g")
        .selectAll("text")
        .data(graph.link.filter(d => d.sequence == 1)).enter()
        .append("text")
        .attr("class", "link-text")
        .attr("x", d => 0.5 * (graphCenter[0] + graphCenter[0] + d.sequence * 100))
        .attr("y", (d, i) => txtOffset + 0.5 * (graphCenter[1] + graphCenter[1] + MainLayoutScaler(i, d.sublink_count)))
        .text(d => d.count * 10)
        .classed("text-hide", true)

    let leftText = link.append("g")
        .selectAll("text")
        .data(graph.link.filter(d => d.sequence == -1)).enter()
        .append("text")
        .attr("class", "link-text")
        .attr("x", d => 0.5 * (graphCenter[0] + graphCenter[0] + d.sequence * 100))
        .attr("y", (d, i) => txtOffset + 0.5 * (graphCenter[1] + graphCenter[1] + MainLayoutScaler(i, d.sublink_count)))
        .text(d => d.count * 10)
        .classed("text-hide", true)

    let node = graphContainer.append("g")
        .attr("id", "nodes");

    let nodeRight = node.append("g")
        .selectAll("circle")
        .data(graph.node.filter(d => d.sequence == 1))
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => linkRight.filter(l => l.target == d.target).attr("x2"))
        .attr("cy", d => linkRight.filter(l => l.target == d.target).attr("y2"))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked)
        .on("mouseover", NodeMouseOver)
        .on("mouseleave", NodeMouseLeave);

    let nodeLeft = node.append("g")
        .selectAll("circle")
        .data(graph.node.filter(d => d.sequence == -1))
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => linkLeft.filter(l => l.target == d.target).attr("x2"))
        .attr("cy", d => linkLeft.filter(l => l.target == d.target).attr("y2"))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked)
        .on("mouseover", NodeMouseOver)
        .on("mouseleave", NodeMouseLeave);

    let centernode = node.append("g")
        .attr("id", "queryNode")
        .selectAll("circle")
        .data(graph.node.filter(d => d.sequence == 0))
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 30)
        .attr("cx", d => graphCenter[0] + d.sequence * 100)
        .attr("cy", graphCenter[1])
        .on("click", clicked);

    let linkRightplus = new Array();
    let nodeRightplus = new Array();
    let linkLeftplus = new Array();
    let nodeLeftplus = new Array();

    function dragged(d) {
        console.log(event.pageX)
        // console.log(d);
        graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
        d.x = d3.event.x, d.y = d3.event.y;
        d3.select(this).attr("stroke", "#18569C");
        d3.select(this).attr("cx", d.x).attr("cy", d.y);
        // console.log(d.data.sequence);
        linkRight.filter(
            l => l.source == d.target
        ).attr("x1", d.x).attr("y1", d.y);
        linkRight.filter(
            l => l.target == drawDirectedLineMode.target
        ).attr("x2", d.x).attr("y2", d.y);
        linkLeft.filter(
            l => l.source == d.target
        ).attr("x1", d.x).attr("y1", d.y);
        linkLeft.filter(
            l => l.target == d.target
        ).attr("x2", d.x).attr("y2", d.y);

        if (graphRightPlusExist) {
            linkRightplus[2].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        if (graphLeftPlusExist) {
            linkLeftplus[2].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        // console.log(d.id);
        drawsta();
        text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
    }
    //Click node event
    function clicked(d) {
        drawsta();
        text.text('Place: ' + d.place + "  |  Frequecy: " + d.count)
        graphContainer.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
    }

    //Add steps control
    graphBg.append("g")
        .on("click", afterplus)
        .append('text')
        .attr("class", "after-controller")
        .text("➕")
        .attr("x", "95%")
        .attr("y", "48%")

    graphBg.append("g")
        .on("click", afterminus)
        .append('text')
        .attr("class", "after-controller")
        .text("➖")
        .attr("x", "95%")
        .attr("y", "54%")

    graphBg.append("g")
        .on("click", beforeplus)
        .append('text')
        .attr("class", "before-controller")
        .text("➕")
        .attr("x", "5%")
        .attr("y", "48%")

    graphBg.append("g")
        .on("click", beforeminus)
        .append('text')
        .attr("class", "before-controller")
        .text("➖")
        .attr("x", "5%")
        .attr("y", "54%")

    if (graphid === "graph-second") {
        graphBg.selectAll(".before-controller")
            .attr("x", "55%")
    }

    let rseq = 2;
    let lseq = 2;
    let maxseq = 4;

    function afterplus() {
        if (rseq <= maxseq) {
            drawRightplus(rseq);
        }

        if (rseq < maxseq + 1) {
            rseq += 1;
        }
    }

    function beforeplus() {
        if (lseq <= maxseq) {
            drawLeftplus(lseq);
            if (lseq < maxseq + 1) {
                lseq += 1;
            }
        }
    }

    function afterminus() {
        d3.selectAll(`#seq${rseq-1}`).remove();
        if (rseq > 2) {
            rseq -= 1
        }

    }

    function beforeminus() {
        d3.selectAll(`#seq${-lseq+1}`).remove();
        if (lseq > 2) {
            lseq -= 1
        }
    }

    function drawRightplus(seq) {

        graphRightPlusExist = true;

        //Calculate vertical layout
        if (seq === 2) {
            linkRightplus[seq] = link.append("g")

                .attr("id", `seq${seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => nodeRight.filter(n => n.target == d.source).attr("cx"))
                .attr("y1", d => nodeRight.filter(n => n.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeRight.filter(n => n.target == d.source).attr("cx")) + 80)
                .attr("y2", d => parseFloat(nodeRight.filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeRightplus[seq] = node.append("g")

                .attr("id", `seq${seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkRightplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mouseleave", NodeMouseLeave);

            linkRightplus[seq]
                .attr("y2", d => nodeRightplus[seq].filter(n => n.target === d.target).attr("cy"))
        } else {

            linkRightplus[seq] = link.append("g")
                .attr("id", `seq${seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                .attr("y1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                .attr("x2", d => parseFloat(linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2")) + 80)
                .attr("y2", d => parseFloat(linkRightplus[seq - 1].filter(l => l.target == d.source).attr("y2")) + LayoutScaler(d.sub_id, d.sublink_count));


            nodeRightplus[seq] = node.append("g")
                .attr("id", `seq${seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkRightplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mouseleave", NodeMouseLeave);

            linkRightplus[seq]
                .attr("y2", d => nodeRightplus[seq].filter(n => n.target === d.target).attr("cy"))
        }
        link.append("g")
            .selectAll("text")
            .data(graph.link.filter(d => d.sequence == seq)).enter()
            .append("text")
            .attr("class", "link-text")
            .attr("x", d => 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
            .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
            .text(d => d.count * 10)
            .classed("text-hide", true)

        function dragged(d) {
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            linkRightplus[seq].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkRightplus[seq].filter(
                l => l.target == d.target
            ).attr("x2", d.x).attr("y2", d.y);
            if (linkRightplus[seq + 1] != undefined) {
                linkRightplus[seq + 1].filter(
                    l => l.source == d.target
                ).attr("x1", d.x).attr("y1", d.y);
            }
            drawsta();

            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
        }

        function clicked(d) {
            console.log("clicked");
            drawsta();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
            graphContainer.selectAll("circle").attr("stroke", "#fff")
            d3.select(this).attr("stroke", "#18569C")
        }


    }

    function drawLeftplus(seq) {

        graphLeftPlusExist = true;

        //Calculate vertical layout

        if (seq == 2) {
            linkLeftplus[seq] = link.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => nodeLeft.filter(n => n.target == d.source).attr("cx"))
                .attr("y1", d => nodeLeft.filter(n => n.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeLeft.filter(n => n.target == d.source).attr("cx")) - 80)
                .attr("y2", d => parseFloat(nodeLeft.filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mouseleave", NodeMouseLeave);

            linkLeftplus[seq]
                .attr("y2", d => nodeLeftplus[seq].filter(n => n.target === d.target).attr("cy"))
        } else {
            linkLeftplus[seq] = link.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                .attr("y1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                .attr("x2", d => parseFloat(linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2")) - 80)
                .attr("y2", d => parseFloat(linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("y2")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mouseleave", NodeMouseLeave);

            linkLeftplus[seq]
                .attr("y2", d => nodeLeftplus[seq].filter(n => n.target === d.target).attr("cy"))
        }

        link.append("g")
            .selectAll("text")
            .data(graph.link.filter(d => d.sequence == -seq)).enter()
            .append("text")
            .attr("class", "link-text")
            .attr("x", d => 0.5 * (
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
            .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
            .text(d => d.count * 10)
            .classed("text-hide", true)

        function dragged(d) {
            // console.log(d);
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            // console.log(link.selectAll(`seq${seq}`), linkRightplus[seq])
            linkLeftplus[seq].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkLeftplus[seq].filter(
                l => l.target == d.target
            ).attr("x2", d.x).attr("y2", d.y);
            if (seq < lseq && linkLeftplus[seq + 1] != undefined) {
                linkLeftplus[seq + 1].filter(
                    l => l.source == d.target
                ).attr("x1", d.x).attr("y1", d.y);
            }

            drawsta();

            text.text('Place: ' + d.place + "  |  Frequecy: " + d.count)
        }

        function clicked(d) {
            console.log("clicked");
            d3.selectAll(".samplePie").remove();
            drawsta();
            text.text('Place: ' + d.place + "  |  Frequecy: " + d.count)
            graphContainer.selectAll("circle").attr("stroke", "#fff")
            d3.select(this).attr("stroke", "#18569C")
        }
    }

    function LayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-30, 30])
            .domain([0.4, subC + 0.6]);
        return scaler(subID);
    }

    function NodeMouseOver(d) {
        node.selectAll("circle").filter(n => n.sequence !== 0).classed("not-this-route", true)
        link.selectAll("line").classed("not-this-route", true)
        link.selectAll("text").classed("not-this-route", true)

        d.route.forEach(function (r) {
            // console.log(r)
            node.selectAll("circle").filter(".not-this-route")
                .classed("this-route", n => isInRoute(r, n.route))
            node.selectAll("circle").filter(".this-route")
                .classed("not-this-route", !(n => isInRoute(r, n.route)))
            link.selectAll("line").filter(".not-this-route")
                .classed("this-route", l => isInRoute(r, l.route))
            link.selectAll("line").filter(".this-route")
                .classed("not-this-route", !(l => isInRoute(r, l.route)))

            link.selectAll("text").filter(".not-this-route")
                .classed("this-route", (l => isInRoute(r, l.route)))
            link.selectAll("text").filter(".this-route")
                .classed("not-this-route", !(l => isInRoute(r, l.route)))
            // link.selectAll("text").each(l => console.log(l.route))
            // link.selectAll("text").filter(".hide").each(console.log(l => isInRoute(r, l.route)))
        })

        node.selectAll("circle").filter(n => n.sequence === 0).classed("this-route", true)
        // console.log(node.selectAll("circle").filter(".this-route"))

        function isInRoute(single, group) {

            if (group.indexOf(single) !== -1) {
                // console.log(single, group, true);
                return true
            } else {
                // console.log(single, group, false);
                return false
            }
        }


    }

    function NodeMouseLeave(d) {
        node.selectAll("circle").classed("this-route", false);
        node.selectAll("circle").classed("not-this-route", false);
        link.selectAll("line").classed("this-route", false);
        link.selectAll("line").classed("not-this-route", false)
        link.selectAll("text").classed("this-route", false)
        link.selectAll("text").classed("not-this-route", false)

    }
    //IF HAVE TIME TRY TO USE FORCE GRAPH
    function drawRightplusForce(seq) {
        let simulation = d3.forceSimulation();

    }

    workSpace.selectAll("#conditionBox").remove();

    let conditionBox = graphBg.append("g")
        .attr("id", "conditionBox")

    if (graphid === "graph-first") {
        conditionCount = 0;
    }

    function initializeConditionBox() {
        conditionBox.append("rect")
            .attr("x", "45%")
            .attr("y", "90%")
            .attr("height", "7%")
            .attr("width", "10%")
            .attr("fill", "#808080")
            .attr("opacity", .5)

        conditionBox.append("text")
            .attr("x", "50%")
            .attr("y", "93.5%")
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(`Conditions(${conditionCount})`)
            .attr("fill", "#2B2B2B")

        if (conditionCount === 0) {
            conditionBox.selectAll("text").attr("opacity", .5)
        } else {
            conditionBox.selectAll("text").attr("opacity", .5)
                .attr("opacity", 1).attr("fill", "#CACACA");
            conditionBox.select("rect").attr("opacity", .8)
                .attr("fill", "#40496C");
        }
    }

    initializeConditionBox();

    let conditionBoxPos = conditionBox.node().getBoundingClientRect();

    function drawsta() {
        console.log("draw");
        staSpace.selectAll(".samplePie").remove();
        staSpace.selectAll(".sampleBar").remove();
        drawsamplepie("#sta1");
        drawsamplebar("#sta2");
        drawsamplepie("#sta3");
        drawsamplepie("#sta4");
        drawsamplebar("#sta5");
        drawsamplebar("#sta6");
    }

    //draw sample pie chart
    function drawsamplepie(id) {
        let fakeData = [{
                "label": "one",
                "value": 20
            },
            {
                "label": "two",
                "value": 50
            },
            {
                "label": "three",
                "value": 30
            }
        ];

        let samplePieColorScale = d3.schemeTableau10;

        let samplePie = staSpace.select(id).append("g")
            .attr("class", "samplePie")

        let arcSample = d3.arc()
            .outerRadius(75)
            .innerRadius(0)

        let spConverter = d3.pie().value(d => d.value)

        samplePie.selectAll("path")
            .data(spConverter(fakeData))
            .enter()
            .append("path")
            .attr('transform', `translate(${staSpaceWidth/2}, 
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/2)})`)
            .attr("fill", (d, i) => samplePieColorScale[i])
            .attr("d", arcSample)
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

        staSpace.select(id)
            .append("g")
            .attr("class", "samplePie")
            .attr('transform', `translate(${ staSpaceWidth / 5},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/8)})`)
            .append("text")
            .text(d => d.category + " " + id)
            .attr("x", 10)
            .attr("y", 10)

        function dragstarted(d) {
            let boundingPos = this.getBoundingClientRect();
            //Draw a same path on drag layer
            globalDragLayer
                .attr("height", "100%")
                .attr("width", "100%")
                .append("path")
                .attr("fill", d3.select(this).attr("fill"))
                .attr("d", d3.select(this).attr("d"))
                .attr("transform", `translate(${event.pageX}, ${event.pageY}) scale(1.2)`)
                .attr("stroke", "white")

            d3.select(this)
                .attr("opacity", 0)
        }

        function dragged(d) {
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this)
                .attr('transform', 'translate(' + d.x + ',' + d.y + ') ');
            dpx = d3.event.pageX;
            dpy = d3.event.pageY;
            globalDragLayer.selectAll("path")
                .attr("transform", "translate(" + event.pageX + "," + event.pageY + ") scale(1.2)")

        }

        function dragended(d) {
            let endXPos = event.pageX,
                endYPos = event.pageY;
            if (endXPos < conditionBoxPos.x + conditionBoxPos.width &&
                endXPos > conditionBoxPos.x &&
                endYPos < conditionBoxPos.y + conditionBoxPos.height &&
                endYPos > conditionBoxPos.y) {
                conditionCount += 1;
                conditionBox.select("text").text(`Conditions(${conditionCount})`)
                    .attr("opacity", 1).attr("fill", "#CACACA");
                conditionBox.select("rect").attr("opacity", .8)
                    .attr("fill", "#40496C");
            }
            globalDragLayer.selectAll("path").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            staSpace.select(id).selectAll("g").remove();
            drawsamplepie(id);
        }
    }

    function drawsamplebar(id) {
        let fakeData = [{
                "label": "one",
                "value": 20
            },
            {
                "label": "two",
                "value": 50
            },
            {
                "label": "three",
                "value": 30
            }
        ];
        let sampleBar = staSpace.select(id).append("g")
            .attr("class", "sampleBar")
            .attr('transform', `translate(${ staSpaceWidth / 4},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/4)})`)

        let barWidth = staSpaceWidth / 2
        let barHeight = staCardHeight / 2

        let xScale = d3.scaleLinear()
            .domain([0, d3.max(fakeData, d => d.value)])
            .range([0, barWidth]);

        let yScale = d3.scaleBand()
            // .rangeRoundBands([barHeight, 0], .1)
            .domain(fakeData.map(d => d.label))
            .range([0, barHeight])
            .padding(.3);

        sampleBar.selectAll("rect").data(fakeData)
            .enter().append("rect")
            .attr("y", d => yScale(d.label))
            .attr("width", d => xScale(d.value))
            .attr("height", yScale.bandwidth())
            .attr("fill", "#1771D8")
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

        staSpace.select(id)
            .append("g")
            .attr("class", "sampleBar")
            .attr('transform', `translate(${ staSpaceWidth / 5},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/8)})`)
            .append("text")
            .text(d => d.category + " " + id)
            .attr("x", 10)
            .attr("y", 10)

        function dragstarted(d) {
            //Draw a same path on drag layer
            globalDragLayer
                .attr("height", "100%")
                .attr("width", "100%")
                .append("rect")
                .attr("fill", d3.select(this).attr("fill"))
                .attr("width", d3.select(this).attr("width"))
                .attr("height", d3.select(this).attr("height"))
                .attr("transform", `translate(${event.pageX}, ${event.pageY}) scale(1.2)`)
                .attr("stroke", "white")

            d3.select(this)
                .attr("opacity", 0)
        }

        function dragged(d) {
            dpx = d3.event.pageX;
            dpy = d3.event.pageY;
            globalDragLayer.selectAll("rect")
                .attr("transform", `translate(${event.pageX}, ${event.pageY}) scale(1.2)`)
        }

        function dragended(d) {
            let endXPos = event.pageX,
                endYPos = event.pageY;
            if (endXPos < conditionBoxPos.x + conditionBoxPos.width &&
                endXPos > conditionBoxPos.x &&
                endYPos < conditionBoxPos.y + conditionBoxPos.height &&
                endYPos > conditionBoxPos.y) {
                conditionCount += 1;
                conditionBox.select("text").text(`Conditions(${conditionCount})`)
                    .attr("opacity", 1).attr("fill", "#CACACA");
                conditionBox.select("rect").attr("opacity", .8)
                    .attr("fill", "#40496C");
            }
            globalDragLayer.selectAll("rect").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            staSpace.select(id).selectAll("g").remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplebar(id);
        }

    }
    // });
}