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
  { label: 'PRODUCT1',
    prefix:"ldw",
    type: 'URI',
    x:500, y:60,
    fixed:true},
  { label: 'Serum 114',
    prefix:"--NONE--",
    type: 'STRING',
    x:700, y:60,
    fixed:true},
  { label: 'F',
    prefix:"ldw",
    type: 'URI',
    x:100, y:400,
    fixed:true},
  { label: 'C16576',
    prefix:"sdtmterm",
    type: 'URI',
    x:100, y:600,
    fixed:true},
  { label: 'M',
    prefix:"ldw",
    type: 'URI',
    x:200, y:400,
    fixed:true},
  { label: 'C20197',
    prefix:"sdtmterm",
    type: 'URI',
    x:200, y:600,
    fixed:true}
  ],
  edgesData = [
    {source: nodesData[0], target: nodesData[1],
      label: 'label', prefix:'foo'},
    {source: nodesData[2], target: nodesData[3],
      label: 'nciCode', prefix:"sdtmterm"},
    {source: nodesData[4], target: nodesData[5],
      label: 'nciCode', prefix:"sdtmterm"}
  ];

let infoActive = false;  // opacity flag for info editing box
let w = 900,
    h = 1100,
    nodeRadius = 40;

let svg = d3.select("#whiteboard").append("svg")
  .attr("width", w)
  .attr("height", h);

// Icon to add node
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
  //.start();
  .on("tick", tick)
  .start();

//---- Edges
let edge = svg.selectAll("line")
  .data(edgesData)
  .enter()
  .append("line")
    .attr("id", function(d,i){return 'edge'+i})
    .attr('marker-end', 'url(#arrowhead)')
    //.attr('class', 'edge')
    .style("stroke", "#ccc")
    //.style("stroke-width", "3px")
    //.style("stroke", "blue")

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
      'dy':-1  // change to 5 to put inline with link
    });

edgelabels.append('textPath')
  .attr('xlink:href',function(d,i) {return '#edgepath'+i})
  .attr('id', function(d,i){return 'edgelabel'+i})
  .text(function(d,i){return d.label})
  //---- Double click edge to edit ---------------------------------------------
  .on("dblclick", function(d, i){
     infoEdit(d,i, "edge");
   });

// Marker for end of edge
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

//---- NODES ------------------------------------------------------------------
let node = svg.selectAll("g.node")
  .data(nodesData)
  .enter()
  .append("g")
    .attr("class", "node")
    .call(force.drag);

node.append("circle")
  .attr("r", nodeRadius)
  .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
  .attr("class", function(d,i){
  if (d.type == "STRING"){ return "string";}
    else if (d.type == "URI"){ return "uri"; }
    else {return "unspec";}
  })

  // Mousover Node - highlight node by fading the node colour during mouseover
  .on('mouseover', function(d){
    //let nodeSelection = d3.select(this).style({opacity:'0.5'});
    console.log("NODE MOUSEOVER");
    let nodeSelection = d3.select(this).attr({'r':nodeRadius+5,}); //TW opacity  for testing only!
  })

  //Mouseout Node  - bring node back to full colour
  .on('mouseout', function(d){
    //  let nodeSelection= d3.select(this).style({opacity:'1.0',})
    let nodeSelection = d3.select(this).attr({'r':nodeRadius});
  })
  //---- Double click node to edit ---------------------------------------------
  .on("dblclick", function(d, i){
    infoEdit(d,i, "node");
  });

// dx sets how close to the node the label appears
// Need unique ID for each nodeText value in order to update it from the info window
node.append("text")
  .attr({
    'class':       function(d){return 'nodeText'},
    'id':          function(d, i) {return("nodeText"+i) ; },
    'text-anchor': 'middle',
    'class':        'nodeLabel'
  })
  .text(function(d) { return d.label; }) ;

// Create unique IDS for the PREFIX and TYPE text for updating from the info box
//  Required for BOTH nodes (prefixText, typeText) and edges (prefixText)
node.append("prefixText")
  .attr("id", function(d, i) {return("prefixText"+i) ; });
node.append("typeText")
  .attr("id", function(d, i) {return("typeText"+i) ; });

edge.append("prefixText")
  .attr("id", function(d, i) {return("prefixText"+i) ; });

function tick() {
  edge.attr({"x1" : function(d) {return d.source.x; },
    "y1": function(d) {return d.source.y; },
    "x2": function(d) { return d.target.x;},
    "y2": function(d) { return d.target.y;}
  });

  // THIS LINE DIFFERS FROM EG FN-EdgePathLabels.js
  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

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
  let self = this;

  if (infoActive == true) {
    // clicked a node or link while previous info block displayed
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

  if(source=="node"){
    typeText = div.append("p")
      .text("Type: ");
    typeInput = typeText.append("input")
      .attr({
        'size':   15,
        'type':  'text',
        'value':  d.type
      });
  }

 //console.log("labelInput: " +labelInput.node().value);
 //---- UPDATE BUTTON -----------------------------------------------------//
  let button = div.append("button")
    .text("Update/Hide")
    .on("click", function() {
      if(source=="node"){
        console.log("Updating Node")
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
          //Hang head in shame for this horrible kludge. Make this smarter.
          //  detect exist class.If changed: Remove existing, update to new
          .classed("string", false)  // remove the class
          .classed("uri", false)  // remove the class
          .classed(typeInput.node().value.toLowerCase(), true)
        ;

      } // end of node UPDATE
      if(source=="edge"){
        console.log("Updating Edge")

        d3.select("#edgelabel" + i)
          .text(function(d)  {return (d.label = labelInput.node().value); });

        d3.select("#prefixText" + i)
          .text(function(d) {return (d.prefix = prefixInput.node().value); });
      }
      // Clean up the info window after click of Hide/Update
      d3.select("#info").selectAll("*").remove();
      d3.select("#info").style("opacity", 0);

 }) // end of click on update button
  infoActive = true;

//TW
var delButton = div.append("button")
  .text("Delete")
  .on("click", function() {
    if(source=="node"){
      console.log("So you want to DELETE a node!")
      // must delete the node and any links attached to it (ingoing and outgoing)
  }
  if(source=="edge"){
    console.log("So you want to DELETE an Edge!")
  }
});

}


function update(){

  // Update the nodes
  node = svg.selectAll("g.node")
    .data(nodesData);

  // Add new nodes.
  // node circles are WITHIN the <g> , so start with <g> and append the circle
  node.enter()
    .append("g")
      .attr("class", "node")
    .append("circle")
      .attr("r", nodeRadius)
      .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
      .attr("class", function(d,i){
        if (d.type == "STRING"){ return "string";}
        else if (d.type == "URI"){ return "uri"; }
        else {return "unspec";}
      })
      //---- Double click node to edit -----------------------------------------
      // For new nodes, this should allow the entry of label, type, and prefix...
      .on("dblclick", function(d, i){
        infoEdit(d,i, "node");
      });


      ;
  // Add nodeText ID to each node. Adding the actual text label here with teh
  //.text  causes problems with intial nodes.
  node.append("text")
    .attr({
      'class':       function(d,i){return 'nodeText'},
      'id':          function(d, i) {return("nodeText"+i) ; },
      'text-anchor': 'middle',
      'class':        'nodeLabel'
    })

    //  .text(function(d,i) { return d.label; }) //Causes problems with preexisting nodes!
    ;

  // Create unique IDS for the PREFIX and TYPE text for updating from the info box
  //  Required for BOTH nodes (prefixText, typeText) and edges (prefixText)
  node.append("prefixText")
    .attr("id", function(d, i) {return("prefixText"+i) ; });
  node.append("typeText")
    .attr("id", function(d, i) {return("typeText"+i) ; });

  node.call(force.drag);

  // Exit any old nodes.
  node.exit().remove();
  // Restart the force layout.
  force.start();
}

/* addNode()
   Add a node
*/

function addNode(){
  console.log("So you want to add a node!")
  let newNode = {
    label: 'New',
    prefix: 'new',
    type: 'new',
    x:200, y:200,
    fixed:true};
    let n = nodesData.push(newNode);
    console.log(newNode)
    console.log(nodesData)
    //restart();
    update();
}
