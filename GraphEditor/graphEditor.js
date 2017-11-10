/*-----------------------------------------------------------------------------
FILE: /LinkedDataDev/GraphEditor/graphEditor.js
DESC: Called from graphEditor.html
REQ :
VIEW: http://localhost:8000/GraphEditor/GraphEditor.html
SRC : http://bl.ocks.org/rkirsling/5001347
IN  :
OUT : WhiteBoardTriples.TTL
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

// set up the SVG
var width  = 1400,
  height = 600,
  colors = d3.scale.category10();

var nodeRadius = 50,
 backOffTarget = nodeRadius+5, // back the arrow away from the node center
 linkLength    = 300;

var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

  svg.append("image")
    .attr("xlink:href", "/graphEditor/img/whiteboard.png")
    .attr("x", -240)
    .attr("y", 0)
    .attr("width", "100%")
    .attr("height", "100%");

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array. Re-inforces they must be unique URIs
//  - links are always source -to--> target of dragging. Edge directions can be reset using L, R.
var nodes = [
  {id: 'STUDY1',  x:500, y:100, fixed:true, type: 'URI'},
  {id: 'TREAT1',  x:350, y:300, fixed:true, type: 'URI'},
  {id: 'PERSON1', x:200, y:100, fixed:true, type: 'URI'}
  ],
  links = [
    {source: nodes[0], target: nodes[1], left: false, right: true ,linkLabel: 'treatmentArm'},
    {source: nodes[2], target: nodes[1], left: false, right: true, linkLabel: 'treatment'},
    {source: nodes[2], target: nodes[0], left: false, right: true, linkLabel: 'enrolledIn'}
  ];

// Initialize D3 force layout
var force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .size([width, height])
  .linkDistance(linkLength)
  .charge(-500)
  .on('tick', tick);

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

// Mouse event var initializations and reset
var selected_node = null,
  selected_link   = null,
  mousedown_link  = null,
  mousedown_node  = null,
  mouseup_node    = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node   = null;
  mousedown_link = null;
}

// Update force layout
function tick() {
  // Edges backed out from node centers with adding & backlOffTarget
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
      deltaY = d.target.y - d.source.y,
      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      normX = deltaX / dist,
      normY = deltaY / dist,
      sourcePadding = d.left ? backOffTarget : 12,
      targetPadding = d.right ? backOffTarget : 12,
      sourceX = d.source.x + (sourcePadding * normX),
      sourceY = d.source.y + (sourcePadding * normY),
      targetX = d.target.x - (targetPadding * normX),
      targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  // Link text positioning.
  // TODO: Add classes. Add rotation??
  linkText
    .attr("x", function(d){
      return ((d.source.x+d.target.x)/2);
      })
    .attr("y", function(d){
      return ( ( (d.source.y + d.target.y)/2) -5 );
      });

  circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')'
  })
}

// Update graph (called when needed)
function restart() {

  //---------- LINKS SECTION --------------------------------------------------

  path = path.data(links);

  // Update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end',   function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  // Add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // Select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      restart();
    });

// Link text values
   linkText = linkText.data(links);
   linkText.enter().append("text")
     .text(function(d){
       return d.linkLabel;
     })
     .attr("class", "linkLabel")
   ;

  // Remove old links
  path.exit().remove();

  // Remove linkText
  linkText.exit().remove();

  //---------- NODES SECTION --------------------------------------------------
  // circle (node) group
  // NB: the function arg is crucial: Nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // Change to base node color on node type using class/CSS
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ?
      d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
    });

  // Add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', nodeRadius)
    // Node is selected. Hook in to this code to display/edit node text and type
    .style('fill', function(d) {
      return (d === selected_node) ? d3.rgb(colors(d.id))
      .brighter()
      .toString() : colors(d.id);
    })
    .style('stroke', function(d) {
      return d3.rgb(colors(d.id))
      .darker()
      .toString(); })
    .on('mouseover', function(d) {
        if(!mousedown_node || d === mousedown_node) return;
        // enlarge target node
        d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
        if(!mousedown_node || d === mousedown_node) return;
        // unenlarge target node
        d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
        if(d3.event.ctrlKey) return;
        // select node
        mousedown_node = d;
        if(mousedown_node === selected_node) selected_node = null;
        else selected_node = mousedown_node;
        selected_link = null;

        // reposition drag line
        drag_line
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
        restart();
    })
    .on('mouseup', function(d) {
        if(!mousedown_node) return;

        //RK Needed by FF
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');

        //RK Check for drag-to-self  (remove for class?)
        mouseup_node = d;
        if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

        //RK Unenlarge target node
        d3.select(this).attr('transform', '');

        // Add link to graph (update if exists)
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
            var relationship = prompt("Please enter relationship",'relationship');
            link = {source: source, target: target, left: false, right: false, linkLabel: relationship};
            link[direction] = true;
            links.push(link);
        }

        // Select new link
        selected_link = link;
        selected_node = null;
        restart();
    });

  // Node text (ID value)
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .text(function(d) { return d.id; });

  // Remove old nodes
  circle.exit()
        .remove();

  // Start force display
  force.start();
}
// Export TTL File
var button = document.createElement("button");
button.innerHTML = "Create TTL";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
  alert("This will create the TTL file. Click OK to confirm.");

  // Test with write to console
  for(var i = 0; i < links.length; i++) {
    var obj = links[i];
    if (obj.target.type =='URI') {
     console.log(obj.source.id + " -- " + obj.linkLabel + " --> " + obj.target.id);
    }
    else{
      if (obj.target.type =='INT') {
        console.log(obj.source.id + ' -- ' + obj.linkLabel + ' --> "' + obj.target.id + '"^^xsd:integer');
      }
      else if (obj.target.type =='STRING') {
        console.log(obj.source.id +' -- '+ obj.linkLabel+' --> "' + obj.target.id + '"^^xsd:string');
      }
    }
  }





  /*
  var writer = N3.Writer({ prefixes: { c: 'http://example.org/cartoons#' } });
  writer.addTriple('http://example.org/cartoons#Tom',
                   'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                   'http://example.org/cartoons#Cat');
  writer.addTriple({
    subject:   'http://example.org/cartoons#Tom',
    predicate: 'http://example.org/cartoons#name',
    object:    '"Tom"'
  });
  writer.end(function (error, result) {
     console.log(result);
    var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "WhiteBoardTriples.ttl");
  });
*/

});



function mousedown() {

  //RK Active only works in WebKit?
  svg.classed('active', true);
  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  // Insert new node at point
  let addNode = true;
  let vertex_id = "vertex";
  while (addNode && vertex_id) {
    vertex_id = prompt("Please enter term", vertex_id);
    if (vertex_id) { // Allow cancel of node creation with no null node created!
      let currentIDs = nodes.map(function(o){return o.id})
      if (!currentIDs.some(function(item){ return item === vertex_id })) {
        var point = d3.mouse(this),
            node = {id: vertex_id};
        node.x = point[0];
        node.y = point[1];
        node.fixed = true;
        node.type = 'URI'; //TODO Need to set this during node creation to URI,STRING, INT, etc.
        nodes.push(node);
        restart();
        addNode = false;
      } else {
        alert("ID already exists");
      }
    }
  }
}

function mousemove() {
  if(!mousedown_node) return;

  // Update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

  restart();
}

function mouseup() {
  if(mousedown_node) {
    // hide  line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  //RK because :active only works in WebKit?
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

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
          nodes.splice(nodes.indexOf(selected_node), 1);
          spliceLinksForNode(selected_node);
      } else if(selected_link) {
          links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
    case 66: // B
      if(selected_link) {
          // set link direction to both left and right
          selected_link.left = true;
          selected_link.right = true;
      }
      restart();
      break;
    case 76: // L
      if(selected_link) {
          // set link direction to left only
          selected_link.left = true;
          selected_link.right = false;
      }
      restart();
      break;
    case 82: // R
      if(selected_node) {
          // Was used to toggle node reflexivity. Not in use for simplified graph
          // All other reflexive code removed
          // selected_node.reflexive = !selected_node.reflexive;
      } else if(selected_link) {
          // set link direction to right only
          selected_link.left = false;
          selected_link.right = true;
      }
      restart();
      break;
  }
}

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

// Start the App
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
