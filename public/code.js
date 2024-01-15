const cy = cytoscape({
    container: document.getElementById("graph"),
    style: [
        {
            "selector": "node[label]",
            "style": {
                "label": "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "color": "white"
            }
        },
      
        {
            "selector": "edge[label]",
            "style": {
                "label": "data(label)",
                "width": 3,
                "text-valign": "center",
                "text-halign": "center"
            }
        },

        {
            "selector": ".internal",
            "style": {
                "line-color": "cyan",
                "background-color": "cyan"
            }
        },
      
        {
            "selector": ".multiline-manual",
            "style": {
                "text-wrap": "wrap"
            }
        },
      
        {
            "selector": ".multiline-auto",
            "style": {
                "text-wrap": "wrap",
                "text-max-width": 80
            }
        },
      
        {
            "selector": ".autorotate",
            "style": {
                "edge-text-rotation": "autorotate"
            }
        },
      
        {
            "selector": ".background",
            "style": {
                "text-background-opacity": 1,
                "color": "#fff",
                "text-background-color": "#888",
                "text-background-shape": "roundrectangle",
                "text-border-color": "#000",
                "text-border-width": 1,
                "text-border-opacity": 1
            }
        },
      
        {
            "selector": ".outline",
            "style": {
                "color": "#fff",
                "text-outline-color": "#888",
                "text-outline-width": 3
            }
        }
      ],
    elements: [],
})

let nodeIdsVisited = []

async function doScrape(_url, depth, currentDepth = 0) {
    if (nodeIdsVisited.find(val => val == _url)) {
        let elems = cy.getElementById(_url.href)
        let elem = elems[0]
        if (elem) {
            let edges = elem.connectedEdges()
            await edges.map(async (edge) => {
                let node = edge.target()
                let id = node.id()
                await doScrape(id, depth, currentDepth + 1)
            })
        }
    };
    nodeIdsVisited.push(_url)
    console.log(nodeIdsVisited)
    console.log("Running fetch for depth: ", depth, " and current depth: ", currentDepth)
    fetch("/scrape?url=" + encodeURIComponent(_url), {cache: "no-store"}).then(async (res) => {
        if (res.status == 200) {
            let resData = await res.json()
            let graphData = {
                nodes: [],
                edges: []
            }

            graphData.nodes.push({
                data: {
                    id: resData.parent,
                    label: resData.parent
                }
            })

            resData.data.forEach(element => {
                let url = new URL(element, resData.parent)

                let isInternal = url.hostname == new URL(resData.parent).hostname

                graphData.nodes.push({
                    data: {
                        id: url.href,
                        label: url.href,
                        internal: isInternal
                    },
                    classes: [
                        (isInternal ? "internal" : "")
                    ]
                })

                graphData.edges.push({
                    data: {
                        id: resData.parent + ":" + url.href,
                        source: resData.parent,
                        target: url.href,
                        internal: isInternal
                    },
                    classes: [
                        (isInternal ? "internal" : "")
                    ]
                })

                if (currentDepth + 1 < depth) {
                    doScrape(url.href, depth, currentDepth + 1)
                }
            });

            cy.add(graphData)
        }
    })
}

function applyLayout() {
    cy.center()
    cy.layout({name:"circle",nodeDimensionsIncludeLabels:false,avoidOverlap:true,animate:false}).run()
}

document.getElementById("layout-button").onclick = event => {
    applyLayout()
}

document.getElementById("add-node-form").onsubmit = event => {
    event.preventDefault();
    let formData = new FormData(event.target)
    let formProps = Object.fromEntries(formData)
    
    doScrape(formProps.url, formProps.depth)
}

