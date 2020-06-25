function createQuery(d, timePoint, type, nodeList) {
    d3.select("#staContainer").classed("hide", true);
    // workContainer.selectAll(".tooltip").remove();
    workSpace.selectAll("#graph-first")
        .transition().duration(3000)
        .attr("opacity", 0)
        .remove();
    //if there is no graph then append background
    if (!graphExist) {
        workSpace.append("rect")
            .classed("graph-background", true)
            .attr("fill", "#CCC")
            .attr("opacity", .25)
            .attr("width", "100%")
            .attr("height", "100%");
    }
    
    // postQuery(d, 4);
    console.log(d)
    postQuery(d, timePoint, type);
    postSubQuery(timePoint + 3);
    // console.log(postQuery(d, 4));
    topSpace.selectAll(".topnodes").remove();
    drawTopNodes(nodeList)
    
    d3.select("#queryTitleContainer").classed("hide", false);
    if (type === "single") {
        titletext.html("Routes of people who go to <b>" +queryNode + "(" + MCCDict.filter(m => m.edited_description === queryNode)[0].mcc + ")"+"</b>");
    } else {
        titletext.html("Packed Query");
    }
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
            
        })
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
