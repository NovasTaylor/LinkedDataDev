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
TODO: Task list:  https://kanbanflow.com/board/5d2eb8e3f370395a0ab2fff3c9cc65c6
      Discussion: https://kanbanflow.com/board/53c6d9a2c742c52254825aca6aabd85d
-----------------------------------------------------------------------------*/
"use strict";

let  nodesData = [
  { id: 0,
    label: 'PRODUCT1',
    prefix:"ldw",
    type: 'URI',
    x:500, y:60,
    fixed:true},
  { id: 1,
    label: 'Serum 114',
    prefix:"--NONE--",
    type: 'STRING',
    x:700, y:60,
    fixed:true},
  { id: 2,
    label: 'F',
    prefix:"ldw",
    type: 'URI',
    x:100, y:400,
    fixed:true},
  { id: 3,
    label: 'C16576',
    prefix:"sdtmterm",
    type: 'URIONT',
    x:100, y:600,
    fixed:true},
  { id: 4,
    label: 'M',
    prefix:"ldw",
    type: 'URI',
    x:200, y:400,
    fixed:true},
  { id: 5,
    label: 'C20197',
    prefix:"sdtmterm",
    type: 'URIONT',
    x:200, y:600,
    fixed:true}
  ],
  lastNodeId = 5,
  edgesData = [
    { id:0,
      source: nodesData[0],
      target: nodesData[1],
      label: 'label',
      prefix:'foo'},
    { id:1,
      source: nodesData[2],
      target: nodesData[3],
      label: 'nciCode',
      prefix:"sdtmterm"},
    { id:2,
      source: nodesData[4],
      target: nodesData[5],
      label: 'nciCode',
      prefix:"sdtmterm"}
  ],
  lastEdgeId = 2;

let infoActive = false;  // opacity flag for info editing box

// Start and end nodes when constructing a link
let startNode=null ,
    endNode = null;
let w = 900,
    h = 1100,
    nodeRadius = 40; // also used to distance arrow from node

// mouse event settings  as per Kirsling. only mousedown_node in use as of 2017-12-23
let selected_node = null,
  selected_edge   = null,
  mousedown_edge  = null,
  mousedown_node  = null,
  mouseup_node    = null;

//TW.  As per Kirsling. Not yet in use. Move to fnt area of code.
function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_edge = null;
}

let svg = d3.select("#whiteboard").append("svg")
  .attr("width", w)
  .attr("height", h);

// Global Declare
let edge = svg.append('svg:g').selectAll('edge'),
  circle = svg.append('svg:g').selectAll('g');
// Add node icon
svg.append("svg:image")
  .attr({
    'x':5,
    'y':5,
    'width': 20,
    'height': 24,
    'xlink:href': '/GraphEditor/img/AddIcon.png'})
  .on('mouseover', function(d){
    console.log("Add a node")
    let addIcon = d3.select(this)
      .attr({
        'width':25,
        'height':29
      });
  })
  .on('mouseout', function(d){
    let addIcon = d3.select(this)
      .attr({
        'width':20,
        'height':24
      });
  })
  .on('click', function(d){ addNode();});

// Initialize D3 force layout
let force = d3.layout.force()
  .nodes(nodesData)
  .links(edgesData)
  .size([w, h])
  .on("tick", tick);

// Arrow marker for end of edge
svg.append('defs').append('marker')
  .attr({'id':'arrowhead',
    'viewBox': '-0 -5 10 10',
    'refX':    nodeRadius+12,
    'refY':    0,
    'orient': 'auto',
    'markerWidth':  10,
    'markerHeight': 10,
    'xoverflow':'visible'})
  .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#ccc')
    .attr('stroke','#ccc');

//---- Edges TODO: MOVE INTO UPDATE() function
/*
edge = svg.selectAll("line")
  .data(edgesData)
  .enter()
  .append("line")
    .attr("id", function(d,i){return 'edge'+i})
    .attr('marker-end', 'url(#arrowhead)')
    //.attr('class', 'edge')
    .style("stroke", "#ccc");
*/
let edgepaths = svg.selectAll(".edgepath")
  .data(edgesData)
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
let edgelabels = svg.selectAll(".edgelabel")
  .data(edgesData).enter()
  .append('text')
    .attr({'class':'edgelabel',
      //
      'dx':80,
      'dy':-1  // change to 5 to put inline with edge
    });

edgelabels.append('textPath')
  .attr('xlink:href',function(d,i) {return '#edgepath'+i})
  .attr('id', function(d,i){return 'edgelabel'+i})
  .text(function(d,i){return d.label})
  //---- Double click edge to edit ---------------------------------------------
  .on("dblclick", function(d, i){
     infoEdit(d,i, "edge");
   });
/*
edge.append("prefixText")
  .attr("id", function(d, i) {return("prefixText"+i) ; });
*/

function tick() {
  edge.attr({"x1" : function(d) {return d.source.x; },
    "y1": function(d) {return d.source.y; },
    "x2": function(d) { return d.target.x;},
    "y2": function(d) { return d.target.y;}
  });

  // THIS LINE DIFFERS FROM EG FN-EdgePathLabels.js
  circle.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  edgepaths.attr('d', function(d) { let path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
    //console.log(d)
    return path});
  edgelabels.attr('transform',function(d,i){
    if (d.target.x<d.source.x){
            let bbox = this.getBBox();
            let rx = bbox.x+bbox.width/2;
            let ry = bbox.y+bbox.height/2;
            return 'rotate(180 '+rx+' '+ry+')';
    }
    else {
      return 'rotate(0)';
    }
  });
};  // End on tick

function update(){

  //---- EDGES update ----------------------------------------------------------

  // Add new links ..... TO BE ADDED
  edge = svg.selectAll("line")
    .data(edgesData)
    .enter()
    .append("line")
      .attr("id", function(d,i){return 'edge'+i})
      .attr('marker-end', 'url(#arrowhead)')
      //.attr('class', 'edge')
      .style("stroke", "#ccc");

  edge.append("prefixText")
    .attr("id", function(d, i) {return("prefixText"+i) ; });

  // NODES update --------------------------------------------------------------
  //let node = svg.selectAll("g.node")
//    .data(nodesData);

  // Add new nodes.
  // node circles are WITHIN the <g> , so start with <g> and append the circle
  circle = circle.data(nodesData, function(d) { return d.id; });

  circle.selectAll('circle');
    //.style('fill', 'red'); //TW

  // add new nodeSelection
  let g = circle.enter().append('svg:g');

    g.append("svg:circle")
      .attr("class", "node")
      .attr("r", nodeRadius)
      .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
      .attr("class", function(d,i){
        if (d.type == "STRING"){ return "string";}
        else if (d.type == "URI"){ return "uri"; }
        else if (d.type == "URIONT"){ return "uriont"; }
        else {return "unspec";}
      })
      //---- Double click node to edit -----------------------------------------
      // For new nodes, this should allow the entry of label, type, and prefix...
      .on("dblclick", function(d, i){
        infoEdit(d,i, "node");
      })
      .on("click", function(d, i){
        if (d3.event.shiftKey)  {
          d.pulse = !d.pulse;
          if (d.pulse) {
            var selected_circles = d3.select(this);
              pulsate(selected_circles);

            }
            if (startNode===null){
            startNode= i;
            console.log("Setting Start Node as node ID: " + startNode);
            }
           else if (startNode !== null){
             endNode= i;
             console.log("Start Node: " + startNode + " End Node: " + endNode);
            addEdge();
           }

        }})
      .on('mouseover', function(d){
        //DEBUG  console.log("NODE MOUSEOVER");
        let nodeSelection = d3.select(this).attr({'r':nodeRadius+5,}); //TW opacity  for testing only!
      })
      //Mouseout Node  - bring node back to full colour
      .on('mouseout', function(d){
        //  let nodeSelection= d3.select(this).style({opacity:'1.0',})
        let nodeSelection = d3.select(this).attr({'r':nodeRadius});
      })

      ;

  // Add nodeText ID to each node. Adding the actual text label here with the
  //.text  causes problems with intial nodes.
  circle.append("text")
    .attr({
      'class':       function(d,i){return 'nodeText'},
      'id':          function(d, i) {return("nodeText"+i) ; },
      'text-anchor': 'middle',
      'class':        'nodeLabel'
    })
    .text(function(d,i) { return d.label; }) //Causes problems with preexisting nodes!
      // after node text is changed, original and NEW overwrite.
    ;

  // Create unique IDS for the PREFIX and TYPE text for updating from the info box
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
}  // end of update()




//-----------------------------------------------------------------------------
//---- Additional Functions --------------------------------------------------------------

/* infoEdit()
   Edit information for either a "node" or an "edge"
   Currently only works for a node
*/
function infoEdit(d, i, source){
  console.log("You clicked a  " +source)
  console.log("     infoEdit: " + source + " " + d.label);
  //console.log("clicked");
  let self = this; //TW : Unnecessary?

  if (infoActive == true) {
    // clicked a node or edge while previous info block displayed
    d3.selectAll("input").remove();
    d3.select("#info").selectAll("*").remove();
    d3.select("#info").style("opacity", 0);
  }
  d3.select("#info").style("opacity", 1);  // Display edit div

  let div = d3.select("#info");

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
  let prefixInput = prefixText.append("input")
    .attr({
      'size': '15',
      'type': 'text',
      'value': d.prefix
    });
  //TYPE - NODES only
  let typeText = ""
  let typeInput = ""
  let typeSelect = ""

  if(source=="node"){
    typeText = div.append("p")
       .text("Type: ");
    let typeData = ["URI","STRING", "INT"]
    typeInput = typeText.append("select")
        .attr('class','select')
    typeSelect = typeInput.selectAll('option')
        .data(typeData).enter()
        .append('option')
        .text(function (d) { return d; })
        .property("selected", function(g){ return g === d.type; })
        ;
  }

 //console.log("labelInput: " +labelInput.node().value);
 //---- UPDATE BUTTON -----------------------------------------------------//
  let button = div.append("button")
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
          .classed(typeInput.node().value.toLowerCase(), true) // add type class

        ;

      } // end of node UPDATE
      if(source=="edge"){
        console.log("Updating Edge")

        d3.select("#edgelabel" + i)
          .text(function(d)  {return (d.label = labelInput.node().value); });

        d3.select("#prefixText" + i)
          .text(function(d) {return (d.prefix = prefixInput.node().value); });
      } // end of Edge update
      // Clean up the info window after click of Hide/Update
      d3.select("#info").selectAll("*").remove();
      d3.select("#info").style("opacity", 0);

 }) // end of click on update button
  infoActive = true;

//TW
let delButton = div.append("button")
  .text("Delete")
  .on("click", function() {
    if(source=="node"){
    // select node
    mousedown_node = d; //TW captures the node Initialized to null as per Kirsling
    selected_node = mousedown_node ;  //TW just playing here. Need to restructure ALL of this per Kirsling
    console.log("D: ", d)
    //let foo = indexOf(node());
    console.log("So you want to DELETE a node!")
    console.log("Selected_node: " , selected_node)
      // must delete the node and any edge attached to it (ingoing and outgoing)
    nodesData.splice(nodesData.indexOf(selected_node), 1); // Delete selected node from array
    update();
  }
  if(source=="edge"){
    console.log("So you want to DELETE an Edge!")
    mousedown_edge = d; //TW captures the edge.
    selected_edge = mousedown_edge ;  //TW just playing here. Need to restructure ALL of this per Kirsling
    console.log("Selected_edge: " , selected_edge)
    edgesData.splice(edgesData.indexOf(selected_edge), 1); // Delete selected edge from array
    update();
  }
});

}


/* addNode()
   Add a node
*/

function addNode(){
  console.log("A node you wish to add!")
  let newNode = {
    id: ++lastNodeId,
    label: 'Newbie',
    prefix: 'new',
    type: 'UNSPEC',
    x:200, y:200,
    fixed:true};
    let n = nodesData.push(newNode);
    console.log(newNode)
    console.log(nodesData)
    update();  // Adds node to the SVG
}
/* addLink()
   Add a link
*/

// ERROR: Need correct way to instead reference into the edgesData array!!
function addEdge(){
  console.log("A LINK you wish to add!")

  let newEdge = {
    id: ++lastEdgeId,
    source: nodesData[startNode],
    target: nodesData[endNode],
    label: 'NEW',
    prefix: 'ldw'};
  let n = edgesData.push(newEdge);
  // Reset flags
  startNode = null,
  endNode = null;
  // RESET the flag for pulsing here!!
  update();  // Adds node to the SVG
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


//---- App Start ---------------------------------------------------------------
update();
