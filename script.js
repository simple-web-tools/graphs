// Helper function to calculate line start and end points on the circle's edge
function getEdgePoints(source, target, sourceRadius, targetRadius) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const sourceX = source.x + (sourceRadius * dx) / distance;
    const sourceY = source.y + (sourceRadius * dy) / distance;

    const targetX = target.x - (targetRadius * dx) / distance;
    const targetY = target.y - (targetRadius * dy) / distance;

    return { sourceX, sourceY, targetX, targetY };
}

// Helper function to map normalized coordinates [-1, 1] to SVG pixel coordinates
function normalizeToPixel(x, y, svgWidth, svgHeight, centerX, centerY) {
    return {
        x: centerX + (x * svgWidth) / 2,
        y: centerY - (y * svgHeight) / 2 // Flip y-axis as SVG y increases downward
    };
}

// Function to create arrow marker for directed edges
function createArrowMarker(svg) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrow");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "5");
    marker.setAttribute("orient", "auto-start-reverse");
    marker.innerHTML = `
        <path d="M0,0 L10,5 L0,10 Z" class="arrow" />
    `;
    svg.appendChild(marker);
}

// Function to add nodes (circles and labels) to the SVG
function addNodes(svg, nodes, nodesGroup, svgWidth, svgHeight, centerX, centerY) {
    nodes.forEach(node => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodesGroup.appendChild(group);

        // Generate acronym from node text
        const acronym = node.id
            .split(/\s+/)
            .map(word => word[0].toUpperCase())
            .join('');

        // Map normalized coordinates to SVG pixel coordinates
        const { x, y } = normalizeToPixel(node.x, node.y, svgWidth, svgHeight, centerX, centerY);

        // Create text element for node
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("dy", "5");
        text.setAttribute("text-anchor", "middle");
        text.textContent = acronym;
        group.appendChild(text);

        // Measure text width and calculate required radius
        document.body.appendChild(svg); // Ensure SVG is in the DOM for getBBox()
        const textBBox = text.getBBox();
        const radius = Math.max(20, textBBox.width / 2 + 10); // Ensure a minimum radius of 20
        text.remove();

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", node.color || "lightblue"); // Default to light blue if no color is provided
        circle.setAttribute("class", "node");
        group.appendChild(circle);

        // Re-add text after circle to ensure it appears on top
        group.appendChild(text);
        node.radius = radius; // Store the radius for edge calculations
        node.acronym = acronym; // Store the acronym for legend
        node.pixelX = x;
        node.pixelY = y; // Store pixel positions for edge calculations
    });
}

// Update the addEdges function to find nodes by acronym
function addEdges(edgesGroup, edges, nodes) {
    edges.forEach(edge => {
        const sourceNode = nodes.find(node => node.acronym === edge.source);
        const targetNode = nodes.find(node => node.acronym === edge.target);

        if (!sourceNode || !targetNode) {
            console.warn(`Edge references invalid acronym: ${edge.source} -> ${edge.target}`);
            return;
        }

        const { sourceX, sourceY, targetX, targetY } = getEdgePoints(
            { x: sourceNode.pixelX, y: sourceNode.pixelY },
            { x: targetNode.pixelX, y: targetNode.pixelY },
            sourceNode.radius,
            targetNode.radius
        );

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", sourceX);
        line.setAttribute("y1", sourceY);
        line.setAttribute("x2", targetX);
        line.setAttribute("y2", targetY);
        line.setAttribute("class", "edge");

        // Add marker if the edge is directed
        if (edge.directed) {
            line.setAttribute("marker-end", "url(#arrow)");
        }

        edgesGroup.appendChild(line);
    });
}

// Function to create a legend for the acronyms
function addLegend(svg, nodes, svgWidth) {
    const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend.setAttribute("class", "legend");
    svg.appendChild(legend);

    let legendY = 20; // Initial Y position for the legend items
    let maxLegendWidth = 0;

    // Create a temporary text element to measure text width
    const tempText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    svg.appendChild(tempText);

    nodes.forEach(node => {
        tempText.textContent = `${node.acronym}: ${node.id}`;
        const textBBox = tempText.getBBox();
        maxLegendWidth = Math.max(maxLegendWidth, textBBox.width);
    });

    svg.removeChild(tempText); // Clean up temporary element

    const legendX = Math.min(svgWidth - maxLegendWidth - 20, svgWidth - 150);

    nodes.forEach(node => {
        const legendItem = document.createElementNS("http://www.w3.org/2000/svg", "text");
        legendItem.setAttribute("x", legendX); // Dynamically position legend on the right side
        legendItem.setAttribute("y", legendY);
        legendItem.setAttribute("class", "legend-item");
        legendItem.textContent = `${node.acronym}: ${node.id}`;
        legend.appendChild(legendItem);

        legendY += 20; // Adjust Y position for the next legend item
    });
}

// Main function to create the graph
function createGraph(nodes, edges) {
    const svg = document.getElementById("graph");
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    // Create groups for nodes and edges
    const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(edgesGroup);

    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(nodesGroup);

    // Create arrow marker for directed edges
    createArrowMarker(svg);

    // Add nodes and edges
    addNodes(svg, nodes, nodesGroup, svgWidth, svgHeight, centerX, centerY);
    addEdges(edgesGroup, edges, nodes);

    // Add legend
    addLegend(svg, nodes, svgWidth);
}
