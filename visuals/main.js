/* global d3 */
var svg = d3.select('svg')
var width = +svg.attr('width')
var height = +svg.attr('height')

// var color = d3.scaleOrdinal(d3.schemeCategory20)
let linkNormalC = '#5e5e5e'
// let linkDarkerC = '#444'
let linkNormalOpacity = 0.6
let linkDarkerOpacity = 0.3
let linkNormalWidth = 1

let linkHighlightC = '#eee'
let linkHighlightWidth = 2

let bsNormalNodeC = '#fffed1'
let bsDarkerNodeC = '#787753'

let wpNormalNodeC = '#FFBE32'
let wpDarkerNodeC = '#89600F'

// /////////////////// Glow filter ///////////////////////////
// Following Nadieh Bremer's tutorial:
// https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization.html

// defs container
var defs = svg.append('defs')

// //Filter for the outside glow
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
//
//
// //Blur for the royal leaders
// var filterIntense = defs.append('filter')
//   .attr('width', '300%')
//   .attr('x', '-100%')
//   .attr('height', '300%')
//   .attr('y', '-100%')
//   .attr('id','glow-intense')
//
// filterIntense.append('feGaussianBlur')
//   .attr('class', 'blur')
//   .attr('stdDeviation','3')
//   .attr('result','coloredBlur');

var simulation = d3.forceSimulation()
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

  var link = svg.append('g')
      .attr('class', 'links')
    .selectAll('line')
    .data(graph.links)
    .enter().append('line')
      .attr('class', d => d.target + ' link')
      .attr('stroke-width', 1) // d => Math.sqrt(d.value)

  var node = svg.append('g')
      .attr('class', 'nodes')
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

  node.append('title')
      .text(d => d.id)

  node.on('mouseover', (d, i, nodes) => {
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
      // .style('stroke', linkDarkerC)
      .style('stroke-opacity', linkDarkerOpacity)
      .style('stroke-width', 1)
  })
  node.on('mouseout', (d, i, nodes) => {
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
