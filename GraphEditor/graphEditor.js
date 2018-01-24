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

// Initializations.
// nodeWidth/Height are the starting defaults for these values.
//   nodeWidth may adjust with content in later versions.
let w          = 900,
    h          = 1500,
    nodeWidth  = 150,
    nodeHeight = 30;
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

let svg=d3.select("#whiteboard")
          .append("svg")
          .attr("width", w)
          .attr("height", h);

//Legend creation
//TODO : Change to creation using a loop over the array of values in the legend.
let legendDiv = d3.select("#legend").append("svg");
let legendNodeHeight = 15,
legendNodeWidth  = 20;
// IRI
legendDiv.append("rect")
    .attr("class", "node iri")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 0);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 15)
    .text("IRI (links to/from)");
//New (unspecified)
legendDiv.append("rect")
    .attr("class", "node unspec")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 25);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 40)
    .text("New Node: edit to set properties");

// Subject Link
 legendDiv.append("rect")
    .attr("class", "node iri subjectLink")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 50);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 65)
    .text("Source node for new link");
// String
legendDiv.append("rect")
    .attr("class", "node string")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 75);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 90)
    .text("String: No outgoing links!")
// Integer
legendDiv.append("rect")
    .attr("class", "node int")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 100);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 115)
    .text("Integer: No outgoing links!")
// Ontology IRI
legendDiv.append("rect")
    .attr("class", "node iriont")
    .attr("width", legendNodeWidth)
    .attr("height", legendNodeHeight)
    .attr("x", 5)
    .attr("y", 125);
legendDiv.append("text")
    .attr("dx", 35)
    .attr("dy", 140)
    .text("External Ontology IRI");

//TODO: These declarations should be removed when code is changed to have them
//  within update() as edge_upate, edgepath_update etc., folling the model of
//  node_update
// MOVE edge and rect  declares from here to within funt
let force     = null;
  //DEL  edge      = null, //moving to update()
//    edgepath  = null,
//    edgelabel = null;

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



// Initialize the graph components ---------------------------------------------
function initializeGraph(graph){
    // Find the max Node and Edge ID values based on array length. Used when
    // creating IDs for new nodes (increment counter)
    lastEdgeId = graph.edgesData.length -1;
    lastNodeId = graph.nodesData.length -1;
    //console.log ("Max Id for Edges, Nodes: "+ lastEdgeId+ ","  +lastNodeId);

    // Initialize D3 force layout
    force = d3.layout.force()
            .nodes(graph.nodesData)
            .links(graph.edgesData)
            .size([w, h])
            .on("tick", tick);
    // Arrow marker for end of edge
    svg.append('defs').append('marker')
        .attr({'id'          :'arrowhead',
               'viewBox'     : '-0 -5 10 10',
               'refX'        : 60,
               'refY'        : 0,
               'orient'      : 'auto',
               'markerWidth' : 5,
               'markerHeight': 5,
               'xoverflow'   :'visible'})
        .append('path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#ccc')
        .attr('stroke','#ccc');

    // Create parent group for links, nodes and set their order so the nodes always
    //   appear on top of the links
    svg.append("g").attr("id", "links");
    svg.append('g').attr("id", "edgepaths");
    svg.append('g').attr("id", "edgelabels");
    svg.append("g").attr("id", "nodes");

    // Add node icon. Within initiallizeGraph() for access to "graph"data
    svg.append("image")
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

function update(graph){
    //---- LINKS ---------------------------------------------------------------
    // link data. Use of force.links to match FN D3 construct
    // let link_update = svg.selectAll('.link').data(
    // #links used for layer order (under nodes)

    // let link_update = svg.select("#links").selectAll('.link').data(
    let link_update = svg.selectAll('.link').data(
         force.links(),
         function(d) {
             return d.id;
           // return d.source.id + "-" + d.target.id;
         }
    );
    console.log("RUNS TO HERE");
    link_update.enter()
        .append("path")  // differs from code example
        .attr("class", "link")
        .attr("id", function(d,i){return 'edge'+ d.id}) // d.soure.id + "-" + d.target.id
        .attr('marker-end', 'url(#arrowhead)')
        .style("stroke", "#ccc");
        ;
    link_update.append("prefixText")
          .attr("id", function(d, i) {
            return("prefixText"+d.id) ;
          });
    link_update.exit().remove();

/*TW TO DELETE after using as example for how changes were made.
//edge = svg.append('g').selectAll('path');
//    edge = edge.data(graph.edgesData);
//    edge.enter()
//        .append('path')
//        .attr("id", function(d,i){return 'edge'+d.id})
//        .attr('marker-end', 'url(#arrowhead)')
        //  .attr('class', 'edge')
//        .style("stroke", "#ccc");

//    edge.append("prefixText")
//      .attr("id", function(d, i) {return("prefixText"+d.id) ; });
//    edge.exit().remove();
*/

    // Path for the Edge Label (link) Text
    // let edgepath_update = svg.select("#edgepaths").selectAll('.edgepath').data(
    let edgepath_update = svg.selectAll('.edgepath').data(
      force.links(),
      //build the edge path id as "ep"+sourceid+"-"+targetid
      function(d){
        return d.id;
        //return ("ep" + d.source.id + "-" + d.target.id);
      }
    );

    edgepath_update.enter()
        .append('path')
        .attr('d', function(d,i) {
            console.log("ERROR HERE for d.source.x etc.");
            console.log("The numbers: "+ d.source.x + " " + d.source.y + " " + d.target.x + " " + d.target.y);
            return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y})
        .attr({'class':'edgepath',
            'fill-opacity':0,
            'stroke-opacity':0,
            'id':function(d,i) {
              return 'edgepath'+d.id}}
              //return ("ep" + d.source.id + "-" + d.target.id);}}

          )
        .style("pointer-events", "none");

    edgepath_update.exit().remove();

    // Edge Label (link) text --------------------------------------------------
    // let edgelabel_update = svg.select("#edgelabels").selectAll('.edgelabel').data(
    let edgelabel_update = svg.selectAll('.edgelabel').data(
      force.links(),
      //build the edge label id as "el"+sourceid+"-"+targetid
      function(d){

        return d.id;
        //return ("el" + d.source.id + "-" + d.target.id);
      }
    );

    edgelabel_update.enter()
        .append('text')
            .attr("id", function(d,i){
                return "edgetext" + d.id;
            })
            //.attr("class", "edgelabel")
            .attr("class", function(d,i){
                if (d.prefix == "schema" || d.prefix == "ncit"){ return "edgelabel extont";}
                else if (d.prefix == "rdf" || d.prefix == "rdfs"){ return "edgelabel rdf";}
                else {return "edgelabel unspec";}
            })
            .attr("dy", -1) // place above line. 5 for inline
            .append('textPath')
            .style("text-anchor", "middle")
            .attr("startOffset", "50%")
            .attr('xlink:href', function(d,i) {

               return '#edgepath'+i;
              //TW return ("ep" + d.source.id + "-" + d.target.id);
            })
            .attr('id', function(d,i){
              return "edgelabel" + i
              //return 'edgelabel'+i
              //TW return ("el" + d.source.id + "-" + d.target.id);
            })
            //.text("FOO")
            .text(function(d,i){return d.prefix+":"+d.label})
            //---- Double click edgelabel to edit ----------------------
            .on("dblclick", function(d, i){
                edit(d,i, "edge", graph);
            });
   edgelabel_update.exit().remove();

    // NODES -------------------------------------------------------------------
   // Data for nodes
   // THE PROBLEM HERE IS in the NODE ID.
   //#nodes used for layer order.
    // let node_update = svg.select("#nodes").selectAll('.node').data(
    let node_update = svg.selectAll('.node').data(
        force.nodes(),
        function(d) {return d.id;}
    );

    // Append the rect shape to the node data
    node_update.enter().append("rect")
        .attr("width", function(d){ return nodeWidth; })
        .attr("height", nodeHeight)
        .attr("rx", 5) // Round edges
        .attr("ry", 5)
        .attr("id", function(d, i) {return("rect"+d.id) ; })  // ID used to update class
        .attr("class", function(d,i){
            if (d.type == "STRING"){ return "node string";}
            else if (d.type == "INT"){ return "node int"; }
            // Other external ontologies would need to be added here along with schema
            else if (d.prefix == "schema"   ||
                    d.prefix  == "ncit"     ||
                     d.prefix == "sdtmterm" ||
                     d.prefix == "cto"){ return "node iriont"; }
            else if (d.prefix == "eg"){ return "node iri"; }
            else {return "node unspec";}
        })
        .call(force.drag)
        //---- Double click node to edit -----------------------------------------
        // For new nodes, this should allow the entry of label, type, and prefix...
        .on("dblclick", function(d, i){
            edit(d,i, "node", graph);
        })
        .on("click", function(d, i){
            if (d3.event.shiftKey)  {
                // In this case you are trying to START a link from a literal,
                // which is not allowed. STRING/INT not allowed as startnode.
                if(startNode === null && (d.type === "STRING" || d.type === "INT")){
                    console.log("STart node is: " + startNode);
                    window.confirm("Links from " + d.type + " nodes are not allowed.");
                    return;
                }
                if (startNode===d.id){
                    console.log("Deselecting link: ", startNode);
                    let selected_rect = d3.select(this);
                    selected_rect.classed("subjectLink", false); // add type class
                    startNode= null;
                    return;
                }
                if (startNode===null){
                    let selected_rect = d3.select(this);
                    console.log("SELECTED FOR LINK: ", d3.select(this))
                    selected_rect.classed("subjectLink", true); // add type class
                    startNode= i;
                    console.log("Setting Start Node as node ID: " + startNode);
                }
                // Only set endNode if it is not the same as the startNode.
                else if (startNode !== null && startNode !== i){
                    endNode= i;
                    console.log("Start Node: " + startNode + " End Node: " + endNode);
                    addEdge(graph);
                    d3.selectAll(".subjectLink")
                        .classed("subjectLink", false); // add type class
                }
           }
        }) // end mouse click
        .on('mouseover', function(d){
            //DEBUG  console.log("NODE MOUSEOVER");
            let nodeSelection = d3.select(this).attr({
              'width':nodeWidth+5,
              'height':nodeHeight+5
            });

            console.log("Node Mouseover is happening");
            // Add tooltip here

        })
        //Mouseout Node  - bring node back to full colour
        .on('mouseout', function(d){
            //  let nodeSelection= d3.select(this).style({opacity:'1.0',})
            let nodeSelection = d3.select(this).attr({
              'width':nodeWidth,
              'height': nodeHeight
            });
            //TODO: Add removal of tooltip

        }); // end mouseout

    // Remove nodes
    // var nodeExit = svg.selectAll(".node").data(
    //     force.nodes()
    //  ).exit().remove();
    node_update.exit().remove();

    // Data for node text
    let nodeText_update = svg.selectAll(".nodeText").data(
        force.nodes(),
        function(d){ return d.id;}
    );

    // Add id (nodeTextn) and the text
    nodeText_update.enter().append("text")
        .attr({
            // 'id':    function(d, i) {return("nodeText"+i) ; },
            // ID linkes to editing window
            'id':    function(d, i) {return("nodeText"+d.id) ; },
            'class': 'nodeText'
        })
        .text(function(d,i) {
            //No prefix for INT, STRING
            if (d.type ==='INT' || d.type ==='STRING') { return d.label; }
            // Prefix for all other types
            else{ return d.prefix+":"+d.label; }
        });

     // Remove nodeText
     // var nodeTextExit = svg.selectAll(".nodeText").data(
     //     force.nodes()
     //  ).exit().remove();
     nodeText_update.exit().remove();

     // Start the force layout.
    force.start();  // Restart the force
}  // end of update(graph)

function tick() {
    svg.selectAll(".link")
        .attr('d', function(d) {
            let xposSource = d.source.x + nodeWidth/2,
                xposTarget = d.target.x + nodeWidth/2,
                yposSource = d.source.y + nodeHeight/2,
                yposTarget = d.target.y + nodeHeight/2;
            return 'M' + xposSource + ',' + yposSource + 'L' + xposTarget + ',' + yposTarget;
        });

/*
    edge.attr('d', function(d) {
        let xposSource = d.source.x + nodeWidth/2,
            xposTarget = d.target.x + nodeWidth/2,
            yposSource = d.source.y + nodeHeight/2,
            yposTarget = d.target.y + nodeHeight/2;
        return 'M' + xposSource + ',' + yposSource + 'L' + xposTarget + ',' + yposTarget;
    });
*/
   svg.selectAll(".edgepath")
    //DEL edgepath.attr('d', function(d) {
    .attr('d', function(d) {
        //Adjust for rectangle shape
        let xposSource = d.source.x + nodeWidth/2,
            xposTarget = d.target.x + nodeWidth/2,
            yposSource = d.source.y + nodeHeight/2,
            yposTarget = d.target.y + nodeHeight/2;

        let path='M '+ xposSource + ' ' + yposSource+' L '+ xposTarget + ' ' + yposTarget;

        // let path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
        return path;
    });

    svg.selectAll(".edgelabel")
    //DEL  edgelabel.attr('transform',function(d,i){
    .attr('transform',function(d,i){
        if (d.target.x<d.source.x){
            let bbox = this.getBBox();
            let rx = bbox.x+bbox.width/2;
            let ry = bbox.y+bbox.height/2;
            return 'rotate(180 '+rx+' '+ry+')';
        }
        else { return 'rotate(0)'; }
    });

    // NODES
    // Prevent node movement off the editing canvas by adj. each d.x, d.y
    svg.selectAll(".node").attr("transform", function(d) {
        if (d.x > w ) {d.x = w-nodeWidth;}  // right
        if (d.x < -40 ) {d.x = nodeWidth;}  // left
        if (d.y < 0 ) {d.y = nodeWidth;}    // top
        if (d.y > h ) {d.y = h-nodeWidth;}  // bottom
        return "translate(" + d.x + "," + d.y + ")";
    });

    // Node Text label
    svg.selectAll(".nodeText")
        .attr("x", function(d){ return d.x+5;})
        .attr("y", function(d){ return d.y+17;});
};  // End tick

//------------------------------------------------------------------------------
//---- Additional Functions ----------------------------------------------------

//   Edit either a "node" or an "edge"
function edit(d, i, source, graph){
    // upsource used in editor display to match exercises text
    let upSource = source.charAt(0).toUpperCase() + source.slice(1);

    console.log("You clicked a  " +source)
    console.log("     edit: " + source + " " + d.prefix + ":" + d.label);

    // If another node or edge was already selected (edit window already present,
    //   then made another dbl click, you must purge the existing info to allow
    //   display of info from the second dbl clicked item to replace the first.
    if (editActive === true) {
        // clicked a node or edge while previous edit div displayed
        // d3.selectAll("input").remove();
        d3.select("#edit").selectAll("*").remove();
        d3.select("#edit").style("opacity", 0);
    }
    // If a node has been selected (shift+click) then it will be deselected
    if (startNode != null) {
        console.log("I'll deselect the selected node for you:"+startNode)
        startNode = null
        d3.selectAll(".subjectLink")
            .classed("subjectLink", false);
    }

    let self = this; //Necessary?
    editActive = true;
    d3.select("#edit").style("opacity", 1);  // Display edit div
    d3.select("#buttons").style("opacity", 0);  // Display edit div
    let div = d3.select("#edit");

    div.append("p")
        .text(function() {
          // Use 'Link values' for edges to match exercises (for comprehension)
          if (source=="edge"){return("Link values"); }
          else {return (upSource + " values");}
        });  // Selet div for appending

    // PREFIX - both nodes and edges
    let prefixText = div.append("p")
                        .text("Prefix: ");
    let prefixData = ["eg","ncit","rdf", "rdfs", "schema", "sdtmterm" ]
    let prefixInput = prefixText.append("select")
                        .attr('class','select');
    let prefixSelect = prefixInput.selectAll('option')
                        .data(prefixData).enter()
                        .append('option')
                        .text(function (d) { return d; })
                        .property("selected", function(g){ return g === d.prefix; });

    // LABEL  - both nodes and edge
    let labelText = div.append("p")
                        .text("Label: ");
    let labelInput = labelText.append("input")
                        .attr({
                          'size': '15',
                          'type': 'text',
                          'value': d.label
                        });

    //TYPE - NODES only
    let typeText   = ""
    let typeInput  = ""
    let typeSelect = ""

    if(source=="node"){
        typeText     = div.append("p")
                            .text("Type: ");
        let typeData = ["IRI","STRING", "INT"]
        typeInput    = typeText.append("select")
                            .attr('class','select')
        typeSelect   = typeInput.selectAll('option')
                            .data(typeData).enter()
                            .append('option')
                            .text(function (d) { return d; })
                            .property("selected", function(g){ return g === d.type; });
    }

    //---- UPDATE BUTTON -------------------------------------------------------
    let button =  div.append("button")
                      .text("Update/Hide")
                      .on("click", function() {
                          console.log("Prefix is: " + d.prefix);

                          //---- NODE ------------------------------------------
                          if(source=="node"){
                              console.log("Update on Node: "+ i)
                              // Label
                              d3.select("#nodeText" + i)
                                // IRI uppercase. INT and STRING can be mixed case.
                                .text(function(d) {
                                    if (typeInput.node().value==="IRI"){//var nodeText =
                                      //return (d.label = labelInput.node().value.toUpperCase());
                                      return prefixInput.node().value + ":" + labelInput.node().value;

                                    }
                                    else{
                                      return (d.label = labelInput.node().value);
                                    }

                                   });
                              // Type
                              d3.select("#typeText" + i)
                                .text(function(d) {return (d.type = typeInput.node().value); });
                              // Node Class
                              // Change class of rect to match TYPE so the node display will change
                              //   according to the node type
                              d3.select("#rect" + i)
                                .attr("class", "")  // Remove all classes (node, iri, string, int)
                                .attr("class", "node") // Add the node class back in.
                                .classed(typeInput.node().value.toLowerCase(), true); // add type class

                              d.label=labelInput.node().value;
                              d.prefix = prefixInput.node().value;
                              d.type = typeInput.node().value;

                          } // end of node UPDATE

                          //---- EDGE -----------------------------------------
                          if(source=="edge"){
                            console.log("Updating Edge")
                            d3.select("#edgetext" + i)
                              .attr("class", "")  // Remove all classes (node, iri, string, int)
                              .attr("class", "edgelabel") // Add the node class back in.
                              .classed(prefixInput.node().value.toLowerCase(), true); // add prefix style class

                            // edge labels forced to lowercase for exercises.
                            d3.select("#edgelabel" + i)
                              .text(function(d)  {
                                // 1. Values for the data array
                                d.prefix = prefixInput.node().value;
                                d.label=labelInput.node().value;
                                // 2. prefix + label to display in the SVG
                                return prefixInput.node().value + ":" + labelInput.node().value;
                              })

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
                           //console.log("Graph is: "+graph);
                            if(source=="node"){
                                // select node
                                mousedown_node = d; // Captures the node Initialized to null as per Kirsling
                                selected_node = mousedown_node ;
                                deleteNode(graph, selected_node);
                            }
                            if(source=="edge"){
                                console.log("So you want to DELETE an Edge!")
                                mousedown_edge = d; // Captures the edge.
                                selected_edge = mousedown_edge ;  //Playing here. Restructure?
                                console.log("Selected_edge: " , selected_edge)
                                graph.edgesData.splice(graph.edgesData.indexOf(selected_edge), 1); // Delete selected edge from array
                                editActive = false;  // turn off the edit area
                                d3.select("#buttons").style("opacity", 1);  // redisplay buttons
                                force.start();
                                update(graph);

                            }
                        });
}

function addNode(graph){
    console.log("A node you wish to add!")
    let newNode = {
        id: ++lastNodeId,
        label: 'NEW',
        prefix: 'new',
        type: 'UNSPEC',
        x:200,
        y:200,
        fixed:true
    };
    let n = graph.nodesData.push(newNode);
    console.log(newNode)
    console.log(graph.nodesData)
    update(graph);  // Adds node to the SVG
}

function deleteNode(graph, selected_node){
    console.log("A node you will delete!")
    console.log("id number: ", )
    console.log("Selected_node: " , selected_node)
    console.log("Selected_node Label: " , selected_node.label)

    //TODO: Add deletion of any edge attached to the selected node
    graph.nodesData.splice(graph.nodesData.indexOf(selected_node), 1); // Delete selected node from array
    console.log("Nodes data post-deletion:");
    console.log(graph.nodesData);
    // Remove the text in the SVG that is associated with this node. [TW KLUDGE]
    d3.select("#nodeText" + selected_node.id).remove();
    d3.select("#buttons").style("opacity", 1);  // redisplay buttons
    update(graph);
}

function addEdge(graph){
    console.log("A LINK you wish to add!")

    let newEdge = {
        id: ++lastEdgeId,
        source: graph.nodesData[startNode],
        target: graph.nodesData[endNode],
        label: 'NEW',
        prefix: 'eg'
    };
    let n = graph.edgesData.push(newEdge);
    // Reset flags
    startNode = null,
    endNode = null;
    // RESET the flag for pulsing here!!
    update(graph);  // Adds node to the SVG
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
    //TW re-enable later: //    alert("You will now create the TTL file. Click OK to confirm.");

    // Set the prefixes
    let writer = N3.Writer({ prefixes: { eg: 'http://example.org/LDWorkshop#',
                                         ncit: 'http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#',
                                         rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                                         rdfs:'http://www.w3.org/2000/01/rdf-schema#',
                                         schema:'http://schema.org/',
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
        // IRI and IRIONT are treated the same
        if (raw.target.type ==='IRI' || raw.target.type ==='IRIONT') {
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
        let blob = new Blob([result], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "WhiteBoardTriples.ttl");
    });
} // end createTTL()

function saveState(graph){
    // Clone the original graph to allow pre-export cleansing
    let graphClone = JSON.parse(JSON.stringify(graph));

    // Remove properties created by the force() function
    graphClone.nodesData.forEach(n => {
        delete n.index;
        delete n.px;
        delete n.py;
        delete n.weight;
    });

    // Replace node array values with their index reference
    graphClone.edgesData.forEach(e => {
        e.source = e.source.id;
        e.target = e.target.id;
    });
    // Convert to blob for saving, then save.
    var blob = new Blob([JSON.stringify(graphClone)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "graph-Saved.JSON");
}
