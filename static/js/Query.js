function createQuery(d, type, nodeList, timeStart, timeEnd) {
    queryNode = d;
    currentQueryType = type;
    d3.select("#staContainer").classed("hide", true);
    // workContainer.selectAll(".tooltip").remove();
    workSpace.selectAll("#graph-first").remove();
    workSpace.selectAll("#graph-second").remove();
    workSpace.selectAll(".division-line").remove();
    //if there is no graph then append background
    if (!graphExist) {
        workSpace.append("rect")
            .classed("graph-background", true)
            .attr("fill", "#EEE")
            .attr("opacity", .25)
            .attr("width", "100%")
            .attr("height", "100%");
    }
    console.log(d);
    //reset seq and left/right plus exist
    resetPlusSeq();
    drawGraph("graph-first", type, queryNode, timeStart, timeEnd, maxShowNum);
    topSpace.selectAll(".topnodes").remove();
    drawTopNodes(nodeList);
    d3.select("#queryTitleContainer").classed("hide", false);
    if (type === "single") {
        titletext.html("Trajectories of people who go to <b>" +queryNode + "(" + MCCDict.filter(m => m.edited_description === queryNode)[0].mcc + ")"+"</b>");
    } else {
        titletext.html("Packed Query");
    }
}

//Data exchange
function packedQuery(d) {
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
    workContainer.selectAll(".brush-menu").remove();
    workContainer.selectAll(".build-query-btn").remove();
    workSpace.selectAll(".division-line").remove();
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

function resetPlusSeq(){
    rseq = 2, lseq = 2, maxseq = 4;
    graphRightPlusExist = false;
    graphLeftPlusExist = false;
}
