/*-----------------------------------------------------------------------------
FILE: /LinkedDataDev/GraphEditor/GraphEditor.js
DESC: Called from GraphEditor.html
REQ :
VIEW: http://localhost:8000/GraphEditor/GraphEditor.html
SRC :
IN  :
OUT :
DEV:
NOTE:
TODO: Task list:  https://kanbanflow.com/board/5d2eb8e3f370395a0ab2fff3c9cc65c6
      Discussion: https://kanbanflow.com/board/53c6d9a2c742c52254825aca6aabd85d
-----------------------------------------------------------------------------*/
"use strict";

var  nodesData = [
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
    comment:""},
  {n:2, id: 'F',
      label: 'F',
      prefix:"ldw",
      type: 'URI',
      nodeFill:"#e6add8",
      x:100, y:400,
      fixed:true,
      comment:""},
    {n:3, id: 'C16576',
      label: 'C16576',
      prefix:"sdtmterm",
      type: 'URI',
      nodeFill:"#c6cbcd",
      x:100, y:600,
      fixed:true,
      comment:"NCI code"},
    {n:4, id: 'M',
      label: 'M',
      prefix:"ldw",
      type: 'URI',
      nodeFill:"#add8e6",
      x:200, y:400,
      fixed:true,
      comment:"male"},
    {n:5, id: 'C20197',
      label: 'C20197',
      prefix:"sdtmterm",
      type: 'URI',
      nodeFill:"#c6cbcd",
      x:200, y:600,
      fixed:true,
      comment:"NCI Code"}
  ],
  edgesData = [
    {source: nodesData[0], target: nodesData[1],
      label: 'label', prefix:'foo', left: false, right: true },
    {source: nodesData[2], target: nodesData[3],
      edgelabel: 'nciCode', prefix:"sdtmterm", left: false, right: true},
    {source: nodesData[4], target: nodesData[5],
      edgelabel: 'nciCode', prefix:"sdtmterm", left: false, right: true}
  ];

var infoActive = false;  // opacity flag for info editing box
var w = 900,
    h = 1100,
    nodeRadius = 40;

var svg = d3.select("#whiteboard").append("svg")
  .attr("width", w)
  .attr("height", h);

/* Arrow for Link
   Must have id:String for display
   refX: increase to back the arrow away from the target node
   markerHeight: Arrow height
   markerWidth: Arrow Width
*/
svg.append("defs")
  .selectAll("marker")
  .data(["arrowhead"])      // Different link/path types can be defined here
  .enter().append("marker")    // Append arrow marker
  //TODO Move size and colouring to CSS
  .attr({'id':String,
    'viewBox': '0 -5 10 10',
    'refX':    5,
    'refY':    0,
    'fill':    'black',
    'stroke':  'white',
    'markerWidth':  2.5,
    'markerHeight': 2.5,
    'orient': 'auto'
  })
  .append("svg:path")
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', 'black')
    .attr('stroke','black');  // move to CSS

// Initialize D3 force layout
var force = d3.layout.force()
  .nodes(nodesData)
  .links(edgesData)
  .size([w, h])
  .start();

// Def for background of link text as a Filter effect as per:
// https://www.w3.org/TR/SVG/filters.html
// Converted from original svg.html to D3JS syntax
// svg.html('<defs><filter x="-0.1" y="0" width="1.2" height="1" id="solid"><feFlood flood-color="white"/><feComposite in="SourceGraphic"/></filter></defs>');
var linkTextBack = svg.append('svg:defs').append('svg:filter')
  .attr({
    'x':      -0.1,
    'y':      0,
    'width':  1.2,
    'height': 1,
    'id':     'solid' });

linkTextBack.append('feFlood')
  .attr("flood-color", "white");

linkTextBack.append('feComposite')
  .attr("in", "SourceGraphic");

var drag = force.drag()
  .on("dragstart", dragstart);

// Relationship lines
var links = svg.selectAll("line")
  .data(edgesData)
  .enter()
  .append("line")
  .attr({
    'id': function(d,i){return 'edge'+i},
    'class': 'edge',
    'marker-end': 'url(#arrowhead)'
  })
  .on('mouseover', function(d){
    var nodeSelection = d3.select(this).style({opacity:'0.5'});
   })
  .on('mouseout', function(d){
    var nodeSelection= d3.select(this).style({opacity:'1.0',})
  });

var nodes = svg.selectAll("g.node")
  .data(nodesData)
  .enter()
  .append("g")
  .attr("class", "node")
  //.on("dblclick", dblclick)
  .call(drag);

nodes.append("circle")
  .attr("r", nodeRadius)
  .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
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
  // .on("click", function(d, i){  // was prev. single click
  .on("dblclick", function(d, i){
    console.log("clicked");
    var self = this;

    if (infoActive == true) {
      // clicked a node while previous info block displayed
      d3.selectAll("input").remove();
      d3.select("#info").selectAll("*").remove();
      d3.select("#info").style("opacity", 0);
    }
    d3.select("#info").style("opacity", 1);  // Display edit div

    var div = d3.select("#info")  // Selet div for appending
    // LABEL
    var labelText = div.append("p")
      .text("Label: ");
    var labelInput = labelText.append("input")
      .attr({
        'size': '15',
        'type': 'text',
        'value': d.label
      });

    // PREFIX
    var prefixText = div.append("p")
        .text("Prefix: ");
    var prefixInput = prefixText.append("input")
      .attr({
        'size': '15',
        'type': 'text',
        'value': d.prefix
      });
    //TYPE
    var typeText = div.append("p")
      .text("Type: ");
    var typeInput = typeText.append("input")
      .attr({
          'size':   15,
          'type':  'text',
          'value':  d.type
        });
   //console.log("labelInput: " +labelInput.node().value);
   //---- UPDATE BUTTON -----------------------------------------------------//
    var button = div.append("button")
      .text("Update/Hide")
      .on("click", function() {
          d3.select("#nodeText" + i)
            .text(function(d) {
              return (d.label = labelInput.node().value); })
          ;
          // Change class of circle to match TYPE
          d3.select("#circle" + i)
             //Hang head in shame for this horrible kludge. Make this smarter.
             //  detect exist class.If changed: Remove existing, update to new
            .classed("string", false)  // remove the class
            .classed("uri", false)  // remove the class
            .classed(typeInput.node().value.toLowerCase(), true)
          ;
          d3.select("#prefixText" + i)
            .text(function(d) {return (d.prefix = prefixInput.node().value); });
          var foo = d3.select("#typeText" + i)
            .text(function(d) {return (d.type = typeInput.node().value); });
          // Clean up the info window
          d3.select("#info").selectAll("*").remove();
          d3.select("#info").style("opacity", 0);
        })

    infoActive = true;
  }); // End of dblClick
//---- END NODE CLICK -------------------------------------------------------//
// dx sets how close to the node the label appears
// Need unique ID for each nodeText value in order to update it from the info window
nodes.append("text")
  .attr({
    'class':       function(d){return 'nodeText'},
    'id':          function(d, i) {return("nodeText"+i) ; },
    'text-anchor': 'middle',
    'class':        'nodeLabel'
  })
  .text(function(d) { return d.label; }) ;

// Create unique IDS for the PREFIX and TYPE text for updating from the info boxE
nodes.append("prefixText")
  .attr("id", function(d, i) {return("prefixText"+i) ; });
nodes.append("typeText")
  .attr("id", function(d, i) {return("typeText"+i) ; });


var edgepaths = svg.selectAll(".edgepath")
  .data(edgesData)
  .enter()
  .append('path')
  .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
         'class':'edgepath',
         'fill-opacity':0,
         'stroke-opacity':0,
         'id':function(d,i) {return 'edgepath'+i}
  })
  .style("pointer-events", "none");

// dx : the starting distance of the label from the source node
var edgelabels = svg.selectAll(".edgelabel")
  .data(edgesData).enter()
  .append('text')
    .attr({'class':'edgeLabel',
      'id':function(d,i){return 'edgelabel'+i},
      'dx':80,
      'filter': 'url(#solid)',
      'dy':5
    });

edgelabels.append('textPath')
  .attr('xlink:href',function(d,i) {return '#edgepath'+i})
  .style("pointer-events", "none")
  .text(function(d,i){return d.label});  // may need i for reference later

force.on("tick", function() {
  links.attr("x1", function(d) {return d.source.x+nodeRadius; })
    .attr("y1", function(d) {return d.source.y; })
    // Extra subtract in X2 to accomodate arrow
    .attr("x2", function(d) { return d.target.x-(nodeRadius+8);})
    // Coordinate with arrow size and placement.
    .attr("y2", function(d) { return d.target.y;});

  //TW DIFFERS HERE
  nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
    //console.log(d)
    return path});

/*ERROR
  edgelabel.attr('transform',function(d,i){
    if (d.target.x<d.source.x){
      //bbox = this.getBBox();
      //rx = bbox.x+bbox.width/2;
      //ry = bbox.y+bbox.height/2;
      return 'rotate(180 '+rx+' '+ry+')';
    }
    else {return 'rotate(0)';}
  });
  */
});

// Set the "fixed" property of the dragged node to TRUE when a dragstart event is initiated,
//   - removes "forces" from acting on that node and changing its position.
function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
}
