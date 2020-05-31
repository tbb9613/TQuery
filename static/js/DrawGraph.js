// drawGraph();
function drawGraph(graphid, graph, type) {

    let graphRightPlusExist = false;
    let graphLeftPlusExist = false;

    staSpace.selectAll("g").remove();

    graphExist = true;

    d3.selectAll(".brush-child").classed("hide", true);

    const graphCenter = [workSpaceWidth / 2, workSpaceHeight / 2];
    // console.log(graphCenter[0], graphCenter[1])
    //Draw workspace background
    let graphBg = workSpace
        .append("g")
        .attr("id", graphid)
    // .attr("y", "30%");

    graphBg
        .append("rect")
        .classed("graph-background", true)
        .attr("fill", "#CCC")
        .attr("opacity", .25)
        .attr("width", "100%")
        .attr("height", "100%");
        // .on("click", function(){d3.select(".node-menu").classed("hide", true)})
        
    // .attr("y", "30%");

    let graphContainer = graphBg.append("g")
        .attr("id", "graphContainer");

    //Create zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 1.5])
        .on("zoom", zoom_actions);

    function zoom_actions() {
        graphContainer.attr("transform", d3.event.transform)
    }

    // zoom(graphBg);
    graphBg.call(zoom).on("dblclick.zoom", null);

    //display side tab menu
    d3.select("#staTab").classed("hide", false)
    //draw sta cards
    let staCardHeight = 2 * staSpaceWidth / 3;

    function drawStaCards() {
        //Create sta cards
        const staCardList = [{
            "category": "general",
            "type": "pie",
            "name": "sta1"
        }, {
            "category": "general",
            "type": "bar",
            "name": "sta2"
        }, {
            "category": "business",
            "type": "pie",
            "name": "sta3"
        }, {
            "category": "business",
            "type": "bar",
            "name": "sta4"
        }, {
            "category": "consumer",
            "type": "pie",
            "name": "sta5"
        }, {
            "category": "consumer",
            "type": "bar",
            "name": "sta6"
        }]

        //Create background   
        var staCards = staSpace.selectAll(".stacard")
            .data(staCardList).enter()
            .append("g")
            .classed("stacard", true)
            .attr("class", d => (d.category + " " + d.type))
            .attr("id", d => d.name)
            .attr("width", "100%")
            .attr("height", staCardHeight)
            // .attr("fill", "#CCC")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))

        staCards
            .append("rect")
            .attr("class", "stacard-bg")
            .attr("x", "2.5%")
            .attr("width", "95%")
            .attr("height", staCardHeight)
            .attr("fill", "#EEE")
            .attr("y", (d, i) => 200 + i * (30 + staCardHeight))

        staSpace.attr("height", 300 + staCardList.length * (30 + staCardHeight))
    }

    drawStaCards();
    var supplierHeight = parseFloat(d3.select("#sta2").attr("y")) + 2 * staCardHeight / 3
    var customerHeight = parseFloat(d3.select("#sta4").attr("y")) + 2 * staCardHeight / 3

    d3.selectAll(".sta-button")
        .on("click", clickStaTab)
    var isTabClicked = false;

    function clickStaTab() {
        isTabClicked = true;
        let id = d3.select(this).attr("id");
        if (id === "G") {
            staContainer.node().scrollTo({
                top: 0,
                behavior: "smooth"
            });
            d3.select("#G").classed("sta-button-active", true);
            d3.select("#S").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "S") {
            staContainer.node().scrollTo({
                top: supplierHeight,
                behavior: "smooth"
            })
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#S").classed("sta-button-active", true);
            d3.select("#C").classed("sta-button-active", false);
        } else if (id === "C") {
            staContainer.node().scrollTo({
                top: customerHeight,
                behavior: "smooth"
            })
            d3.select("#G").classed("sta-button-active", false);
            d3.select("#S").classed("sta-button-active", false);
            d3.select("#C").classed("sta-button-active", true);
        }
        setTimeout(() => {
            isTabClicked = false;
            checkScroll();
        }, 1500)

    }
    staContainer.node().onscroll = checkScroll;

    function checkScroll() {
        let sTop = staContainer.node().scrollTop;
        if (!isTabClicked) {
            if (sTop < supplierHeight) {
                d3.select("#G").classed("sta-button-active", true);
                d3.select("#S").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", false);
            } else if (sTop >= supplierHeight && sTop < customerHeight) {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#S").classed("sta-button-active", true);
                d3.select("#C").classed("sta-button-active", false);
            } else {
                d3.select("#G").classed("sta-button-active", false);
                d3.select("#S").classed("sta-button-active", false);
                d3.select("#C").classed("sta-button-active", true);
            }
        }
        // console.log("scroll!", sTop);
    }
    //brush - select

    brush.on("start", brushstart)
        .on("brush", brushed)
        .on("end", brushpopup);

    function brushstart() {
        leftContainer.selectAll(".brush-menu").remove();
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

            let menuContainer = leftContainer.append("div")
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
            zoom.scaleBy(graphBg, 0.7, [workSpaceWidth / 4, workSpaceHeight / 2])

            drawGraph("graph-second", subNodeMap, "single")
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
        zoom.scaleBy(graphBg, 0.7, [3 * workSpaceWidth / 4, workSpaceHeight / 2])

        workSpace.append("g")
            .append("line")
            .attr("x1", graphCenter[0])
            .attr("y1", 0.15 * workSpaceHeight)
            .attr("x2", graphCenter[0])
            .attr("y2", 0.85 * workSpaceHeight)
            .attr("stroke", "black")
            .attr("stroke-width", "3px");
    }

    //Pie around center node
    //Calculate pie chart data
    //Draw links & nodes
    function MainLayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-workSpaceHeight / 4, workSpaceHeight / 4])
            .domain([0, subC - 1]);
        return scaler(subID);
    }


    let linkScaler = d3.scaleLinear()
        .range([1, 5])
        .domain([1, d3.max(graph.link, d => d.count)])

    let rightCountSum = d3.sum(graph.link.filter(d => d.sequence == 1), d => d.count)
    let leftCountSum = d3.sum(graph.link.filter(d => d.sequence == -1), d => d.count)

    let link = graphContainer.append('g')
        .attr("id", "link")

    let node = graphContainer.append("g")
        .attr("id", "nodes");

    let nodeTxtOffset = 27,
        fistNodeDistance = 100,
        coeffTxtOffset = 0.5;


    if (type === "single") {
        let centernode = node.append("g")
            .attr("id", "queryNode")
            .selectAll("circle")
            .data(graph.node.filter(d => d.sequence == 0))
            .enter().append("circle")
            .attr("class", "center-node")
            .attr("r", 30)
            .attr("cx", d => graphCenter[0] + d.sequence * fistNodeDistance)
            .attr("cy", graphCenter[1])
            .on("click", clicked);

        let textCenter = node.append("g")
            .selectAll("text")
            .data(graph.node.filter(d => d.sequence == 0))
            .enter().append("text")
            .attr("class", "node-text")
            .attr("fill", "slategray")
            .attr("x", d => graphCenter[0] + d.sequence * fistNodeDistance)
            .attr("y", graphCenter[1] + nodeTxtOffset + 15)
            .text(d => d.place.slice(0, 3))
            .style("font-size", "14px")


    } else {
        fistNodeDistance = 180;
        coeffTxtOffset = 0.8;
        let centernode = node.append("g")
            .attr("id", "queryNode")
            .selectAll("circle")
            .data(graph.node.filter(d => d.sequence == 0))
            .enter().append("circle")
            .attr("class", "node-multi-center")
            .attr("r", 120)
            .attr("cx", d => graphCenter[0] + d.sequence * fistNodeDistance)
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
                .text(d => d.id)
                .attr("x", 0).attr("y", 20)
                .attr("fill", "white")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("font-size", 10);

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

    let linkRight = link.append("g")
        .selectAll("line")
        .data(graph.link.filter(d => d.sequence == 1))
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => linkScaler(d.count))
        .attr("x1", d => graphCenter[0])
        .attr("y1", d => graphCenter[1])
        .attr("x2", d => graphCenter[0] + d.sequence * fistNodeDistance)
        .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, d.sublink_count));

    var txtOffset = -20

    let linkLeft = link.append("g")
        .selectAll("line")
        .data(graph.link.filter(d => d.sequence == -1))
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => linkScaler(d.count))
        .attr("x1", d => graphCenter[0])
        .attr("y1", d => graphCenter[1])
        .attr("x2", d => graphCenter[0] + d.sequence * fistNodeDistance)
        .attr("y2", (d, i) => graphCenter[1] + MainLayoutScaler(i, d.sublink_count));

    let rightText = link.append("g")
        .selectAll("text")
        .data(graph.link.filter(d => d.sequence == 1)).enter()
        .append("text")
        .attr("class", "link-text")
        .attr("x", d => graphCenter[0] + coeffTxtOffset * d.sequence * fistNodeDistance)
        .attr("y", (d, i) => txtOffset + graphCenter[1] + coeffTxtOffset * MainLayoutScaler(i, d.sublink_count))
        .text(d => d.count * 10)
        .classed("text-hide", true)

    let leftText = link.append("g")
        .selectAll("text")
        .data(graph.link.filter(d => d.sequence == -1)).enter()
        .append("text")
        .attr("class", "link-text")
        .attr("x", d => graphCenter[0] + coeffTxtOffset * d.sequence * fistNodeDistance)
        .attr("y", (d, i) => txtOffset + graphCenter[1] + coeffTxtOffset * MainLayoutScaler(i, d.sublink_count))
        .text(d => d.count * 10)
        .classed("text-hide", true)

    let nodeRight = node.append("g")
        .selectAll("circle")
        .data(graph.node.filter(d => d.sequence == 1))
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => linkRight.filter(l => l.target == d.target).attr("x2"))
        .attr("cy", d => linkRight.filter(l => l.target == d.target).attr("y2"))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked)
        .on("mouseover", NodeMouseOver)
        .on("mousemove", NodeMouseMove)
        .on("mouseleave", NodeMouseLeave);
        // .on("contextmenu", rightclicked)

    let textRight = node.append("g")
        .selectAll("text")
        .data(graph.node.filter(d => d.sequence == 1))
        .enter().append("text")
        .attr("class", "node-text")
        .attr("x", d => linkRight.filter(l => l.target == d.target).attr("x2"))
        .attr("y", d => parseFloat(linkRight.filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset)
        .text(d => d.place.slice(0, 3))

    let nodeLeft = node.append("g")
        .selectAll("circle")
        .data(graph.node.filter(d => d.sequence == -1))
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("cx", d => linkLeft.filter(l => l.target == d.target).attr("x2"))
        .attr("cy", d => linkLeft.filter(l => l.target == d.target).attr("y2"))
        .call(d3.drag().on("drag", dragged))
        .on("click", clicked)
        .on("mouseover", NodeMouseOver)
        .on("mousemove", NodeMouseMove)
        .on("mouseleave", NodeMouseLeave);

    let textLeft = node.append("g")
        .selectAll("text")
        .data(graph.node.filter(d => d.sequence == -1))
        .enter().append("text")
        .attr("class", "node-text")
        .attr("x", d => linkLeft.filter(l => l.target == d.target).attr("x2"))
        .attr("y", d => parseFloat(linkLeft.filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset)
        .text(d => d.place.slice(0, 3))




    function dragged(d) {
        console.log(event.pageX)
        // console.log(d);
        graphContainer.selectAll("circle").attr("stroke", "#fff") // reset the style
        d.x = d3.event.x, d.y = d3.event.y;
        d3.select(this).attr("stroke", "#18569C");
        d3.select(this).attr("cx", d.x).attr("cy", d.y);
        node.selectAll(".node-text").filter(t => t.target === d.target)
            .attr("x", d.x).attr("y", d.y + nodeTxtOffset);
        // console.log(d.data.sequence);
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
        link.selectAll("text").filter(t => t.target === d.target)
            .attr("x", t => 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("x2"))))
            .attr("y", (t, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))

        if (graphRightPlusExist) {
            linkRightplus[2].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        if (graphLeftPlusExist) {
            linkLeftplus[2].filter(
                l => l.source == d.target
            ).attr("x1", d.x).attr("y1", d.y);
        }

        // console.log(d.id);
        drawsta();
        text.text('Place: ' + d.place)
    }
    //Click node event

    function clicked(d) {
        let thisNode = d3.select(this);
        console.log(node.selectAll("text"));
        if (d3.event.shiftKey) {
            createQuery(d.place, 4, "single");
        } else {
            console.log("clicked");
            drawsta();
            text.text('Place: ' + d.place)
            graphContainer.selectAll("circle").classed("clicked", false);
            thisNode.classed("clicked", true);
            node.selectAll(".node-text").classed("clicked", false);
            node.selectAll(".node-text").filter(t => t.sequence < -1 || t.sequence > 1).classed("text-hide", true);
            node.selectAll(".node-text").filter(t => t.target === d.target)
                .attr("class", "text-hide node-text clicked")
                .classed("text-hide", false)
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
        .attr("y", "48%")

    graphBg.append("g")
        .on("click", afterminus)
        .append('text')
        .attr("class", "after-controller")
        .text("➖")
        .attr("x", "95%")
        .attr("y", "54%")

    graphBg.append("g")
        .on("click", beforeplus)
        .append('text')
        .attr("class", "before-controller")
        .text("➕")
        .attr("x", "5%")
        .attr("y", "48%")

    graphBg.append("g")
        .on("click", beforeminus)
        .append('text')
        .attr("class", "before-controller")
        .text("➖")
        .attr("x", "5%")
        .attr("y", "54%")

    if (graphid === "graph-second") {
        graphBg.selectAll(".before-controller")
            .attr("x", "55%")
    }

    let rseq = 2;
    let lseq = 2;
    let maxseq = 4;

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

    function drawRightplus(seq) {

        graphRightPlusExist = true;

        //Calculate vertical layout
        if (seq === 2) {
            linkRightplus[seq] = link.append("g")

                .attr("id", `seq${seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => nodeRight.filter(n => n.target == d.source).attr("cx"))
                .attr("y1", d => nodeRight.filter(n => n.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeRight.filter(n => n.target == d.source).attr("cx")) + 80)
                .attr("y2", d => parseFloat(nodeRight.filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeRightplus[seq] = node.append("g")
                .attr("id", `seq${seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkRightplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mousemove", NodeMouseMove)
                .on("mouseleave", NodeMouseLeave);

            linkRightplus[seq]
                .attr("y2", d => nodeRightplus[seq].filter(n => n.target === d.target).attr("cy"))

            nodeRightplus[seq].sort(function(){
                
            })
            console.log(d3.selectAll(`#seq${seq}`).sort())
        } else {
            linkRightplus[seq] = link.append("g")
                .attr("id", `seq${seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                .attr("y1", d => linkRightplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                .attr("x2", d => parseFloat(linkRightplus[seq - 1].filter(l => l.target == d.source).attr("x2")) + 80)
                .attr("y2", d => parseFloat(linkRightplus[seq - 1].filter(l => l.target == d.source).attr("y2")) + LayoutScaler(d.sub_id, d.sublink_count));


            nodeRightplus[seq] = node.append("g")
                .attr("id", `seq${seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkRightplus[seq].filter(l => l.target == d.target).attr("y2"))
                // .attr("cy", (d,i) => 100+ i * 40)
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mousemove", NodeMouseMove)
                .on("mouseleave", NodeMouseLeave);

            linkRightplus[seq]
                .attr("y2", d => nodeRightplus[seq].filter(n => n.target === d.target).attr("cy"))
        }
        // add link text
        link.append("g")
            .attr("id", `seq${seq}`)
            .selectAll("text")
            .data(graph.link.filter(d => d.sequence == seq)).enter()
            .append("text")
            .attr("class", "link-text")
            .attr("x", d => 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
            .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                parseFloat(linkRightplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
            .text(d => d.count * 10)
            .classed("text-hide", true)
        //add node text
        node.append("g")
            .attr("id", `seq${seq}`)
            .selectAll("text")
            .data(graph.node.filter(d => d.sequence == seq))
            .enter().append("text")
            .attr("class", "node-text")
            .attr("x", d => linkRightplus[seq].filter(l => l.target == d.target).attr("x2"))
            .attr("y", d => parseFloat(linkRightplus[seq].filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset * 0.6)
            .text(d => d.place.slice(0, 3))
            .classed("text-hide", true)

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
                    parseFloat(linkRightplus[seq].filter(l => l.target == t.target && l.source == t.source).attr("y2"))))
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
            //Reset text pos

            drawsta();

            text.text('Place: ' + d.place)
        }




    }

    function drawLeftplus(seq) {

        graphLeftPlusExist = true;

        //Calculate vertical layout

        if (seq == 2) {
            linkLeftplus[seq] = link.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => nodeLeft.filter(n => n.target == d.source).attr("cx"))
                .attr("y1", d => nodeLeft.filter(n => n.target == d.source).attr("cy"))
                .attr("x2", d => parseFloat(nodeLeft.filter(n => n.target == d.source).attr("cx")) - 80)
                .attr("y2", d => parseFloat(nodeLeft.filter(n => n.target == d.source).attr("cy")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mousemove", NodeMouseMove)
                .on("mouseleave", NodeMouseLeave);

            linkLeftplus[seq]
                .attr("y2", d => nodeLeftplus[seq].filter(n => n.target === d.target).attr("cy"))
        } else {
            linkLeftplus[seq] = link.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("line")
                .data(graph.link.filter(d => d.sequence == -seq))
                .enter().append("line")
                .attr("class", "link")
                .attr("x1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2"))
                .attr("y1", d => linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("y2"))
                .attr("x2", d => parseFloat(linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("x2")) - 80)
                .attr("y2", d => parseFloat(linkLeftplus[seq - 1].filter(l => l.target == d.source).attr("y2")) + LayoutScaler(d.sub_id, d.sublink_count));

            nodeLeftplus[seq] = node.append("g")
                .attr("id", `seq${-seq}`)
                .selectAll("circle")
                .data(graph.node.filter(d => d.sequence == -seq))
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 10)
                .attr("cx", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
                .attr("cy", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("y2"))
                .call(d3.drag().on("drag", dragged))
                .on("click", clicked)
                .on("mouseover", NodeMouseOver)
                .on("mousemove", NodeMouseMove)
                .on("mouseleave", NodeMouseLeave);

            linkLeftplus[seq]
                .attr("y2", d => nodeLeftplus[seq].filter(n => n.target === d.target).attr("cy"))
        }
        //add text
        link.append("g")
            .attr("id", `seq${-seq}`)
            .selectAll("text")
            .data(graph.link.filter(d => d.sequence == -seq)).enter()
            .append("text")
            .attr("class", "link-text")
            .attr("x", d => 0.5 * (
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x1")) +
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("x2"))))
            .attr("y", (d, i) => txtOffset / 2 + 0.5 * (
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y1")) +
                parseFloat(linkLeftplus[seq].filter(l => l.target == d.target && l.source == d.source).attr("y2"))))
            .text(d => d.count * 10)
            .classed("text-hide", true)

        node.append("g")
            .attr("id", `seq${-seq}`)
            .selectAll("text")
            .data(graph.node.filter(d => d.sequence == -seq))
            .enter().append("text")
            .attr("class", "node-text")
            .attr("x", d => linkLeftplus[seq].filter(l => l.target == d.target).attr("x2"))
            .attr("y", d => parseFloat(linkLeftplus[seq].filter(l => l.target == d.target).attr("y2")) + nodeTxtOffset * 0.6)
            .text(d => d.place.slice(0, 3))
            .classed("text-hide", true)


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

            drawsta();

            text.text('Place: ' + d.place)
        }
    }

    function LayoutScaler(subID, subC) {
        let scaler = d3.scaleLinear()
            .range([-10 - 10 * subC, 10 + 10 * subC])
            .domain([0.4, subC + 0.6]);
        return scaler(subID);
    }

    var shiftTooltip = leftContainer.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)

    function NodeMouseOver(d) {
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode);
        console.log(hoveredNodeParent);


        node.selectAll("circle").filter(n => n.sequence !== 0).classed("not-this-route", true)
        link.selectAll("line").classed("not-this-route", true)
        link.selectAll("text").classed("not-this-route", true)

        d.route.forEach(function (r) {
            // console.log(r)
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
            .attr("x", d3.select(this).attr("cx"))
            .attr("y", parseFloat(d3.select(this).attr("cy"))-30)
            .text("Click to center")

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

    function NodeMouseMove(d){
        let hoveredNode = d3.select(this);
        let hoveredNodeParent = d3.select(this.parentNode)

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
    //IF HAVE TIME TRY TO USE FORCE GRAPH
    function drawRightplusForce(seq) {
        let simulation = d3.forceSimulation();

    }

    workSpace.selectAll("#conditionBox").remove();

    let conditionBox = graphBg.append("g")
        .attr("id", "conditionBox")

    if (graphid === "graph-first") {
        conditionCount = 0;
    }

    function initializeConditionBox() {
        conditionBox.append("rect")
            .attr("x", "45%")
            .attr("y", "90%")
            .attr("height", "7%")
            .attr("width", "10%")
            .attr("fill", "#808080")
            .attr("opacity", .5)

        conditionBox.append("text")
            .attr("x", "50%")
            .attr("y", "93.5%")
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

    function drawsta() {
        console.log("draw");
        staSpace.selectAll(".samplePie").remove();
        staSpace.selectAll(".sampleBar").remove();
        drawsamplepie("#sta1");
        drawsamplebar("#sta2");
        drawsamplepie("#sta3");
        drawsamplepie("#sta4");
        drawsamplebar("#sta5");
        drawsamplebar("#sta6");
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

        let samplePieColorScale = d3.schemeTableau10;

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
            .attr('transform', `translate(${staSpaceWidth/2}, 
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/2)})`)
            .attr("fill", (d, i) => samplePieColorScale[i])
            .attr("d", arcSample)
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

        staSpace.select(id)
            .append("g")
            .attr("class", "samplePie")
            .attr('transform', `translate(${ staSpaceWidth / 5},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/8)})`)
            .append("text")
            .text(d => d.category + " " + id)
            .attr("x", 10)
            .attr("y", 10)

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
            staSpace.select(id).selectAll("g").remove();
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
            .attr('transform', `translate(${ staSpaceWidth / 4},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/4)})`)

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
            .attr("fill", "#1771D8")
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))

        staSpace.select(id)
            .append("g")
            .attr("class", "sampleBar")
            .attr('transform', `translate(${ staSpaceWidth / 5},
                ${(parseFloat(staSpace.select(id).attr("y")) + staCardHeight/8)})`)
            .append("text")
            .text(d => d.category + " " + id)
            .attr("x", 10)
            .attr("y", 10)

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
            globalDragLayer.selectAll("rect").remove();
            globalDragLayer.attr("width", 0).attr("height", 0);
            staSpace.select(id).selectAll("g").remove();
            // graphContainer.attr("transform", "translate("+(-workSpaceWidth/4)+","+0+(")"));
            drawsamplebar(id);
        }
    }
}