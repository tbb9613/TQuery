var graph
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
    .attr("x", workSpaceWidth * (3/4) )

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
        .attr("class","topnodes")
        .attr("x", xPosition)
        .attr("y", topSpaceHeight / 2)
        .call(d3.drag().on("drag", dragged).on("end", dragended))

        
    node
        .append("circle")
        .attr("cx", xPosition)
        .attr("cy", topSpaceHeight / 2)
        .attr("r", 20)
;

    node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr("x", xPosition)
        .attr("y", topSpaceHeight / 2)
        .style('font-size', '13px')
        .attr('fill', 'white')
        .text(d => d.slice(0,3))
    
    //draw transparent node on text
    node
        .append("circle")
        .attr("cx", xPosition)
        .attr("cy", topSpaceHeight / 2)
        .attr("r", 20)
        .attr("opacity", 0)


//Data exchange
    function postQuery(d){
        var queryNode = d; 
        console.log(d);
        $.ajax({
            type: "POST",
            url: 'http://127.0.0.1:5000/receivedata', //send data by route
            dataType: 'json',
            data: JSON.stringify({
                name : queryNode
            }),
            // data : JSON(queryNode),
            success: function(data){ // if success then update data
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
        if (endYPos > topSpaceHeight) {   //judge height space
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
                workSpace.selectAll(["circle", "line","path"]).remove();
                createQuery(d);
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

    graphExist = true;

    // d3.json(data1).then(function (graph) {
    //Calculate pie chart data
    let rightNodePieData = graph.filter(d => d.sequence == 1);
    let leftNodePieData = graph.filter(d => d.sequence == -1);
    let centerNodePieData = graph.filter(d => d.sequence == 0)
    let nodePieStartAngle = 20;
    let nodePieEndAngle = 160;
    let rightCountSum = d3.sum(rightNodePieData, d => d.count);
    let leftCountSum = d3.sum(leftNodePieData, d => d.count);
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
    
    let rpieData = rightdraw(rightNodePieData);
    let lpieData = leftdraw(leftNodePieData);
    let cpieData = rightdraw(centerNodePieData); // format the central node
    

    function yPosCalculator(xPosOffset, startRadian, endRadian){
        //convert radian to degree
        let startDegree = startRadian * 180 / Math.PI;
        let endDegree = endRadian * 180 / Math.PI;
        let degreeDiff = endDegree - startDegree;
        //
        let yPosOffset = 0;
        if (endDegree <= 90){
            yPosOffset = - xPosOffset * Math.tan(Math.PI / 180 * (degreeDiff/2 + (90 - endDegree)));
        }
        else if (endDegree > 90 && startDegree <= 90){
            if ((90 - startDegree - degreeDiff/2) > 0) 
            {
                yPosOffset = - xPosOffset * Math.tan(Math.PI / 180 * (90 - startDegree - degreeDiff/2));
            }
            else if ((90 - startDegree - degreeDiff/2) < 0){
                yPosOffset = xPosOffset * Math.tan(Math.PI / 180 * (-(90 - startDegree - degreeDiff/2)));
            } 
        } 
        else if (startDegree > 90) {
            yPosOffset = xPosOffset * Math.tan(Math.PI / 180 * (startDegree - 90 + degreeDiff/2))
        }
        console.log(startDegree, endDegree, degreeDiff, xPosOffset, yPosOffset);
        return yPosOffset;
        
    }

    //Draw links
    let link = workSpace.append('g')
        .attr("id","link")

    let rightlink = link.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(rpieData)
    .enter().append("line")
    .attr("x1", d => workSpaceWidth / 2)
    .attr("y1", d => topSpaceHeight + workSpaceHeight / 2)
    .attr("x2", d => workSpaceWidth / 2 + d.data.sequence * 100)
    .attr("y2", d => topSpaceHeight + workSpaceHeight / 2 + yPosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle));
    
    let leftlink = link.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(lpieData)
    .enter().append("line")
    .attr("x1", d => workSpaceWidth / 2)
    .attr("y1", d => topSpaceHeight + workSpaceHeight / 2)
    .attr("x2", d => workSpaceWidth / 2 + d.data.sequence * 100)
    .attr("y2", d => topSpaceHeight + workSpaceHeight / 2 + yPosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle));

    let pieNode = workSpace.append("g")
        .attr("id","pieNode")
        .attr('transform', 'translate(' + workSpaceWidth / 2 + ',' + (topSpaceHeight + workSpaceHeight / 2) + ')');

    let pieright = pieNode.append("g");
    let pierightDiv = d3.select("body").append("div")
        .attr("class", "tooltip-donut")
        .style("opacity", 0);
    pieright.selectAll("path")
        .data(rightdraw(rightNodePieData))
        .enter()
        .append("path")
        .attr("fill", (d,i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', function (d, i) {  //show the frequency sta when hover on pie segment
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.85')
            pierightDiv.transition()
                .duration(50)
                .style("opacity", 1);
            pierightDiv.html("Proportion: "+d.data.count / rightCountSum)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1')
            pierightDiv.transition()
                .duration('50')
                .style("opacity", 0);
        });

    let pieleft = pieNode.append("g") // draw left half of the piechart

    pieleft.selectAll("path")
        .data(leftdraw(leftNodePieData))
        .enter()
        .append("path")
        .attr("fill", (d,i) => pieColorScale[i])
        .attr("d", arc)
        .on('mouseover', function (d, i) { //show the frequency sta when hover on pie
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.85')
            pierightDiv.transition()
                .duration(50)
                .style("opacity", 1);
            pierightDiv.html("Proportion: "+ d.data.count / leftCountSum)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");

        })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1')
            pierightDiv.transition()
                .duration('50')
                .style("opacity", 0);
        });

    //Draw nodes
    let node = workSpace.append("g")
        .attr("id", "nodes")
    
    let rightnode = node.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(rpieData)
        .enter().append("circle")
        .attr("r", 20)
        .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
        .attr("cy", d => topSpaceHeight + workSpaceHeight / 2 + yPosCalculator(d.data.sequence * 100, d.startAngle, d.endAngle))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);
    
    let leftnode = node.append("g")
    .attr("class", "node")
    .selectAll("circle")
    .data(lpieData)
    .enter().append("circle")
    .attr("r", 20)
    .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
    .attr("cy", d => topSpaceHeight + workSpaceHeight / 2 + yPosCalculator(-d.data.sequence * 100, -d.startAngle, -d.endAngle))
    .call(d3.drag().on("drag", dragged))
    .on("click", clicked);

    let centernode = node.append("g")
    .attr("class", "node")
    .attr("id", "queryNode")
    .selectAll("circle")
    .data(cpieData)
    .enter().append("circle")
    .attr("r", 25)
    .attr("cx", d => workSpaceWidth / 2 + d.data.sequence * 100)
    .attr("cy", topSpaceHeight + workSpaceHeight / 2)
    .call(d3.drag().on("drag", dragged))
    .on("click", clicked);
    

    //Drag node event
    function dragged(d) {
        console.log(d);
        workSpace.selectAll("circle").attr("stroke", "#fff") // reset the style
        d.x = d3.event.x, d.y = d3.event.y;
        d3.select(this).attr("cx", d.x).attr("cy", d.y)
            .attr("stroke", "#18569C");
        if (d.data.sequence == 0){
            pieNode
            .attr('transform', 'translate(' + d.x + ',' + d.y + ')');
        }
        // console.log(d.id);
        console.log(d.data.sequence);
        rightlink.filter(function (l) {
            return l.data.source === d.data.target;
        }).attr("x1", d.x).attr("y1", d.y);
        rightlink.filter(function (l) {
            return l.data.target === d.data.target;
        }).attr("x2", d.x).attr("y2", d.y);
        leftlink.filter(function (l) {
            return l.data.source === d.data.target;
        }).attr("x1", d.x).attr("y1", d.y);
        leftlink.filter(function (l) {
            return l.data.target === d.data.target;
        }).attr("x2", d.x).attr("y2", d.y);

        drawsamplepie();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.count)
    }
    //Click node event
    function clicked(d) {
        staSpace.selectAll("path").remove();
        drawsamplepie();
        text.text('Place: ' + d.data.target.slice(1) + "  |  Frequecy: " + d.count)
        workSpace.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
    }


    //draw sample pie chart
    function drawsamplepie(){
        let fakeData = [{"label":"one", "value":20}, 
        {"label":"two", "value":50}, 
        {"label":"three", "value":30}];

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
        .attr("fill", (d,i) => pieColorScale[i])
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
            drawsamplepie();
        }
    }
    // });
}