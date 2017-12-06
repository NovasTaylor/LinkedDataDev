/*-----------------------------------------------------------------------------
FILE: /LinkedDataDev/GraphEditor/GraphEditorV2.js
DESC: Called from graphEditorV2.html
REQ :
VIEW: http://localhost:8000/GraphEditor/GraphEditor.html
SRC : http://bl.ocks.org/rkirsling/5001347
IN  :
OUT : TBD: WhiteBoardTriples.TTL
DEV:
NOTE: LINKS
        Changing Link Direction Arrows. With Link selected:
        R - arrow to right
        L - arrow to left
        B - arrow in BOTh directions (remove for course?)

       NODES
       With node selected:
       R - NOT IN USE. Previous: toggled reflexivity on/off.

      CTRL + Left Mouse = Drag of node.
TODO: Task list tracked at
      https://kanbanflow.com/board/5d2eb8e3f370395a0ab2fff3c9cc65c6

-----------------------------------------------------------------------------*/
"use strict";

var  nodes = [
  {n:0, id: 'PRODUCT1',
   label: 'PRODUCT1',
    prefix:"ldw",
    type: 'URI',
    x:500, y:60,
    fixed:true,
    comment:""},
  {n:1, id: 'Serum 114',
    label: 'Serum 114',
    prefix:"--NONE--",
    type: 'STRING',
    x:700, y:60,
    fixed:true,
    comment:""}
  ],
  edges = [
    {source: nodes[0], target: nodes[1],
      label: 'label', prefix:'foo', left: false, right: true }
  ];

var infoActive = false;
var w = 900,
    h = 400;

var svg = d3.select("#whiteboard").append("svg")
  .attr("width", w)
  .attr("height", h);
// Build the arrow for RDF Triple
svg.append("defs")
  .selectAll("marker")
  .data(["end"])      // Different link/path types can be defined here
  .enter().append("marker")    // This section adds in the arrows
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 5)  // Increase this number to back the arrow away from the target node
  .attr("refY", 0)
  .attr("fill", "#756bb1")
  .attr("stroke", "white")
  .attr("markerWidth", 2.5)  // Arrow height
  .attr("markerHeight", 2.5) // Arrow width
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

var force = d3.layout.force()
  .nodes(nodes)
  .links(edges)
  .gravity(.05)
  .charge(-180)
  .linkDistance(100)
  .size([w, h])
  .start();

  // Def for background of link text as a Filter effect as per:
  // https://www.w3.org/TR/SVG/filters.html
  // Converted from original svg.html to D3JS syntax
  // svg.html('<defs><filter x="-0.1" y="0" width="1.2" height="1" id="solid"><feFlood flood-color="white"/><feComposite in="SourceGraphic"/></filter></defs>');
  var linkTextBack = svg.append('svg:defs').append('svg:filter')
    .attr("x", "-0.1")
    .attr("y", "0")
    .attr("width", "1.2")
    .attr("height", "1")
    .attr("id", "solid");
  linkTextBack.append('feFlood')
      .attr("flood-color", "white");
  linkTextBack.append('feComposite')
      .attr("in", "SourceGraphic");

//TW NEW INSERTION -------------------------------------------
// Define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
  .attr('id', 'end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 6)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');
svg.append('svg:defs').append('svg:marker')
  .attr('id', 'start-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 4)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// Line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// Handles to link and node element groups
var path     = svg.append('svg:g').selectAll('path'),
  linkText = svg.append('svg:g').selectAll('textPath'),  // Group for edge labels
  circle   = svg.append('svg:g').selectAll('g');


//TW END NEW INSERTION ---------------------------------------


var drag = force.drag()
  .on("dragstart", dragstart);


// Relationship lines
var links = svg.selectAll("reLine")
  .data(edges)
  .enter()
  .append("line")
  .attr("id",function(d,i){return 'edge'+i})
  .attr("class", "edges")
  .attr("marker-end", "url(#end)")
  .on('mouseover', function(d){
    var nodeSelection = d3.select(this).style({opacity:'0.5'});
   })
  .on('mouseout', function(d){
    var nodeSelection= d3.select(this).style({opacity:'1.0',})
  });

// var nodes = svg.selectAll("g.node")
var circles = svg.selectAll("g.node")
  .data(nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  //.on("dblclick", dblclick)
  .call(drag);

circles.append("circle")
  .attr("r", 50)
  .attr("class", function(d,i){
    if (d.type == "STRING"){ return "string";}
    else if (d.type == "URI"){ return "uri"; }
    else {return "unspec";}
  })
  // Mousover Node - highlight node by fading the node colour during mouseover
  .on('mouseover', function(d){
    var nodeSelection = d3.select(this).style({opacity:'0.5'});
  })
  //Mouseout Node  - bring node back to full colour
  .on('mouseout', function(d){
    var nodeSelection= d3.select(this).style({opacity:'1.0',})
  })
//---- Double CLICK NODE TO EDIT ---------------------------------------------------//
  // .on("click", function(d, i){
  .on("dblclick", function(d, i){
    console.log("clicked");
    var self = this;

    if (infoActive == true) {
      // clicked a node while previous info block displayed
      d3.selectAll("input").remove();
      //d3.selectAll(".formEle").remove();
      d3.select("#info").selectAll("*").remove();
      d3.select("#info").style("opacity", 0);
    }
    d3.select("#info").style("opacity", 1);

    var div = d3.select("#info")

    var labelText = div.append("p")
      .text("Label: ");
    var labelInput = labelText.append("input")
      .attr("size", "15")
      .attr("type", "text")
      .attr("value", d.label);

      var prefixText = div.append("p")
        .text("Prefix: ");
      var prefixInput = prefixText.append("input")
        .attr("size", "15")
        .attr("type", "text")
        .attr("value", d.prefix);

        var typeText = div.append("p")
          .text("Type: ");
        var typeInput = typeText.append("input")
          .attr("size", "15")
          .attr("type", "text")
          .attr("value", d.type);
   //console.log("labelInput: " +labelInput.node().value);
   //---- UPDATE BUTTON -----------------------------------------------------//
    var button = div.append("button")
      .text("Update/Hide")
      .on("click", function() {
          d3.select("#nodeText" + i)
            .text(function(d) {
              return (d.label = labelInput.node().value); })
          ;
          d3.select("#prefixText" + i)
            .text(function(d) {
              return (d.prefix = prefixInput.node().value); })
          ;
          d3.select("#typeText" + i)
            .text(function(d) {
              return (d.type = typeInput.node().value); })
          ;


          // Clean up the info window
          d3.select("#info").selectAll("*").remove();
          d3.select("#info").style("opacity", 0);
        })

    infoActive = true;
  });
//---- END NODE CLICK -------------------------------------------------------//
// dx sets how close to the node the label appears
circles.append("text")
  .attr("class", function(d){return 'nodeText'})
  // Need unique ID for each nodeText value in order to update it from the info window
  .attr("id", function(d, i) {return("nodeText"+i) ; })
  .attr("text-anchor", "middle")
  .attr("class", "nodeLabel")
  .text(function(d) { return d.label; }) ;

// Create unique IDS for the PREFIX and TYPE text for updating from the info boxE
circles.append("prefixText")
  .attr("id", function(d, i) {return("prefixText"+i) ; });
circles.append("typeText")
  .attr("id", function(d, i) {return("typeText"+i) ; });


var edgepaths = svg.selectAll(".edgepath")
  .data(edges)
  .enter()
  .append('path')
    .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
      'class':'edgepath',
      'id':function(d,i) {return 'edgepath'+i}
  })
  .style("pointer-events", "none");

  // dx : the starting distance of the label from the source node
var linkLabel = svg.selectAll(".linkLabel")
  .data(edges).enter()
  .append('text')
    .attr({'class':'linkLabel',
      'id':function(d,i){return 'linkLabel'+i},
      'dx':80,
      'filter': 'url(#solid)',
      'dy':5
    });

linkLabel.append('textPath')
  .attr('xlink:href',function(d,i) {return '#edgepath'+i})
  .style("pointer-events", "none")
  .text(function(d,i){return d.label});  // may need i for reference later

force.on("tick", function() {
  links.attr("x1", function(d) {return d.source.x; })
    .attr("y1", function(d) {return d.source.y; })
    .attr("x2", function(d) { return d.target.x-60;})  // Increase this value to move the edge away from node center.
    // Coordinate with arrow size and placement.
    .attr("y2", function(d) { return d.target.y;});
    circles.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
    return path
  });
});

// Set the "fixed" property of the dragged node to TRUE when a dragstart event is initiated,
//   - removes "forces" from acting on that node and changing its position.
function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
}
