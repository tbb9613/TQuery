// define data
var graph //nodemap data
var probHeatmap //heatmap data

var mainContainer = document.getElementById("mainContainer");
var width = mainContainer.clientWidth;
var height = mainContainer.clientHeight;
// console.log(width, height);
var topSpaceHeight = 0.3 * height;
var workSpaceHeight = 0.7 * height;
var workSpaceWidth = 0.7 * width;
var staSpaceWidth = 0.3 * width
var graphExist = false;

window.onresize = function () {
    getSize()
    this.console.log(workSpaceWidth)
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


var leftContainer = d3.select("#leftContainer")
var rightContainer = d3.select("#rightContainer")

//Add svg to left
var leftSvg = leftContainer.append("svg")
    .attr("id", "leftSpace")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidyMid slice")

var topSpace = leftSvg.append("g")
    .attr("id", "top");

//Draw topspace bg
topSpace.append("rect")
    .attr("id", "topSpace")
    .attr("fill", "#CCC")
    .attr("opacity", .1)
    .attr("width", "100%")
    .attr("height", "30%");

var workSpace = leftSvg.append("g")
    .attr("id", "work");

//make the workspace under topspace

//Add workspace text(interpretation of node map)
var titletext = workSpace.append("text")
    .attr("y", topSpaceHeight + 50)
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
map.on('moveend', function() { 
    let northEast = [map.getBounds()._northEast.lat, map.getBounds()._northEast.lng];
    let southWest = [map.getBounds()._southWest.lat, map.getBounds()._southWest.lng];
    console.log(northEast, southWest);
});



var staContainer = d3.select("#staContainer")

var staSpace = staContainer.append("svg")
    .attr("id", "staSpace")
    .attr("width", "100%")
    // .attr("height", "300%")
    .attr("overflow", "visible")

var text = staSpace.append("text")
    .attr("x", 100)
    .attr("y", 50)
    .attr("fill", "white")


var nodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];
// nodeList = d3.range(5)
drawTopNodes();
getHeatmap();


let isHeatmapActive = false;
d3.select(".heatmap-button").on("click", drawHeatmap)

function drawTopNodes() {

    console.log(nodeList)
    const xPosition = (d, i) => i * 50 + 60;
    // console.log(d);

    let node = topSpace.selectAll(".topnodes")
        .data(nodeList)
        .enter()
        .append("g")
        .attr("class", "topnodes")
        .attr("x", xPosition)
        .attr("y", "50%")
        .call(d3.drag().on("drag", dragged).on("end", dragended))

    node
        .append("circle")
        .attr("cx", xPosition)
        .attr("cy", topSpaceHeight / 2)
        .attr("r", 20);

    node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr("x", xPosition)
        .attr("y", topSpaceHeight / 2)
        .style('font-size', '13px')
        .attr('fill', 'white')
        .text(d => d.slice(0, 3))

    //draw transparent node on text
    node
        .append("circle")
        .attr("cx", xPosition)
        .attr("cy", topSpaceHeight / 2)
        .attr("r", 20)
        .attr("opacity", 0)



    // getHeatmap()
    //Data exchange
    function postQuery(d) {
        let queryNode = d;
        console.log(d);
        $.ajax({
            type: "POST",
            url: 'http://127.0.0.1:5000/receivedata', //send data by route
            dataType: 'json',
            data: JSON.stringify({
                name: queryNode,
                time: 3
            }),
            // data : JSON(queryNode),
            success: function (data) { // if success then update data
                graph = data
            }
        })
        titletext.text("Routes of people who go to " + queryNode);
        // console.log(graph);
    }

    function createQuery(d) {
        postQuery(d);
        setTimeout(() => {
            drawGraph("graph-first");
            topSpace.selectAll(".topnodes").remove();
            drawTopNodes()
        }, 500);
    }

    function dragged(d) {
        d3.select(this).select("text").attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
        d3.select(this).select("circle").attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        // console.log(d, d3.event.x)
    }; //???????
    //drag top nodes

    function dragended(d) {
        let endXPos = d3.event.x,
            endYPos = d3.event.y;
        if (endYPos > topSpaceHeight) { //judge height space
            d3.select(this)
                .select("circle")
                .transition().duration(200)
                .attr("cx", workSpaceWidth / 2)
                .attr("cy", topSpaceHeight + workSpaceHeight / 2)
                .attr("opacity", 1)
                .transition().duration(300)
                .attr("r", 80)
                .attr("opacity", 0.1);

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

        } else {
            // d3.select(this).attr("cx", d => d * 50 + 60).attr("cy", topSpaceHeight / 2)
            // topSpace.selectAll("circle").remove();
            topSpace.selectAll(".topnodes").remove();
            drawTopNodes()
        }
        console.log("end");
    }

};

function getHeatmap() {
    $.ajax({
        url: "http://127.0.0.1:5000/heatmap",
        dataType: "json",
        success: function (data) {
            probHeatmap = data
            // console.log(heatmap)
        }
    });
}

function drawHeatmap(d) {
    let heatmapContainer = leftContainer.select(".heatmap-container")
    if (!isHeatmapActive) {
        // console.log(heatmap);
        d3.select(this).classed("heatmap-button-active", true);
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

    }

}
// drawGraph();

function drawGraph(graphid) {

    let graphRightPlusExist = false;
    let graphLeftPlusExist = false;


    graphExist = true;

    const graphCenter = [workSpaceWidth / 2, topSpaceHeight + workSpaceHeight / 2];
    console.log(graphCenter[0], graphCenter[1])

    //Draw workspace background
    let graphBg = workSpace
        .append("g")
        .attr("id", graphid)
        .attr("y", "30%");

    graphBg
        .append("rect")
        .attr("fill", "#CCC")
        .attr("opacity", .25)
        .attr("width", "100%")
        .attr("height", "70%")
        .attr("y", "30%");

    let graphContainer = graphBg.append("g")
        .attr("id", "graphContainer");

    //Create zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 1.5])
        .on("zoom", zoom_actions);

    function zoom_actions() {
        graphContainer.attr("transform", d3.event.transform)
    }

    zoom(graphBg);

    //display side tab menu
    d3.select("#staTab").classed("hide", false)
    //draw sta cards
    let staCardHeight = 2 * staSpaceWidth / 3;
    function drawStaCards(){
        //Create sta cards
        // const staCardList = ["pie", "bar", "line"]
        const staCardList = [{
            "category" : "general",
            "type" : "pie",
            "name" : "sta1"
        },{
            "category" : "general",
            "type" : "bar",
            "name" : "sta2"
        },{
            "category" : "business",
            "type" : "pie",
            "name" : "sta3"
        },{
            "category" : "business",
            "type" : "bar",
            "name" : "sta4"
        },{
            "category" : "consumer",
            "type" : "pie",
            "name" : "sta5"
        },{
            "category" : "consumer",
            "type" : "bar",
            "name" : "sta6"
        }]
        //Create background
        
        var staCards = staSpace.selectAll(".stacard")
            .data(staCardList).enter()
            .append("g")
            .classed("stacard", true)
            .attr("class", d => (d.category+" "+d.type))
            .attr("id", d => d.name)
            .attr("width", "100%")
            .attr("height", staCardHeight)
            // .attr("fill", "#CCC")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))
    
        staCards
            .append("rect")
            .attr("x", "2.5%")
            .attr("width", "95%")
            .attr("height", staCardHeight)
            .attr("fill", "#CCC")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))
    
        staSpace.attr("height", 300 + staCardList.length * (30 + staCardHeight))
    }

    drawStaCards();
    let businessHeight = parseFloat(d3.select("#sta2").attr("y")) + 2 * staCardHeight / 3
    let customerHeight = parseFloat(d3.select("#sta4").attr("y")) + 2 * staCardHeight / 3

    d3.selectAll(".sta-button")
        .on("click", clickStaTab)
    var isTabClicked = false;
    function clickStaTab(){
        isTabClicked = true;
        let id = d3.select(this).attr("id");
        if (id === "G") {
            staContainer.node().scrollTo({top: 0, behavior: "smooth"});
            d3.select("#G").classed("sta-button-active", true);
            d3.select("#B").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "B") {
            staContainer.node().scrollTo({top: businessHeight, behavior: "smooth"})
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#B").classed("sta-button-active", true);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "C") {
            staContainer.node().scrollTo({top: customerHeight, behavior: "smooth"})
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#B").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", true);
        }
        setTimeout(() =>{
            isTabClicked = false;
            checkScroll();
        }, 1500)
        
    }
    staContainer.node().onscroll = checkScroll;
    
    function checkScroll(){
        let sTop = staContainer.node().scrollTop;
        if (!isTabClicked) {
            if (sTop < businessHeight){
                d3.select("#G").classed("sta-button-active", true);
                d3.select("#B").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", false);
            } else if (sTop >= businessHeight && sTop < customerHeight) {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#B").classed("sta-button-active", true);
                d3.select("#C").classed("sta-button-active", false);
            }  else {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#B").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", true);
            }
        }

        console.log("scroll!", sTop);
    }
    

    //brush - select
    var brush = d3.brush()
        .extent([[0, topSpaceHeight], [workSpaceWidth, height]])
        .on("start brush", brushed)
        .on("end", brushpopup);

    function brushed(){
        let selection = d3.event.selection;
        if (selection != null){
            let [[x0, y0], [x1, y1]] = selection;
            let nodes = node.selectAll("circle")
            nodes.classed("selected", function(d) {return isInSelection(selection, 
            this.getBoundingClientRect().x + 0.5 * this.getBoundingClientRect().width, 
            this.getBoundingClientRect().y + 0.5 * this.getBoundingClientRect().height)})
        }
        function isInSelection(brush_coords, cx, cy){
            let x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; 
        }
    }
    function brushpopup(){
        let selection = d3.event.selection;
        if (selection != null){
            
        }
    }

    var isSelectMode = false;
    let selectModeButton = d3.select(".select-mode")
    selectModeButton.on("click", selectMode)
    function selectMode(){
        if (!isSelectMode) {
            selectModeButton.classed("select-mode-active", true);
            isSelectMode = true;
            graphBg.on(".zoom", null);
            brushLayer.attr("width", "70%")
                .attr("height", "100%")
                .attr("y", "30%")
            brush(brushLayer);
            console.log("select!")
        } else {
            selectModeButton.classed("select-mode-active", false);
            isSelectMode = false;
            brushLayer.on(".brush", null);
            brushLayer.attr("width", 0)
                .attr("height", 0)
                .attr("y", 0)            
            zoom(graphBg);
        }
    }
 
    
    if (graphid === "graph-first") {
        d3.select(".add-graph")
            .on("click", addGraph)
            
        function addGraph() {
            graphBg.attr("width", "50%")
            graphBg.selectAll("rect")
                .attr("width", "50%");
            zoom.transform(graphBg, d3.zoomIdentity.translate(-workSpaceWidth / 4, 0))
            zoom.scaleBy(graphBg, 0.7, [workSpaceWidth / 4, workSpaceHeight])

            drawGraph("graph-second")
            
            console.log("clicked!")
        }
    } else if (graphid === "graph-second") {

        d3.select(".add-graph")
            .classed("hide", true);
            // .style("display", "none")
            // .on("click", addGraph)

        graphBg.attr("width", "50%")
        graphBg.selectAll("rect")
            .attr("width", "50%")
            .attr("x", "50%");
        const scalePoint = [0, 0]
        zoom.transform(graphBg, d3.zoomIdentity.translate(workSpaceWidth / 4, 0))
        zoom.scaleBy(graphBg, 0.7, [3 * workSpaceWidth / 4, workSpaceHeight])

        workSpace.append("g")
            .append("line")
            .attr("x1", graphCenter[0])
            .attr("y1", topSpaceHeight)
            .attr("x2", graphCenter[0])
            .attr("y2", topSpaceHeight + workSpaceHeight)
            .attr("stroke", "black")
            .attr("stroke-width", "3px");

        console.log("second-layout done!")
    }

    //Pie around center node
    //Calculate pie chart data
    let nodeRightPieData = graph.filter(d => d.sequence == 1);
    let nodeLeftPieData = graph.filter(d => d.sequence == -1);
    let centerNodePieData = graph.filter(d => d.sequence == 0)
    let nodePieStartAngle = 20;
    let nodePieEndAngle = 160;
    let rightCountSum = d3.sum(nodeRightPieData, d => d.count); //here count = frequency
    let leftCountSum = d3.sum(nodeLeftPieData, d => d.count);
    //define pie around node
    let pieColorScale = d3.schemeCategory10; //define color scale

    let arc = d3.arc()
        .innerRadius(20)
        .outerRadius(50);

    let rightdraw = d3.pie()
        .value(d => d.count)
        .sort(null)
        .startAngle(nodePieStartAngle * (Math.PI / 180))
        .endAngle(nodePieEndAngle * (Math.PI / 180))
        .padAngle(0.01);

    let leftdraw = d3.pie()
        .value(d => d.count)
        .sort(null)
        .startAngle(-nodePieStartAngle * (Math.PI / 180))
        .endAngle(-nodePieEndAngle * (Math.PI / 180))
        .padAngle(0.01);

    let rpieData = rightdraw(nodeRightPieData);
    let lpieData = leftdraw(nodeLeftPieData);
    let cpieData = rightdraw(centerNodePieData); // format the central node

    // Layout position calculator - make the links and nodes fit the pie graph
    function y1PosCalculator(xPosOffset, startRadian, endRadian) {
        //convert radian to degree
        let startDegree = startRadian * 180 / Math.PI;
        let endDegree = endRadian * 180 / Math.PI;
        let degreeDiff = endDegree - startDegree;
        //
        let yPosOffset = 0;
        if (endDegree <= 90) {
            yPosOffset = -xPosOffset * Math.sin(Math.PI / 180 * (degreeDiff / 2 + (90 - endDegree)));
        } else if (endDegree > 90 && startDegree <= 90) {
            if ((90 - startDegree - degreeDiff / 2) > 0) {
                yPosOffset = -xPosOffset * Math.sin(Math.PI / 180 * (90 - startDegree - degreeDiff / 2));
            } else if ((90 - startDegree - degreeDiff / 2) < 0) {
                yPosOffset = xPosOffset * Math.sin(Math.PI / 180 * (-(90 - startDegree - degreeDiff / 2)));
            }
        } else if (startDegree > 90) {
            yPosOffset = xPosOffset * Math.sin(Math.PI / 180 * (startDegree - 90 + degreeDiff / 2))
        }
        return yPosOffset;
    }

    function x1PosCalculator(xPosOffset, startRadian, endRadian) {
        //convert radian to degree
        let startDegree = startRadian * 180 / Math.PI;
        let endDegree = endRadian * 180 / Math.PI;
        let degreeDiff = endDegree - startDegree;
        //
        let yPosOffset = 0;
        if (endDegree <= 90) {
            yPosOffset = xPosOffset * Math.cos(Math.PI / 180 * (degreeDiff / 2 + (90 - endDegree)));
        } else if (endDegree > 90 && startDegree <= 90) {
            if ((90 - startDegree - degreeDiff / 2) > 0) {
                yPosOffset = xPosOffset * Math.cos(Math.PI / 180 * (90 - startDegree - degreeDiff / 2));
            } else if ((90 - startDegree - degreeDiff / 2) < 0) {
                yPosOffset = xPosOffset * Math.cos(Math.PI / 180 * (-(90 - startDegree - degreeDiff / 2)));
            }
        } else if (startDegree > 90) {
            yPosOffset = xPosOffset * Math.cos(Math.PI / 180 * (startDegree - 90 + degreeDiff / 2))
        }
        return yPosOffset;

    }

    function y2PosCalculator(xPosOffset, startRadian, endRadian) {
        //convert radian to degree
        let startDegree = startRadian * 180 / Math.PI;
        let endDegree = endRadian * 180 / Math.PI;
        let degreeDiff = endDegree - startDegree;
        //
        let yPosOffset = 0;
        if (endDegree <= 90) {
            yPosOffset = -xPosOffset * Math.tan(Math.PI / 180 * (degreeDiff / 2 + (90 - endDegree)));
        } else if (endDegree > 90 && startDegree <= 90) {
            if ((90 - startDegree - degreeDiff / 2) > 0) {
                yPosOffset = -xPosOffset * Math.tan(Math.PI / 180 * (90 - startDegree - degreeDiff / 2));
            } else if ((90 - startDegree - degreeDiff / 2) < 0) {
                yPosOffset = xPosOffset * Math.tan(Math.PI / 180 * (-(90 - startDegree - degreeDiff / 2)));
            }
        } else if (startDegree > 90) {
            yPosOffset = xPosOffset * Math.tan(Math.PI / 180 * (startDegree - 90 + degreeDiff / 2))
        }
        return yPosOffset;
    }

    // Draw links
    let link = graphContainer.append('g')
        .attr("id", "link")

    let linkRight = link.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(rpieData)
        .enter().append("line")
        .attr("x1", d => graphCenter[0] + x1PosCalculator(50, d.startAngle, d.endAngle))
        .attr("y1", d => graphCenter[1] + y1PosCalculator(50, d.startAngle, d.endAngle))
        .attr("x2", d => graphCenter[0] + d.data.sequence * 100)
        .attr("y2", d => graphCenter[1] + y2PosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle));

    let linkLeft = link.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(lpieData)
        .enter().append("line")
        .attr("x1", d => graphCenter[0] + x1PosCalculator(-50, -d.startAngle, -d.endAngle))
        .attr("y1", d => graphCenter[1] + y1PosCalculator(50, -d.startAngle, -d.endAngle))
        .attr("x2", d => graphCenter[0] + d.data.sequence * 100)
        .attr("y2", d => graphCenter[1] + y2PosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle));

    let pieNode = graphContainer.append("g")
        .attr("id", "pieNode")
        .attr('transform', `translate(${graphCenter[0]}, ${graphCenter[1]})`);

    let pieRight = pieNode.append("g");
    let pieDiv = leftContainer.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function pierightMouseover(d, i) { //show the frequency sta when hover on pie segment
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.85')
        pieDiv.transition()
            .duration(50)
            .style("opacity", 1);
        pieDiv.html("Proportion: " + (d.data.count / rightCountSum).toFixed(2))
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    }

    function pieleftMouseover(d, i) { //show the frequency sta when hover on pie segment
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.85')
        pieDiv.transition()
            .duration(50)
            .style("opacity", 1);
        pieDiv.html("Proportion: " + (d.data.count / leftCountSum).toFixed(2))
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    }

    function pieMouseout(d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '1')
        pieDiv.transition()
            .duration('50')
            .style("opacity", 0);
    }

    pieRight.selectAll("path")
        .data(rightdraw(nodeRightPieData))
        .enter()
        .append("path")
        .attr("fill", (d, i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', pierightMouseover)
        .on('mouseout', pieMouseout);

    let pieLeft = pieNode.append("g") // draw left half of the piechart

    pieLeft.selectAll("path")
        .data(leftdraw(nodeLeftPieData))
        .enter()
        .append("path")
        .attr("fill", (d, i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', pieleftMouseover)
        .on('mouseout', pieMouseout);

    //Draw nodes
    let node = graphContainer.append("g")
        .attr("id", "nodes")

    let nodeRight = node.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(rpieData)
        .enter().append("circle")
        .attr("r", 20)
        .attr("cx", d => graphCenter[0] + d.data.sequence * 100)
        .attr("cy", d => graphCenter[1] + y2PosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);

    let nodeLeft = node.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(lpieData)
        .enter().append("circle")
        .attr("r", 20)
        .attr("cx", d => graphCenter[0] + d.data.sequence * 100)
        .attr("cy", d => graphCenter[1] + y2PosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);

    let centernode = node.append("g")
        .attr("class", "node")
        .attr("id", "queryNode")
        .selectAll("circle")
        .data(cpieData)
        .enter().append("circle")
        .attr("r", 30)
        .attr("cx", d => graphCenter[0] + d.data.sequence * 100)
        .attr("cy", graphCenter[1])
        // .call(d3.drag().on("drag", clicked))
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
        console.log(d.data.sequence);
        linkRight.filter(
            l => l.data.source == d.data.target
        ).attr("x1", d.x).attr("y1", d.y);
        linkRight.filter(
            l => l.data.target == d.data.target
        ).attr("x2", d.x).attr("y2", d.y);
        linkLeft.filter(
            l => l.data.source == d.data.target
        ).attr("x1", d.x).attr("y1", d.y);
        linkLeft.filter(
            l => l.data.target == d.data.target
        ).attr("x2", d.x).attr("y2", d.y);

        if (graphRightPlusExist) {
            linkRightplus.filter(
                l => l.source == d.data.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        if (graphLeftPlusExist) {
            linkLeftplus.filter(
                l => l.source == d.data.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        console.log(this.getBoundingClientRect().x);
        console.log(d.x, d.y);

        // console.log(d.id);
        drawsta();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.data.count)
    }
    //Click node event
    function clicked(d) {
        drawsta();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.data.count)
        graphContainer.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
        
    }

    //Add steps
    d3.select("#afterPlus").on("click", afterplus);
    d3.select("#beforePlus").on("click", beforeplus);
    d3.select("#afterMinus").on("click", afterminus);
    d3.select("#beforeMinus").on("click", beforeminus);

    let rseq = 2;
    let lseq = 2;
    let maxseq = 3;
    function afterplus() {

        drawRightplus(rseq);
        if (rseq < maxseq+1){
            rseq += 1;
        }
        
    }
    function beforeplus() {
        drawLeftplus(lseq);
        if (lseq < maxseq+1){
            lseq += 1;
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
        function LayoutScaler(subID, subC) {
            let scaler = d3.scaleLinear()
                .domain([-32, 32])
                .range([0.6, subC + 0.4]);
            return scaler.invert(subID);
        }
        if (seq === 2){
            linkRightplus[seq] = link.append("g")
                .attr("class", "link")
                .attr("id", `seq${seq}`)
                .selectAll("line")
                .data(graph.filter(d => d.sequence == seq))
                .enter().append("line")
                .attr("x1", d => nodeRight.filter(n => n.data.target == d.source).attr("cx"))
                .attr("y1", d => nodeRight.filter(n => n.data.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 80)
                .attr("y2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeRightplus[seq] = node.append("g")
                .attr("class", "node")
                .attr("id", `seq${seq}`)
                .selectAll("circle")
                .data(graph.filter(d => d.sequence == seq))
                .enter().append("circle")
                .attr("r", 10)
                .attr("cx", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 80)
                .attr("cy", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked);
        } else {
            console.log("draw"+seq);
            console.log(graph.filter(d => d.sequence == seq));
            console.log(nodeRightplus.filter(n => n.target == "2Cafe"));
            console.log(graph.filter(d => d.sequence == seq).filter(d => d.source == "2Cafe"));
            

            linkRightplus[seq] = link.append("g")
            .attr("class", "link")
            .attr("id", `seq${seq}`)
            .selectAll("line")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("line")
            .attr("x1", d => nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cx"))
            .attr("y1", d => nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cy"))
            .attr("x2", d => parseFloat(nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cx")) + 80)
            .attr("y2", d => parseFloat(nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeRightplus[seq] = node.append("g")
            .attr("class", "node")
            .attr("id", `seq${seq}`)
            .selectAll("circle")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("circle")
            .attr("r", 10)
            .attr("cx", d => parseFloat(nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cx")) + 80)
            .attr("cy", d => parseFloat(nodeRightplus[seq-1].filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
            .call(d3.drag().on("drag", dragged))
            .on("click", clicked);
        }


        function dragged(d) {
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            
            linkRightplus[seq].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkRightplus[seq].filter(
                l => l.target == d.target && l.source == d.source
            ).attr("x2", d.x).attr("y2", d.y);
            if (seq < maxseq){
                linkRightplus[seq+1].filter(
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
        function LayoutScaler(subID, subC) {
            let scaler = d3.scaleLinear()
                .domain([-32, 32])
                .range([0.6, subC + 0.4]);
            return scaler.invert(subID);
        }
        if (seq == 2) {
            linkLeftplus[seq] = link.append("g")
                .attr("class", "link")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("x1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cx"))
                .attr("y1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 80)
                .attr("y2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("class", "node")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("r", 10)
                .attr("cx", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 80)
                .attr("cy", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked);
        }   else {
            linkLeftplus[seq] = link.append("g")
                .attr("class", "link")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("x1", d => nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cx"))
                .attr("y1", d => nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cx")) - 80)
                .attr("y2", d => parseFloat(nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("class", "node")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("r", 10)
                .attr("cx", d => parseFloat(nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cx")) - 80)
                .attr("cy", d => parseFloat(nodeLeftplus[seq-1].filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked);
        }

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
                l => l.target == d.target && l.source == d.source
            ).attr("x2", d.x).attr("y2", d.y);
            if (seq < maxseq){
                linkLeftplus[seq+1].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            }

            drawsta();

            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
        }
        function clicked(d) {
            console.log("clicked");
            d3.selectAll(".samplePie").remove();
            drawsta();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
            graphContainer.selectAll("circle").attr("stroke", "#fff")
            d3.select(this).attr("stroke", "#18569C")
        }
    }
    //IF HAVE TIME TRY TO USE FORCE GRAPH
    function drawRightplusForce(seq) {
        let simulation = d3.forceSimulation();

    }

    function drawsta(){
        console.log("draw");
        staSpace.selectAll(".samplePie").remove();
        staSpace.selectAll(".sampleBar").remove();
        drawsamplepie("#sta1");
        drawsamplebar("#sta2");
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

        let samplePieColorScale = d3.schemeAccent;

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
            .attr('transform', `translate(${staSpaceWidth/2}, ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/2)})`)
            .attr("fill", (d, i) => samplePieColorScale[i])
            .attr("d", arcSample)
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

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
            globalDragLayer.selectAll("path").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            samplePie.remove();
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
            .attr('transform', `translate(${ staSpaceWidth / 4}, ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/4)})`)

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
            .attr("fill", "#4BC1C1")
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

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
            globalDragLayer.selectAll("rect").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            sampleBar.remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplebar(id);
        }

    }
    // });
}