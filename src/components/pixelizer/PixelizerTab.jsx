import { useProjectStore } from '../../store/projectStore.js'
import { useHistoryStore } from '../../store/historyStore.js'

export default function PixelizerTab() {
  const { testCounter, incrementCounter } = useProjectStore()
  const { past, future, push, undo, redo } = useHistoryStore()

  const handleIncrement = () => {
    push(useProjectStore.getState().getSnapshot())
    incrementCounter()
  }

  const handleUndo = () => {
    const prev = undo(useProjectStore.getState().getSnapshot())
    if (prev) useProjectStore.getState().restoreSnapshot(prev)
  }

  const handleRedo = () => {
    const next = redo(useProjectStore.getState().getSnapshot())
    if (next) useProjectStore.getState().restoreSnapshot(next)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Фото</h1>
      <p style={styles.subtitle}>Раздел появится в этапе 4</p>
      <div style={styles.undoRow}>
        <button style={styles.btn} onClick={handleUndo} disabled={past.length === 0}>↩ Отменить</button>
        <button style={styles.btn} onClick={handleRedo} disabled={future.length === 0}>↪ Повторить</button>
      </div>
      <div style={styles.counterBlock}>
        <p style={styles.counterLabel}>Тест undo/redo: {testCounter}</p>
        <button style={styles.btn} onClick={handleIncrement}>+1</button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 },
  title:     { fontSize: 28, fontWeight: 700 },
  subtitle:  { fontSize: 14, color: '#888' },
  undoRow:   { display: 'flex', gap: 12 },
  counterBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 18 },
  btn:       { padding: '10px 20px', background: '#2a2a2a', color: '#f0f0f0', border: '1px solid #444', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
}
