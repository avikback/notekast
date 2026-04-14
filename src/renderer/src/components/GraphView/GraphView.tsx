import React, { useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import Icon from '../Icon/Icon'
import { useApp } from '../../context/AppContext'
import styles from './GraphView.module.css'

const NODE_COLOR_REST   = '#3d7d72'
const EDGE_PEER_COLOR   = '#5aada0'
const EDGE_PARENT_COLOR = 'rgba(200, 190, 100, 0.6)'

/** Truncates a title for use as a graph node label. */
function _shortLabel(title: string): string {
  if (!title) return '(Untitled)'
  return title.length > 22 ? title.slice(0, 21) + '…' : title
}

/** Interactive force-directed graph of notes using Graphology + Sigma.js. */
const GraphView: React.FC = () => {
  const { state, dispatch } = useApp()

  const _goList = (): void => dispatch({ type: 'SET_PANEL_VIEW', view: 'list' })
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const notes = state.notes
    if (notes.length === 0) return

    const graph = new Graph()
    graphRef.current = graph

    // Add nodes with initial random positions
    notes.forEach((n) => {
      graph.addNode(n.id, {
        label: _shortLabel(n.title),
        title: n.id,
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        size: 8,
        color: NODE_COLOR_REST
      })
    })

    // Add edges
    notes.forEach((n) => {
      if (n.parent && graph.hasNode(n.parent)) {
        const eId = `parent:${n.id}`
        if (!graph.hasEdge(eId)) {
          graph.addEdge(n.id, n.parent, { id: eId, color: EDGE_PARENT_COLOR, size: 1.5 })
        }
      }
      n.links.forEach((linkId) => {
        if (!graph.hasNode(linkId)) return
        const eId = `link:${n.id}:${linkId}`
        if (!graph.hasEdge(eId) && !graph.hasEdge(`link:${linkId}:${n.id}`)) {
          graph.addEdge(n.id, linkId, { id: eId, color: EDGE_PEER_COLOR, size: 1 })
        }
      })
    })

    // Run initial layout passes — tight clustering settings
    const settings = { ...forceAtlas2.inferSettings(graph), scalingRatio: 0.08, gravity: 8, strongGravityMode: true }
    forceAtlas2.assign(graph, { iterations: 200, settings })

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultNodeColor: NODE_COLOR_REST,
      defaultEdgeColor: EDGE_PEER_COLOR,
      labelColor: { color: '#e0e0e0' },
      labelSize: 13,
      labelFont: 'Segoe UI, Ubuntu, sans-serif',
      minCameraRatio: 0.1,
      maxCameraRatio: 10
    })
    sigmaRef.current = renderer

    // Continuous physics animation (3 iterations per frame)
    let dragging = false
    let draggedNode: string | null = null

    const runPhysics = (): void => {
      if (!dragging) {
        forceAtlas2.assign(graph, { iterations: 3, settings })
      }
      renderer.refresh()
      animRef.current = requestAnimationFrame(runPhysics)
    }
    animRef.current = requestAnimationFrame(runPhysics)

    // Node drag
    renderer.on('downNode', ({ node }) => {
      dragging = true
      draggedNode = node
      renderer.getCamera().disable()
    })
    renderer.getMouseCaptor().on('mousemovebody', (e) => {
      if (!dragging || !draggedNode) return
      const pos = renderer.viewportToGraph(e)
      graph.setNodeAttribute(draggedNode, 'x', pos.x)
      graph.setNodeAttribute(draggedNode, 'y', pos.y)
    })
    renderer.getMouseCaptor().on('mouseup', () => {
      dragging = false
      draggedNode = null
      renderer.getCamera().enable()
    })

    // Single click → open pop-out
    renderer.on('clickNode', ({ node }) => {
      const note = notes.find((n) => n.id === node)
      if (note) {
        window.api.openPopout(note.id, note.projectPath)
      }
    })

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.kill()
      sigmaRef.current = null
      graphRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notes])

  return (
    <div className={styles.wrapper}>
      <button className={styles.backBtn} onClick={_goList}>
        <Icon name="list-view" size={14} />
        List
      </button>
      {state.notes.length === 0 ? (
        <p className={styles.empty}>
          No notes yet — create some notecards to see the graph.
        </p>
      ) : (
        <div ref={containerRef} className={styles.canvas} />
      )}
    </div>
  )
}

export default GraphView
