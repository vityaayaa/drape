export default function PixelizerTab() {
  return (
    <div style={s.container}>
      <p style={s.title}>Фото</p>
      <p style={s.sub}>Раздел появится в этапе 4</p>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 },
  title:     { fontSize: 22, fontWeight: 700, color: '#111827' },
  sub:       { fontSize: 14, color: '#9ca3af' },
}
