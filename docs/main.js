/* global d3 */

let linkNormalC = '#5e5e5e'
let linkNormalOpacity = 0.6
let linkDarkerOpacity = 0.3
let linkNormalWidth = 1

let linkHighlightC = '#eee'
let linkHighlightWidth = 2

let bsNormalNodeC = '#fffed1'
let bsDarkerNodeC = '#787753'

let wpNormalNodeC = '#FFBE32'
let wpDarkerNodeC = '#89600F'

var container = d3.select('#network')
var width = 960
var height = 800

var svg = container.append('svg')
  .attr('id', 'chart')
  .attr('preserveAspectRatio', 'xMinYMin meet')
  .attr('viewBox', '0 0 960 800')

// ----------------------------------------
// Legend
// ----------------------------------------

var legendSvg = d3.select('#legend').append('svg')
  .attr('id', 'legendSvg')
  .attr('preserveAspectRatio', 'xMinYMin meet')
  .attr('viewBox', '0 0 312 50')

var legendWidth = 312
var legendHeight = 50

legendSvg.append('circle')
  .attr('cx', legendWidth / 3)
  .attr('cy', legendHeight / 4)
  .attr('r', 5)
  .style('fill', bsNormalNodeC)
  .style('filter', 'url(#glow)')

legendSvg.append('text')
  .attr('x', legendWidth / 3)
  .attr('y', legendHeight / 4 + 20)
  .attr('dy', '.35em')
  .style('fill', '#ccc')
  .style('text-anchor', 'middle')
  .text('Blogspot')

legendSvg.append('circle')
  .attr('cx', legendWidth * 2 / 3)
  .attr('cy', legendHeight / 4)
  .attr('r', 5)
  .style('fill', wpNormalNodeC)
  .style('filter', 'url(#glow)')

legendSvg.append('text')
  .attr('x', legendWidth * 2 / 3)
  .attr('y', legendHeight / 4 + 20)
  .attr('dy', '.35em')
  .style('fill', '#ccc')
  .style('text-anchor', 'middle')
  .text('Wordpress')

// ----------------------------------------
// Glow filter
// Following Nadieh Bremer's tutorial:
// https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization.html
// ----------------------------------------

// defs container
var defs = svg.append('defs')

var filter = defs.append('filter')
  .attr('width', '300%')
  .attr('x', '-100%')
  .attr('height', '300%')
  .attr('y', '-100%')
  .attr('id', 'glow')

filter.append('feGaussianBlur')
  .attr('class', 'blur')
  .attr('stdDeviation', '5')
  .attr('result', 'coloredBlur')

var feMerge = filter.append('feMerge')
feMerge.append('feMergeNode')
  .attr('in', 'coloredBlur')
feMerge.append('feMergeNode')
  .attr('in', 'SourceGraphic')

var simulation = d3.forceSimulation()
    .alphaDecay(0.05)
    .force('link', d3.forceLink().id(function (d) { return d.id }).distance(50))
    .force('charge', d3.forceManyBody().distanceMax(100).strength(-75))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('forceX', d3.forceX(width / 2).strength(0.02))
    .force('forceY', d3.forceY(height / 2).strength(0.1))
    .force('collision', d3.forceCollide(function (d) {
      return +d.followers.length * 2 + 10
    }))

d3.json('universe.json', function (error, graph) {
  if (error) throw error
  console.log('graph', graph)

  var linksGroup = svg.append('g').attr('class', 'links')
  var nodesGroup = svg.append('g').attr('class', 'nodes')
  var tooltipGroup = svg.append('g').attr('class', 'tooltip-wrapper')

  var link = linksGroup
    .selectAll('line')
    .data(graph.links)
    .enter().append('line')
      .attr('class', d => d.target + ' link')
      .attr('stroke-width', 1)

  var node = nodesGroup
    .selectAll('circle')
    .data(graph.nodes)
    .enter().append('circle')
      .attr('id', d => d.id)
      .attr('r', d => +d.followers.length / 2 + 3)
      .attr('class', 'node')
      .style('fill', d => {
        if (d.platform === 'blogspot') return bsNormalNodeC
        else return wpNormalNodeC
      })
      .style('filter', 'url(#glow)')
      .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

  tooltipGroup
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
    .style('opacity', 0)

  var tooltipTitle = tooltipGroup.append('text')
    .attr('class', 'tooltip-title')
    .attr('y', 15)
    .text('title')

  node.on('mouseover', (d, i, nodes) => {
    tooltipTitle.text(d.id)
    let radio = +d.followers.length / 2 + 3

    tooltipGroup
      .attr('transform', 'translate(' + d.x + ',' + (d.y - (radio + 25)) + ')')
    tooltipGroup
     .style('opacity', 1)

    // Change cursor
    d3.select(nodes[i])
      .attr('cursor', 'pointer')

    // hightlight links
    d3.selectAll('.' + d.id)
      .style('stroke', linkHighlightC)
      .style('stroke-width', linkHighlightWidth)

    // Select all nodes that are not followers and fill them darker
    d3.selectAll('circle.node')
      .filter(e => {
        return d.followers.indexOf(e.id) === -1 && d.id !== e.id
      })
      .style('fill', e => {
        if (e.platform === 'blogspot') return bsDarkerNodeC
        else return wpDarkerNodeC
      })

    // Select all links that are not followers and stroke them darker
    d3.selectAll('line.link:not(.' + d.id + ')')
      .style('stroke-opacity', linkDarkerOpacity)
      .style('stroke-width', 1)
  })
  node.on('mouseout', (d, i, nodes) => {
    tooltipGroup
     .style('opacity', 0)
    d3.selectAll('line.link')
      .style('stroke', linkNormalC)
      .style('stroke-opacity', linkNormalOpacity)
      .style('stroke-width', linkNormalWidth)
    d3.selectAll('circle.node')
      .style('fill', d => {
        if (d.platform === 'blogspot') return bsNormalNodeC
        else return wpNormalNodeC
      })
  })

  node.on('click', d => window.open('http://' + d.id + '.blogspot.com', '_blank'))

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
