function drawGraph(graphid, type, queryCenter, timeStart, timeEnd, maxNum) {
    packLinkData = copy(packLinks), packNodeData = copy(packNodes);
    // graphLeftData = 

    var innodePieClickedFlag = false;
    var firstDefaultInterval = 999, plusDefaultInterval = 999;
    if (timeIntervalFlag) {
        if (type === "single"){
            firstDefaultInterval = 100;
        } else {
            firstDefaultInterval = 180;
        }
        plusDefaultInterval = 80;
    }

    let pieColorScale = d3.scaleOrdinal().domain([0, 1])
        .range(["#F7CE3E", "#1A2930"]);
    let atvColors = ["#DA5EA7", "#5C9E6D"]

    // get all list
    var allList = new Array();
    //initialize condition list
    var conditionList = new Array();
    // show link density filter
    d3.select("#lineWeightFilter").classed("hide", false);
    d3.select("#linkVisTxt").classed("hide", false);

    d3.selectAll(".brush-child").classed("hide", true);

    const graphCenter = [workSpaceWidth / 2, workSpaceHeight / 2];
    // console.log(graphCenter[0], graphCenter[1])
    //Draw workspace background
    let graphBg = workSpace
        .append("g")
        .attr("id", graphid)

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

    //add graph and legend
    if (graphid === "graph-first") {
        d3.select("#addGraph")
            .on("click", addGraph);
        // addLegend();


    } else if (graphid === "graph-second") {
        // d3.select("#addGraph")
        // .classed("hide", true);
        d3.select("#addGraph")
            .on("click", removeGraph);

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
            .attr("stroke-width", "3px")
            .attr("class", "division-line");


    }
    function addGraph() {
        secondGraphExist = true;
        activeBtn(d3.select(this))
        graphBg.attr("width", "50%")
        graphBg.selectAll(".graph-background")
            .attr("width", "50%");
        graphBg.selectAll(".after-controller")
            .attr("x", "45%")

        zoom.transform(graphContainer, d3.zoomIdentity.translate(-workSpaceWidth / 4, 0))
        zoom.scaleBy(graphContainer, 0.8, [workSpaceWidth / 4, workSpaceHeight / 2])
        //put graph 1 left and zoom

        drawGraph("graph-second", type, queryNode, timeStart, timeEnd, maxNum);
        // callSecondBrush();
        console.log("clicked!")

        //Display second brush
        d3.selectAll(".brush-child").classed("hide", false);
    };
    function removeGraph(){
        inactiveBtn(d3.select(this));
        workSpace.selectAll("#graph-second").remove();
        workSpace.selectAll(".division-line").remove();
        d3.select("#addGraph")
            .on("click", addGraph);
        let graphFirst = workSpace.select("#graph-first");
        console.log(graphFirst)
        
        graphFirst.attr("width", "100%")
        graphFirst.selectAll(".graph-background")
            .attr("width", "100%");
        graphFirst.selectAll(".after-controller")
            .attr("x", "95%")
        // zoom.transform(graphFirst.select("#graphContainer"), d3.zoomIdentity.translate(0,0).scale(0,0))
        graphFirst.select("#graphContainer").attr("transform", null);
        d3.selectAll(".brush-child").classed("hide", true);
    }

    //Draw Bottom Axis according to time selector data
    var bottomAxisWidth = 0.85 * width;
    let bottomAxisMargin = ({
        left: (width - bottomAxisWidth) * 0.5,
        top: 0.9 * workSpaceHeight - 30
    });
    let timeBoundary = bottomAxisWidth / 2
    let xBottom = d3.scaleLinear()
        .domain([-timeBoundary, timeBoundary])
        .range([0, bottomAxisWidth]);

    function drawBottomAxis() {
        d3.selectAll(".bottom-axis").remove();
        let timeMin = timeSec / 60
        let timeHour = timeMin / 60
        // console.log(timeMin);
        // console.log(xBottom(0));
        let xAxisBottom = workSpace.append("g")
            .attr("transform", `translate(${bottomAxisMargin.left}, ${bottomAxisMargin.top})`)
            .attr("class", "bottom-axis hide");
        xAxisBottom.call(d3.axisBottom(xBottom).ticks(bottomAxisWidth / 40).tickSize(3).tickSizeOuter(0))
        // .raise();
        // xAxisBottom.selectAll("text").remove();
        xAxisBottom.append("text").attr("class", "bottom-axis-label")
            .attr("x", -5)
            .attr("y", 10)
            .text("Max Time Interval");

        xAxisBottom.attr("opacity", .4);
    }
    if (!graphExist) {
        d3.select("#viewSelector").classed("hide", false);
        appendViewSelector();
        drawBottomAxis();
    };

    //Draw links & nodes
    function MainLayoutScaler(subID, count) {
        let scaler = d3.scaleLinear()
            .range([-workSpaceHeight / 6 - count * 10, workSpaceHeight / 6 + count * 10])
            .domain([0, count - 1]);
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
        plusNodeRadius = 15,
        nodeTxtOffset = 27,
        firstNodeDistance = 100,
        coeffTxtOffset = 0.5;
    if (type === "packed") {
        firstNodeDistance = 180;
        coeffTxtOffset = 0.8;
    }

    function drawCenterNode() {
        if (type === "single") {
            axios.post('http://127.0.0.1:5000/query_single_new', {
                name: queryCenter,
                sequence: 0,
                list: allList,
                timeStart: timeStart,
                timeEnd: timeEnd,
                timeInterval: 9999,
                displaynum: 1,
                firstQuery: false
                // time: t
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function (response) { // if success then update data
                console.log("center", response.data);
                let centernode = node.selectAll(`#seq0`)
                    .data(response.data.node).enter()
                    .append("g").attr("id", "seq0")
                    .attr("class", "node-group")

                centernode
                    .attr("transform", `translate(${graphCenter[0]}, ${graphCenter[1]})`)
                    .append("circle")
                    .attr("class", "center-node")
                    .attr("r", 30)
                    .on("click", clicked);

                centernode
                    .append("text")
                    .attr("class", "node-text")
                    .attr("fill", "slategray")
                    // .attr("x", graphCenter[0])
                    .attr("y", nodeTxtOffset + 15)
                    .text(d => multiWordsFormat(d.target))
                    .style("font-size", "13px")
                    .on("mouseover", d => showFullName(d.target))
                    .on("mousemove", moveFullName)
                    .on("mouseout", hideFullName);

                console.log(getTranslation(centernode.attr("transform")))
                drawCenterPie();

                function drawCenterPie() {
                    innodePieClickedFlag = false;
                    let arcSample = d3.arc().outerRadius(30 + 1).innerRadius(15);
                    // Convert raw data to pie data format
                    function pieData(d) {
                        let data = [{
                                "label": "Online",
                                "value": d.online_count,
                                "percentage": d.online_count / d.count,
                                "route": d.online_route
                            },
                            {
                                "label": "Offline",
                                "value": d.offline_count,
                                "percentage": d.offline_count / d.count,
                                "route": d.offline_route
                            }
                        ];
                        return data
                    }
                    let spConverter = d3.pie().value(d => d.value)
                        .sort(null).sortValues(null);

                    centernode.append("g").selectAll("path")
                        .data(d => spConverter(pieData(d)))
                        .enter().append("path")
                        .attr("class", "innode-graph innode-type-pie hide")
                        .attr("fill", (d, i) => pieColorScale(i))
                        .attr("d", arcSample)
                        .on("mouseover", InNodePieGraphMouseOver)
                        .on("mousemove", InNodePieGraphMouseMove)
                        .on("mouseleave", InNodePieGraphMouseLeave)
                        .on("click", InNodePieGraphClick);
                    if (pieViewFlag) {
                        d3.selectAll(".link-trans-type").classed("hide", false);
                        d3.selectAll(".innode-type-pie").classed("hide", false);
                    }
                }
                });

        } else {
            
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

            function drawPreview() {
                if (packLinkData.length < 2) {
                    //draw node map
                    var svgMNode = graphContainer
                        .append("g")
                        .attr("id", "#multiNodePreview")

                    var simulation = d3.forceSimulation()
                        .force("link", d3.forceLink().id(function (d) {
                            return d.id;
                        }).distance(80))
                        .force("charge", d3.forceManyBody())
                        .force("center", d3.forceCenter(workSpaceWidth / 2, workSpaceHeight / 2));

                    var previewLink = svgMNode.append("g")
                        .attr("class", "node-multi-pre-link")
                        .selectAll("line")
                        .data(packLinkData[0])
                        .enter()
                        .append("line")
                        .attr("marker-end", d => (d.type === "directed") ? "url(#triangleArrow-p)" : null);

                    var previewNodeG = svgMNode.append("g")
                        .selectAll(".prev-node-g")
                        .data(packNodeData).enter()
                        .append("g")
                        .classed("prev-node-g", true)
                        .call(d3.drag()
                            .on("start", dragstartedPreview)
                            .on("drag", draggedPreview)
                            .on("end", dragendedPreview));

                    previewNodeG.append("circle")
                        .attr("r", 12)
                        .attr("fill", "white")
                        .attr("stroke", "white")

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
                        .nodes(packNodeData)
                        .on("tick", ticked);

                    simulation.force("link")
                        .links(packLinkData[0]);

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
                    // console.log(packLinks)
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
    }


    var txtOffset = -15
    var linkRight, linkLeft, textRight, textLeft, nodeRight, nodeLeft, leftFirstList, rightFirstList
    var leftLastList = new Array();
    var rightLastList = new Array();
    var totalSta
    var leftMaxCnt, rightMaxCnt, totalMaxCnt, totalMaxTTV
    var inNodeHistScaler = d3.scaleLinear()
        .range([-0.6 * nodeRadius, 0.6 * nodeRadius])
        .domain([-1, 1]).nice();


    // axios.post('http://127.0.0.1:5000/nodelist', {
    //     name: name
    // })
    // .then(function (response) { // if success then update data
    //     allList = response.data;
    // })
    var linkScaler

    drawFirstSteps(-1, firstDefaultInterval);
    drawFirstSteps(1, firstDefaultInterval);
    //add vertical line    
    var verLiney = ({
        y1: workSpaceHeight - bottomAxisMargin.top - 10,
        y2: bottomAxisMargin.top + 10
    })

    function appendVerLine(selection, xPos) {
        selection.append("line")
            .attr("x1", xPos)
            .attr("y1", verLiney.y1)
            .attr("x2", xPos)
            .attr("y2", verLiney.y2)
            .attr("class", "vertical-line hide");
    }

    let centerVerline = verticalLine.append("g")
        .attr("id", "seq0");

    let leftVerline = verticalLine.append("g")
        .attr("id", "seq-1")
        .call(d3.drag().on("drag", vlineDragged));

    let rightVerline = verticalLine.append("g")
        .attr("id", "seq1")
        .call(d3.drag().on("drag", vlineDragged));

    //add horizontal line(interval indicator)

    function appendHorLine(selection, x1pos, x2pos) {
        selection.append("line")
            .attr("class", "horizontal-line hide")
            .attr("x1", x1pos)
            .attr("y1", verLiney.y1 + 5)
            .attr("x2", x2pos)
            .attr("y2", verLiney.y1 + 5)
            .attr("marker-end", "url(#triangleArrow-hor)")
            .attr("marker-start", "url(#triangleArrow-hor)");

        selection.append("text")
            .attr("x", (x1pos + x2pos) / 2)
            .attr("y", verLiney.y1)
            .attr("class", "horizontal-line-text hide")
            .text(d3.format(".0f")(xBottom(graphCenter[0] + arrowOffset * 2) - xBottom(graphCenter[0]) + Math.abs(xBottom(x2pos) - xBottom(x1pos))));
        selection.append("text")
            .attr("x", (x1pos + x2pos) / 2)
            .attr("y", verLiney.y1 + 15)
            .attr("class", "horizontal-line-text-unit hide")
            .text("mins");
    }
    var arrowOffset = 4;
    let leftHorline = horizontalLine.append("g")
        .attr("id", "seq-1");

    let rightHorline = horizontalLine.append("g")
        .attr("id", "seq1");


    //scale links


    // get and draw first links 
    function drawFirstSteps(seq, interval) {
        if (type === "single") {
            axios.post('http://127.0.0.1:5000/query_single_new', {
                    name: queryCenter,
                    sequence: seq,
                    list: allList,
                    timeStart: timeStart,
                    timeEnd: timeEnd,
                    timeInterval: interval,
                    displaynum: maxNum,
                    firstQuery: true
                    // time: t
                })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) { // if success then update data
                    console.log(response.data);
                    totalSta = response.data.total_sta;
                    renderGraph(response);
                });
        } else {
            console.log(packLinks, packNodes);
            axios.post('http://127.0.0.1:5000/query_packed', {
                    links: packLinks,
                    nodes: packNodes,
                    sequence: seq,
                    list: allList,
                    timeStart: timeStart,
                    timeEnd: timeEnd,
                    timeInterval: interval,
                    displaynum: maxNum,
                    firstQuery: true
                    // time: t
                })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) { // if success then update data
                    console.log(response.data);
                    totalSta = response.data.total_sta;
                    renderGraph(response);
                });
        }

        function renderGraph(response) {
            let linkGroup = link.append("g")
                .attr("id", `seq${seq}`)
            //add links
            linkGroup.selectAll("line")
                .data(response.data.node)
                .enter().append("line")
                .attr("class", "link link-total")
                .attr("id", `seq${seq}`)
                .attr("stroke-width", 1)
                .attr("x1", d => graphCenter[0])
                .attr("y1", d => graphCenter[1])
                .attr("x2", d => graphCenter[0] + seq * firstNodeDistance)
                .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, response.data.node.length));

            let transTypeLinkGroup = link.append("g")
                .attr("class", "link-trans-type-g")

            transTypeLinkGroup.append("g") //add links
                .selectAll("line")
                .data(response.data.node)
                .enter().append("line")
                .attr("class", "link link-online-trans link-trans-type hide")
                .attr("id", `seq${seq}`)
                .attr("stroke-width", 1)
                .attr("x1", d => graphCenter[0])
                // .attr("y1", d => graphCenter[1])
                .attr("x2", d => graphCenter[0] + seq * firstNodeDistance)
            // .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, response.data.link.length));


            transTypeLinkGroup.append("g") //add type links
                .selectAll("line")
                .data(response.data.node)
                .enter().append("line")
                .attr("class", "link link-offline-trans link-trans-type hide")
                .attr("id", `seq${seq}`)
                .attr("stroke-width", 1)
                .attr("x1", d => graphCenter[0])
                // .attr("y1", d => graphCenter[1])
                .attr("x2", d => graphCenter[0] + seq * firstNodeDistance)
            // .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, response.data.link.length));

            let linkTextGroup = link.append("g") // add text on links
                .selectAll("text")
                .data(response.data.node).enter()
                .append("text")
                .attr("class", "link-text link-text-main")
                .attr("id", `seq${seq}`)
                .attr("x", d => graphCenter[0] + coeffTxtOffset * seq * firstNodeDistance)
                .attr("y", (d, i) => txtOffset + graphCenter[1] + coeffTxtOffset * MainLayoutScaler(i, response.data.node.length))
                .text(d => d.count)
                .classed("text-hide", true);
            let nodeGroup = node.selectAll(`#seq${seq}`)
                .data(response.data.node)
                .enter().append("g")
                .attr("id", `seq${seq}`)
                .attr("class", "node-group")
                .attr("transform", d => "translate(" + linkGroup.selectAll(".link-total").filter(l => l.target == d.target).attr("x2") + "," +
                    linkGroup.selectAll(".link-total").filter(l => l.target == d.target).attr("y2") + ")");
            // .call(d3.drag().on("drag", dragged));

            nodeGroup
                .append("circle")
                .attr("class", "node")
                .attr("r", nodeRadius)
                .attr("fill", "white")
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
            function drawATVBar() {
                // let meanATV = d3.mean(response.data.link, d => d.atv);
                let digitFormat = d3.format("+.1f"); // set format: eg. +0.1/-0.1 
                // console.log(digitFormat(meanATV));
                function barData(d){
                    let data = [{
                        "atv": d.atv,
                        "avg_atv": meanATV(d),
                        "percent": (d.atv-meanATV(d))/meanATV(d),
                        "sequence": d.sequence
                    }]
                    return data
                }
                let ATVBarGroup = nodeGroup.selectAll(".atv-group")
                    .data(d => barData(d)).enter()
                    .append("g")
                    .attr("class", "atv-group");
                // .attr("class", "innode-graph innnode-atv-bar")

                ATVBarGroup.append("rect")
                    .attr("width", 0.8 * nodeRadius)
                    .attr("x", -0.4 * nodeRadius)
                    .attr("y", d => (d.percent > 0) ? -inNodeHistScaler(d.percent) : 0) // if result is postive then the bar should be put over the baseline
                    .attr("height", d => inNodeHistScaler(Math.abs(d.percent)))
                    .attr("class", "innode-graph innode-atv-bar")
                    .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1]);
                //baseline
                ATVBarGroup.append("line")
                    .attr("x1", -0.6 * nodeRadius).attr("x2", 0.6 * nodeRadius)
                    // .datum(d => d.atv)
                    .attr("class", "innode-graph innode-atv-bar");
                //number text with "+" "-"
                ATVBarGroup.append("text")
                    .text(d => digitFormat(d.atv - d.avg_atv))
                    .attr("class", "innode-graph innode-atv-bar")
                    .attr("y", d => (d.atv - d.avg_atv > 0) ? 11 : -3)
                    .attr("fill", d => (d.atv - d.avg_atv > 0) ? atvColors[0] : atvColors[1]);
                //add hover events
                node.selectAll(".innode-atv-bar")
                    .on("mouseover", InNodeATVGraphMouseOver)
                    .on("mousemove", InNodeATVGraphMouseMove)
                    .on("mouseleave", InNodeATVGraphMouseLeave);


            }
            drawATVBar();

            function drawTypePie() {
                innodePieClickedFlag = false;

                let arcFirst = d3.arc().outerRadius(20 + 1).innerRadius(15);
                // Convert raw data to pie data format
                function pieData(d) {
                    let data = [{
                            "label": "Online",
                            "value": d.online_count,
                            "percentage": d.online_count / d.count,
                            "route": d.online_route
                        },
                        {
                            "label": "Offline",
                            "value": d.offline_count,
                            "percentage": d.offline_count / d.count,
                            "route": d.offline_route
                        }
                    ];
                    return data
                }
                let spConverter = d3.pie().value(d => d.value)
                    .sort(null).sortValues(null);

                nodeGroup.selectAll("path")
                    .data(d => spConverter(pieData(d)))
                    .enter().append("path")
                    .attr("class", "innode-graph innode-type-pie hide")
                    .attr("fill", (d, i) => pieColorScale(i))
                    .attr("d", arcFirst)
                    .on("mouseover", InNodePieGraphMouseOver)
                    .on("mousemove", InNodePieGraphMouseMove)
                    .on("mouseleave", InNodePieGraphMouseLeave)
                    .on("click", InNodePieGraphClick);
            }
            drawTypePie();

            if (pieViewFlag) {
                d3.selectAll(".link-trans-type").classed("hide", false);
                d3.selectAll(".innode-type-pie").classed("hide", false);
            }
            // let thisStepList = new Array();
            // response.data.link.forEach(d => thisStepList.push(d.target));

            if (seq === -1) {
                linkLeftplus[-seq] = linkGroup;
                nodeLeftplus[-seq] = nodeGroup;
                textLeft = linkTextGroup;
                leftLastList[-seq] = response.data.route_list;
                leftMaxCnt = d3.sum(response.data.node, d => d.count);
                drawCenterNode();
                if (graphLeftPlusExist) {
                    drawLeftplus(-2, plusDefaultInterval);
                }
            } else if (seq === 1) {
                linkRightplus[seq] = linkGroup;
                nodeRightplus[seq] = nodeGroup;
                textRight = linkTextGroup;
                rightLastList[seq] = response.data.route_list;
                rightMaxCnt = d3.sum(response.data.node, d => d.count);
                if (graphRightPlusExist) {
                    drawRightplus(2, plusDefaultInterval);
                }
            }

            totalMaxCnt = Math.max(leftMaxCnt, rightMaxCnt);
            if (!isNaN(totalMaxCnt)) {
                linkScaler = d3.scalePow().exponent(.6)
                    .range([0.25, 20])
                    .domain([1, totalMaxCnt])

                let totalLink = link.selectAll(".link-total")
                let onlineLink = link.selectAll(".link-online-trans");
                let offlineLink = link.selectAll(".link-offline-trans");

                totalLink
                    .transition().duration(300)
                    .attr("stroke-width", d => linkScaler(d.count));
                offlineLink
                    .transition().duration(300)
                    .attr("stroke-width", d => linkScaler(d.offline_count));
                onlineLink
                    .transition().duration(300)
                    .attr("stroke-width", d => linkScaler(d.online_count));
                offlineLink.filter("#seq1")
                    .attr("y1", d => graphCenter[1] + linkOffsetCalc(d, totalLink, d.offline_count))
                    .attr("y2", (d, i) => parseFloat(totalLink.filter("#seq1").filter(l => l.target === d.target).attr("y2")) + linkOffsetCalc(d, totalLink, d.offline_count));
                offlineLink.filter("#seq-1")
                    .attr("y1", d => graphCenter[1] + linkOffsetCalc(d, totalLink, d.offline_count))
                    .attr("y2", (d, i) => parseFloat(totalLink.filter("#seq-1").filter(l => l.target === d.target).attr("y2")) + linkOffsetCalc(d, totalLink, d.offline_count));
                onlineLink.filter("#seq1")
                    .attr("y1", d => graphCenter[1] - linkOffsetCalc(d, totalLink, d.online_count))
                    .attr("y2", (d, i) => parseFloat(totalLink.filter("#seq1").filter(l => l.target === d.target).attr("y2")) - linkOffsetCalc(d, totalLink, d.online_count));
                onlineLink.filter("#seq-1")
                    .attr("y1", d => graphCenter[1] - linkOffsetCalc(d, totalLink, d.online_count))
                    .attr("y2", (d, i) => parseFloat(totalLink.filter("#seq-1").filter(l => l.target === d.target).attr("y2")) - linkOffsetCalc(d, totalLink, d.online_count));
            }
            if (timeIntervalFlag) {
                showAllTimeInterval()
            }
        }
    };

    function linkOffsetCalc(d, totalLinkGroup, offsetCount) {
        let referenceLink = totalLinkGroup.filter(l => l.source === d.source && l.target === d.target)
        let x1 = parseFloat(referenceLink.attr("x1")),
            x2 = parseFloat(referenceLink.attr("x2")),
            y1 = parseFloat(referenceLink.attr("y1")),
            y2 = parseFloat(referenceLink.attr("y2"));
        let rawOffset = linkScaler(offsetCount) / 2;
        let newOffset
        newOffset = rawOffset / (Math.cos(Math.atan(Math.abs(y2 - y1) / Math.abs(x2 - x1))));
        return newOffset
    }

    setTimeout(() => {
        appendVerLine(centerVerline, graphCenter[0]);
        appendVerLine(leftVerline, graphCenter[0] - firstNodeDistance);
        appendVerLine(rightVerline, graphCenter[0] + firstNodeDistance);
        appendHorLine(leftHorline, graphCenter[0] - arrowOffset, graphCenter[0] - firstNodeDistance + arrowOffset);
        appendHorLine(rightHorline, graphCenter[0] + arrowOffset, graphCenter[0] + firstNodeDistance - arrowOffset);
    }, 150)

    //drag vertical line event
    function vlineDragged(d) {
        // console.log(linkLeft)
        // console.log(d3.event.x)
        let dLinex = d3.event.x;
        var thisLine = d3.select(this);
        thisLine.select("line").attr("x1", dLinex).attr("x2", dLinex);
            var seq = parseFloat(thisLine.attr("id").replace("seq", ""));
            let allgroup = d3.selectAll(`#${thisLine.attr("id")}`);
            if (seq > 0) {
                horLineMove(seq, seq + 1);
                linkTxtPosMove(seq, linkRightplus[seq]);
                nodeRightplus[seq].attr("transform", d => "translate(" + dLinex + "," +
                    getTranslation(nodeRightplus[seq].filter(n => n.target == d.target).attr("transform"))[1] + ")");
                linkRightplus[seq].selectAll("line").attr("x2", dLinex);
                if (linkRightplus[seq + 1] != undefined) {
                    linkRightplus[seq + 1].selectAll("line").attr("x1", dLinex);
                    linkTxtPosMove(seq + 1, linkRightplus[seq + 1]);
                }
            } else {
                horLineMove(seq, seq - 1);

                linkTxtPosMove(seq, linkLeftplus[-seq]);
                nodeLeftplus[-seq].attr("transform", d => "translate(" + dLinex + "," +
                    getTranslation(nodeLeftplus[-seq].filter(n => n.target == d.target).attr("transform"))[1] + ")");
                linkLeftplus[-seq].selectAll("line").attr("x2", dLinex);
                if (linkLeftplus[-seq + 1] != undefined) {
                    linkLeftplus[-seq + 1].selectAll("line").attr("x1", dLinex);
                    linkTxtPosMove(seq - 1, linkLeftplus[-seq + 1]);
                }
            }
        
        function horLineMove(seq, nxtseq) {
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line")
                .attr("x2", () => (dLinex < graphCenter[0]) ? dLinex + arrowOffset : dLinex - arrowOffset);
            horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line")
                .attr("x1", () => (dLinex < graphCenter[0]) ? dLinex - arrowOffset : dLinex + arrowOffset);
            let seqx1pos = parseFloat(horizontalLine.select(`#seq${seq}`).select(".horizontal-line").attr("x2")),
                seqx2pos = parseFloat(horizontalLine.select(`#seq${seq}`).select(".horizontal-line").attr("x1"));
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line-text")
                .attr("x", (seqx1pos + seqx2pos) / 2)
                .text(d3.format(".0f")(xBottom(graphCenter[0] + arrowOffset * 2) - xBottom(graphCenter[0]) + Math.abs(xBottom(seqx2pos) - xBottom(seqx1pos))));
            horizontalLine.select(`#seq${seq}`).select(".horizontal-line-text-unit")
                .attr("x", (seqx1pos + seqx2pos) / 2);
            if (!horizontalLine.select(`#seq${nxtseq}`).empty()) { // if the selection not empty
                let nxtseqx1pos = parseFloat(horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line").attr("x2")),
                    nxtseqx2pos = parseFloat(horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line").attr("x1"));
                horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line-text")
                    .attr("x", (nxtseqx1pos + nxtseqx2pos) / 2)
                    .text(d3.format(".0f")(xBottom(graphCenter[0] + arrowOffset * 2) - xBottom(graphCenter[0]) + Math.abs(xBottom(nxtseqx2pos) - xBottom(nxtseqx1pos))));
                horizontalLine.select(`#seq${nxtseq}`).select(".horizontal-line-text-unit")
                    .attr("x", (nxtseqx1pos + nxtseqx2pos) / 2)
            }

        }
    }

    function linkTxtPosMove(seq, linkGroup) {
        link.selectAll(`#seq${seq}`).selectAll("text") //select text belongs to the seq
            .attr("x", t => 0.5 * (
                parseFloat(linkGroup.selectAll(".link-total").filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                parseFloat(linkGroup.selectAll(".link-total").filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
            .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkGroup.selectAll(".link-total").filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                parseFloat(linkGroup.selectAll(".link-total").filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
    }
    let thisClickedNode
    //Click node event
    function clicked(d) {
        thisClickedNode = d;
        let thisNode = d3.select(this),
            thisNodeParent = d3.select(this.parentNode);
        let thisText = d3.selectAll(`#${thisNodeParent.attr("id")}`)
            .selectAll(".node-text").filter(t => d.target === t.target);
        console.log(thisNodeParent)
        if (d3.event.shiftKey) {
            createQuery(d.target, "single", nodeList, timeStart, timeEnd);
        } else {
            console.log(d, "clicked");
            d3.select("#staContainer").classed("hide", false);
            d3.selectAll(".sta-single").on("click", StaLabelClick);
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

    function afterplus() {
        if (rseq <= maxseq) {
            drawRightplus(rseq, plusDefaultInterval);
            if (rseq < maxseq + 1) {
                rseq += 1;
            }
        }
    }

    function beforeplus() {
        if (lseq <= maxseq) {
            drawLeftplus(-lseq, plusDefaultInterval);
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

    function LayoutScaler_Adjust(thisID, count) {
        let scaler = d3.scaleLinear()
            .range([graphCenter[1] - workSpaceHeight / 4 - count * 3, graphCenter[1] + workSpaceHeight / 4 + count * 3])
            .domain([-0.3, count - 0.7]);
        return scaler(thisID);
    }

    function drawPlusVerticalLine(seq, lastseq, gap) {
        let verLine = verticalLine.append("g")
            .attr("id", `seq${seq}`)
            .call(d3.drag().on("drag", vlineDragged));
        let verLineXpos = parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")) + gap;
        verLine.append("line")
            .attr("x1", verLineXpos)
            .attr("y1", verLiney.y1)
            .attr("x2", verLineXpos)
            .attr("y2", verLiney.y2)
            .attr("class", "vertical-line hide");
    }

    function drawPlusHorizontalLine(seq, lastseq, gap) {
        let horLine = horizontalLine.append("g")
            .attr("id", `seq${seq}`)
        let horLineX1pos = parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")),
            horLineX2pos = parseFloat(verticalLine.select(`#seq${lastseq}`).select("line").attr("x2")) + gap;
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

    function drawRightplus(seq, interval) {
        graphRightPlusExist = true;
        //add vertical line
        var queryData
        if (type === "single") {
            console.log(seq, rightLastList[seq - 1])
            queryData = {
                name: queryCenter,
                sequence: seq,
                list: rightLastList[seq - 1],
                timeStart: timeStart,
                timeEnd: timeEnd,
                timeInterval: interval,
                displaynum: maxNum,
                firstQuery: false
            }
            axios.post('http://127.0.0.1:5000/query_single_new', queryData)
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) {
                    renderPlusGraph(response, seq)
                    if (timeIntervalFlag) {
                        showAllTimeInterval();
                    }
                    console.log("nowseq", seq, rseq)
                    if (seq < rseq - 1) {
                        console.log(seq, rseq)
                        drawRightplus(seq + 1, plusDefaultInterval);
                    }
                });
        } else {

            queryData = {
                links: packLinks,
                nodes: packNodes,
                sequence: seq,
                list: rightLastList[seq - 1],
                timeStart: timeStart,
                timeEnd: timeEnd,
                timeInterval: interval,
                displaynum: maxNum,
                firstQuery: false
            }

            axios.post('http://127.0.0.1:5000/query_packed', queryData)
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) {
                    renderPlusGraph(response, seq);
                    if (timeIntervalFlag) {
                        showAllTimeInterval();
                    }
                    if (seq < rseq - 1) {
                        drawRightplus(seq + 1, plusDefaultInterval);
                    }
                });

        }

    }

    function drawLeftplus(seq, interval) {
        graphLeftPlusExist = true;
        var queryData
        if (type === "single") {
            queryData = {
                name: queryCenter,
                sequence: seq,
                list: leftLastList[-seq - 1],
                timeStart: timeStart,
                timeEnd: timeEnd,
                timeInterval: interval,
                displaynum: maxNum,
                firstQuery: false
            }

            axios.post('http://127.0.0.1:5000/query_single_new', queryData)
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) {
                    renderPlusGraph(response, seq);
                    if (timeIntervalFlag) {
                        showAllTimeInterval()
                    }
                    if (-seq < lseq - 1) {
                        drawLeftplus(seq - 1, plusDefaultInterval)
                    }
                })
        } else {
            queryData = {
                links: packLinks,
                nodes: packNodes,
                sequence: seq,
                list: leftLastList[-seq - 1],
                timeStart: timeStart,
                timeEnd: timeEnd,
                timeInterval: interval,
                displaynum: maxNum,
                firstQuery: false
            }

            axios.post('http://127.0.0.1:5000/query_packed', queryData)
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) {
                    renderPlusGraph(response, seq);
                    if (timeIntervalFlag) {
                        showAllTimeInterval()
                    }
                    if (seq < lseq - 1) {
                        drawLeftplus(seq + 1, plusDefaultInterval)
                    }
                })
        }
    }

    function renderPlusGraph(response, seq) {
        console.log(seq, response.data.node)
        if (seq > 0) {
            rightLastList[seq] = response.data.route_list;
        } else {
            leftLastList[-seq] = response.data.route_list;
        }

        let prevLinkGroup, nodeOffset
        if (seq > 0) {
            nodeOffset = 80
            prevLinkGroup = linkRightplus[seq - 1].selectAll(".link-total");
        } else {
            nodeOffset = -80
            prevLinkGroup = linkLeftplus[-seq - 1].selectAll(".link-total");
        };
        let thisLinkGroup = link.append("g")
            .attr("id", `seq${seq}`)
            .attr("class", "link-group");
        // add total link
        thisLinkGroup.append("g")
            .selectAll("line")
            .data(response.data.link)
            .enter().append("line")
            .attr("class", "link link-total")
            .attr("id", `seq${seq}`)
            .attr("stroke-width", 0)
            .attr("x1", d => prevLinkGroup.filter(n => n.target == d.source).attr("x2"))
            .attr("y1", d => prevLinkGroup.filter(n => n.target == d.source).attr("y2"))
            .attr("x2", d => parseFloat(prevLinkGroup.filter(n => n.target == d.source).attr("x2")) + nodeOffset)
            .attr("y2", 0);

        thisLinkGroup.append("g") //add type links
            .selectAll("line")
            .data(response.data.link)
            .enter().append("line")
            .attr("class", "link link-offline-trans link-trans-type hide")
            .attr("x1", d => prevLinkGroup.filter(n => n.target == d.source).attr("x2"))
            .attr("y1", d => prevLinkGroup.filter(n => n.target == d.source).attr("y2"))
            .attr("x2", d => parseFloat(prevLinkGroup.filter(n => n.target == d.source).attr("x2")) + nodeOffset)
            .attr("y2", 0);
        thisLinkGroup.append("g") //add type links
            .selectAll("line")
            .data(response.data.link)
            .enter().append("line")
            .attr("class", "link link-online-trans link-trans-type hide")
            .attr("x1", d => prevLinkGroup.filter(n => n.target == d.source).attr("x2"))
            .attr("y1", d => prevLinkGroup.filter(n => n.target == d.source).attr("y2"))
            .attr("x2", d => parseFloat(prevLinkGroup.filter(n => n.target == d.source).attr("x2")) + nodeOffset)
            .attr("y2", 0);

        let thisNodeGroup = node.selectAll(`#seq${seq}`)
            .data(response.data.node)
            .enter().append("g")
            .attr("id", `seq${seq}`)
            .attr("class", "node-group")
            .attr("transform", (d, i) => "translate(" + thisLinkGroup.selectAll(".link-total").filter(l => l.target == d.target).attr("x2") + "," +
                LayoutScaler_Adjust(i, response.data.node.length) + ")")
        thisNodeGroup.append("circle") // add circle
            .attr("class", "node")
            .attr("r", plusNodeRadius)
            .attr("fill", "white")
            .on("click", clicked)
            .on("mouseover", NodeMouseOver)
            .on("mousemove", NodeMouseMove)
            .on("mouseleave", NodeMouseLeave);
        // adjust link pos
        let totalLink = thisLinkGroup.selectAll(".link-total")
        totalLink
            .attr("y2", d => getTranslation(thisNodeGroup.filter(n => n.target === d.target).attr("transform"))[1])
            .transition().duration(300)
            .attr("stroke-width", d => linkScaler(d.count));

        thisLinkGroup.selectAll(".link-offline-trans")
            .attr("y1", d => parseFloat(totalLink.filter(l => l.source === d.source && l.target === d.target).attr("y1")) + linkOffsetCalc(d, totalLink, d.offline_count))
            .attr("y2", d => parseFloat(totalLink.filter(n => n.target === d.target).attr("y2")) + linkOffsetCalc(d, totalLink, d.offline_count))
            .transition().duration(300)
            .attr("stroke-width", d => linkScaler(d.offline_count));

        thisLinkGroup.selectAll(".link-online-trans")
            .attr("y1", d => parseFloat(totalLink.filter(l => l.source === d.source && l.target === d.target).attr("y1")) - linkOffsetCalc(d, totalLink, d.online_count))
            .attr("y2", d => parseFloat(totalLink.filter(n => n.target === d.target).attr("y2")) - linkOffsetCalc(d, totalLink, d.online_count))
            .transition().duration(300)
            .attr("stroke-width", d => linkScaler(d.online_count));

        // add link text
        link.append("g")
            .attr("id", `seq${seq}`)
            .selectAll(".link-text-rightplus")
            .data(response.data.link).enter()
            .append("text")
            .attr("class", "link-text link-text-rightplus")
            .attr("x", d => 0.5 * (
                parseFloat(totalLink.filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                parseFloat(totalLink.filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
            .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                parseFloat(totalLink.filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                parseFloat(totalLink.filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
            .text(d => d.count)
            .classed("text-hide", true)
        //add node name text
        thisNodeGroup
            .append("text")
            .attr("class", "node-text")
            // .attr("x", d => totalLink.filter(l => l.target == d.target).attr("x2"))
            .attr("y", nodeTxtOffset * 0.8)
            .text(d => multiWordsFormat(d.target))
            .on("mouseover", d => showFullName(d.target))
            .on("mousemove", moveFullName)
            .on("mouseout", hideFullName);
        // all in-node text
        thisNodeGroup.append("g")
            .append("text")
            .attr("class", "innode-text-plus")
        // .classed("text-hide", true)
        // TODO: keep link visibility settings
        // changeLinkVisibility();
        // add vertical line
        function drawPlusATVBar() {
            // let meanATV = d3.mean(response.data.link, d => d.atv);
            let digitFormat = d3.format("+.1f"); // set format: eg. +0.1/-0.1 
            // console.log(digitFormat(meanATV));
            // .attr("class", "innode-graph innnode-atv-bar")
            function barData(d){
                let data = [{
                    "atv": d.atv,
                    "avg_atv": meanATV(d),
                    "percent": (d.atv-meanATV(d))/meanATV(d),
                    "sequence": d.sequence
                }]
                return data
            }

            let ATVBarGroup = thisNodeGroup.selectAll(".atv-group")
                .data(d => barData(d)).enter()
                .append("g")
                .attr("class", "atv-group")
                .on("mouseover", InNodeATVGraphMouseOver)
                .on("mousemove", InNodeATVGraphMouseMove)
                .on("mouseleave", InNodeATVGraphMouseLeave);
            ATVBarGroup.append("rect")
                .attr("width", 0.8 * plusNodeRadius)
                .attr("x", -0.4 * plusNodeRadius)
                .attr("y", d => (d.percent > 0) ? -inNodeHistScaler(d.percent) : 0) // if result is postive then the bar should be put over the baseline
                .attr("height", d => inNodeHistScaler(Math.abs(d.percent)))
                .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
                .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1]);
            //baseline
            ATVBarGroup.append("line")
                .attr("x1", -0.6 * plusNodeRadius).attr("x2", 0.6 * plusNodeRadius)
                // .datum(d => d.atv)
                .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus");
            //number text with "+" "-"
            ATVBarGroup.append("text")
                .text(d => digitFormat(d.atv - d.avg_atv))
                .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
                .attr("y", d => (d.percent > 0) ? 8 : -2)
                .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1])
                .style("font-size", "9px");
        }
        drawPlusATVBar();

        drawPlusTypePie()

        function drawPlusTypePie() {
            innodePieClickedFlag = false;
            let arcPlus = d3.arc().outerRadius(plusNodeRadius + 1).innerRadius(11);
            // Convert raw data to pie data format
            function pieData(d) {
                let data = [{
                        "label": "Online",
                        "value": d.online_count,
                        "percentage": d.online_count / d.count,
                        "route": d.online_route
                    },
                    {
                        "label": "Offline",
                        "value": d.offline_count,
                        "percentage": d.offline_count / d.count,
                        "route": d.offline_route
                    }
                ];
                return data
            }
            let spConverter = d3.pie().value(d => d.value)
                .sort(null).sortValues(null);

            thisNodeGroup.selectAll("path")
                .data(d => spConverter(pieData(d)))
                .enter().append("path")
                .attr("class", "innode-graph innode-type-pie hide")
                .attr("fill", (d, i) => pieColorScale(i))
                .attr("d", arcPlus)
                .on("mouseover", InNodePieGraphMouseOver)
                .on("mousemove", InNodePieGraphMouseMove)
                .on("mouseleave", InNodePieGraphMouseLeave)
                .on("click", InNodePieGraphClick);
        }
        if (pieViewFlag) {
            d3.selectAll(".link-trans-type").classed("hide", false);
            d3.selectAll(".innode-type-pie").classed("hide", false);
        }
        if (seq > 0) {
            linkRightplus[seq] = thisLinkGroup;
            nodeRightplus[seq] = thisNodeGroup;
            drawPlusVerticalLine(seq, seq - 1, nodeOffset);
            drawPlusHorizontalLine(seq, seq - 1, nodeOffset);
        } else {
            linkLeftplus[-seq] = thisLinkGroup;
            nodeLeftplus[-seq] = thisNodeGroup;
            drawPlusVerticalLine(seq, seq + 1, nodeOffset);
            drawPlusHorizontalLine(seq, seq + 1, nodeOffset);
        }

    }

    function NodeMouseOver(d) {
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode);
        // console.log(hoveredNodeParent);
        if (!innodePieClickedFlag) {
            node.selectAll("circle").filter(d => d.route != undefined).classed("not-this-route", true);
            node.selectAll(".node-text").filter(d => d.route != undefined).classed("not-this-route", true);
            link.selectAll("line").classed("not-this-route", true);
            node.selectAll(".innode-type-pie").style("opacity", .3)
            // link.selectAll("text").classed("not-this-route", true)
            // console.log(d)
            // d.route.forEach(function (r) {
            filterRouteByNodeHover(d.route);
            // })
            node.selectAll("circle").filter(n => n.sequence === 0).classed("this-route", true);
        }
        // console.log(node.selectAll("circle").filter(".this-route"))
        hoveredNodeParent
            .append("text")
            .attr("class", "recenter-text hide")
            .attr("x", 0)
            .attr("y", -30)
            .text("Click to center")

        if (d3.event.shiftKey) {
            console.log("shifthover!")
            hoveredNode
                .classed("node", false)
                .attr("stroke-width", 3)
                .attr("stroke", "#00AAFF");
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", false);
        } else {
            hoveredNode
                .classed("node", true);
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", true);
        }
    }

    function NodeMouseMove(d) {
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode)
        //recenter
        if (d3.event.shiftKey) {
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
                .classed("node", true);
            hoveredNodeParent.select(".recenter-text")
                .classed("hide", true);
        }
    }

    function NodeMouseLeave(d) {
        //Reset all styles
        d3.select(this).classed("node", true);
        d3.selectAll(".recenter-text").remove();
        if (!innodePieClickedFlag) {
            resetAllGraphStyle();
        }
    }

    function InNodeATVGraphMouseOver(d) {
        inNodeTooltip.style("opacity", 1);
    }

    function InNodeATVGraphMouseMove(d) {
        let dpx = event.pageX,
            dpy = event.pageY;

        inNodeTooltip
            .html(inNodeTooltipHtml(d))
            .style("top", dpy + "px")
            .style("left", dpx + "px");

        function inNodeTooltipHtml(d) {
            if (d.percent > 0) {
                return "ATV: " + "<span style = 'color:#C94CB0'>" + moneyFormat(d.atv) + "</span>; <br>" +
                    "<span style = 'color:#C94CB0'>" + moneyFormat(Math.abs(d.atv - d.avg_atv)) + "(" + percentFormat(Math.abs(d.percent)) + ")</span>" + " more than the average ATV " +
                    "<span style = 'color:#6C7CAB'>" + moneyFormat(d.avg_atv) + "</span>."
            } else {
                return "ATV: " + "<span style = 'color:#328347'>" + moneyFormat(d.atv) + "</span>; <br>" +
                    "<span style = 'color:#328347'>" + moneyFormat(Math.abs(d.atv - d.avg_atv)) + "(" + percentFormat(Math.abs(d.percent)) + ")</span>" + " less than the average ATV " +
                    "<span style = 'color:#6C7CAB'>" + moneyFormat(d.avg_atv) + "</span>."
            }
        }
    }

    function InNodeATVGraphMouseLeave(d) {
        inNodeTooltip
            .style("opacity", 0);
    }

    //TODO: change it to update pattern
    function InNodePieGraphClick(d) {
        innodePieClickedFlag = true;
        resetAllGraphStyle();
        node.selectAll("circle").filter(d => d.route != undefined).classed("not-this-route", true);
        node.selectAll(".node-text").filter(d => d.route != undefined).classed("not-this-route", true);
        link.selectAll("line").classed("not-this-route", true)
        node.selectAll(".innode-type-pie").style("opacity", .5);
        d3.select(this).style("opacity", 1);
        let thisParent = d3.select(this.parentNode);
        if (d.data.label === "Offline") { //if click the offline
            // d3.selectAll(".innode-type-pie")
            //     .filter(d => d.data.label === "Online").style("opacity", 0);
            renderInterSectionPie(d);
            
            filterRouteByTypePieClick(d.data.route);
        } else if (d.data.label === "Online") {
            renderInterSectionPie(d);
            filterRouteByTypePieClick(d.data.route);
            // d.data.route.forEach(function (r) {
            //     filterRouteByTypePieClick(r);
            // })
        }
        if (nodeViewType === "bar"){
            renderRandomATVBar();
        }
    };

    function filterRouteByTypePieClick(r) {
        node.selectAll("circle").filter(".not-this-route")
            .classed("this-route-type", n => isInRoute(r, n.route));
        node.selectAll("circle").filter(".this-route-type")
            .classed("not-this-route", !(n => isInRoute(r, n.route)));
        node.selectAll(".node-text").filter(".not-this-route")
            .classed("this-route-type", n => isInRoute(r, n.route));
        node.selectAll(".node-text").filter(".this-route-type")
            .classed("not-this-route", !(n => isInRoute(r, n.route)));

        link.selectAll(".link-online-trans").filter(".not-this-route")
            .classed("this-route-online", l => isInRoute(r, l.online_route));
        link.selectAll(".link-offline-trans").filter(".not-this-route")
            .classed("this-route-offline", l => isInRoute(r, l.offline_route));

        link.selectAll(".link-online-trans").filter(".this-route-online")
            .classed("not-this-route", !(l => isInRoute(r, l.online_route)));
        link.selectAll(".link-offline-trans").filter(".this-route-offline")
            .classed("not-this-route", !(l => isInRoute(r, l.offline_route)));

        if (nodeViewType === "bar"){
            node.selectAll("circle").filter(".not-this-route")
                .select(selectParent).selectAll(".atv-group").classed("hide", true);
            node.selectAll("circle").filter(".this-route-type")
                .select(selectParent).selectAll(".atv-group").classed("hide", false);
        }
    }

    function renderRandomATVBar(){

        node.selectAll(".node-group").filter(d => d.sequence != 0)
            .selectAll(".atv-group").remove();
        let digitFormat = d3.format("+.1f");
        function barData(d){
            let data = [{
                "atv": d.atv + (Math.random()-0.5)*10,
                "avg_atv": meanATV(d),
                "percent": (d.atv+(Math.random()-0.5)*10-meanATV(d))/meanATV(d),
                "sequence": d.sequence
            }]
            return data
        }
        let ATVBarGroup = node.selectAll(".node-group").filter(d => d.sequence != 0)
            .selectAll(".atv-group")
            .data(d => barData(d)).enter()
            .append("g")
            .attr("class", "atv-group")
            .on("mouseover", InNodeATVGraphMouseOver)
            .on("mousemove", InNodeATVGraphMouseMove)
            .on("mouseleave", InNodeATVGraphMouseLeave);

        ATVBarGroup.append("rect")
            .attr("width", d => (Math.abs(d.sequence) > 1) ? 0.8 * plusNodeRadius : 0.8 * nodeRadius)
            .attr("x", d => (Math.abs(d.sequence) > 1) ? -0.4 * plusNodeRadius : -0.4 * nodeRadius)
            .attr("y", d => (d.percent > 0) ? -inNodeHistScaler(d.percent) : 0) // if result is postive then the bar should be put over the baseline
            .attr("height", d => inNodeHistScaler(Math.abs(d.percent)))
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
            .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1]);
        //baseline
        ATVBarGroup.append("line")
            .attr("x1", d => (Math.abs(d.sequence) > 1) ? -0.6 * plusNodeRadius : -0.6 * nodeRadius)
            .attr("x2", d => (Math.abs(d.sequence) > 1) ? 0.6 * plusNodeRadius : 0.6 * nodeRadius)
            // .datum(d => d.atv)
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus");
        //number text with "+" "-"
        ATVBarGroup.append("text")
            .text(d => digitFormat(d.atv - d.avg_atv))
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
            .attr("y", d => textYPos(d))
            .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1])
            .style("font-size", d => (Math.abs(d.sequence) > 1) ? "9px" : null);
        // hide not this route bar
        node.selectAll("circle").filter(".not-this-route")
            .select(selectParent).selectAll(".atv-group").classed("hide", true);
        node.selectAll("circle").filter(".this-route-type")
            .select(selectParent).selectAll(".atv-group").classed("hide", false);
        
            function textYPos(d){
            if (Math.abs(d.sequence) > 1) {
                if (d.percent > 0) { return 8 } else { return -2 }
            } else {
                if (d.percent > 0) { return 11 } else { return -3 }
            }
        }
    }

    function renderInterSectionPie(d) {
        // find the intersection of clicked segement & all the other segments
        function pieDataInter(p, d) { //p as pie data, d as the clicked data
            let onlineRoute = intersection(p.online_route, d.data.route),
                offlineRoute = intersection(p.offline_route, d.data.route)
            let data = [{
                    "label": "Online",
                    "value": onlineRoute.length,
                    "percentage": onlineRoute.length / (onlineRoute.length + offlineRoute.length),
                    "route": onlineRoute
                },
                {
                    "label": "Offline",
                    "value": offlineRoute.length,
                    "percentage": offlineRoute.length / (onlineRoute.length + offlineRoute.length),
                    "route": offlineRoute
                }
            ];
            return data
        }
        let spConverter = d3.pie().value(d => d.value)
            .sort(null).sortValues(null);
        let arcFirst = d3.arc().outerRadius(20 + 1).innerRadius(15);
        let arcCenter = d3.arc().outerRadius(30 + 1).innerRadius(15);
        let arcPlus = d3.arc().outerRadius(15 + 1).innerRadius(11);
        //redraw the pies
        node.selectAll(".innode-type-pie").remove();
        node.selectAll(".node-group").selectAll(".innode-type-pie")
            .data(p => spConverter(pieDataInter(p, d)))
            .enter().append("path")
            .attr("class", "innode-graph innode-type-pie")
            .attr("fill", (d, i) => pieColorScale(i))
            .attr("d", arcPlus)
            .on("mouseover", InNodePieGraphMouseOver)
            .on("mousemove", InNodePieGraphMouseMove)
            .on("mouseleave", InNodePieGraphMouseLeave)
            .on("click", InNodePieGraphClick);

        node.selectAll("#seq0").selectAll(".innode-type-pie")
            .attr("d", arcCenter);

        node.selectAll("#seq1, #seq-1").selectAll(".innode-type-pie")
            .attr("d", arcFirst);
    }

    function InNodePieGraphMouseOver(d) {
        if (!innodePieClickedFlag) {
            resetAllGraphStyle();
            node.selectAll("circle").filter(d => d.route != undefined).classed("not-this-route", true)
            link.selectAll("line").classed("not-this-route", true);
            node.selectAll(".node-text").filter(d => d.route != undefined).classed("not-this-route", true);
            node.selectAll(".innode-type-pie").style("opacity", .3);
            d3.select(this).style("opacity", 1);
            // d.data.route.forEach(function (r) {
            filterRouteByNodeHover(d.data.route);
            // });
        }
        inNodeTooltip.style("opacity", 1);
    }

    function InNodePieGraphMouseMove(d) {
        let dpx = event.pageX,
            dpy = event.pageY;


        inNodeTooltip
            .html(inNodeTooltipHtml(d))
            .style("top", dpy + "px")
            .style("left", dpx + "px");

        function inNodeTooltipHtml(d) {
            if (d.data.label === "Offline") {
                return "<span style = 'color:#3A6B83'> Offline </span>" + "<span style = 'color:#3A6B83'>" + numFormat(d.data.value) + "(" + percentFormat(d.data.percentage) + ")</span>"
            } else if (d.data.label === "Online") {
                return "<span style = 'color:#DDAD01'> Online </span>" + "<span style = 'color:#DDAD01'>" + numFormat(d.data.value) + "(" + percentFormat(d.data.percentage) + ")</span>"
            }
        };
    }

    function InNodePieGraphMouseLeave(d) {
        inNodeTooltip
            .style("opacity", 0);
        //reset all route styles
        if (!innodePieClickedFlag) {
            resetAllGraphStyle();
        }
    }

    function resetTypePie() {
        node.selectAll(".innode-type-pie").remove()
        innodePieClickedFlag = false;

        let arcFirst = d3.arc().outerRadius(20 + 1).innerRadius(15);
        let arcCenter = d3.arc().outerRadius(30 + 1).innerRadius(15);
        let arcPlus = d3.arc().outerRadius(15 + 1).innerRadius(11);
        // Convert raw data to pie data format
        function pieData(d) {
            let data = [{
                    "label": "Online",
                    "value": d.online_count,
                    "percentage": d.online_count / d.count,
                    "route": d.online_route
                },
                {
                    "label": "Offline",
                    "value": d.offline_count,
                    "percentage": d.offline_count / d.count,
                    "route": d.offline_route
                }
            ];
            return data
        }
        let spConverter = d3.pie().value(d => d.value)
            .sort(null).sortValues(null);

        node.selectAll(".node-group").selectAll(".innode-type-pie")
            .data(d => spConverter(pieData(d)))
            .enter().append("path")
            .attr("class", "innode-graph innode-type-pie hide")
            .attr("fill", (d, i) => pieColorScale(i))
            .attr("d", arcPlus)
            .on("mouseover", InNodePieGraphMouseOver)
            .on("mousemove", InNodePieGraphMouseMove)
            .on("mouseleave", InNodePieGraphMouseLeave)
            .on("click", InNodePieGraphClick);

        node.selectAll("#seq0").selectAll(".innode-type-pie")
            .attr("d", arcCenter);

        node.selectAll("#seq1, #seq-1").selectAll(".innode-type-pie")
            .attr("d", arcFirst);
    }

    function resetATVBar(){
        node.selectAll(".atv-group").remove();
        let digitFormat = d3.format("+.1f");
        function barData(d){
            let data = [{
                "atv": d.atv,
                "avg_atv": meanATV(d),
                "percent": (d.atv-meanATV(d))/meanATV(d),
                "sequence": d.sequence
            }]
            return data
        }
        let ATVBarGroup = node.selectAll(".node-group").filter(d => d.sequence != 0)
            .selectAll(".atv-group")
            .data(d => barData(d)).enter()
            .append("g")
            .attr("class", "atv-group")
            .on("mouseover", InNodeATVGraphMouseOver)
            .on("mousemove", InNodeATVGraphMouseMove)
            .on("mouseleave", InNodeATVGraphMouseLeave);

        ATVBarGroup.append("rect")
            .attr("width", d => (Math.abs(d.sequence) > 1) ? 0.8 * plusNodeRadius : 0.8 * nodeRadius)
            .attr("x", d => (Math.abs(d.sequence) > 1) ? -0.4 * plusNodeRadius : -0.4 * nodeRadius)
            .attr("y", d => (d.percent > 0) ? -inNodeHistScaler(d.percent) : 0) // if result is postive then the bar should be put over the baseline
            .attr("height", d => inNodeHistScaler(Math.abs(d.percent)))
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
            .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1]);
        //baseline
        ATVBarGroup.append("line")
            .attr("x1", d => (Math.abs(d.sequence) > 1) ? -0.6 * plusNodeRadius : -0.6 * nodeRadius)
            .attr("x2", d => (Math.abs(d.sequence) > 1) ? 0.6 * plusNodeRadius : 0.6 * nodeRadius)
            // .datum(d => d.atv)
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus");
        //number text with "+" "-"
        ATVBarGroup.append("text")
            .text(d => digitFormat(d.atv - d.avg_atv))
            .attr("class", "innode-graph innode-atv-bar innode-atv-bar-plus")
            .attr("y", d => textYPos(d))
            .attr("fill", d => (d.percent > 0) ? atvColors[0] : atvColors[1])
            .style("font-size", d => (Math.abs(d.sequence) > 1) ? "9px" : null);
        function textYPos(d){
            if (Math.abs(d.sequence) > 1) {
                if (d.percent > 0) { return 8 } else { return -2 }
            } else {
                if (d.percent > 0) { return 11 } else { return -3 }
            }
        }
    }

    function resetAllGraphStyle() {
        //reset style
        d3.selectAll(".innode-type-pie").style("opacity", null)
        node.selectAll("circle").classed("this-route-online", false);
        node.selectAll("circle").classed("this-route-offline", false);
        node.selectAll("circle").classed("this-route", false);
        node.selectAll("circle").classed("not-this-route", false);
        node.selectAll("circle").classed("this-route-type", false);

        node.selectAll("text").classed("this-route-online", false);
        node.selectAll("text").classed("this-route-offline", false);
        node.selectAll("text").classed("this-route", false);
        node.selectAll("text").classed("not-this-route", false);
        node.selectAll("text").classed("this-route-type", false);

        link.selectAll("line").classed("this-route-online", false);
        link.selectAll("line").classed("this-route-offline", false);
        link.selectAll("line").classed("not-this-route", false);
        link.selectAll("line").classed("this-route", false);
        link.selectAll("text").classed("this-route", false);
        link.selectAll("text").classed("not-this-route", false);

        if (nodeViewType === "bar"){
            node.selectAll(".atv-group").classed("hide", false);
        }

    }

    function filterRouteByNodeHover(r) {
        node.selectAll("circle").filter(".not-this-route")
            .classed("this-route", n => isInRoute(r, n.route))
        node.selectAll("circle").filter(".this-route")
            .classed("not-this-route", !(n => isInRoute(r, n.route)));
        //node text style
        node.selectAll(".node-text").filter(".not-this-route")
            .classed("this-route", n => isInRoute(r, n.route))
        node.selectAll(".node-text").filter(".this-route")
            .classed("not-this-route", !(n => isInRoute(r, n.route)))
        // link style
        link.selectAll("line").filter(".not-this-route")
            .classed("this-route", l => isInRoute(r, l.route))
        link.selectAll("line").filter(".this-route")
            .classed("not-this-route", !(l => isInRoute(r, l.route)))
        // link.selectAll("text").filter(".not-this-route")
        //     .classed("this-route", (l => isInRoute(r, l.route)))
        // link.selectAll("text").filter(".this-route")
        //     .classed("not-this-route", !(l => isInRoute(r, l.route)))
        if (nodeViewType === "bar"){
            node.selectAll("circle").filter(".not-this-route")
                .select(selectParent).selectAll(".atv-group").classed("hide", true);
            node.selectAll("circle").filter(".this-route")
                .select(selectParent).selectAll(".atv-group").classed("hide", false);
        }
        

    }

    function isInRoute(single, group) {
        // if two groups have intersection, then we say it's "in route"
        if (intersection(group, single).length !== 0) {
            return true
        } else {
            // console.log(single, group, false);
            return false
        }
    }

    workSpace.selectAll("#conditionBox").remove();

    let conditionBox = graphBg.append("g")
        .attr("id", "conditionBox")
        .attr("transform", `translate(${0.45 * width}, ${0.9 * workSpaceHeight})`)
        .style("cursor", "default")

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

    function conditionBoxClicked() {
        d3.select("#conditionContainer").classed("hide", !d3.select("#conditionContainer").classed("hide"));

    }

    initializeConditionBox();

    function drawConditionBoxList() {
        mdui.mutation();
        let inputdata = {
            list: conditionList
        };
        // console.log(inputdata)
        let html = template("conditionListTemp", inputdata)
        document.getElementById("conditionContainer").innerHTML = html;
    }

    let conditionBoxPos = conditionBox.node().getBoundingClientRect();

    function StaLabelClick() {
        console.log("staclick");
        let thisCard = d3.select(this);
        if (!thisCard.classed("sta-card")) {
            let svgWidth = 200,
                svgHeight = 200;
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
        let clickedNode = d3.selectAll("circle").filter(".clicked").data()[0]
        let data = {
            timeStart: timeStart,
            timeEnd: timeEnd,
            name: queryNode,
            route: clickedNode.route,
            sequence: clickedNode.sequence
        }
        axios.post('http://127.0.0.1:5000/query_property', data)
            .catch(function (error) {
                console.log(error);
            })
            .then(function (response) {
                // console.log(response.data);
                renderPie(response.data);
            })

        function renderPie(data) {
            let samplePieColorScale = d3.schemeTableau10;
            let samplePie = svg.append("g")
                .attr("class", "samplePie")
            let arcSample = d3.arc()
                .outerRadius(75)
                .innerRadius(0)

            let spConverter = d3.pie().value(d => d.transaction_value)

            samplePie.selectAll("path")
                .data(spConverter(data))
                .enter()
                .append("path")
                .attr('transform', `translate(${svgWidth/2}, 
                    ${svgHeight/2})`)
                .attr("fill", (d, i) => samplePieColorScale[i])
                .attr("d", arcSample)
                .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
                .on("mouseover", samplePieMouseOver)
                .on("mousemove", samplePieMouseMove)
                .on("mouseleave", samplePieMouseLeave)

            let sumTTV = d3.sum(data, d => d.transaction_value)

            function dragstarted(d) {
                console.log(d.data.merchant)
                let boundingPos = this.getBoundingClientRect();
                //Draw a same path on drag layer
                globalDragLayer
                    .attr("height", "100%")
                    .attr("width", "100%")
                    .append("path")
                    .datum(d)
                    .attr("fill", d3.select(this).attr("fill"))
                    .attr("d", d3.select(this).attr("d"))
                    .attr("transform", `translate(${event.pageX}, ${event.pageY}) scale(1.2)`)
                    .attr("stroke", "white")

                d3.select(this)
                    .attr("opacity", 0);

            }

            function dragged(d) {
                // d.x = d3.event.x, d.y = d3.event.y;
                // d3.select(this)
                //     .attr('transform', 'translate(' + d.x + ',' + d.y + ') ');
                dpx = event.pageX;
                dpy = event.pageY;
                globalDragLayer.selectAll("path")
                    .attr("transform", "translate(" + dpx + "," + dpy + ") scale(1.2)")
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
                    d3.selectAll("clicked").classed("conditioned", true);
                    //here it only works for *single* condition in one node
                    let thisSeq = clickedNode.sequence,
                        thisMCC = clickedNode.target;
                    let complementRoute
                    if (thisSeq > 0 & graphRightPlusExist) {
                        complementRoute = complementSet(d.data.route, rightLastList[thisSeq])
                        rightLastList[thisSeq] = complementRoute
                        d3.selectAll(".node-group").filter(d => d.sequence > thisSeq).remove();
                        // This would create redaudant "g". Change if need.
                        d3.selectAll(".link").filter(d => d.sequence > thisSeq).remove()
                        drawRightplus(thisSeq + 1, plusDefaultInterval);

                    } else if (thisSeq < 0 & graphLeftPlusExist) {
                        complementRoute = complementSet(d.data.route, leftLastList[-thisSeq])
                        leftLastList[-thisSeq] = complementRoute;
                        d3.selectAll(".node-group").filter(d => d.sequence < thisSeq).remove();
                        // This would create redaudant "g". Change if need.
                        d3.selectAll(".link").filter(d => d.sequence < thisSeq).remove()
                        drawLeftplus(thisSeq - 1, plusDefaultInterval)
                    }
                    //updata condition list
                    conditionList.push({
                        "merchant": d.data.merchant,
                        "sequence": thisSeq,
                        "mcc_name": thisMCC
                    })
                    drawConditionBoxList();
                    console.log(complementSet(d.data.route, clickedNode.route));
                }
                if (conditionCount > 0) {
                    conditionBox.style("cursor", "pointer")
                    conditionBox.on("click", conditionBoxClicked)
                } else {
                    conditionBox.style("cursor", "default")
                    conditionBox.on("click", null)
                }
                globalDragLayer.selectAll("path").remove();
                globalDragLayer.attr("width", 0).attr("height", 0);
                svg.selectAll("g").remove();
                drawsamplepie(svg, svgWidth, svgHeight);
                //redo graphs after this node
                staTooltip.style("opacity", 0);
                staTooltip.html(null);
            }

            function samplePieMouseOver(d) {
                let dpx = event.pageX,
                    dpy = event.pageY;
                let bgColor = d3.color(d3.select(this).attr("fill")).darker()
                staTooltip.style("opacity", 1)
                    .style("background-color", bgColor)
                    .style("top", dpy + "px")
                    .style("left", dpx + "px")
                    .html("<span><b>" + d.data.merchant + "</b>: " + moneyFormat(d.data.transaction_value) +
                        " (" + percentFormat(d.data.transaction_value / sumTTV) + ") </span>");
                d3.select(this)
                    .attr("stroke", bgColor)
                    .attr("stroke-width", 2)
            }

            function samplePieMouseMove(d) {
                let dpx = event.pageX,
                    dpy = event.pageY;
                staTooltip
                    .style("top", dpy + "px")
                    .style("left", dpx + "px");
            }

            function samplePieMouseLeave(d) {
                staTooltip.style("opacity", 0);
                staTooltip.html(null);
                d3.select(this).attr("stroke", null).attr("stroke-width", null)
            }
        }

    }

    //set tools
    d3.selectAll("#pieView").on("click", togglePieView);

    function togglePieView() {
        // pieViewFlag = !pieViewFlag;
        // d3.selectAll(".node-type-legend").classed("hide", !d3.selectAll(".node-type-legend").classed("hide"));
        d3.selectAll(".link-trans-type").classed("hide", !d3.selectAll(".link-trans-type").classed("hide"));
        d3.selectAll(".innode-type-pie").classed("hide", !d3.selectAll(".innode-type-pie").classed("hide"));
        // mdui.mutation();
        if (pieViewFlag) { // if the status is show
            mdui.snackbar({
                message: 'Pie view of transaction types enbabled'
            });
        } else {
            if (innodePieClickedFlag) {
                resetAllGraphStyle();
                resetTypePie();
                resetATVBar();
            }
            mdui.snackbar({
                message: 'Pie view of transaction types disabled'
            });
        }
    }
    // d3.select("#timeIntervalView").on("click", toggleTimeIntervalView);
    function toggleTimeIntervalView() {
        timeIntervalFlag = !timeIntervalFlag;
        d3.selectAll(".horizontal-line").classed("hide", !d3.selectAll(".horizontal-line").classed("hide"));
        d3.selectAll(".vertical-line").classed("hide", !d3.selectAll(".vertical-line").classed("hide"));
        d3.selectAll(".horizontal-line-text").classed("hide", !d3.selectAll(".horizontal-line-text").classed("hide"));
        d3.selectAll(".horizontal-line-text-unit").classed("hide", !d3.selectAll(".horizontal-line-text-unit").classed("hide"));
        d3.selectAll(".bottom-axis").classed("hide", !d3.selectAll(".bottom-axis").classed("hide"));
        refresehGraph();
        // mdui.mutation();
        if (timeIntervalFlag) { // if the status is show
            activeBtn(d3.select(this));
            mdui.snackbar({
                message: 'Time interval filter enbabled'
            });
        } else {
            inactiveBtn(d3.select(this));
            mdui.snackbar({
                message: 'Time interval filter disabled'
            });
        }
    }

    function showAllTimeInterval() {
        d3.selectAll(".horizontal-line").classed("hide", false);
        d3.selectAll(".vertical-line").classed("hide", false);
        d3.selectAll(".horizontal-line-text").classed("hide", false);
        d3.selectAll(".horizontal-line-text-unit").classed("hide", false);
        d3.selectAll(".bottom-axis").classed("hide", false);
    }
    let selectModeFlag = false;
    let singleRouteFlag = false;

    d3.select("#selectMode").on("click", toggleSelectMode)

    function toggleSelectMode() {
        selectModeFlag = !selectModeFlag;
        d3.selectAll(".clicked").classed("clicked", false);

        let firstClickFlag, thisRouteList, lastRouteList
        if (selectModeFlag) {
            activeBtn(d3.select(this));
            firstClickFlag = true;
            d3.selectAll(".node")
                .on("click", selectModeClicked)
                .on("mouseover", null)
                .on("mousemove", null)
                .on("mouseleave", null);
            d3.select("#viewStatusContainer").classed("hide", false);
            d3.select(".status-name").select("span")
                .html("Select nodes to filter trajectories");
            d3.selectAll(".node").style("cursor", "cell");
            d3.selectAll(".innode-text-plus").style("cursor", "cell");
            d3.selectAll(".innode-atv-bar-plus").classed("hide", true);
        } else {
            inactiveBtn(d3.select(this));
            if (singleRouteFlag) {
                //resume the main vis
                d3.select("#lineWeightFilter").classed("hide", false);
                node.selectAll("circle").filter(".not-this-route").classed("hide", false);
                node.selectAll(".node-text").filter(".not-this-route").classed("hide", false);
                link.selectAll(".link-total").classed("hide", false)
                d3.selectAll(".innode-atv-bar").classed("hide", false);
                d3.selectAll(".after-controller").classed("hide", false);
                d3.selectAll(".before-controller").classed("hide", false);
                let allSelectedCircle = d3.selectAll("circle").filter(".this-route")
                let allSelectedCirclep = allSelectedCircle.select(selectParent)
                allSelectedCirclep.classed("hide", false);
                d3.selectAll(".single-route").remove();
                d3.selectAll(".innode-atv-bar-plus").classed("hide", false);
                singleRouteFlag = false;
            }
            resetAllGraphStyle();
            d3.selectAll(".node").on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mousemove", NodeMouseMove)
                .on("mouseleave", NodeMouseLeave);
            d3.select("#viewStatusContainer").classed("hide", true);
            d3.select(".status-name").select("span")
                .html(null);
            d3.selectAll(".node").style("cursor", null);
            d3.selectAll(".innode-text-plus").style("cursor", null);
            d3.select(".single-route-menu-container").remove();
            d3.select("#shareWalletContainer").select("svg").remove();
            d3.select("#shareWalletContainer")
                .style("width", null)
                .style("height", null)
                .style("left", null)
        }

        function selectModeClicked(d) {
            if (firstClickFlag) {
                thisRouteList = d.route;
                firstClickFlag = false;
            } else {
                thisRouteList = intersection(d.route, lastRouteList)
            }
            let dpx = event.pageX,
                dpy = event.pageY
            node.selectAll("circle").classed("not-this-route", true);
            node.selectAll(".node-text").classed("not-this-route", true);
            link.selectAll("line").classed("not-this-route", true);
            node.selectAll(".innode-type-pie").style("opacity", .3);
            lastRouteList = thisRouteList;
            filterRouteByNodeHover(thisRouteList);
            // select all the "total" link in this route
            let allSelectedLink = d3.selectAll(".link-total").filter(".this-route").nodes()

            let nextStepLinks, nextStepNodes, nextSeq
            if (d.sequence > 0) {
                nextSeq = d.sequence + 1
            } else if (d.sequence < 0) {
                nextSeq = d.sequence - 1
            }
            nextStepLinks = d3.selectAll(".link-total").filter(l => l.sequence === nextSeq).filter(".this-route");
            nextStepNodes = d3.selectAll(".node").filter(l => l.sequence === nextSeq).filter(".this-route");
            console.log(nextStepLinks.data())
            let percentFormatC = d3.format("+.0%")
            d3.selectAll(".innode-text-plus").text(null);

            // using ID, judge whether it is a single route without branches
            let idList = new Array(); //get all the link id (seq *)
            allSelectedLink.forEach(d => idList.push(d.getAttribute("id")));
            // get the unique list array from this list and compare the length
            // if it is a single route
            if (idList.length === uniqueArray(idList).length) {
                transformSingleRoute();
                console.log("this is a route");
                console.log(thisRouteList);

                let menuContainer = workContainer.append("div")
                    .attr("class", "single-route-menu-container")
                    .style("position", "absolute")
                    .style("top", `${dpy - 30}px`)
                    .style("left", `${dpx}px`)

                // let menuSlice = menuContainer
                //     .append("button")
                //     .attr("class", "brush-menu mdui-btn mdui-color-deep-purple-800 mdui-btn-raised mdui-btn-dense")
                //     .html("SLICE")
                //     .on("click", transformSingleRoute)
                // transformSingleRoute();
                // allSelectedCirclep
            } else {
                if (nextStepLinks !== [
                        []
                    ]) {
                    if ((nodeViewType === "bar") || (nodeViewType === "atv")) {
                        nextStepNodes.select(selectParent)
                            .selectAll(".innode-text-plus")
                            .text(t => percentFormatC((nextStepLinks.filter(l => l.target === t.target).data()[0].atv - meanATV(t)) / meanATV(t)));
                    } else if (nodeViewType === "ttv") {
                        nextStepNodes.select(selectParent)
                            .selectAll(".innode-text-plus")
                            .text(t => percentFormat((t.atv * intersection(t.route, thisRouteList).length) / totalTTV(t)));
                    }

                }
                console.log("this is not a route")
            }
        }

        function transformSingleRoute() {
            //remove button
            // d3.select(".single-route-menu-container").remove();
            singleRouteFlag = true;
            //hide all other vis
            // d3.select("#lineWeightFilter").classed("hide", true);
            // d3.selectAll(".not-this-route").classed("hide", true)
            // link.selectAll(".link").classed("hide", true);
            // node.selectAll(".innode-graph").classed("hide", true);
            // d3.selectAll(".after-controller").classed("hide", true);
            // d3.selectAll(".before-controller").classed("hide", true);
            d3.selectAll(".innode-text-plus").text(null);
            // get all the nodes in the route and clone
            let allSelectedCircle = d3.selectAll("circle").filter(".this-route")
            //get parent node selection
            let allSelectedCirclep = allSelectedCircle.select(selectParent)
            // let singleRouteNode = allSelectedCirclep.clone(true);
            // allSelectedCirclep.classed("hide", true);
            // singleRouteNode.classed("single-route", true);
            let avgSeq = d3.mean(allSelectedCirclep.data(), d => d.sequence);
            //append a dumb line
            let linex1 = graphCenter[0] + 100 * (d3.min(allSelectedCirclep.data(), d => d.sequence) - avgSeq),
                linex2 = graphCenter[0] + 100 * (d3.max(allSelectedCirclep.data(), d => d.sequence) - avgSeq);
            let nodeLinkY = 150

            // node.append("line").attr("class", "link single-route")
            //     .attr("x1", linex1).attr("y1", nodeLinkY)
            //     .attr("x2", linex2).attr("y2", nodeLinkY);
            // singleRouteNode.raise();
            // //change and transform nodes' position
            // singleRouteNode.selectAll("circle").attr("r", 15)
            //     .style("cursor", "default");
            // singleRouteNode.selectAll(".node-text")
            //     .attr("y", 30).style("font-size", 11)
            // singleRouteNode.transition().duration(200)
            //     .attr("transform", d => "translate(" + (graphCenter[0] + (d.sequence - avgSeq) * 100) + "," + nodeLinkY + ")");
            
            let sequenceArray = new Array();
            allSelectedCirclep.data().forEach(d => sequenceArray.push(d.sequence));
            sequenceArray.sort((a, b) => a - b);
            console.log(sequenceArray)
            axios.post('http://127.0.0.1:5000/query_route', {
                route_list: thisRouteList,
                sequence_list: sequenceArray
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function (response) { // if success then update data
                console.log(response.data);
                function stackData(data) {
                    let cumulative = 0
                    const _data = data.map(d => {
                        cumulative += d.atv
                        return {
                            atv: d.atv,
                            // want the cumulative to prior value (start of rect)
                            cumulative: cumulative - d.atv,
                            mcc: d.mcc,
                            ttv: d.ttv,
                            sequence: d.sequence,
                            time_interval_to_next: d.time_interval_to_next
                        }
                    })
                    return _data
                }

                function renderStackedBar(data) {
                    console.log(data)
                    let stackedBarColorScale = d3.schemeTableau10;
                    let total = d3.sum(data, d => d.atv)
                    let barHeight = 25,
                        barWidthOffest = 100,
                        barY = workSpaceHeight-100
                    console.log(linex1, linex2, total)
                    const xScale = d3.scaleLinear()
                        .domain([0, total])
                        .range([0, linex2 - linex1 + 2 * barWidthOffest]);
                    let container = d3.select("#shareWalletContainer")
                    container.style("left", `${linex1 - barWidthOffest}px`)
                        .style("height", 150)
                        .style("width", 40+xScale(total))
                    let stacksvg = container.append("svg")
                    stacksvg
                        .style("height", 150)
                        .style("width", 40+xScale(total))
                    stacksvg.append("rect").attr("fill", "#fff")
                            .attr("width", "100%").attr("height", "100%")
                            .attr("stroke", "#CCC")
                    let stackBar = stacksvg.append("g")
                        .attr("class", "single-route")
                        .raise()
                    let stackBarG = stackBar.append("g")
                        .attr("transform", `translate(20, 40)`)
                    
                    //add background
                        // .datum(total)
                    
                    stackBarG.selectAll(".share-wallet-bar")
                        .data(data).enter()
                        .append("rect")
                        .attr("class", "single-route share-wallet-bar")
                        .attr("x", d => xScale(d.cumulative))
                        // .attr("y", barY)
                        // .attr("y", d => (d.atv - stackMeanATV(d)) > 0 ? -0.5 * yScale((d.atv - stackMeanATV(d))/stackMeanATV(d)) : 0.5 * yScale(Math.abs(d.atv - stackMeanATV(d))/stackMeanATV(d)))
                        .attr("height", d => barHeight)
                        .attr("width", d => xScale(d.atv))
                        .attr("fill", (d, i) => stackedBarColorScale[i])
                        .on("mouseover", stackBarMouseOver)
                        .on("mousemove", stackBarMouseMove)
                        .on("mouseleave", stackBarMouseLeave);

                        function stackMeanATV(d){
                            return totalSta.filter(s => s.mcc === d.mcc)[0].avg_atv
                        }
                        function stackBarMouseOver(d) {
                            inNodeTooltip.style("opacity", 1);
                        }
            
                        function stackBarMouseMove(d) {
                            let dpx = event.pageX,
                                dpy = event.pageY;
            
                            inNodeTooltip
                                .html(inNodeTooltipHtml(d))
                                .style("top", dpy + "px")
                                .style("left", dpx + "px");
            
                            function inNodeTooltipHtml(d) {
                                if (d.atv - stackMeanATV(d) > 0) {
                                    return "ATV: " + "<span style = 'color:#C94CB0'>" + moneyFormat(d.atv) + "</span>; <br>" +
                                        "<span style = 'color:#C94CB0'>" + moneyFormat(Math.abs(d.atv - stackMeanATV(d))) + "(" + percentFormat(Math.abs(d.atv - stackMeanATV(d)) / stackMeanATV(d)) + ")</span>" + " more than the average ATV " +
                                        "<span style = 'color:#6C7CAB'>" + moneyFormat(stackMeanATV(d)) + "</span>."
                                } else {
                                    return "ATV: " + "<span style = 'color:#328347'>" + moneyFormat(d.atv) + "</span>; <br>" +
                                        "<span style = 'color:#328347'>" + moneyFormat(Math.abs(d.atv - stackMeanATV(d))) + "(" + percentFormat(Math.abs(d.atv - stackMeanATV(d)) / stackMeanATV(d)) + ")</span>" + " less than the average ATV " +
                                        "<span style = 'color:#6C7CAB'>" + moneyFormat(stackMeanATV(d)) + "</span>."
                                }
                            }

                        }
            
                        function stackBarMouseLeave(d) {
                            inNodeTooltip
                                .style("opacity", 0);
                        }

                    stackBarG.selectAll(".share-wallet-text-atv")
                        .data(data).enter()
                        .append("text")
                        .attr("class", "share-wallet-text-atv")
                        .attr("x", d => xScale(d.cumulative) + (xScale(d.atv) / 2))
                        .attr("y", barHeight / 2)
                        .text(d => moneyFormat(d.atv));

                    stackBarG.selectAll(".share-wallet-text-percent")
                        .data(data).enter()
                        .append("text")
                        .attr("class", "share-wallet-text-percent")
                        .attr("x", d => xScale(d.cumulative) + (xScale(d.atv) / 2))
                        .attr("y", -10)
                        .text(d => percentFormat(d.atv / total));

                    stackBarG.selectAll(".share-wallet-text-mcc")
                        .data(data).enter()
                        .append("text")
                        .attr("class", "share-wallet-text-mcc")
                        .attr("x", d => xScale(d.cumulative) + (xScale(d.atv) / 2))
                        .attr("y", barHeight + 10)
                        .text(d => multiWordsFormat(d.mcc))
                        .attr("fill", (d, i) => stackedBarColorScale[i])
                        .on("mouseover", d => showFullName(d.mcc))
                        .on("mousemove", moveFullName)
                        .on("mouseout", hideFullName);
                    
                    stackBarG.append("rect")
                        .attr("x", 0).attr("y", barHeight + 30)
                        .attr("height", barHeight)
                        .attr("width", xScale(total))
                        .attr("fill", "#5E37A5")
                        .datum(total)

                    stackBarG.append("text").attr("class", "share-wallet-text-total")
                        .attr("x", xScale(total) / 2)
                        .attr("y", 1.5 * barHeight + 30)
                        .text("Average Total Wallet: " + moneyFormat(total) +
                            "  ×  " + thisRouteList.length + "  people");

                    stackBarG.append("text")
                        .attr("class", "share-wallet-text-title")
                        .text("SHARE OF WALLET")
                        .attr("x", xScale(total) / 2)
                        .attr("y", 2.5 * barHeight + 30);
                    
                }
                setTimeout(() => {
                    renderStackedBar(stackData(response.data));
                }, 300)
                // renderGraph(response);
            });
        }
    }
    //all done, set graph exist indicator = true
    graphExist = true;

    function appendViewSelector() {
        let svgWidth = 200,
            svgHeight = 200;
        let svg = d3.select("#viewSelector").append("svg")
            .attr("width", svgWidth).attr("height", svgHeight);
        //append defs
        appendDefs();

        function appendDefs() {
            let defs = svg.append("defs")
            let countGradient = defs.append("linearGradient")
                .attr("id", "countGradient")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%");
            countGradient.append("stop").attr("offset", "0%")
                .attr("stop-color", d3.interpolatePuBu(0.2));
            countGradient.append("stop").attr("offset", "50%")
                .attr("stop-color", d3.interpolatePuBu(0.6));
            countGradient.append("stop").attr("offset", "100%")
                .attr("stop-color", d3.interpolatePuBu(1));

            let atvGradient = defs.append("linearGradient")
                .attr("id", "atvGradient")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%")
            atvGradient.append("stop").attr("offset", "0%")
                .attr("stop-color", d3.interpolateYlGn(0.2));
            atvGradient.append("stop").attr("offset", "50%")
                .attr("stop-color", d3.interpolateYlGn(0.6));
            atvGradient.append("stop").attr("offset", "100%")
                .attr("stop-color", d3.interpolateYlGn(1));

            let ttvGradient = defs.append("linearGradient")
                .attr("id", "ttvGradient")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%")
            ttvGradient.append("stop").attr("offset", "0%")
                .attr("stop-color", d3.interpolateRdPu(0.2));
            ttvGradient.append("stop").attr("offset", "50%")
                .attr("stop-color", d3.interpolateRdPu(0.6));
            ttvGradient.append("stop").attr("offset", "100%")
                .attr("stop-color", d3.interpolateRdPu(1));
        }
        //draw top buttons
        let topBtnG = svg.append("g").attr("id", "viewBtnG")
            .attr("transform", "translate(0,40)")
        let btnWidth = 0.31 * svgWidth,
            btnHeight = 20,
            btnMargin = 0.03 * svgWidth;
        let timeViewToggle = topBtnG.append("g")
            .attr("transform", `translate(0,0)`)
            .on("click", toggleTimeIntervalView);
        timeViewToggle.append("rect")
            .attr("width", btnWidth).attr("height", btnHeight)
            .attr("fill", "white").attr("stroke", "#CCC");
        timeViewToggle.append("text")
            .attr("class", "view-toggle-text")
            .attr("x", btnWidth / 2).attr("y", btnHeight / 2)
            .text("TIME");
        let dblViewToggle = topBtnG.append("g").attr("id", "addGraph")
            .attr("transform", `translate(${btnMargin+btnWidth},0)`)
            .on("click", addGraph);
        dblViewToggle.append("rect")
            .attr("width", btnWidth).attr("height", btnHeight)
            .attr("fill", "white").attr("stroke", "#CCC");
        dblViewToggle.append("text")
            .attr("class", "view-toggle-text")
            .attr("x", btnWidth / 2).attr("y", btnHeight / 2)
            .text("DOUBLE");
        let sliceToggle = topBtnG.append("g")
            .attr("transform", `translate(${2*btnMargin+2*btnWidth},0)`)
            .on("click", toggleSelectMode);
        sliceToggle.append("rect")
            .attr("width", btnWidth).attr("height", btnHeight)
            .attr("fill", "white").attr("stroke", "#CCC");
        sliceToggle.append("text")
            .attr("class", "view-toggle-text")
            .attr("x", btnWidth / 2).attr("y", btnHeight / 2)
            .text("SLICE");

        //draw node
        let viewNodeRadius = 25
        let nodeG = svg.append("g").attr("id", "viewNodeG")
            .attr("transform", `translate(${svgWidth/2}, ${svgHeight/2})`)
        let viewNode = nodeG.append("circle")
            .attr("class", "view-node")
            .attr("r", viewNodeRadius).attr("fill", "white")
            .attr("stroke", "#7B8C9D");
        //draw pie
        let pieColorScale = d3.scaleOrdinal().domain([0, 1])
            .range(["#F7CE3E", "#1A2930"]);
        let sampleTypePieData = [{
                "label": "Online",
                "value": 1,
            },
            {
                "label": "Offline",
                "value": 1,
            }
        ]
        let spConverter = d3.pie().value(d => d.value)
            .sort(null).sortValues(null);
        let arc = d3.arc().outerRadius(23).innerRadius(18);
        let typePie = nodeG.selectAll("path")
            .data(d => spConverter(sampleTypePieData))
            .enter().append("path")
            .style("cursor", "pointer")
            .attr("class", "view-pie")
            .attr("fill", "#DDD")
            .attr("transform", (d, i) => `translate(${20*(-i+0.5)},0) scale(1, 1.4)`)
            .attr("d", arc)
            .on("click", togglePieClick);
        // draw sample bar
        let sampleATVBarG = nodeG.append("g").attr("id", "viewSampleATVBarG")
        sampleATVBarG.append("line")
            .attr("x1", -0.6 * viewNodeRadius)
            .attr("x2", 0.6 * viewNodeRadius)
            .attr("stroke", "#BBB")
        sampleATVBarG.append("rect")
            .attr("width", 0.8 * viewNodeRadius)
            .attr("x", -0.4 * viewNodeRadius)
            .attr("y", -9) // if result is postive then the bar should be put over the baseline
            .attr("height", 8)
            .attr("fill", atvColors[0]);
        sampleATVBarG.append("text")
            .text("+10.0")
            .attr("class", "innode-graph innode-atv-bar")
            .attr("y", 11)
            .attr("fill", atvColors[0]);
        // add legend rect
        let glegendG = svg.append("g").attr("id", "gradLegendG")
            .attr("transform", `translate(0, ${0.7*svgHeight})`)
            .classed("hide", true);
        let glengendMargin = 40
        let glengendWidth = svgWidth - 2 * glengendMargin
        glegendG.append("rect").attr("class", "gradient-legend")
            .attr("height", 10).attr("width", glengendWidth)
            .attr("x", glengendMargin)
            .attr("fill", "white");
        glegendG.append("text").attr("class", "legend-text")
            .style("alignment-baseline", "baseline")
            .style("fill", "#666")
            .attr("x", 0.7 * glengendMargin).text("0")
        glegendG.append("text").attr("class", "legend-text")
            .style("alignment-baseline", "baseline")
            .style("fill", "#666")
            .attr("id", "legendMaxText")
            .attr("x", 1.1 * glengendMargin + glengendWidth)

        function togglePieClick(d) {
            pieViewFlag = !pieViewFlag;
            let thisSegment = d3.select(this);
            let activeArc = d3.arc().outerRadius(viewNodeRadius).innerRadius(17);
            if (pieViewFlag) {
                typePie.transition().duration(300)
                    .attr("d", activeArc)
                    .attr("fill", (d, i) => pieColorScale(i))
                    .attr("transform", "translate(0,0)");
                //add legend text
                let legendLineSpace = 6
                nodeG.append("text").attr("class", "legend-text pie-legend")
                    .text("Online").attr("x", 30).attr("y", -legendLineSpace);
                nodeG.append("text").attr("class", "legend-text pie-legend")
                    .text("Transaction").attr("x", 30).attr("y", legendLineSpace);
                nodeG.append("text").attr("class", "legend-text pie-legend")
                    .text("Offline").attr("x", -30).attr("y", -legendLineSpace)
                    .attr("text-anchor", "end");
                nodeG.append("text").attr("class", "legend-text pie-legend")
                    .text("Transaction").attr("x", -30).attr("y", legendLineSpace)
                    .attr("text-anchor", "end");
            } else {
                typePie.transition().duration(300)
                    .attr("d", arc)
                    .attr("fill", "#CCC")
                    .attr("transform", (d, i) => `translate(${20*(-i+0.5)},0) scale(1, 1.4)`);
                nodeG.selectAll(".pie-legend").remove();
            }
            togglePieView();
        }
    }

    function meanATV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].avg_atv
    }

    function totalTTV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].total_ttv
    }

    function onlineMeanATV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].online_avg_atv
    }

    function offlineMeanATV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].offline_avg_atv
    }

    function onlineTotalTTV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].online_total_ttv
    }

    function offlineTotalTTV(d) {
        return totalSta.filter(s => s.mcc === d.target)[0].offline_total_ttv
    }
}

function changeLinkVisibility() {
    let value = document.getElementById("linkVis").value;
    let allLink = d3.selectAll(".link")
    let maxLinkCount = d3.max(allLink.data(), d => d.count);
    let scaler = d3.scalePow().exponent(3).range([0.9, maxLinkCount + 1]).domain([0, 100]);
    let txt = d3.select("#linkVisTxt").select("span")
    console.log(scaler(100 - value))
    allLink.filter(l => l.count > scaler(100 - value)).transition().duration(200).style("opacity", .9);
    allLink.filter(l => l.count < scaler(100 - value)).transition().duration(200).style("opacity", .05);
    txt.html("count > " + Math.floor(scaler(100 - value)));
}

function changeAllNodeColor(ele) {
    nodeViewType = ele.value;
    let type = ele.value;
    let allNodes = d3.selectAll(".node");
    let allmaxCount = d3.max(allNodes.data(), d => d.count);
    let allmaxATV = d3.max(allNodes.data(), d => d.atv);
    let allmaxTTV = d3.max(allNodes.data(), d => d.count * d.atv);
    d3.selectAll(".innode-atv-bar").classed("hide", true);
    if (type === "bar") {
        d3.selectAll(".node").attr("fill", "white");
        d3.select(".gradient-legend").attr("fill", "white");
        d3.select(".view-node").attr("fill", "white");
        d3.selectAll(".innode-atv-bar").classed("hide", false);
        d3.select("#gradLegendG").classed("hide", true);
        d3.select("#viewSampleATVBarG").classed("hide", false);
    } else {
        d3.select("#gradLegendG").classed("hide", false);
        d3.select("#viewSampleATVBarG").classed("hide", true);
        if (type === "count") {
            d3.selectAll(".node").attr("fill", d => d3.interpolatePuBu(normalColorScaler(allmaxCount, d.count)));
            d3.select(".gradient-legend").attr("fill", "url(#countGradient)");
            d3.select(".view-node").attr("fill", d3.interpolatePuBu(0.6));
            d3.select("#legendMaxText").text(numFormat(allmaxCount));
        } else if (type === "atv") {
            d3.selectAll(".node").attr("fill", d => d3.interpolateYlGn(normalColorScaler(allmaxATV, d.count * d.atv)));
            d3.select(".gradient-legend").attr("fill", "url(#atvGradient)");
            d3.select(".view-node").attr("fill", d3.interpolateYlGn(0.6));
            d3.select("#legendMaxText").text(numFormat(allmaxATV));
        } else if (type === "ttv") {
            d3.selectAll(".node").attr("fill", d => d3.interpolateRdPu(normalColorScaler(allmaxTTV, d.count * d.atv)));
            d3.select(".gradient-legend").attr("fill", "url(#ttvGradient)");
            d3.select(".view-node").attr("fill", d3.interpolateRdPu(0.6));
            d3.select("#legendMaxText").text(d3.format(".4s")(allmaxTTV));
        }
    }
}

function resetNodeColor() {
    d3.selectAll(".node").attr("fill", "white");
    d3.selectAll(".innode-atv-bar").classed("hide", false);
}

function activeBtn(selection) {
    selection.selectAll("rect").attr("fill", "#666");
    selection.selectAll("text").style("fill", "white");
}

function inactiveBtn(selection) {
    selection.selectAll("rect").attr("fill", "white");
    selection.selectAll("text").style("fill", null);
}

function plusShowNum(){
    let lastVal = parseFloat(document.getElementById("changeNum").value);
    if (lastVal < 10){
        document.getElementById("changeNum").value = lastVal + 1;
        maxShowNum = lastVal + 1;
        if (graphExist == true && secondGraphExist === false) {
            refresehGraph();
        }
    }
}

function minusShowNum(){
    let lastVal = parseFloat(document.getElementById("changeNum").value);
    if (lastVal > 3){
        document.getElementById("changeNum").value = lastVal - 1;
        maxShowNum = lastVal - 1;
        if (graphExist == true && secondGraphExist === false) {
            refresehGraph();
        }
    }
}

function showNumChange(){
    let val = parseFloat(document.getElementById("changeNum").value);
    if (val < 3){
        document.getElementById("changeNum").value = 3;
    } else if (val > 10) {
        document.getElementById("changeNum").value = 10;
    }
    val = parseFloat(document.getElementById("changeNum").value);
    maxShowNum = val;
    if (graphExist == true && secondGraphExist === false) {
        refresehGraph();
    }
}

function refresehGraph(){
    workSpace.selectAll("#graph-first").remove();
    // workSpace.selectAll("#graph-second").remove();
    drawGraph("graph-first", currentQueryType, queryNode, timeStart, timeEnd, maxShowNum);
}