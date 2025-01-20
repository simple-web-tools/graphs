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

function createGraph(nodes, edges) {
    const svg = document.getElementById("graph");

    // Create a group for edges (lines/arrows)
    const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(edgesGroup);

    // Create a group for nodes (circles)
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(nodesGroup);

    // Define an arrow marker for directed edges
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

    // Add the nodes (circles) to the nodes group
    nodes.forEach(node => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodesGroup.appendChild(group);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", node.x);
        text.setAttribute("y", node.y);
        text.setAttribute("dy", "5");
        text.setAttribute("text-anchor", "middle");
        text.textContent = node.id;
        group.appendChild(text);

        // Measure text width and calculate required radius
        document.body.appendChild(svg); // Ensure SVG is in the DOM for getBBox()
        const textBBox = text.getBBox();
        const radius = Math.max(20, textBBox.width / 2 + 10); // Ensure a minimum radius of 20
        text.remove();

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", node.x);
        circle.setAttribute("cy", node.y);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", node.color || "lightblue"); // Default to light blue if no color is provided
        circle.setAttribute("class", "node");
        group.appendChild(circle);

        // Re-add text after circle to ensure it appears on top
        group.appendChild(text);
        node.radius = radius; // Store the radius for edge calculations
    });

    // Add the edges (lines/arrows) to the edges group
    edges.forEach(edge => {
        const sourceNode = nodes[edge.source];
        const targetNode = nodes[edge.target];
        const { sourceX, sourceY, targetX, targetY } = getEdgePoints(
            sourceNode,
            targetNode,
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

