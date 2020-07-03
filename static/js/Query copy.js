function createQuery(d, type, nodeList, timeStart, timeEnd) {
    queryNode = d;
    d3.select("#staContainer").classed("hide", true);
    // workContainer.selectAll(".tooltip").remove();
    workSpace.selectAll("#graph-first").remove();
    //if there is no graph then append background
    if (!graphExist) {
        workSpace.append("rect")
            .classed("graph-background", true)
            .attr("fill", "#EEE")
            .attr("opacity", .25)
            .attr("width", "100%")
            .attr("height", "100%");
    }
    
    // postQuery(d, 4);
    console.log(d)
    drawGraph("graph-first", type, queryNode, timeStart, timeEnd)
    topSpace.selectAll(".topnodes").remove();
    drawTopNodes(nodeList)
    
    d3.select("#queryTitleContainer").classed("hide", false);
    if (type === "single") {
        titletext.html("Trajectories of people who go to <b>" +queryNode + "(" + MCCDict.filter(m => m.edited_description === queryNode)[0].mcc + ")"+"</b>");
    } else {
        titletext.html("Packed Query");
    }
}

//Data exchange
function packedQuery(d) {
    // console.log(nodeList);
    // console.log(linkmapList);
    console.log(packList);
    console.log(packLinks);
    console.log(packNodes);
    let timeStart = "2020-04-30 10:00:00", 
    timeEnd = "2020-04-30 18:00:00";
    createQuery("Bakeries", "packed", nodeList, timeStart, timeEnd);

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
    topSpace.selectAll(".topnodes").remove();
    drawTopNodes(nodeList);
    d3.selectAll(".tool-active").classed("tool-active", false);
    //reset array
    packCount = 1;
    //redraw arrow
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

    d3.select("#multiNodeText").selectAll("p").remove();
    d3.select("#multiNodeText").classed("hide", true);
}

function postQuery(d, t, type) {
    queryNode = d;
    // console.log(d);
    axios.post('http://127.0.0.1:5000/query_single', {
            name: queryNode,
            time: t
        })
        .catch(function (error) {
            console.log(error);
        })
        .then(function (response) { // if success then update data
            nodeMap_c = response.data
            console.log(nodeMap_c)
            setTimeout(() => {
            drawGraph("graph-first", nodeMap_c, type);
            console.log(nodeMap_c);
            secondGraphExist = false;
            }, 50);
            
        });
    

}

function postSubQuery(t) {
    axios.post('http://127.0.0.1:5000/query_single', {
            name: queryNode,
            time: t
        })
        .catch(function (error) {
            console.log(error);
        })
        .then(function (response) { // if success then update data
            subNodeMap = response.data;
        })
}

function postSingleQuery_test(d, seq, timeStart, timeEnd) {
    axios.post('http://127.0.0.1:5000/query_single_new', {
        name: d,
        sequence: seq,
        timeStart: timeStart,
        timeEnd: timeEnd
    })
    .catch(function (error) {
        console.log(error);
    })
    .then(function (response) { // if success then update data
        console.log(response.data)
    });
}

