function getHeatmap() {
    axios.get('http://127.0.0.1:5000/heatmap')
        .then(function (response) { // if success then update data
            console.log(response.data)
            probHeatmap = response.data.heatmap;
            drawHeatmap();
        });
}

function drawHeatmap(d) {
    let heatmapContainer = workContainer.select(".heatmap-container")
    let heatmapWidth = 0.2 * width;
    let heatmapHeight = 0.2 * height;
    setTimeout(() => {
        let heatmap = heatmapContainer.append("svg")
            .attr("id", "heatmap")
            .attr("width", 1.2 * heatmapWidth)
            .attr("height", 1.2 * heatmapHeight)
            .attr("fill", "white");
        let heatmap_x = d3.map(probHeatmap, d => d.place2).keys();
        let heatmap_y = d3.map(probHeatmap, d => d.place1).keys();
        //x axis
        let x = d3.scaleBand()
            .range([0, heatmapWidth])
            .domain(heatmap_x)
            .padding(0.05)
        heatmap.append("g")
            .attr("transform", `translate(${0.2 * heatmapWidth + 5},${0.85 * heatmapHeight + 3})`)
            .classed("heatmap-axis", true)
            .call(d3.axisBottom(x).tickSize(0).tickFormat(d => multiWordsFormat(d)))
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(90)")
            .select(".domamin").remove()
            .attr("stroke", "white")
            
        //y axis
        let y = d3.scaleBand()
            .range([0.85 * heatmapHeight, 0])
            .domain(heatmap_y)
            .padding(0.05)

        heatmap.append("g")
            .attr("transform", `translate(${0.2 * heatmapWidth},${0 * heatmapHeight})`)
            .classed("heatmap-axis", true)
            .call(d3.axisLeft(y).tickSize(0).tickFormat(d => multiWordsFormat(d)))
            .select(".domamin").remove()

        let heatmapColorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(probHeatmap, d => d.prob)])
        let heatmapTextColorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([-d3.max(probHeatmap, d => d.prob), 0])

        let tooltip = heatmapContainer
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip");

        let heatRect = heatmap.selectAll(".heatmap-rect")
            .data(probHeatmap, d => d.place1 + ":" + d.place2)
            .enter().append("g")
            .attr("class","heatmap-rect")
            .on("mouseover", heatmapMouseover)
            .on("mousemove", heatmapMousemove)
            .on("mouseleave", heatmapMouseleave)
            .on("dblclick", heatmapDblClick);

        heatRect.append("rect")
            .attr("x", d => x(d.place2) + 0.2 * heatmapWidth)
            .attr("y", d => y(d.place1) + 0 * heatmapHeight)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => heatmapColorScale(d.prob))
            .style("stroke-width", 3)
            .style("stroke", "none")
            .style("opacity", 0.9);

        
        heatRect.append("text")
            .text(d => d3.format(".2%")(d.prob))
            .attr("x", d => x(d.place2) + x.bandwidth()/2 + 0.2 * heatmapWidth)
            .attr("y", d => y(d.place1) + y.bandwidth()/2)
            .attr("class", "heatmap-text")
            .attr("fill", d => (d.prob < d3.max(probHeatmap, d => d.prob) * 0.75 && d.prob > d3.max(probHeatmap, d => d.prob) * 0.35) ? "black" : heatmapTextColorScale(-d.prob));

        function heatmapMouseover(d) {
            tooltip
                .style("opacity", 1)
            d3.select(this).select("rect")
                .style("stroke", "#154360")
                .style("opacity", 1)
        }
    
        function heatmapMousemove(d) {
            tooltip
                .html("The prob from " + d.place1 + " to " + d.place2 + " is: " + "<span style='color:darkblue'> "+ d3.format(".2%")(d.prob) + "</span>")
                .style("left", (d3.mouse(this)[0] + 10) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
    
        function heatmapMouseleave(d) {
            tooltip
                .style("opacity", 0)
            d3.select(this).select("rect")
                .style("stroke", "none")
                .style("opacity", 0.9)
        }
        
        function heatmapDblClick(d){
            //reset array
            packNodes.length = 0;
            packLinks.length = 0;
            //make array
            packNodes.push({"id": d.place1});
            packNodes.push({"id": d.place2})
            let linkdata = [{"source": d.place1, "target": d.place2, "type": "directed"}]
            packLinks.push(linkdata);
            setTimeout(() => {
                packedQuery();}, 150);
        }
    }, 300);
    isHeatmapActive = true;
}

getHeatmap();
