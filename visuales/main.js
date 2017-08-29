/* global d3 */
var svg = d3.select('svg')
var width = +svg.attr('width')
var height = +svg.attr('height')

// var color = d3.scaleOrdinal(d3.schemeCategory20)

var simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(function (d) { return d.id }).distance(70))
    .force('charge', d3.forceManyBody().distanceMax(200).strength(-75))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('forceX', d3.forceX(width / 2).strength(0.01))
    .force('forceY', d3.forceY(height / 2).strength(0.04))
    .force('collision', d3.forceCollide(function (d) {
      return +d.followers.length * 2 + 10
    }))

d3.json('universe.json', function (error, graph) {
  if (error) throw error
  console.log('graph', graph)

  var link = svg.append('g')
      .attr('class', 'links')
    .selectAll('line')
    .data(graph.links)
    .enter().append('line')
      .attr('class', d => d.target)
      .attr('stroke-width', 1) // d => Math.sqrt(d.value)

  var node = svg.append('g')
      .attr('class', 'nodes')
    .selectAll('circle')
    .data(graph.nodes)
    .enter().append('circle')
      .attr('id', d => d.id)
      .attr('r', d => +d.followers.length / 2 + 3)
      .attr('fill', '#fffed1')
      .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

  node.append('title')
      .text(d => d.id)

  node.on('mouseover', (d, i, nodes) => {
    d3.select(nodes[i])
      .attr('fill', 'yellow')
      .style('stroke-opacity', 0.6)
      .style('stroke', '#fffc7a')
    d3.selectAll('.' + d.id)
      .style('stroke', 'yellow')
      .style('stroke-width', 1.5)
    d.followers.map(blog => blog.source).forEach(id => {
      d3.select('#' + id)
        .style('stroke-opacity', 0.6)
        .style('stroke', '#fffc7a')
    })
  })
  node.on('mouseout', (d, i, nodes) => {
    d3.select(nodes[i])
      .attr('fill', '#fffed1')
      .style('stroke-opacity', 0.2)
      .style('stroke', '#fff')
    d3.selectAll('.' + d.id)
      .style('stroke', '#999')
      .style('stroke-width', 1)
    d.followers.map(blog => blog.source).forEach(id => {
      d3.select('#' + id)
        .style('stroke-opacity', 0.2)
        .style('stroke', '#fff')
    })
  })

  simulation
      .nodes(graph.nodes)
      .on('tick', ticked)

  simulation
      .force('link')
      .links(graph.links)

  function ticked () {
    link
        .attr('x1', function (d) { return d.source.x })
        .attr('y1', function (d) { return d.source.y })
        .attr('x2', function (d) { return d.target.x })
        .attr('y2', function (d) { return d.target.y })

    node
        .attr('cx', function (d) { return d.x })
        .attr('cy', function (d) { return d.y })
  }
})

function dragstarted (d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged (d) {
  d.fx = d3.event.x
  d.fy = d3.event.y
}

function dragended (d) {
  if (!d3.event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}
