/*-----------------------------------------------------------------------------
FILE: /LinkedDataDev/GraphEditor/GraphEditor.js
DESC: Called from GraphEditor.html
REQ :
VIEW: http://localhost:8000/GraphEditor/GraphEditor.html
SRC :
IN  :
OUT :
DEV:
NOTE: Basing node addition on this: http://jsfiddle.net/Nivaldo/tUKh3/
      validate TTL file using RIOT: riot --validate "WhiteBoardTriples.ttl"
TODO: Task list:  https://kanbanflow.com/board/5d2eb8e3f370395a0ab2fff3c9cc65c6
      Discussion: https://kanbanflow.com/board/53c6d9a2c742c52254825aca6aabd85d
-----------------------------------------------------------------------------*/
"use strict";

// Initializations
let w          = 900,
    h          = 1100,
    nodeRadius = 40; // also used to distance arrow from node

let editActive = false;  // opacity flag for editing box

// Start and end nodes when constructing a link
//  count of edge and node Ids for later incrementing
let startNode   = null,
    endNode     = null,
    lastEdgeId  = null,
    lastNodeId  = null;

// mouse event settings  as per Kirsling. only mousedown_node in use as of 2017-12-23
let selected_node  = null,
    selected_edge  = null,
    mousedown_edge = null,
    mousedown_node = null,
    mouseup_node   = null;

// Read source data
d3.queue()
   .defer(d3.json, '/graphEditor/data/graph.json')
   .await(processData);

function processData (error, graph) {
    if(error) { console.log(error); }
    console.log(graph.nodesData[0]);
    console.log(graph.edgesData[0]);
    initializeGraph(graph);
;}


let svg=d3.select("#whiteboard")
          .append("svg")
          .attr("width", w)
          .attr("height", h);

// Global declare of items referecnced  in udpate()
let force     = null,
    edge      = null,
    edgepath  = null,
    edgelabel = null,
    circle    = null;

// Initialize the graph components ---------------------------------------------
function initializeGraph(graph){
    // Find the max Node and Edge ID values based on array length. Used when
    // creating IDs for new nodes (increment counter)
    lastEdgeId = graph.edgesData.length -1;
    lastNodeId = graph.nodesData.length -1;
    //console.log ("Max Id for Edges, Nodes: "+ lastEdgeId+ ","  +lastNodeId);

    // Setup the SVG elements that do not depend on data
    // Global Declare

    // Initialize D3 force layout
    force = d3.layout.force()
            .nodes(graph.nodesData)
            .links(graph.edgesData)
            .size([w, h])
            .on("tick", tick);

    // Arrow marker for end of edge
    svg.append('svg:defs').append('svg:marker')
        .attr({'id'          :'arrowhead',
               'viewBox'     : '-0 -5 10 10',
               'refX'        : nodeRadius+12,
               'refY'        : 0,
               'orient'      : 'auto',
               'markerWidth' : 10,
               'markerHeight': 10,
               'xoverflow'   :'visible'})
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#ccc')
        .attr('stroke','#ccc');

    edge = svg.append('svg:g').selectAll('path'),
    circle= svg.append('svg:g').selectAll('g');
    // edgepath = svg.append('svg:g').selectAll(".edgepath"),

/*
  edgepath = svg.append('svg:g').selectAll(".edgepath"),
  edgelabel = svg.append('svg:g').selectAll(".edgeLabelpath"),;
*/
    // Add node icon. Within initiallizeGraph() for access to "graph"data
    svg.append("svg:image")
        .attr({'x'         : 5,
               'y'         : 5,
               'width'     : 20,
               'height'    : 24,
               'xlink:href': '/GraphEditor/img/AddIcon.png'})
        .on('mouseover', function(d){
                // console.log("Add a node")
                let addIcon = d3.select(this)
                               .attr({
                                      'width' :25,
                                      'height':29
                                    });
        })
        .on('mouseout', function(d){
                let addIcon = d3.select(this)
                               .attr({
                                      'width' :20,
                                      'height':24
                                    });
        })
        .on('click', function(d){ addNode(graph);});

    // handler for createTTL buttons
    // Setup and display a buttons div for createTTL and saveState
    let buttonsDiv = d3.select("#buttons");

    buttonsDiv.append("button")
      .text("Create TTL")
      .on("click", function(d){ createTTL(graph);});

    buttonsDiv.append("button")
      .text("Save State")
      .on("click", function(d){ saveState(graph);});

    update(graph);  // Update graph for the first time
}  // end of initializeGraph

function tick() {

    // draw directed edges with proper padding from node centers
    edge.attr('d', function(d) {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
    });

    // THIS LINE DIFFERS FROM EG FN-EdgePathLabels.js
    circle.attr("transform", function(d) {
      //console.log(d.x);
      return "translate(" + d.x + "," + d.y + ")"; 
    });

    edgepath.attr('d', function(d) {
        var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
        return path
    });

    edgelabel.attr('transform',function(d,i){
        if (d.target.x<d.source.x){
            let bbox = this.getBBox();
            let rx = bbox.x+bbox.width/2;
            let ry = bbox.y+bbox.height/2;
            return 'rotate(180 '+rx+' '+ry+')';
        } else {
            return 'rotate(0)';
        }
    });

};  // End on tick

function update(graph){

    //---- EDGES update ----------------------------------------------------------
    // Add new links ..... TO BE ADDED
    edge = edge.data(graph.edgesData);

    edge.enter()
        .append('svg:path')
        .attr("id", function(d,i){return 'edge'+i})
        .attr('marker-end', 'url(#arrowhead)')
        //  .attr('class', 'edge')
        .style("stroke", "#ccc");

//    edge.append("prefixText")
//      .attr("id", function(d, i) {return("prefixText"+i) ; });

    edge.exit().remove();

    edgepath = svg.selectAll(".edgepath")
                  .data(graph.edgesData)
                  .enter()
                  .append('path')
                  .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
                         'class':'edgepath',
                         'fill-opacity':0,
                         'stroke-opacity':0,
                         'id':function(d,i) {return 'edgepath'+i}})
                  .style("pointer-events", "none")
                  ;

    // dx : the starting distance of the label from the source node

    // edgelabel =
    edgelabel = svg.selectAll(".edgelabel")
                    .data(graph.edgesData)
                    .enter()
                    .append('text')
                    .attr({'class':'edgelabel',
                        //
                           'dx':80,
                           'dy':-1  // change to 5 to put inline with edge
                          })
                    .append('textPath')
                    .attr('xlink:href',function(d,i) {return '#edgepath'+i})
                    .attr('id', function(d,i){return 'edgelabel'+i})
                    .text(function(d,i){return d.label})
                    //  .text("foo")
                    //---- Double click edge to edit ---------------------------------------------
                    .on("dblclick", function(d, i){
                       edit(d,i, "edge");
                     });

    // NODES update --------------------------------------------------------------

    // Add new nodes.
    // node circles are WITHIN the <g> , so start with <g> and append the circle
    //TW can d.id be deleted? ID is set as attr later.
    circle = circle.data(graph.nodesData, function(d) { return d.id; });

    circle.selectAll('circle');

    // add new nodeSelection
    let g = circle.enter().append('svg:g');

    g.append("svg:circle")
        .attr("class", "node")
        .attr("r", nodeRadius)
        .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
        .attr("class", function(d,i){
            if (d.type == "STRING"){ return "string";}
            else if (d.type == "URI"){ return "uri"; }
            else if (d.type == "INT"){ return "int"; }
            else if (d.type == "URIONT"){ return "uriont"; }
            else {return "unspec";}
        })
        //---- Double click node to edit -----------------------------------------
        // For new nodes, this should allow the entry of label, type, and prefix...
        .on("dblclick", function(d, i){
            edit(d,i, "node");
        })
        .on("click", function(d, i){
            if (d3.event.shiftKey)  {
                // No links allowed FROM INT/STRING literals
                if(d.type === "STRING" || d.type === "INT"){
                  window.confirm("Links from " + d.type + " nodes are not allowed.");
                  return;
                }
                d.pulse = !d.pulse;
                if (d.pulse) {
                    var selected_circle = d3.select(this);
                    console.log("SELECTED FOR LINK: ", d3.select(this))
                    pulsate(selected_circle);
                }
                if (startNode===null){
                  startNode= i;
                  console.log("Setting Start Node as node ID: " + startNode);
                }
                // Only set endNode if it is not the same as the startNode.
                else if (startNode !== null && startNode !== i){
                  endNode= i;
                  console.log("Start Node: " + startNode + " End Node: " + endNode);
                  addEdge(graph);
                  // Turn off pulsating after edge created.
                  d.pulse = false;
                }
           }
        }) // end mouse click
        .on('mouseover', function(d){
            //DEBUG  console.log("NODE MOUSEOVER");
            let nodeSelection = d3.select(this).attr({'r':nodeRadius+5,});
        })
        //Mouseout Node  - bring node back to full colour
        .on('mouseout', function(d){
            //  let nodeSelection= d3.select(this).style({opacity:'1.0',})
            let nodeSelection = d3.select(this).attr({'r':nodeRadius});
        }) // end mouseout
        ;

    // Add nodeText ID to each node. Adding the actual text label here with the
    //.text  causes problems with intial nodes.
    g.append("svg:text") //232
    //d3.selectAll("circle")
        .attr({
              'class':       function(d,i){return 'nodeText'},
              'id':          function(d, i) {return("nodeText"+i) ; },
              'text-anchor': 'middle',
              'class':        'nodeLabel'
            })
        .text(function(d,i) { return d.label; }) //TW: Problem here AFTER a new node is added.
        ;

    // Create unique IDS for the PREFIX and TYPE text for updating from the edit box
    //  Required for BOTH nodes (prefixText, typeText) and edges (prefixText)
    circle.append("prefixText")
        .attr("id", function(d, i) {return("prefixText"+i) ; });
    circle.append("typeText")
        .attr("id", function(d, i) {return("typeText"+i) ; });
    circle.call(force.drag);
    // Exit any old nodes.
    circle.exit().remove();

    // Start the force layout.
    force.start();
}  // end of update(graph)



//-----------------------------------------------------------------------------
//---- Additional Functions --------------------------------------------------------------

// edit()
//   Edit either a "node" or an "edge"
//   Currently only works for a node
//
function edit(d, i, source){
    console.log("You clicked a  " +source)
    console.log("     edit: " + source + " " + d.label);
    //console.log("clicked");

    // If another node or edge was already selected (edit window already present,
    //   then made another dbl click, you must purge the existing info to allow
    //   display of info from the second dbl clicked item to replace the first.
    if (editActive == true) {
        // clicked a node or edge while previous edit div displayed
        // d3.selectAll("input").remove();
        d3.select("#edit").selectAll("*").remove();
        d3.select("#edit").style("opacity", 0);
    }

    let self = this; //Necessary?
    editActive = true;
    d3.select("#edit").style("opacity", 1);  // Display edit div
    d3.select("#buttons").style("opacity", 0);  // Display edit div
    let div = d3.select("#edit");

    div.append("p")
        .text(function() { return("Edit " + source) });  // Selet div for appending

    // LABEL  - both nodes and edge
    let labelText = div.append("p")
                        .text("Label: ");
    let labelInput = labelText.append("input")
                        .attr({
                          'size': '15',
                          'type': 'text',
                          'value': d.label
                        });

    // PREFIX - both nodes and edges
    let prefixText = div.append("p")
                        .text("Prefix: ");
    let prefixData = ["ldw","rdf", "rdfs", "sdtmterm"]
    let prefixInput = prefixText.append("select")
                          .attr('class','select');
    let prefixSelect = prefixInput.selectAll('option')
                          .data(prefixData).enter()
                          .append('option')
                          .text(function (d) { return d; })
                          .property("selected", function(g){ return g === d.prefix; });

    //TYPE - NODES only
    let typeText   = ""
    let typeInput  = ""
    let typeSelect = ""

    if(source=="node"){
        typeText     = div.append("p")
                            .text("Type: ");
        let typeData = ["URI","STRING", "INT"]
        typeInput    = typeText.append("select")
                            .attr('class','select')
        typeSelect   = typeInput.selectAll('option')
                            .data(typeData).enter()
                            .append('option')
                            .text(function (d) { return d; })
                            .property("selected", function(g){ return g === d.type; });
    }

    //console.log("labelInput: " +labelInput.node().value);
    //---- UPDATE BUTTON -----------------------------------------------------//
    let button =  div.append("button")
                      .text("Update/Hide")
                      .on("click", function() {
                          if(source=="node"){
                              console.log("Update on Node: "+ i)
                              // Label
                              d3.select("#nodeText" + i)
                                .text(function(d) {return (d.label = labelInput.node().value); });
                              // Prefix
                              d3.select("#prefixText" + i)
                                .text(function(d) {return (d.prefix = prefixInput.node().value); });
                              // Type
                              d3.select("#typeText" + i)
                                .text(function(d) {return (d.type = typeInput.node().value); });
                              // Node Class
                              // Change class of circle to match TYPE so the node display will change
                              //   according to the node type
                              d3.select("#circle" + i)
                                .attr("class", "")  // Remove all classes (node, uri, string, int)
                                .attr("class", "node") // Add the node class back in.
                                .classed(typeInput.node().value.toLowerCase(), true); // add type class
                          } // end of node UPDATE
                          if(source=="edge"){
                            console.log("Updating Edge")

                            d3.select("#edgelabel" + i)
                              .text(function(d)  {return (d.label = labelInput.node().value); });

                            d3.select("#prefixText" + i)
                              .text(function(d) {return (d.prefix = prefixInput.node().value); });
                          } // end of Edge update
                          // Clean up the edit window after click of Hide/Update
                          d3.select("#edit").selectAll("*").remove();
                          d3.select("#edit").style("opacity", 0);
                          editActive = false;  // turn off the edit area
                          d3.select("#buttons").style("opacity", 1);  // redisplay buttons
                      }) // end of click on update button

    let delButton = div.append("button")
                        .text("Delete")
                        .on("click", function() {
                            if(source=="node"){
                                // select node
                                mousedown_node = d; // Captures the node Initialized to null as per Kirsling
                                selected_node = mousedown_node ;  // Playing here. Need to restructure?
                                console.log("D: ", d)//TW d is currently UNDEFINED during a delete!
                                //let foo = indexOf(node());
                                console.log("So you want to DELETE a node!")
                                console.log("Selected_node: " , selected_node)
                                // must delete the node and any edge attached to it (ingoing and outgoing)
                                graph.nodesData.splice(graph.nodesData.indexOf(selected_node), 1); // Delete selected node from array
                                editActive = false;  // turn off the edt area
                                update(graph);
                            }
                            if(source=="edge"){
                                console.log("So you want to DELETE an Edge!")
                                mousedown_edge = d; // Captures the edge.
                                selected_edge = mousedown_edge ;  //Playing here. Restructure?
                                console.log("Selected_edge: " , selected_edge)
                                graph.edgesData.splice(graph.edgesData.indexOf(selected_edge), 1); // Delete selected edge from array
                                editActive = false;  // turn off the edit area
                                d3.select("#buttons").style("opacity", 1);  // redisplay buttons
                                update(graph);
                            }
                        });
}

function addNode(graph){
    console.log("A node you wish to add!")
    let newNode = {
        id: ++lastNodeId,
        label: 'Newbie',
        prefix: 'new',
        type: 'UNSPEC',
        x:200, y:200,
        fixed:true
    };
    let n = graph.nodesData.push(newNode);
    console.log(newNode)
    console.log(graph.nodesData)
    update(graph);  // Adds node to the SVG
}
function addEdge(graph){
    console.log("A LINK you wish to add!")

    let newEdge = {
        id: ++lastEdgeId,
        source: graph.nodesData[startNode],
        target: graph.nodesData[endNode],
        label: 'NEW',
        prefix: 'ldw'
    };
    let n = graph.edgesData.push(newEdge);
    // Reset flags
    startNode = null,
    endNode = null;
    // RESET the flag for pulsing here!!
    update(graph);  // Adds node to the SVG
}

// Pulse a circle selected for linking
function pulsate(selection) {
    recursive_transitions();

    function recursive_transitions() {
        if (selection.data()[0].pulse) {
            selection.transition()
                .duration(500) // was 400
                .attr("stroke-width", 2)
                .attr("r", nodeRadius)
                //.ease('sin-in')
                .ease('sin')
                .transition()
                .duration(500) // was 800
                .attr('stroke-width', 3)
                .attr("r", nodeRadius + 10)
                //.ease('bounce-in')
                .ease('sin')
                .each("end", recursive_transitions);
        } else {
            // transition back to normal
            selection.transition()
                .duration(500)
                .attr("r", nodeRadius + 10)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "1, 0");
        }
    }
}

//HK: Code as per Kirsling. Not yet in use. Move to fnt area of code.
function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_edge = null;
}

//HK: Code as per Kirsling. Not yet in use. Move to fnt area of code.
function createTTL(jsonData) {
    //console.log("Now Create TTL");
    console.log(jsonData);
    //TW re-enable    alert("You will now create the TTL file. Click OK to confirm.");

    // Set the prefixes
    var writer = N3.Writer({ prefixes: { ldw: 'http://example.org/LDWorkshop#',
                                         rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                                         rdfs:'http://www.w3.org/2000/01/rdf-schema#',
                                         sdtmterm:'https://raw.githubusercontent.com/phuse-org/CTDasRDF/master/data/rdf/sdtm-terminology.rdf#',
                                         xsd:'http://www.w3.org/2001/XMLSchema#'
                                        }
                          });

    // loop through the edges to create triples
    //   Code excludes unattached nodes. But if you have unattached nodes, you
    // should re-evaluate your life choices... (ok, will code for them later..)
    for(var i = 0; i < jsonData.edgesData.length; i++) {
        let raw       = jsonData.edgesData[i];  // create object for shorter references
        let subject   = raw.source.prefix + ":" + raw.source.label;
        let predicate = raw.prefix + ":" + raw.label;
        let object    = null;
        //console.log("S-P: " + subject + " --" + predicate)

        // Creae Object based on their type
        // URI and URIONT are treated the same
        if (raw.target.type ==='URI' || raw.target.type ==='URIONT') {
            object = raw.target.prefix + ":" + raw.target.label;
        } else {
            // Literal values are enquoted with use of '"'
            if (raw.target.type =='INT') {
                object = '"' + raw.target.label + '"^^xsd:integer' ;
            } else if (raw.target.type =='STRING') {
                object = '"' + raw.target.label + '"^^xsd:string' ;
            }
          // Add some logic here to throw error if Subject, Predicate, Object undefined
        } // end of Object creation
        console.log("TRIPLE: " + subject + " --" + predicate + "--> " + object);
        writer.addTriple(subject, predicate, object); // Add triple for each edge
    } // end looping over edges
    // Write out to file
    writer.end(function (error, result) {
        console.log(result);
        var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "WhiteBoardTriples.ttl");
    });
} // end createTTL()

function saveState(graph){
    alert("This function will save the graph. Method is TBD!");
}
