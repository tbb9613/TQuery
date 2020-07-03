// drawGraph();
function drawGraph(graphid, type, queryCenter, timeStart, timeEnd) {
    
    // graphLeftData = 

    let graphRightPlusExist = false;
    let graphLeftPlusExist = false;
    
    d3.selectAll(".brush-child").classed("hide", true);

    const graphCenter = [workSpaceWidth / 2, workSpaceHeight / 2];
    // console.log(graphCenter[0], graphCenter[1])
    //Draw workspace background
    let graphBg = workSpace
        .append("g")
        .attr("id", graphid)
    // .attr("y", "30%");
        // .on("click", function(){d3.select(".node-menu").classed("hide", true)})

    let graphContainer = graphBg.append("g")
        .attr("id", "graphContainer");

    //Create zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 1.5])
        .on("zoom", zoom_actions);

    function zoom_actions() {
        graphContainer.attr("transform", d3.event.transform)
    }

    //Active zoom
    // zoom(graphBg);
    // graphBg.call(zoom).on("dblclick.zoom", null);


    brush.on("start", brushstart)
        .on("brush", brushed)
        .on("end", brushpopup);

    function brushstart() {
        workContainer.selectAll(".brush-menu").remove();
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

            let menuContainer = workContainer.append("div")
                .attr("class", "brush-menu-container")
                .style("position", "absolute")
                .style("top", `${y0+topSpaceHeight}px`)
                .style("left", `${x1}px`)

            let menuAnd = menuContainer
                .append("button")
                .attr("class", "brush-menu")
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
            zoom.scaleBy(graphBg, 0.8, [workSpaceWidth / 4, workSpaceHeight / 2])
            //put graph 1 left and zoom

            drawGraph("graph-second", type, queryNode, timeStart, timeEnd);
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
        zoom.scaleBy(graphBg, 0.8, [3 * workSpaceWidth / 4, workSpaceHeight / 2])

        workSpace.append("g")
            .append("line")
            .attr("x1", graphCenter[0])
            .attr("y1", 0.15 * workSpaceHeight)
            .attr("x2", graphCenter[0])
            .attr("y2", 0.85 * workSpaceHeight)
            .attr("stroke", "black")
            .attr("stroke-width", "3px");
    }

    //Draw Bottom Axis according to time selector data
    var bottomAxisWidth = 0.85 * width;
    let bottomAxisMargin = ({
        left: (width - bottomAxisWidth) * 0.5,
        top: 0.9 * workSpaceHeight - 30
    });
    let timeBoundary = bottomAxisWidth/2
    let xBottom = d3.scaleLinear()
            .domain([-timeBoundary, timeBoundary])
            .range([0, bottomAxisWidth]);
    function drawBottomAxis(){
        d3.selectAll(".bottom-axis").remove();
        let timeMin = timeSec / 60
        let timeHour = timeMin / 60
        // console.log(timeMin);
        console.log(xBottom(0));
        let xAxisBottom = workSpace.append("g")
            .attr("transform", `translate(${bottomAxisMargin.left}, ${bottomAxisMargin.top})`)
            .attr("class", "bottom-axis");
        xAxisBottom.call(d3.axisBottom(xBottom).ticks(bottomAxisWidth / 40).tickSize(3).tickSizeOuter(0))
            // .raise();
        // xAxisBottom.selectAll("text").remove();
        xAxisBottom.append("text").attr("class","bottom-axis-label")
            .attr("x", -5)
            .attr("y", 10)
            .text("Max Time Interval");
            
        xAxisBottom.attr("opacity", .4);
    }
    if (!graphExist){
        drawBottomAxis();
    };
    
    //Draw links & nodes
    function MainLayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-workSpaceHeight / 4, workSpaceHeight / 4])
            .domain([0, subC - 1]);
        return scaler(subID);
    }

    var verticalLine = graphContainer.append("g")
        .attr("id", "VerticalLines")
        .attr("opacity", .3);

    var horizontalLine = graphContainer.append("g")
        .attr("id", "HorizontalLines")
        .attr("opacity", .3);

    let link = graphContainer.append('g')
        .attr("id", "Links")

    let node = graphContainer.append("g")
        .attr("id", "Nodes");

    let nodeRadius = 20,
        nodeTxtOffset = 27,
        fistNodeDistance = 100,
        coeffTxtOffset = 0.5;


    if (type === "single") {
        let centerdata = [{
            "target": queryCenter 
        }]

        let centernode = node.append("g")
            .attr("id", "queryNode")
            .selectAll("circle")
            .data(centerdata).enter()
            .append("circle")
            .attr("class", "center-node")
            .attr("r", 30)
            .attr("cx", graphCenter[0])
            .attr("cy", graphCenter[1])
            .on("click", clicked);

        let textCenter = node.append("g")
            .selectAll("text")
            .data(centerdata).enter()
            .append("text")
            .attr("class", "node-text")
            .attr("fill", "slategray")
            .attr("x", graphCenter[0])
            .attr("y", graphCenter[1] + nodeTxtOffset + 15)
            .text(d => multiWordsFormat(d.target))
            .style("font-size", "14px")
            .on("mouseover", d => showFullName(d.target))
            .on("mousemove", moveFullName)
            .on("mouseout", hideFullName);
        
        console.log(textCenter)
        console.log(typeof queryCenter)
    } else {
        fistNodeDistance = 180;
        coeffTxtOffset = 0.8;
        let centernode = node.append("g")
            .attr("id", "queryNode")
            .selectAll("circle")
            .data(queryCenter)
            .enter().append("circle")
            .attr("class", "node-multi-center")
            .attr("r", 120)
            .attr("cx", d => graphCenter[0])
            .attr("cy", graphCenter[1])
            .on("click", clicked);

        drawPreview();
        function drawPreview(){
            console.log(packLinks, packNodes);
            if (packLinks.length < 2) {
            //draw node map
            // const width = workSpaceWidth,
            //     height = ;
            var svgMNode = graphContainer
                .append("g")
                .attr("id", "#multiNodePreview")

            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function (d) {
                    return d.id;
                }).distance(80))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(workSpaceWidth / 2, workSpaceHeight/ 2));

            var previewLink = svgMNode.append("g")
                .attr("class", "node-multi-pre-link")
                .selectAll("line")
                .data(packLinks[0])
                .enter()
                .append("line")
                .attr("marker-end", d => (d.type === "directed") ? "url(#triangleArrow-p)" : null);

            var previewNodeG = svgMNode.append("g")
                .selectAll(".prev-node-g")
                .data(packNodes).enter()
                .append("g")
                .classed("prev-node-g", true)
                .call(d3.drag()
                    .on("start", dragstartedPreview)
                    .on("drag", draggedPreview)
                    .on("end", dragendedPreview));

            previewNodeG.append("circle")
                .attr("r", 12)
                .attr("class", "node")

            previewNodeG
                .append("text")
                .text(d => multiWordsFormat(d.id))
                .attr("x", 0).attr("y", 20)
                .attr("class", "node-preview-text")
                .on("mouseover", d => showFullName(d.id))
                .on("mousemove", moveFullName)
                .on("mouseout", hideFullName);

            // previewNodeG.append("title").text(d => d.id)
            // console.log(previewNode);

            simulation
                .nodes(packNodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(packLinks[0]);

            function ticked() {
                previewLink
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => (d.type === "directed") ? getTargetNodeCircumferencePoint(d)[0] : d.target.x)
                    .attr("y2", d => (d.type === "directed") ? getTargetNodeCircumferencePoint(d)[1] : d.target.y)

                function getTargetNodeCircumferencePoint(d) {
                    var t_radius = 20; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
                    var dx = d.target.x - d.source.x;
                    var dy = d.target.y - d.source.y;
                    var gamma = Math.atan2(dy, dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
                    var tx = d.target.x - (Math.cos(gamma) * t_radius);
                    var ty = d.target.y - (Math.sin(gamma) * t_radius);
                    return [tx, ty];
                }

                previewNodeG
                    .attr("transform", d => `translate(${d.x}, ${d.y})`)
            }

            function dragstartedPreview(d) {
                d3.event.sourceEvent.stopPropagation();
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function draggedPreview(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            function dragendedPreview(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        } else {
            //draw pack

        }
        }

        centernode.on("mouseover", packedMouseOver)
            .on("mouseleave", packedMouseLeave);

        function packedMouseOver() {
            // console.log(packList);
        }

        function packedMouseLeave() {

        }
    }

    var txtOffset = -15
    var linkRight, linkLeft ,textRight, textLeft, nodeRight, nodeLeft, leftFirstList, rightFirstList
    var leftMaxCnt, rightMaxCnt, totalMaxCnt
    var inNodeHistScaler = d3.scaleLinear()
        .range([-0.5 * nodeRadius, 0.5*nodeRadius])
        .domain([-1, 1]).nice();
    // get all list
    var allList = new Array()
    // axios.post('http://127.0.0.1:5000/nodelist', {
    //     name: name
    // })
    // .then(function (response) { // if success then update data
    //     allList = response.data;
    //     drawFirstSteps(-1);
    //     drawFirstSteps(1);
    // })
    var linkScaler
    drawFirstSteps(-1);
    drawFirstSteps(1);


    //add vertical line
    
    var verLiney = ({
        y1: workSpaceHeight-bottomAxisMargin.top - 10,
        y2: bottomAxisMargin.top + 10
    })

    function appendVerLine(selection, xPos) {
        selection.append("line")
        .attr("x1", xPos)
        .attr("y1", verLiney.y1)
        .attr("x2", xPos)
        .attr("y2", verLiney.y2)
        .attr("class", "vertical-line");
    }

    let centerVerline = verticalLine.append("g")  
        .attr("id", "seq0");

    appendVerLine(centerVerline, graphCenter[0]);
    
    let leftVerline = verticalLine.append("g")  
        .attr("id", "seq-1")
        .call(d3.drag().on("drag", vlineDragged));

    appendVerLine(leftVerline, graphCenter[0]-fistNodeDistance);

    let rightVerline = verticalLine.append("g")  
        .attr("id", "seq1")
        .call(d3.drag().on("drag", vlineDragged));

    appendVerLine(rightVerline, graphCenter[0]+fistNodeDistance);

    //add horizontal line(interval indicator)

    function appendHorLine(selection, x1pos, x2pos){
        selection.append("line")
            .attr("class", "horizontal-line")
            .attr("x1", x1pos)
            .attr("y1", verLiney.y1+5)
            .attr("x2", x2pos)
            .attr("y2", verLiney.y1+5)
            .attr("marker-end", "url(#triangleArrow-hor)")
            .attr("marker-start", "url(#triangleArrow-hor)");
        
        selection.append("text")
            .attr("x", (x1pos + x2pos)/2)
            .attr("y", verLiney.y1)
            .attr("class", "horizontal-line-text")
            .text(d3.format(".0f")(xBottom(graphCenter[0]+arrowOffset*2) - xBottom(graphCenter[0]) + Math.abs(xBottom(x2pos)-xBottom(x1pos))));
        selection.append("text")
            .attr("x", (x1pos + x2pos)/2)
            .attr("y", verLiney.y1+15)
            .attr("class", "horizontal-line-text-unit")
            .text("mins");
    }
    var arrowOffset = 4;
    let leftHorline = horizontalLine.append("g")
        .attr("id", "seq-1");
    appendHorLine(leftHorline, graphCenter[0]-arrowOffset, graphCenter[0]-fistNodeDistance+arrowOffset);
    let rightHorline = horizontalLine.append("g")
        .attr("id", "seq1");
    appendHorLine(rightHorline, graphCenter[0]+arrowOffset, graphCenter[0]+fistNodeDistance-arrowOffset);

    //scale links
    

    // get and draw first links 
    function drawFirstSteps(seq) {
        axios.post('http://127.0.0.1:5000/query_single_new', {
            name: queryCenter,
            sequence: seq,
            list: allList,
            timeStart: timeStart,
            timeEnd: timeEnd
            // time: t
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function (response) { // if success then update data
                console.log(response.data.link);
                // console.log(linkGroup, linkLeft, linkRight);
                let linkGroup = link.append("g") //add links
                    .selectAll("line")
                    .data(response.data.link)
                    .enter().append("line")
                    .attr("class", "link")
                    .attr("id", `seq${seq}`)
                    .attr("stroke-width", 1)
                    .attr("x1", d => graphCenter[0])
                    .attr("y1", d => graphCenter[1])
                    .attr("x2", d => graphCenter[0] + seq * fistNodeDistance)
                    .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, response.data.link.length));

                let linkTextGroup = link.append("g") // add text on links
                    .selectAll("text")
                    .data(response.data.link).enter()
                    .append("text")
                    .attr("class", "link-text link-text-main")
                    .attr("id", `seq${seq}`)
                    .attr("x", d => graphCenter[0] + coeffTxtOffset * seq * fistNodeDistance)
                    .attr("y", (d, i) => txtOffset + graphCenter[1] + coeffTxtOffset * MainLayoutScaler(i, response.data.link.length))
                    .text(d => d.count)
                    .classed("text-hide", true);
                let nodeGroup = node.selectAll(`#seq${seq}`)
                    .data(response.data.link)
                    .enter().append("g")
                    .attr("id", `seq${seq}`)
                    .attr("transform",  d => "translate("+ linkGroup.filter(l => l.target == d.target).attr("x2") + "," 
                        + linkGroup.filter(l => l.target == d.target).attr("y2") + ")");
                    // .call(d3.drag().on("drag", dragged));
                nodeGroup
                    .append("circle")
                    .attr("class", "node")
                    .attr("r", nodeRadius)
                    .on("click", clicked)
                    .on("mouseover", NodeMouseOver)
                    .on("mousemove", NodeMouseMove)
                    .on("mouseleave", NodeMouseLeave);
                nodeGroup.append("text")
                    .attr("class", "node-text")
                    .attr("y", nodeTxtOffset)
                    .text(d => multiWordsFormat(d.target))
                    .on("mouseover", d => showFullName(d.target))
                    .on("mousemove", moveFullName)
                    .on("mouseout", hideFullName);
                //calculate the proportion of thisnode atv / total atv

                let atvmean = d3.mean(response.data.link, d => d.atv);
                let digitFormat = d3.format("+.1f"); // set format: eg. +0.1/-0.1 
                // console.log(digitFormat(atvmean));
                nodeGroup.append("rect")
                    .attr("width", 0.8 * nodeRadius)
                    .attr("x", -0.4 * nodeRadius)
                    .attr("y", d => (d.atv-atvmean > 0) ? -inNodeHistScaler((d.atv-atvmean)/atvmean) : 0) // if result is postive then the bar should be put over the baseline
                    .attr("height", d => inNodeHistScaler(Math.abs((d.atv-atvmean)/atvmean)))
                    .attr("class", "innode-graph")
                    .attr("fill", d => (d.atv-atvmean > 0) ? "#C59CBD" : "#9CC5A5");
                //baseline
                nodeGroup.append("line")
                    .attr("x1", -0.6 * nodeRadius).attr("x2", 0.6 * nodeRadius)
                    .attr("class", "innode-graph");
                //number text with "+" "-"
                nodeGroup.append("text")
                    .text(d => digitFormat(d.atv-atvmean))
                    .attr("class", "innode-graph")
                    .attr("y", d => (d.atv-atvmean > 0) ? 11 : -3)
                    .attr("fill", d => (d.atv-atvmean > 0) ? "#C59CBD" : "#98AC9D");
                //add hover events
                node.selectAll(".innode-graph")
                    .on("mouseover", InNodeGraphMouseOver)
                    .on("mousemove", InNodeGraphMouseMove)
                    .on("mouseleave", InNodeGraphMouseLeave);
                function InNodeGraphMouseOver(d){
                    inNodeTooltip.style("opacity", 1);
                }
                function InNodeGraphMouseMove(d) {
                    let dpx = event.pageX,
                        dpy = event.pageY;
                    let percentFormat = d3.format(".0%"),
                        numFormat = d3.format(".1f");
            
                    inNodeTooltip
                        .html(inNodeTooltipHtml(d))
                        .style("top", dpy + "px")
                        .style("left", dpx + "px");
                    
                    function inNodeTooltipHtml(d){
                        if (d.atv-atvmean > 0) {
                            return "ATV: " + "<span style = 'color:#C94CB0'>" + numFormat(d.atv) + "</span>; <br>" 
                            + "<span style = 'color:#C94CB0'>" + numFormat(Math.abs(d.atv-atvmean)) + "(" +  percentFormat(Math.abs(d.atv-atvmean)/atvmean)+ ")</span>" + " more than the average ATV " 
                            + "<span style = 'color:#6C7CAB'>" + numFormat(atvmean) + "</span>."
                        } else {
                            return "ATV: "  + "<span style = 'color:#328347'>" + numFormat(d.atv) + "</span>; <br>" 
                            + "<span style = 'color:#328347'>" + numFormat(Math.abs(d.atv-atvmean)) + "(" +  percentFormat(Math.abs(d.atv-atvmean)/atvmean)+ ")</span>" + " less than the average ATV " 
                            + "<span style = 'color:#6C7CAB'>" + numFormat(atvmean) + "</span>."
                        }
                    }
                }
                function InNodeGraphMouseLeave(d) {
                        inNodeTooltip
                            .style("opacity", 0);
                    }
                // let thisStepList = new Array();
                // response.data.link.forEach(d => thisStepList.push(d.target));

                if (seq === -1){
                    linkLeft = linkGroup;
                    nodeLeft = nodeGroup;
                    textLeft = linkTextGroup;
                    leftFirstList = response.data.route_list;
                    leftMaxCnt = d3.sum(response.data.link, d => d.count)

                } else if (seq === 1){
                    linkRight = linkGroup;
                    nodeRight = nodeGroup;
                    textRight = linkTextGroup;
                    rightFirstList = response.data.route_list;
                    rightMaxCnt = d3.sum(response.data.link, d => d.count)
                }

                totalMaxCnt = Math.max(leftMaxCnt, rightMaxCnt);
                if (!isNaN(totalMaxCnt)) {
                    linkScaler = d3.scaleLinear()
                        .range([0.5, 20])
                        .domain([1, totalMaxCnt])
                    link.selectAll("line")
                        .transition().duration(300)
                        .attr("stroke-width", d=> linkScaler(d.count))
                }

            });
    }


    //drag vertical line event
    function vlineDragged(d){
        // console.log(linkLeft)
        // console.log(d3.event.x)
        let dLinex = d3.event.x;
        var thisLine = d3.select(this);
        thisLine.select("line").attr("x1", dLinex).attr("x2", dLinex);
        if (thisLine.attr("id") === "seq-1") { //left seq 1 node
            nodeLeft.attr("transform",  d => "translate("+ dLinex + "," 
            + linkLeft.filter(l => l.target == d.target).attr("y2") + ")");
            linkLeft.attr("x2",dLinex);
            //move left text
            textLeft.attr("x", d => graphCenter[0] + coeffTxtOffset * (-1) * (graphCenter[0]-dLinex));
            //move horizontal line
            horLineMove(-1, -2);
            //if left plus line is drawn
            if (linkLeftplus[2] != undefined) {
                linkLeftplus[2].attr("x1", dLinex);
                linkTxtPosMove(-2, linkLeftplus[2]);
            }

        } else if (thisLine.attr("id") === "seq1") { //right seq 1 node
            nodeRight.attr("transform",  d => "translate("+ dLinex + "," 
            + linkRight.filter(l => l.target == d.target).attr("y2") + ")");
            linkRight.attr("x2",dLinex);
            //move right line text
            textRight.attr("x", d => graphCenter[0] + coeffTxtOffset * d.sequence * (dLinex-graphCenter[0]));
            //move horizontal line
            horLineMove(1, 2);
            if (linkRightplus[2] != undefined) {
                linkRightplus[2].attr("x1", dLinex);
                // console.log(linkRightplus[2].selectAll("text"))
                linkTxtPosMove(2, linkRightplus[2]);
            }
        } else {
            var seq = parseFloat(thisLine.attr("id").replace("seq", ""));
            let allgroup = d3.selectAll(`#${thisLine.attr("id")}`);
            allgroup.selectAll("circle").attr("cx", dLinex);
            allgroup.selectAll(".node-text").attr("x", dLinex); //node text move
            allgroup.selectAll("line").attr("x2", dLinex);
            if (seq>0) {
                horLineMove(seq, seq+1);
                linkTxtPosMove(seq, linkRightplus[seq]);
                if (linkRightplus[seq+1] != undefined) {
                    linkRightplus[seq+1].attr("x1", dLinex);
                    
                    linkTxtPosMove(seq+1, linkRightplus[seq+1]);
                }
            } else {
                horLineMove(seq, seq-1);
                linkTxtPosMove(seq, linkLeftplus[-seq]);
                if (linkLeftplus[-seq+1] != undefined) {
                    linkLeftplus[-seq+1].attr("x1", dLinex);
                    linkTxtPosMove(seq-1, linkLeftplus[-seq+1]);
                }
            }
        }
        function horLineMove(seq, nxtseq){
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line") 
                .attr("x2", () => (dLinex < graphCenter[0]) ? dLinex + arrowOffset : dLinex - arrowOffset);
            horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line") 
                .attr("x1", () => (dLinex < graphCenter[0]) ? dLinex - arrowOffset : dLinex + arrowOffset);
            let seqx1pos = parseFloat(horizontalLine.select(`#seq${seq}`).select(".horizontal-line").attr("x2")),
                seqx2pos = parseFloat(horizontalLine.select(`#seq${seq}`).select(".horizontal-line").attr("x1"));
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line-text")
                .attr("x", (seqx1pos + seqx2pos)/2)
                .text(d3.format(".0f")(xBottom(graphCenter[0]+arrowOffset*2) - xBottom(graphCenter[0]) + Math.abs(xBottom(seqx2pos)- xBottom(seqx1pos))));
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line-text-unit")
                .attr("x", (seqx1pos + seqx2pos)/2);
            if (!horizontalLine.select(`#seq${nxtseq}`).empty()){ // if the selection not empty
                let nxtseqx1pos = parseFloat(horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line").attr("x2")),
                    nxtseqx2pos = parseFloat(horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line").attr("x1"));
                horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line-text")
                    .attr("x", (nxtseqx1pos + nxtseqx2pos)/2)
                    .text(d3.format(".0f")(xBottom(graphCenter[0]+arrowOffset*2) - xBottom(graphCenter[0]) + Math.abs(xBottom(nxtseqx2pos)-xBottom(nxtseqx1pos))));
                horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line-text-unit")
                    .attr("x", (nxtseqx1pos + nxtseqx2pos)/2)
            }
            
        }
    }

    function linkTxtPosMove(seq, linkGroup){
        link.selectAll(`#seq${seq}`).selectAll("text") //select text belongs to the seq
            .attr("x", t => 0.5 * (
                parseFloat(linkGroup.filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                parseFloat(linkGroup.filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
            .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkGroup.filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                parseFloat(linkGroup.filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
    }

    //drag node event: currently banned
    function dragged(d) {
        console.log(event.pageX)
        // console.log(d);
        graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
        d.x = d3.event.x, d.y = d3.event.y;
        // d3.select(this).selectattr("stroke", "#18569C");

        d3.select(this).attr("transform", "translate("+ d.x + "," + d.y + ")")

        linkRight.filter(
            l => l.source == d.target
        ).attr("x1", d.x).attr("y1", d.y);
        linkRight.filter(
            l => l.target == d.target
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
            link.selectAll(".link-text-rightplus").filter(t => t.source === d.target)
                .attr("x", t => 0.5 * (
                    parseFloat(linkRightplus[2].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                    parseFloat(linkRightplus[2].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                    parseFloat(linkRightplus[2].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                    parseFloat(linkRightplus[2].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
        }

        if (graphLeftPlusExist) {
            linkLeftplus[2].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            link.selectAll(".link-text-leftplus").filter(t => t.source === d.target)
                .attr("x", t => 0.5 * (
                    parseFloat(linkLeftplus[2].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                    parseFloat(linkLeftplus[2].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                    parseFloat(linkLeftplus[2].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                    parseFloat(linkLeftplus[2].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
        }

        // console.log(d.id);
        // drawsta();
        // text.text('Place: ' + d.place)
    }
    //Click node event

    function clicked(d) {
        let thisNode = d3.select(this), thisNodeParent = d3.select(this.parentNode);
        let thisText = d3.selectAll(`#${thisNodeParent.attr("id")}`)
            .selectAll(".node-text").filter(t => d.target === t.target);
            console.log(thisNodeParent)
        // console.log(node.selectAll("text"));
        if (d3.event.shiftKey) {
            createQuery(d.target, "single",  nodeList);
        } else {
            console.log(d,"clicked");
            d3.select("#staContainer").classed("hide",false);
            d3.selectAll(".sta-single").on("click",StaLabelClick);
            d3.select(".sta-nodename").select("span")
                .html(d.target)
            // drawsta();
            // text.text('Place: ' + d.place)
            graphContainer.selectAll("circle").classed("clicked", false);
            thisNode.classed("clicked", true);
            node.selectAll(".node-text").classed("clicked", false);
            // node.selectAll(".node-text").filter(t => t.sequence < -1 || t.sequence > 1).classed("text-hide", true);
            thisNodeParent.selectAll(".node-text")
                .attr("class", "node-text clicked");
            thisText.attr("class", "node-text clicked");
                // .classed("text-hide", false)
        }
    }

    let linkRightplus = new Array();
    let nodeRightplus = new Array();
    let linkLeftplus = new Array();
    let nodeLeftplus = new Array();
    let leftLastList = new Array();
    let rightLastList = new Array();
    //Add steps control
    graphBg.append("g")
        .on("click", afterplus)
        .append('text')
        .attr("class", "after-controller")
        .text("➕")
        .attr("x", "95%")
        .attr("y", "48%");

    graphBg.append("g")
        .on("click", afterminus)
        .append('text')
        .attr("class", "after-controller")
        .text("➖")
        .attr("x", "95%")
        .attr("y", "54%");

    graphBg.append("g")
        .on("click", beforeplus)
        .append('text')
        .attr("class", "before-controller")
        .text("➕")
        .attr("x", "5%")
        .attr("y", "48%");

    graphBg.append("g")
        .on("click", beforeminus)
        .append('text')
        .attr("class", "before-controller")
        .text("➖")
        .attr("x", "5%")
        .attr("y", "54%");

    if (graphid === "graph-second") {
        graphBg.selectAll(".before-controller")
            .attr("x", "55%")
    }

    let rseq = 2, lseq = 2, maxseq = 4;

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

    function LayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-10 - 10 * subC, 10 + 10 * subC])
            .domain([0.3, subC + 0.7]);
        return scaler(subID);
    }
    function LayoutScaler_Adjust(thisID,count) {
        let scaler = d3.scaleLinear()
            .range([graphCenter[1] - workSpaceHeight / 4, graphCenter[1] + workSpaceHeight / 4])
            .domain([-0.3, count-0.7]);
        return scaler(thisID);
    }

    function drawPlusVerticalLine(seq, lastseq, gap){
        let verLine = verticalLine.append("g")  
            .attr("id", `seq${seq}`)
            .call(d3.drag().on("drag", vlineDragged));
        let verLineXpos = parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")) + gap;
        verLine.append("line")
            .attr("x1", verLineXpos)
            .attr("y1", verLiney.y1)
            .attr("x2", verLineXpos)
            .attr("y2", verLiney.y2)
            .attr("class", "vertical-line");
    }

    function drawPlusHorizontalLine(seq, lastseq, gap){
        let horLine = horizontalLine.append("g")
            .attr("id", `seq${seq}`)
        let horLineX1pos =  parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")),
            horLineX2pos =  parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")) + gap;
        if (horLineX1pos < graphCenter[0]) {
            horLineX1pos -= arrowOffset
        } else {
            horLineX1pos += arrowOffset;
        };
        if (horLineX2pos < graphCenter[0]) {
            horLineX2pos += arrowOffset
        } else {
            horLineX2pos -= arrowOffset;
        }
        appendHorLine(horLine, horLineX1pos, horLineX2pos);
    }

    function drawRightplus(seq) {
        graphRightPlusExist = true;
        //add vertical line
        drawPlusVerticalLine(seq, seq-1, 80);
        drawPlusHorizontalLine(seq, seq-1, 80);

        var queryData
        if (seq === 2){
            queryData = {
                name: queryCenter,
                sequence: seq,
                list: rightFirstList,
                timeStart: timeStart,
                timeEnd: timeEnd
            }
        } else {
            queryData = {
                name: queryCenter,
                sequence: seq,
                list: rightLastList[seq-1],
                timeStart: timeStart,
                timeEnd: timeEnd
            }
        }
        axios.post('http://127.0.0.1:5000/query_single_new', queryData)
            .catch(function (error) {
                console.log(error);
            })
            .then(function (response) { 
                console.log(response.data.node)
                // get this step's node list
                // let thisStepList = new Array();
                // response.data.node.forEach(d => thisStepList.push(d.target));
                rightLastList[seq] = response.data.route_list;
                if (seq === 2) {
                    linkRightplus[seq] = link.append("g")
                        .attr("id", `seq${seq}`)
                        .selectAll("line")
                        .data(response.data.link)
                        .enter().append("line")
                        .attr("class", "link")
                        .attr("stroke-width", 0)
                        .attr("x1", d => linkRight.filter(n => n.target == d.source).attr("x2"))
                        .attr("y1", d => linkRight.filter(n => n.target == d.source).attr("y2"))
                        .attr("x2", d => parseFloat(linkRight.filter(n => n.target == d.source).attr("x2")) + 80)
                        .attr("y2", 0);
        
                    nodeRightplus[seq] = node.append("g")
                        .attr("id", `seq${seq}`)
                        .selectAll("circle")
                        .data(response.data.node)
                        .enter().append("circle")
                        .attr("class", "node")
                        .attr("r", 10)
                        .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                        .attr("cy", (d,i) => LayoutScaler_Adjust(i, response.data.node.length))
                        // .call(d3.drag().on("drag", dragged))
                        .on("click", clicked)
                        .on("mouseover", NodeMouseOver)
                        .on("mousemove", NodeMouseMove)
                        .on("mouseleave", NodeMouseLeave);

                } else {
                    linkRightplus[seq] = link.append("g")
                        .attr("id", `seq${seq}`)
                        .selectAll("line")
                        .data(response.data.link)
                        .enter().append("line")
                        .attr("class", "link")
                        .attr("stroke-width", 0)
                        .attr("x1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                        .attr("y1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                        .attr("x2", d => parseFloat(linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2")) + 80)
                        .attr("y2", 0);
        
                    nodeRightplus[seq] = node.append("g")
                        .attr("id", `seq${seq}`)
                        .selectAll("circle")
                        .data(response.data.node)
                        .enter().append("circle")
                        .attr("class", "node")
                        .attr("r", 10)
                        .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                        .attr("cy", (d,i) => LayoutScaler_Adjust(i, response.data.node.length))
                        // .attr("cy", (d,i) => 100+ i * 40)
                        // .call(d3.drag().on("drag", dragged))
                        .on("click", clicked)
                        .on("mouseover", NodeMouseOver)
                        .on("mousemove", NodeMouseMove)
                        .on("mouseleave", NodeMouseLeave);
                    
                    //if this step nodes amount < last step nodes amount, then do not apply dumb layout
                    // if  ((graph.node.filter(d => d.sequence == seq).length < 4) || (graph.node.filter(d => d.sequence == seq).length < (1+graph.node.filter(d => d.sequence == seq-1).length))) {
                    //     nodeRightplus[seq].attr("cy", d => parseFloat(linkRightplus[seq].filter(l => l.target == d.target).attr("y2")))
                    // }

                }
                linkRightplus[seq]
                    .attr("y2", d => nodeRightplus[seq].filter(n => n.target === d.target).attr("cy"))
                    .transition().duration(300)
                    .attr("stroke-width", d => linkScaler(d.count))
                // add link text
                link.append("g")
                    .attr("id", `seq${seq}`)
                    .selectAll(".link-text-rightplus")
                    .data(response.data.link).enter()
                    .append("text")
                    .attr("class", "link-text link-text-rightplus")
                    .attr("x", d => 0.5 * (
                        parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                        parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
                    .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                        parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                        parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
                    .text(d => d.count)
                    .classed("text-hide", true)
                //add node text
                node.append("g")
                    .attr("id", `seq${seq}`)
                    .selectAll("text")
                    .data(response.data.node)
                    .enter().append("text")
                    .attr("class", "node-text")
                    .attr("x", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                    .attr("y", d => parseFloat(linkRightplus[seq].filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset * 0.6)
                    .text(d => multiWordsFormat(d.target))
                    .on("mouseover", d => showFullName(d.target))
                    .on("mousemove", moveFullName)
                    .on("mouseout", hideFullName);
                    // .classed("text-hide", true)
            });
        
        //Calculate vertical layout


        function dragged(d) {
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            // let originX = d3.select
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            node.selectAll(".node-text").filter(t => t.target === d.target)
                .attr("x", d.x).attr("y", d.y + nodeTxtOffset * 0.6);
            linkRightplus[seq].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkRightplus[seq].filter(
                l => l.target == d.target
            ).attr("x2", d.x).attr("y2", d.y);
            link.selectAll("text").filter(t => t.target === d.target)
                .attr("x", t => 0.5 * (
                    parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                    parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                    parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                    parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y2"))));
            if (linkRightplus[seq + 1] != undefined) {
                linkRightplus[seq + 1].filter(
                    l => l.source == d.target
                ).attr("x1", d.x).attr("y1", d.y);
                link.selectAll("text").filter(t => t.source === d.target)
                    .attr("x", t => 0.5 * (
                        parseFloat(linkRightplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                        parseFloat(linkRightplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                    .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                        parseFloat(linkRightplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                        parseFloat(linkRightplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
            }

        }
    }
    function drawLeftplus(seq) {
        graphLeftPlusExist = true;
        //add vertical line
        drawPlusVerticalLine(-seq ,-seq+1, -80);
        drawPlusHorizontalLine(-seq ,-seq+1, -80);

        var queryData
        console.log(leftFirstList, rightFirstList);
        if (seq === 2){
            queryData = {
                name: queryCenter,
                sequence: -seq,
                list: leftFirstList,
                timeStart: timeStart,
                timeEnd: timeEnd
            }
        } else {
            queryData = {
                name: queryCenter,
                sequence: -seq,
                list: leftLastList[seq-1],
                timeStart: timeStart,
                timeEnd: timeEnd
            }
        }
        //Calculate vertical layout
        axios.post('http://127.0.0.1:5000/query_single_new', queryData)
        .catch(function (error) {
            console.log(error);
        })
        .then(function (response) { 

            console.log(seq, response.data)
            // let thisStepList = new Array();
            // response.data.node.forEach(d => thisStepList.push(d.target));
            leftLastList[seq] = response.data.route_list;
            if (seq == 2) {
                linkLeftplus[seq] = link.append("g")
                    .attr("id", `seq${-seq}`)
                    .selectAll("line")
                    .data(response.data.link)
                    .enter().append("line")
                    .attr("class", "link")
                    .attr("stroke-width", 0)
                    .attr("x1", d => linkLeft.filter(n => n.target == d.source).attr("x2"))
                    .attr("y1", d => linkLeft.filter(n => n.target == d.source).attr("y2"))
                    .attr("x2", d => parseFloat(linkLeft.filter(n => n.target == d.source).attr("x2")) - 80)
                    .attr("y2", 0);

                nodeLeftplus[seq] = node.append("g")
                    .attr("id", `seq${-seq}`)
                    .selectAll("circle")
                    .data(response.data.node)
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("r", 10)
                    .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                    .attr("cy",  (d,i) => LayoutScaler_Adjust(i, response.data.node.length))
                    // .call(d3.drag().on("drag", dragged))
                    .on("click", clicked)
                    .on("mouseover", NodeMouseOver)
                    .on("mousemove", NodeMouseMove)
                    .on("mouseleave", NodeMouseLeave);

            } else {
                linkLeftplus[seq] = link.append("g")
                    .attr("id", `seq${-seq}`)
                    .selectAll("line")
                    .data(response.data.link)
                    .enter().append("line")
                    .attr("class", "link")
                    .attr("stroke-width", 0)
                    .attr("x1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                    .attr("y1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                    .attr("x2", d => parseFloat(linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2")) - 80)
                    .attr("y2", 0);

                nodeLeftplus[seq] = node.append("g")
                    .attr("id", `seq${-seq}`)
                    .selectAll("circle")
                    .data(response.data.node)
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("r", 10)
                    .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                    .attr("cy", (d,i) => LayoutScaler_Adjust(i, response.data.node.length))
                    // .call(d3.drag().on("drag", dragged))
                    .on("click", clicked)
                    .on("mouseover", NodeMouseOver)
                    .on("mousemove", NodeMouseMove)
                    .on("mouseleave", NodeMouseLeave);

                //if this step nodes amount < last step nodes amount, then do not apply dumb layout
                // if  ((graph.node.filter(d => d.sequence == -seq).length < 4) || (graph.node.filter(d => d.sequence == -seq).length < (1+graph.node.filter(d => d.sequence == -seq+1).length))) {
                //     nodeLeftplus[seq].attr("cy", d => parseFloat(linkLeftplus[seq].filter(l => l.target == d.target).attr("y2")))
                // }
            }
            linkLeftplus[seq]
                .attr("y2", d => nodeLeftplus[seq].filter(n => n.target === d.target).attr("cy"))
                .transition().duration(300)
                    .attr("stroke-width", d => linkScaler(d.count))

            //add text
            link.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll(".link-text-leftplus")
                .data(response.data.link)
                .enter().append("text")
                .attr("class", "link-text-leftplus link-text")
                .attr("x", d => 0.5 * (
                    parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                    parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
                .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                    parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                    parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
                .text(d => d.count)
                .classed("text-hide", true)

            node.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("text")
                .data(response.data.node)
                .enter().append("text")
                .attr("class", "node-text")
                .attr("x", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("y", d => parseFloat(linkLeftplus[seq].filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset * 0.6)
                .text(d => multiWordsFormat(d.target))
                .on("mouseover", d => showFullName(d.target))
                .on("mousemove", moveFullName)
                .on("mouseout", hideFullName);
                // .classed("text-hide", true)
        })    

        function dragged(d) {
            // console.log(d);
            graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
            d.x = d3.event.x, d.y = d3.event.y;
            d3.select(this).attr("stroke", "#18569C");
            d3.select(this).attr("cx", d.x).attr("cy", d.y);
            node.selectAll(".node-text").filter(t => t.target === d.target)
                .attr("x", d.x).attr("y", d.y + nodeTxtOffset * 0.6);
            // console.log(link.selectAll(`seq${seq}`), linkRightplus[seq])
            linkLeftplus[seq].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
            linkLeftplus[seq].filter(
                l => l.target == d.target
            ).attr("x2", d.x).attr("y2", d.y);
            link.selectAll("text").filter(t => t.target === d.target)
                .attr("x", t => 0.5 * (
                    parseFloat(linkLeftplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                    parseFloat(linkLeftplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                    parseFloat(linkLeftplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                    parseFloat(linkLeftplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
            if (seq < lseq && linkLeftplus[seq + 1] != undefined) {
                linkLeftplus[seq + 1].filter(
                    l => l.source == d.target
                ).attr("x1", d.x).attr("y1", d.y);
                link.selectAll("text").filter(t => t.source === d.target)
                    .attr("x", t => 0.5 * (
                        parseFloat(linkLeftplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                        parseFloat(linkLeftplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
                    .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                        parseFloat(linkLeftplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                        parseFloat(linkLeftplus[seq + 1].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
            }
        }
    }


    function NodeMouseOver(d) {
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode);
        // console.log(hoveredNodeParent);
        node.selectAll("circle").filter(d => d.route != undefined).classed("not-this-route", true)
        link.selectAll("line").classed("not-this-route", true)
        link.selectAll("text").classed("not-this-route", true)
        // console.log(d)
        d.route.forEach(function (r) {
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

        hoveredNodeParent
            .append("text")
            .attr("class", "recenter-text hide")
            .attr("x", 0)
            .attr("y", -30)
            .text("Click to center")

        if (d3.event.shiftKey){
            console.log("shifthover!")
            hoveredNode
                .classed("node", false)
                .attr("stroke-width", 3)
                .attr("stroke", "#00AAFF");
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", false);
        } else {
            hoveredNode
                .classed("node", true)
                .attr("stroke-width", null)
                .attr("stroke", null)
                .attr("fill", null);
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", true);
        }
    }

    function NodeMouseMove(d){
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode)
        //recenter
        if (d3.event.shiftKey){
            console.log("shifthover!")
            hoveredNode
                .classed("node", false)
                .attr("stroke-width", 3)
                .attr("stroke", "#00AAFF");
                // .attr("fill", "#00AAFF");
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", false);
        } else {
            hoveredNode
                .classed("node", true)
                .attr("stroke-width", null)
                .attr("stroke", null)
                .attr("fill", null);
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", true);
        }
    }

    function NodeMouseLeave(d) {
        //Reset all styles
        d3.select(this).classed("node", true)
            .attr("stroke-width", null)
            .attr("stroke", null)
            .attr("fill", null);
        d3.selectAll(".recenter-text").remove();
        node.selectAll("circle").classed("this-route", false);
        node.selectAll("circle").classed("not-this-route", false);
        link.selectAll("line").classed("this-route", false);
        link.selectAll("line").classed("not-this-route", false)
        link.selectAll("text").classed("this-route", false)
        link.selectAll("text").classed("not-this-route", false)

    }

    workSpace.selectAll("#conditionBox").remove();

    let conditionBox = graphBg.append("g")
        .attr("id", "conditionBox")
        .attr("transform", `translate(${0.45 * width}, ${0.9 * workSpaceHeight})`)

    if (graphid === "graph-first") {
        conditionCount = 0;
    }

    function initializeConditionBox() {
        conditionBox.append("rect")
            // .attr("x", "45%")
            // .attr("y", 0.9 * workSpaceHeight)
            .attr("height", 50)
            .attr("width", 0.1 * width)
            .attr("fill", "#808080")
            .attr("opacity", .5)

        conditionBox.append("text")
            .attr("x", 0.05 * width)
            .attr("y", 25)
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
    function StaLabelClick(){
        console.log("staclick");
        let thisCard = d3.select(this);
        if (!thisCard.classed("sta-card")){
            let svgWidth = 200, svgHeight = 200;
            thisCard.classed("sta-card", true);
            let svg = thisCard.append("svg")
                .transition().duration(200)
                .attr("height", svgHeight)
                .attr("width", svgWidth);
            setTimeout(() => {
                drawsamplepie(d3.select(this).selectAll("svg"), svgWidth, svgHeight)
            }, 200)
            
        } else {
            thisCard.selectAll("svg")
            .transition().duration(200)
            .attr("height", 0)
            .attr("width", 0)
            .remove();
            thisCard.classed("sta-card", false);
        }
    }


    //draw sample pie chart
    function drawsamplepie(svg, svgWidth, svgHeight) {
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

        let samplePie = svg.append("g")
            .attr("class", "samplePie")

        let arcSample = d3.arc()
            .outerRadius(75)
            .innerRadius(0)

        let spConverter = d3.pie().value(d => d.value)

        samplePie.selectAll("path")
            .data(spConverter(fakeData))
            .enter()
            .append("path")
            .attr('transform', `translate(${svgWidth/2}, 
                ${svgHeight/2})`)
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
            svg.selectAll("g").remove();
            drawsamplepie(svg, svgWidth, svgHeight);
        }
    }
    //all done, set graph exist indicator = true
    graphExist = true;
}