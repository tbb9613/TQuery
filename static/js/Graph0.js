var graph // define data
console.log(graph)



var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight;

var svg = d3.select("#space")
    .attr("viewBox", [0, 0, width, height])

console.log(width, height)

var topSpaceHeight = 0.3 * height;
var workSpaceHeight = 0.7 * height;
var workSpaceWidth = 0.7 * width;
var graphExist = false;
var graphRightPlusExist = false;
var graphLeftPlusExist = false;

var topSpace = svg.append("g")
    .attr("id", "top");

topSpace.append("rect")
    .attr("id", "topSpace")
    .attr("fill", "#CCC")
    .attr("opacity", .4)
    .attr("width", width)
    .attr("height", topSpaceHeight);

topSpace.append("rect")
    .attr("id", "heatmap")
    .attr("fill", "#CCC")
    .attr("width", width - workSpaceWidth)
    .attr("height", topSpaceHeight)
    .attr("x", workSpaceWidth)



var nodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];
// nodeList = d3.range(5)
drawTopNodes();

var workSpace = svg.append("g")
    .attr("id", "work");

//Draw background
workSpace
    .append("rect")
    .attr("fill", "blue")
    .attr("opacity", .15)
    .attr("width", workSpaceWidth)
    .attr("height", workSpaceHeight)
    .attr("y", topSpaceHeight); //make the workspace under topspace

workSpace
    .append('g')
    .append("rect")
    .attr("id", "conditionBox")
    // .attr("fill", "black")
    // .attr("opacity", .20)
    .attr("width", workSpaceWidth / 5)
    .attr("height", workSpaceHeight / 4)
    .attr("y", topSpaceHeight + workSpaceHeight * 0.7)
    .attr("x", workSpaceWidth * (3 / 4))

var staSpace = svg.append("g")
    .attr("id", "sta")

var text = staSpace.append("text")
    .attr("x", workSpaceWidth + 50)
    .attr("y", topSpaceHeight + 100)

var titletext = workSpace.append("text")
    .attr("y", topSpaceHeight + 50)
    .attr("x", 100)



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
        .attr("y", topSpaceHeight / 2)
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
            drawGraph();
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
                graphContainer.remove();
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

function drawGraph() {

    var graphContainer = workSpace.append("g")
        .attr("id", "graphContainer");
    // .attr('transform', 'translate(' + 0 + ',' + 0 + ')');
    graphExist = true;

    //Create zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 1.5])
        .on("zoom", zoom_actions);

    function zoom_actions() {
        graphContainer.attr("transform", d3.event.transform)
    }

    zoom(workSpace);


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
        console.log(startDegree, endDegree, degreeDiff, xPosOffset, yPosOffset);
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
        // console.log(startDegree, endDegree, degreeDiff, xPosOffset, yPosOffset);
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
        // console.log(startDegree, endDegree, degreeDiff, xPosOffset, yPosOffset);
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
        .attr("x1", d => workSpaceWidth / 2 + x1PosCalculator(50, d.startAngle, d.endAngle))
        .attr("y1", d => topSpaceHeight + workSpaceHeight / 2 + y1PosCalculator(50, d.startAngle, d.endAngle))
        .attr("x2", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("y2", d => topSpaceHeight + workSpaceHeight / 2 + y2PosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle));

    let linkLeft = link.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(lpieData)
        .enter().append("line")
        .attr("x1", d => workSpaceWidth / 2 + x1PosCalculator(-50, -d.startAngle, -d.endAngle))
        .attr("y1", d => topSpaceHeight + workSpaceHeight / 2 + y1PosCalculator(50, -d.startAngle, -d.endAngle))
        .attr("x2", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("y2", d => topSpaceHeight + workSpaceHeight / 2 + y2PosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle));

    let pieNode = graphContainer.append("g")
        .attr("id", "pieNode")
        .attr('transform', 'translate(' + workSpaceWidth / 2 + ',' + (topSpaceHeight + workSpaceHeight / 2) + ')');

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
        .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("cy", d => topSpaceHeight + workSpaceHeight / 2 + y2PosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);

    let nodeLeft = node.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(lpieData)
        .enter().append("circle")
        .attr("r", 20)
        .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("cy", d => topSpaceHeight + workSpaceHeight / 2 + y2PosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);

    let centernode = node.append("g")
        .attr("class", "node")
        .attr("id", "queryNode")
        .selectAll("circle")
        .data(cpieData)
        .enter().append("circle")
        .attr("r", 30)
        .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("cy", topSpaceHeight + workSpaceHeight / 2)
        // .call(d3.drag().on("drag", clicked))
        .on("click", clicked);

    let linkRightplus;
    let nodeRightplus;

    function dragged(d) {
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

        if (graphRightPlusExist){
            linkRightplus.filter(
                l => l.source == d.data.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        if (graphLeftPlusExist){
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
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.data.count)
        graphContainer.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
        // thiscx = graph.filter(n => n.source == d.data.target);
        if (!graphRightPlusExist){
            drawRightplus(2);
            drawLeftplus(-2);
        }

        

    }

    function drawRightplus(seq) {

        graphRightPlusExist = true;

        //Calculate vertical layout
        function LayoutScaler(subID, subC) {
            let scaler = d3.scaleLinear()
                .domain([-40, 40])
                .range([0.8, subC+0.2]);
            return scaler.invert(subID);
        }

        linkRightplus = link.append("g")
            .attr("class", "link")
            .selectAll("line")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("line")
            .attr("x1", d => nodeRight.filter(n => n.data.target == d.source).attr("cx"))
            .attr("y1", d => nodeRight.filter(n => n.data.target == d.source).attr("cy"))
            .attr("x2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 100)
            .attr("y2", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

        nodeRightplus = node.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("circle")
            .attr("r", 15)
            .attr("cx", d => parseFloat(nodeRight.filter(n => n.data.target == d.source).attr("cx")) + 100)
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
                .domain([-40, 40])
                .range([0.8, subC+0.2]);
            return scaler.invert(subID);
        }

        linkLeftplus = link.append("g")
            .attr("class", "link")
            .selectAll("line")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("line")
            .attr("x1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cx"))
            .attr("y1", d => nodeLeft.filter(n => n.data.target == d.source).attr("cy"))
            .attr("x2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 100)
            .attr("y2", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

        nodeLeftplus = node.append("g")
            .attr("class", "node")
            .selectAll("circle")
            .data(graph.filter(d => d.sequence == seq))
            .enter().append("circle")
            .attr("r", 15)
            .attr("cx", d => parseFloat(nodeLeft.filter(n => n.data.target == d.source).attr("cx")) - 100)
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
            staSpace.selectAll("path").remove();
            drawsamplepie();
            text.text('Place: ' + d.target.slice(1) + "  |  Frequecy: " + d.count)
            graphContainer.selectAll("circle").attr("stroke", "#fff")
            d3.select(this).attr("stroke", "#18569C")
        }
    }
    //IF HAVE TIME TRY TO USE FORCE GRAPH
    function drawRightplusForce(seq){
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

        let samplePieColorScale = d3.schemeCategory20c;

        let samplePie = staSpace.append("g")

        let arcSample = d3.arc()
            .outerRadius(90)
            .innerRadius(0)

        let spConverter = d3.pie().value(d => d.value)

        samplePie.selectAll("path")
            .data(spConverter(fakeData))
            .enter()
            .append("path")
            .attr('transform', 'translate(' + (workSpaceWidth + 150) + ',' + (topSpaceHeight + workSpaceHeight * 0.7) + ')')
            .attr("fill", (d, i) => pieColorScale[i])
            .attr("d", arcSample)
            .call(d3.drag().on("drag", dragged).on("end", dragended))

        function dragged(d) {
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this)
                .attr('transform', 'translate(' + d.x + ',' + d.y + ')');
        }

        function dragended(d) {
            let endXPos = d3.event.x,
                endYPos = d3.event.y;
            staSpace.selectAll("path").remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplepie();
        }
    }
    // });
}