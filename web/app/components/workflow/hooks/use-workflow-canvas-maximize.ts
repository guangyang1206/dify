import { useCallback } from 'react'
import { useEventEmitterContextContext } from '@/context/event-emitter'
import { useStore } from '../store'
import { useNodesReadOnly } from './use-workflow'
import { useSetLocalStorage } from '@/hooks/use-local-storage'

export const useWorkflowCanvasMaximize = () => {
  const { eventEmitter } = useEventEmitterContextContext()
  const maximizeCanvas = useStore(s => s.maximizeCanvas)
  const setMaximizeCanvas = useStore(s => s.setMaximizeCanvas)
  const { getNodesReadOnly } = useNodesReadOnly()

  const setWorkflowCanvasMaximize = useSetLocalStorage<boolean>('workflow-canvas-maximize', { raw: true })

  const handleToggleMaximizeCanvas = useCallback(() => {
    if (getNodesReadOnly())
      return

    const nextValue = !maximizeCanvas
    setMaximizeCanvas(nextValue)
    setWorkflowCanvasMaximize(nextValue)
    eventEmitter?.emit({
      type: 'workflow-canvas-maximize',
      payload: nextValue,
    } as never)
  }, [eventEmitter, getNodesReadOnly, maximizeCanvas, setMaximizeCanvas, setWorkflowCanvasMaximize])

  return {
    handleToggleMaximizeCanvas,
  }
}
