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

var text = svg.append("text")
    .attr("x", workSpaceWidth + 50)
    .attr("y", topSpaceHeight + 100)

var topSpace = svg.append("g")
    .attr("id", "top");

topSpace.append("rect")
    .attr("id", "topSpace")
    .attr("fill", "#CCC")
    .attr("opacity", .4)
    .attr("width", width)
    .attr("height", topSpaceHeight);

var nodeList = ["Surpermarket", "Cafe", "Restaurant", "School", "Pharmacy", "Theatre", "Cinema"];
// nodeList = d3.range(5)
drawTopNodes();

var workSpace = svg.append("g");

//Draw background
workSpace
    .append("rect")
    .attr("id", "workSpace")
    .attr("fill", "blue")
    .attr("opacity", .15)
    .attr("width", workSpaceWidth)
    .attr("height", workSpaceHeight)
    .attr("y", topSpaceHeight); //make the workspace under topspace

workSpace
    .append('g')
    .append("rect")
    .attr("id", "conditionBox")
    .attr("fill", "black")
    .attr("opacity", .20)
    .attr("width", workSpaceWidth / 5)
    .attr("height", workSpaceHeight / 4)
    .attr("y", topSpaceHeight + workSpaceHeight * 0.7)
    .attr("x", workSpaceWidth * (3/4) )


function drawTopNodes() {

    console.log(nodeList)
    const xPosition = (d, i) => i * 50 + 60;
    // console.log(d);

    const node = topSpace.append("g")
        .selectAll("circle")
        .data(nodeList);
    node
        .enter().append("circle")
        .attr("cx", xPosition)
        .attr("cy", topSpaceHeight / 2)
        .attr("r", 0)
        .merge(node)
        .attr("cx", xPosition)
        // .transition().duration(1000) 
        .attr("r", 20)
        .call(d3.drag().on("drag", dragged).on("end", dragended));

    node.append("title").text("Node Name To Display")

    node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em").text("Node Name To Display")

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
        console.log(graph);
    }

    function createQuery(d) {
        postQuery(d);
        setTimeout(() => {
            drawGraph();
            topSpace.selectAll("circle").remove();
            drawTopNodes()
        }, 500);
    }

    function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        console.log(d, d3.event.x)
    }; //???????
    //drag top nodes

    function dragended(d) {
        let endXPos = d3.event.x,
            endYPos = d3.event.y;
        if (endYPos > topSpaceHeight) {   //judge height space
            d3.select(this)
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
                workSpace.selectAll(["circle", "line"]).remove();

                createQuery(d);
            }

        } else {
            // d3.select(this).attr("cx", d => d * 50 + 60).attr("cy", topSpaceHeight / 2)
            topSpace.selectAll("circle").remove();
            drawTopNodes()
        }
        console.log("end");
    }

};

// drawGraph();

function drawGraph() {

    graphExist = true;

    // d3.json(data1).then(function (graph) {

    console.log(graph.filter(d => d.sequence == 1).length);

    //Draw links
    let link = workSpace.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(graph)
        .enter().append("line")
        .attr("x1", d => workSpaceWidth / 2)
        .attr("y1", d => topSpaceHeight + workSpaceHeight / 2)
        .attr("x2", d => workSpaceWidth / 2 + d.sequence * 100)
        .attr("y2", d => (d.sequence != 0) ?
            topSpaceHeight + workSpaceHeight / 2 + 70 * (d.id - 1) :
            topSpaceHeight + workSpaceHeight / 2);

    let node = workSpace.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(graph)
        .enter().append("circle")
        .attr("r", 20)
        .attr("cx", d => workSpaceWidth / 2 + d.sequence * 100)
        .attr("cy", d => (d.sequence != 0) ?
            topSpaceHeight + workSpaceHeight / 2 + 70 * (d.id - 1) :
            topSpaceHeight + workSpaceHeight / 2)
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked);

    function dragged(d) {
        workSpace.selectAll("circle").attr("stroke", "#fff") // reset the style
        d.x = d3.event.x, d.y = d3.event.y;
        d3.select(this).attr("cx", d.x).attr("cy", d.y)
            .attr("stroke", "#18569C");
        console.log(d.id);
        link.filter(function (l) {
            return l.source === d.target;
        }).attr("x1", d.x).attr("y1", d.y);
        console.log(d.source, d.target);
        link.filter(function (l) {
            return l.target === d.target;
        }).attr("x2", d.x).attr("y2", d.y);
        text.text('Place ' + d.target.slice(1) + ' Frequency ' + d.count)
    }

    function clicked(d) {
        text.text('Place ' + d.target.slice(1) + ' Frequency ' + d.count)
        workSpace.selectAll("circle").attr("stroke", "#fff")
        d3.select(this).attr("stroke", "#18569C")
    }
    // });
}