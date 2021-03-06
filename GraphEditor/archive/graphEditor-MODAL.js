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

// Prevent context menu
// document.addEventListener('contextmenu', event => event.preventDefault());

// set up the SVG
var width  = 1400,
  height = 900,
  colors = d3.scale.category10();

width = window.innerWidth*0.6
//height = window.innerHeight*0.6

var nodeRadius = 40,
  backOffTarget = nodeRadius+5, // back the arrow away from the node center
  linkLength    = 300;

/* Zoom extent of -2 allows zoom out smaller than original */
var zoom = d3.behavior.zoom().scaleExtent([-2, 2]).on("zoom", zoomed);

let bodyElement = d3.select('body')
var svg = bodyElement.append('svg')
  .attr('width', width)
  .attr('height', height);

// let dynamicContent = bodyElement.append('div').attr("border","10px");
let dynamicTable = bodyElement.append('table')
let thead = dynamicTable.append("thead")
let tbody = dynamicTable.append("tbody")

thead.append("tr")
  .selectAll('th')
  .data(["key","value"]).enter()
  .append("th")
  .text(function (column) { return column; });

let tableEmpty = true

function updateTable(data,columns) {
  // Convert node properties to list with key-value pairs ( e.x. key:property, value: property-value. E.g. key: ID, value: VERTEX)
  let keyValuePairs = [], item;

  for (let type in data) {
      item = {};
      item.key = type;
      item.value = data[type];
      keyValuePairs.push(item);
  }

  // create a row for each key-value pair in the data
  var rows = tbody.selectAll('tr')
        .data(keyValuePairs, function (d) { return d.value; })

  rows.enter()
      .append('tr');

// create a cell in each row for each column (i.e. key, value)
  var cells = rows.selectAll('td')
    .data(function (row) {
      return columns.map(function (column) {
        return {column: column, value: row[column]};
      });
    })

  // Add the cells
  cells.enter()
    .append('td')
    .text(function (d) { return d.value; });

  // Remove old rows and columns
  rows.exit().remove();
  cells.exit().remove();

}

// Set up initial nodes and links
//  - nodes are known by 'id', not by index in array. Re-inforces they must be unique URIs
//  - links are always source -to--> target of dragging. Edge directions can be reset using L, R.
var nodes = [
  {n:0, id: 'PRODUCT1',
    nodePrefix:"ldw",
    type: 'URI',
    nodeFill:"white",
    x:500, y:60,
    fixed:true,
    comment:""},
  {n:1, id: 'Serum 114',
    nodePrefix:"",
    type: 'STRING',
    nodeFill:"white",
    x:700, y:60,
    fixed:true,
    comment:""},
  {n:2, id: 'F',
    nodePrefix:"ldw",
    type: 'URI',
    nodeFill:"#e6add8",
    x:100, y:400,
    fixed:true,
    comment:""},
  {n:3, id: 'C16576',
    nodePrefix:"sdtmterm",
    type: 'URI',
    nodeFill:"#c6cbcd",
    x:100, y:600,
    fixed:true,
    comment:"NCI code"},
  {n:4, id: 'M',
    nodePrefix:"ldw",
    type: 'URI',
    nodeFill:"#add8e6",
    x:200, y:400,
    fixed:true,
    comment:"male"},
  {n:5, id: 'C20197',
    nodePrefix:"sdtmterm",
    type: 'URI',
    nodeFill:"#c6cbcd",
    x:200, y:600,
    fixed:true,
    comment:"NCI Code"}
  ],
  links = [
    {source: nodes[0], target: nodes[1],
      linkLabel: 'label', linkPrefix:"foo", left: false, right: true },
    {source: nodes[2], target: nodes[3],
      linkLabel: 'nciCode', linkPrefix:"sdtmterm", left: false, right: true},
    {source: nodes[4], target: nodes[5],
      linkLabel: 'nciCode', linkPrefix:"sdtmterm", left: false, right: true}
  ];

// Initialize D3 force layout
var force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .size([width, height])
  .linkDistance(linkLength)
  .charge(-500)
  .on('tick', tick);

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
    .attr("transform", function(d) { // calc angle for label
      var angle = Math.atan((d.source.y - d.target.y) / (d.source.x - d.target.x)) * 180 / Math.PI;
      return 'translate(' + [((d.source.x + d.target.x) / 2), ((d.source.y + d.target.y) / 2)] + ')rotate(' + angle + ')';
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
    .classed('selected',   function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end',   function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('mousedown',       function(d) {
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
      .attr("filter", "url(#solid)")
      .attr("class", "linkLabel")
      .attr("dy", 5)        // adjust label down into line center
      .text(function(d){
        return d.linkLabel;
      });

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
   /* Change a selected node to fill-white with brigher(15) and dashed stroke */
   .style('fill', function(d) { return (d === selected_node) ?
       d3.rgb(colors(d.id)).brighter(15).toString() : colors(d.id);
      })
   .style('stroke-dasharray', function(d) { return (d === selected_node) ?
          ("3, 3") : ("0, 0");
         })
      ;
  // Add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', nodeRadius)
    .style('fill', 'white')
    .style('stroke', "black")
    .style('fill', function(d) {
      return (d === selected_node) ? d3.rgb(colors(d.id))
      .brighter()
      .toString() : colors(d.id);
      })

/*
.style('stroke', function(d) {
  if (d === selcted_node) ? return d3.rgb(colors(d.id))
  .darker()
  .toString(); })
*/
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

// Get the modal
let modalDiv = document.getElementById('myModal');
// let dynamicContent = document.getElementById('dynamic-content');
let modalMessage = document.getElementById('modal-message');
let modalAddButton = document.getElementById('add_button');

// Create the button that opens the modal message
let showMessageButton = document.createElement("button");
showMessageButton.innerHTML = "Help";

// Create the button that shows the properties
let showPropertiesButton = document.createElement("button");
showPropertiesButton.innerHTML = "Show properties";

// Get the <span> element that closes the modal
var cancelButton = document.getElementsByClassName("cancel_button")[0];
var okButton = document.getElementsByClassName("ok_button")[0];
var close = document.getElementsByClassName("close")[0];
// alert(JSON.stringify(close))

// Export TTL File
var createTTLButton = document.createElement("button");
createTTLButton.innerHTML = "Create TTL";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(createTTLButton);
body.appendChild(showPropertiesButton);
body.appendChild(showMessageButton);

showPropertiesButton.addEventListener ("click", function() {
  // for (var key in selected_node) {
  //   if (selected_node.hasOwnProperty(key)) {
      // let theDomElement = document.createElement("div")
      // theDomElement.setAttribute("style","float:left;clear:left;padding:10px 10px;border:10px;")
      // let thePair = document.createTextNode(key + " -> " + selected_node[key])
      // theDomElement.appendChild(thePair)
      // dynamicContent.appendChild(theDomElement)
      // console.log(key + " -> " + selected_node[key]);
  //   }
  // }
  if (!selected_node && !selected_link) {
    alert("Please select a node or link")
    return;
  }
  if (selected_node) {
    updateTable(selected_node,["key","value"])

  }
  if (selected_link) {
    updateTable(selected_link,["key","value"])
  }
});

showMessageButton.addEventListener ("click", function() {
  // modalMessage.innerHTML = JSON.stringify(selected_node)
  modalMessage.innerHTML = "<b>HELP</b><br>" +
    "<table cellspacing='10px' class='help'>" +
    "<tr><td>Drag node</td><td>CTRL + left mouse button</td></tr>" +
    "<tr><td>Delete node</td><td>Select node, DEL key</td></tr>" +
    "<tr><td>Delete link</td><td>Select link, DEL key</td></tr>" +
    "<tr><td>Reset Whiteboard</td><td>Reload browser window. <font color='red'>All your work will be lost!</font></td></tr>" +
    "</table>"
  modalDiv.style.display = "block";
});

// modalAddButton.addEventListener ("click", function() {
//   let p = document.createElement("p")
//   p.innerHTML ="hopps"
//   dynamicContent.appendChild(p);
// });

cancelButton.addEventListener ("click", function() {
  modalDiv.style.display = "none";
  return false
  // while (dynamicContent.firstChild) {
  //     dynamicContent.removeChild(dynamicContent.firstChild);
  // }
});
okButton.addEventListener ("click", function() {
  modalDiv.style.display = "none";
  return true
});

// 3. Add event handler
createTTLButton.addEventListener ("click", function() {
  alert("This will create the TTL file. Click OK to confirm.");

  // Set the prefixes
  var writer = N3.Writer({ prefixes: { ldw: 'http://example.org/LDWorkshop#' } });
  // Test with write to console
  for(var i = 0; i < links.length; i++) {
    var obj = links[i];
    // Prefixes are hard-coded.
    // All values are currently URI's
    if (obj.target.type =='URI') {
      writer.addTriple('ldw:' + obj.source.id,
                       'ldw:' + obj.linkLabel,
                       'ldw:' + obj.target.id);

     // console.log(obj.source.id + " -- " + obj.linkLabel + " --> " + obj.target.id);
    }
    else{
    // Literal values are enquoted with use of '"'
      if (obj.target.type =='INT') {
        writer.addTriple('ldw:' + obj.source.id,
                         'ldw:' + obj.linkLabel,
                         '"'+ obj.target.id + '"^^xsd:integer');
        // console.log(obj.source.id + ' -- ' + obj.linkLabel + ' --> "' + obj.target.id + '"^^xsd:integer');
      }
      else if (obj.target.type =='STRING') {
        writer.addTriple('ldw:' + obj.source.id,
                         'ldw:' + obj.linkLabel,
                         '"'+ obj.target.id + '"^^xsd:string');
        //console.log(obj.source.id +' -- '+ obj.linkLabel+' --> "' + obj.target.id + '"^^xsd:string');
      }
    }
  }
  // Write out to file
  writer.end(function (error, result) {
     console.log(result);
    var blob = new Blob([result], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "WhiteBoardTriples.ttl");
  });
});



function mousedown() {
  //RK Active only works in WebKit?
  svg.classed('active', true);
  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

  // Insert new node at point
  let addNode = true;
  let vertex_id = "vertex";
  let currentIDs = nodes.map(function(o){return o.id})
  while (addNode && vertex_id) {
    vertex_id = prompt("Please enter term", vertex_id);
    switch (addNode) {
      // If cancel is pressed, exit while loop
      case vertex_id === null:
        addNode = false
        break
      // If vertex_id is empty string (""), assign value to vertex_id so that the prompt is shown again
      case vertex_id.length === 0:
        alert("Term cannot be empty");
        vertex_id = "vertex";
        break
      case vertex_id.length > 0:
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
        break
      default:
        break
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
/* NEW SHITE */
function zoomed() {
    svg.attr("transform",
        "translate(" + zoom.translate() + ")" +
        "scale(" + zoom.scale() + ")"
    );
}

function interpolateZoom (translate, scale) {
    var self = this;
    return d3.transition().duration(350).tween("zoom", function () {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
            iScale = d3.interpolate(zoom.scale(), scale);
        return function (t) {
            zoom
                .scale(iScale(t))
                .translate(iTranslate(t));
            zoomed();
        };
    });
}
function zoomClick() {
    var clicked = d3.event.target,
        direction = 1,
        factor = 0.2,
        target_zoom = 1,
        center = [width / 2, height / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    d3.event.preventDefault();
    direction = (this.id === 'zoom_in') ? 1 : -1;
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
    view.k = target_zoom;
    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    interpolateZoom([view.x, view.y], view.k);
}

d3.selectAll('button.zoom').on('click', zoomClick);
/* END NEW SHITE */

// Start the App
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
