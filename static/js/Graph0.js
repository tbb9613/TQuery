var graph // define data

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


var leftContainer = d3.select("#leftContainer")
var rightContainer = d3.select("#rightContainer")

//Add svg to left
var leftSvg = leftContainer
    .append("svg")
    .attr("id", "leftSpace")
    // .attr("viewBox", [0, 0, "100%", "100%"])
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

var map = mapContainer.append("svg")
    .attr("id", "map")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidyMid slice")

map.append("rect")
    .attr("id", "heatmap")
    .attr("fill", "#CCC")
    .attr("width", "100%")
    .attr("height", "100%")


var staContainer = d3.select("#staContainer")

var staCardHeight = 2 * staSpaceWidth / 3
var staSpace = staContainer.append("svg")
    .attr("id", "staSpace")
    .attr("width", "100%")
    // .attr("height", "300%")
    .attr("overflow", "visible")
// .attr("viewBox", [0, 0, staSpaceWidth, workSpaceHeight+1000])
// .attr("")

//Create sta cards
const staCardList = ["pie", "bar", "line"]

//Create background
var staCards = staSpace.selectAll(".stacard")
    .data(staCardList)
    .enter()
    .append("g")
    .attr("class", "stacard")
    .attr("id", d => d)
    .attr("width", "100%")
    .attr("height", staCardHeight)
    // .attr("fill", "#CCC")
    .attr("y", (d, i) => 200 + i * (30 + staCardHeight))

staCards
    .append("rect")
    .attr("width", "100%")
    .attr("height", 2 * staSpaceWidth / 3)
    .attr("fill", "#CCC")
    .attr("y", (d, i) => 200 + i * (30 + 2 * staSpaceWidth / 3))

staSpace.attr("height", 300 + staCardList.length * (30 + 2 * staSpaceWidth / 3))

var text = staSpace.append("text")
    .attr("x", 100)
    .attr("y", 50)
    .attr("fill", "white")


var nodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];
// nodeList = d3.range(5)
drawTopNodes();

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


    //Data exchange
    function postQuery(d) {
        var queryNode = d;
        console.log(d);
        $.ajax({
            type: "POST",
            url: 'http://127.0.0.1:5000/receivedata', //send data by route
            dataType: 'json',
            data: JSON.stringify({
                name: queryNode
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
        console.log(d, d3.event.x)
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

        // drawGraph("graph-second")
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
    let pieDiv = d3.select("body").append("div")
        .attr("class", "tooltip-donut")
        .style("opacity", 0);
    pieRight.selectAll("path")
        .data(rightdraw(nodeRightPieData))
        .enter()
        .append("path")
        .attr("fill", (d, i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', function (d, i) { //show the frequency sta when hover on pie segment
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.85')
            pieDiv.transition()
                .duration(50)
                .style("opacity", 1);
            pieDiv.html("Proportion: " + d.data.count / rightCountSum)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1')
            pieDiv.transition()
                .duration('50')
                .style("opacity", 0);
        });

    let pieLeft = pieNode.append("g") // draw left half of the piechart

    pieLeft.selectAll("path")
        .data(leftdraw(nodeLeftPieData))
        .enter()
        .append("path")
        .attr("fill", (d, i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', function (d, i) { //show the frequency sta when hover on pie
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.85')
            pieDiv.transition()
                .duration(50)
                .style("opacity", 1);
            pieDiv.html("Proportion: " + d.data.count / leftCountSum)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");

        })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1')
            pieDiv.transition()
                .duration('50')
                .style("opacity", 0);
        });

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

    let linkRightplus;
    let nodeRightplus;

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

        drawsamplepie();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.data.count)
    }
    //Click node event
    function clicked(d) {
        staSpace.selectAll("path").remove();
        drawsamplepie();
        drawsamplebar();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.data.count)
        graphContainer.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
        // thiscx = graph.filter(n => n.source == d.data.target);
        if (!graphRightPlusExist) {
            drawRightplus(2);
            drawLeftplus(-2);
        }

        console.log(d3.event.pageX)

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

        linkRightplus = link.append("g")
            .attr("class", "link")
            .selectAll("line")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("line")
            .attr("x1", d => nodeRight.filter(n => n.data.target == d.source).attr("cx"))
            .attr("y1", d => nodeRight.filter(n => n.data.target == d.source).attr("cy"))
            .attr("x2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 80)
            .attr("y2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

        nodeRightplus = node.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("circle")
            .attr("r", 10)
            .attr("cx", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 80)
            .attr("cy", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
            .call(d3.drag().on("drag", dragged))
            .on("click", clicked);

        function dragged(d) {
            // console.log(d);
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            linkRightplus.filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkRightplus.filter(
                l => l.target == d.target && l.source == d.source
            ).attr("x2", d.x).attr("y2", d.y);
            drawsamplepie();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
        }

        function clicked(d) {
            console.log("clicked");
            staSpace.selectAll("path").remove();
            drawsamplepie();
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

        linkLeftplus = link.append("g")
            .attr("class", "link")
            .selectAll("line")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("line")
            .attr("x1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cx"))
            .attr("y1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cy"))
            .attr("x2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 80)
            .attr("y2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

        nodeLeftplus = node.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("circle")
            .attr("r", 10)
            .attr("cx", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 80)
            .attr("cy", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count))
            .call(d3.drag().on("drag", dragged))
            .on("click", clicked);

        function dragged(d) {
            // console.log(d);
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            linkLeftplus.filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkLeftplus.filter(
                l => l.target == d.target && l.source == d.source
            ).attr("x2", d.x).attr("y2", d.y);
            drawsamplepie();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
        }

        function clicked(d) {
            console.log("clicked");
            d3.selectAll(".samplePie").remove();
            drawsamplepie();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
            graphContainer.selectAll("circle").attr("stroke", "#fff")
            d3.select(this).attr("stroke", "#18569C")
        }
    }
    //IF HAVE TIME TRY TO USE FORCE GRAPH
    function drawRightplusForce(seq) {
        let simulation = d3.forceSimulation();

    }


    //draw sample pie chart
    function drawsamplepie() {
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

        let samplePie = staSpace.select("#pie").append("g")
            .attr("class", "samplePie")

        let arcSample = d3.arc()
            .outerRadius(75)
            .innerRadius(0)

        let spConverter = d3.pie().value(d => d.value)

        samplePie.selectAll("path")
            .data(spConverter(fakeData))
            .enter()
            .append("path")
            .attr('transform', `translate(${staSpaceWidth/2}, ${(parseFloat(staSpace.select("#pie").attr("y")) + staCardHeight/2)})`)
            .attr("fill", (d, i) => samplePieColorScale[i])
            .attr("d", arcSample)
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

        function dragstarted(d) {
            let boundingPos = this.getBoundingClientRect();
            // globalDragLayer.append(this)
            console.log("boundingPos", boundingPos.bottom, boundingPos.right)
            console.log("getCTM", this.getCTM());
            console.log("getSCTM", this.getScreenCTM());
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
            console.log(d3.event.PageX, d3.event.x)
            // console.log("dxdy",d.x, d.y);
            boundingPos = this.getBoundingClientRect();
            console.log(boundingPos)
            globalDragLayer.selectAll("path")
                .attr("transform", "translate(" + event.pageX + "," + event.pageY + ") scale(1.2)")

        }

        function dragended(d) {
            let endXPos = d3.event.x,
                endYPos = d3.event.y;
            globalDragLayer.selectAll("path").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            staSpace.selectAll("path").remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplepie();
        }
    }

    function drawsamplebar() {
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
        let sampleBar = staSpace.select("#bar").append("g")
            .attr("class", "sampleBar")
            .attr('transform', `translate(${ staSpaceWidth / 4}, ${(parseFloat(staSpace.select("#bar").attr("y")) + staCardHeight/4)})`)

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
            console.log(d3.event.PageX, d3.event.x)
            // console.log("dxdy",d.x, d.y);
            boundingPos = this.getBoundingClientRect();
            console.log(boundingPos)
            globalDragLayer.selectAll("rect")
                .attr("transform", `translate(${event.pageX}, ${event.pageY}) scale(1.2)`)

        }

        function dragended(d) {
            let endXPos = d3.event.x,
                endYPos = d3.event.y;
            globalDragLayer.selectAll("rect").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            sampleBar.remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplebar();
        }

    }
    // });
}