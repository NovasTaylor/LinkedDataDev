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
    type: 'URI',
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
    type: 'URI',
    x:200, y:600,
    fixed:true}
  ],
  lastNodeId = 5,
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
    nodeRadius = 40; // also used to distance arrow from node

let svg = d3.select("#whiteboard").append("svg")
  .attr("width", w)
  .attr("height", h);

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
svg.append('svg:defs').append('svg:marker')
  .attr({'id':'end-arrow',
    'viewBox': '-0 -5 10 10',
    'refX':    nodeRadius-7,
    'refY':    0,
    'orient': 'auto',
    'markerWidth':  3.1,
    'markerHeight': 3.1,
    'xoverflow':'visible'})
  .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#ccc')
    .attr('stroke','#ccc');

//HK line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

//HK handles to link and node element groups
var edge = svg.append('svg:g').selectAll('edge'),
  circle = svg.append('svg:g').selectAll('g');
//HK mouse event vars as per Kirsling. only mousedown_node in use as of 2017-12-23
let selected_node = null,
  selected_edge   = null,
  mousedown_edge  = null,
  mousedown_node  = null,
  mouseup_node    = null;
//HK Not yet in use. Move to fnt area of code.
function resetMouseVars() {
  mousedown_node = null;
  mouseup_node   = null;
  mousedown_edge = null;
}

function tick() {
  //HK draw directed edges with proper padding from node centers
  // TODO: Need to add-in path LABEL TEXT and their rotation!
  edge.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });
/*TW ORIGINAL EDGE TICKING
  DO NOT DELETE YET....
  edge.attr({"x1" : function(d) {return d.source.x; },
    "y1": function(d) {return d.source.y; },
    "x2": function(d) { return d.target.x;},
    "y2": function(d) { return d.target.y;}
  });
  edgepaths.attr('d', function(d) { let path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
    return path;
  });
  edgelabels.attr('transform',function(d,i){
    if (d.target.x<d.source.x){
            let bbox = this.getBBox();
            let rx = bbox.x+bbox.width/2;
            let ry = bbox.y+bbox.height/2;
            return 'rotate(180 '+rx+' '+ry+')';
    } else { return 'rotate(0)'; }
  });
*/

  circle.attr('transform', function(d) {
     return 'translate(' + d.x + ',' + d.y + ')';
  });
};  // End on tick

function update(){
  //---- EDGES ----------------------------------------------------------------
  //TW ORIGINAL EDGE drawing and LABEL text.
  // DO NOT DELETE yet
/*TW : Original Edge. delete after implment ID on new PATH
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
;
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
        'dy':-4  // change to 5 to put inline with edge
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
  //HK new PATH script from HK
  // path (link) group
  //path = path.data(links);
  edge = edge.data(edgesData);
  // update existing links
  edge.classed('selected', function(d) { return d === selected_edge; })
    .style('marker-end', 'url(#end-arrow)');

  // Add new links
  edge.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_edge; })
    .style('marker-end', 'url(#end-arrow)')
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_edge = d;
      if(mousedown_edge === selected_edge) selected_edge = null;
      else selected_edge = mousedown_edge;
      selected_node = null;
      update();
    });

  // remove old links
  edge.exit().remove();

  //---- NODES -----------------------------------------------------------------
  // circle (node) group
  //HK: The function arg is crucial: Nodes are known by id, not by index.
  circle = circle.data(nodesData, function(d) { return d.id; });

  // Add nodes
  var g = circle.enter().append('svg:g');
  // Nodes have subclasses based on type: node uri, node string, etc. for
  // CSS
  g.append('svg:circle')
    .attr("r", nodeRadius)
    .attr("id", function(d, i) {return("circle"+i) ; })  // ID used to update class
    .attr("class", function(d,i){
      if (d.type == "STRING"){ return "node string";}
      else if (d.type == "URI"){ return "node uri"; }
      else if (d.type == "INT"){ return "node int"; }
      else if (d.type == "UNSPEC"){ return "node unspec"; }
    })
    //---- Double click node to edit -----------------------------------------
    // Nodes: edit of label, type, and prefix...
    .on("dblclick", function(d, i){
      infoEdit(d,i, "node");
    })
    .on('mouseover', function(d){
      console.log("NODE MOUSEOVER");
      let nodeSelection = d3.select(this).attr({
        'r':nodeRadius+5,
        'fill-opacity':0.2,
      }); //TW opacity  for testing only to see arrow on edge
    })
    //Mouseout Node  - bring node back to full colour
    .on('mouseout', function(d){
      //  let nodeSelection= d3.select(this).style({opacity:'1.0',})
      let nodeSelection = d3.select(this).attr({
        'r':nodeRadius,
        'fill-opacity':1
      }); //TW opacity  for testing only to see arrow on edge

    })
    //HK START NEW FROM HK
    /*
    .on('mousedown', function(d) {
      // select node
      mousedown_node = d; // The node you mousedowned on
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;
      selected_edge = null;

      // Drag to create link only when SHIFT + LEFT Mouse drag
      if (d3.event.shiftKey) {
        console.log("SHIFT PLUS MOUSDOWN!")
        // reposition drag line
        drag_line
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
      }
      update();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;
      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      //TW: Can remove??
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }
      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      if(mousedown_node.id < mouseup_node.id) {
        source = mousedown_node;
        target = mouseup_node;
        direction = 'right';
      } else {
        source = mouseup_node;
        target = mousedown_node;
        direction = 'left';
      }
      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];

      if(link) {
        link[direction] = true;
      } else {
        link = {source: source, target: target, left: false, right: false};
        link[direction] = true;
        links.push(link);
      }
      // select new link
      selected_edge = link;
      selected_node = null;
      update();
    }); // end on mouseup
    */
    //HK END NEW FROM HK

    // Node Label for visual identification
    circle.append('svg:text')
      .attr({
        'class':       function(d,i){return 'nodeText'},
        'id':          function(d, i) {return("nodeText"+i) ; },
        'text-anchor': 'middle',
        'class':       'nodeLabel'
      })
      .text(function(d,i) { return d.label; }) //Causes problems with preexisting nodes!

    // Create unique IDS for the PREFIX and TYPE text for updating from the info box
    //  Required for BOTH nodes (prefixText, typeText) and edges (prefixText)

    g.append("prefixText")
      .attr("id", function(d, i) {return("prefixText"+i) ; });
    g.append("typeText")
      .attr("id", function(d, i) {return("typeText"+i) ; });


    //force.drag: Later move into keydown function to differentiate between
    // a drag and CTRL+Drag to create a new link (differs from Kersling)
     circle.call(force.drag);

    // Remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();
}  // end of update()

//------------------------------------------------------------------------------
//---- Additional Functions ----------------------------------------------------
function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();

  // because :active only works in WebKit?
  svg.classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_edge) return;

  // insert new node at point
  var point = d3.mouse(this),
      node = {id: ++lastNodeId, reflexive: false};
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  update();
}

function mousemove() {
  if(!mousedown_node) return;

  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  update();
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

/*
// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(force.drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_edge) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1); // Delete selected node from array
        spliceLinksForNode(selected_node);  // Delete links attached to the selected node
      } else if(selected_edge) {
        links.splice(links.indexOf(selected_edge), 1);
      }
      selected_edge = null;
      selected_node = null;
      update();
      break;
    case 66: // B
      if(selected_edge) {
        // set link direction to both left and right
        selected_edge.left = true;
        selected_edge.right = true;
      }
      update();
      break;
    case 76: // L
      if(selected_edge) {
        // set link direction to left only
        selected_edge.left = true;
        selected_edge.right = false;
      }
      update();
      break;
    case 82: // R
      if(selected_node) {
        // toggle node reflexivity
        selected_node.reflexive = !selected_node.reflexive;
      } else if(selected_edge) {
        // set link direction to right only
        selected_edge.left = false;
        selected_edge.right = true;
      }
      update();
      break;
  }
}
*/
/*
function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}
*/


/*---- infoEdit()
  Edit information for either a "node" or an "edge"
*/
function infoEdit(d, i, source){
  console.log("You clicked a  " +source)
  console.log("     infoEdit: " + source + " " + d.label);
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
  let delButton = div.append("button")
    .text("Delete")
    .on("click", function() {
    if(source=="node"){
      // select node
      mousedown_node = d; //TW captures the node. Initialized to null as per Kirsling
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
  }); // end of del button
} // end of infoEdit()

//---- addNode()
function addNode(){
  console.log("So you want to add a node!")
  let newNode = {
    label: 'Newbie',
    prefix: 'new',
    type: 'UNSPEC',
    x:200, y:200,
    fixed:true};
    let n = nodesData.push(newNode);
    console.log(newNode)
    console.log(nodesData)
    update();
}

//---- App Start ---------------------------------------------------------------
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);

//KEYDOWN/KEYUP detection causes inability to EDIT fields in infoEdit window.
// Need to isolate this to the #whiteboard ONLY ??
//d3.select(window)
  //.on('keydown', keydown)
  //.on('keyup', keyup);
update();
