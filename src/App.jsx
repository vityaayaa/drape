import { useProjectStore } from './store/projectStore.js'
import RoomTab from './components/room/RoomTab.jsx'
import PixelizerTab from './components/pixelizer/PixelizerTab.jsx'
import ViewerTab from './components/viewer/ViewerTab.jsx'
import ExportTab from './components/export/ExportTab.jsx'
import LayoutTab from './components/layout/LayoutTab.jsx'

const TABS = [
  { id: 'room',      label: 'Комната' },
  { id: 'pixelizer', label: 'Фото' },
  { id: 'viewer',    label: '3D' },
  { id: 'export',    label: 'Схема' },
  { id: 'layout',    label: 'Укладка' },
]

export default function App() {
  const { activeTab, setActiveTab } = useProjectStore()

  return (
    <div className="app">
      <div className="tab-content">
        <div className="tab-panel" style={{ display: activeTab === 'room' ? 'block' : 'none' }}>
          <RoomTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'pixelizer' ? 'block' : 'none' }}>
          <PixelizerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'viewer' ? 'block' : 'none' }}>
          <ViewerTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'export' ? 'block' : 'none' }}>
          <ExportTab />
        </div>
        <div className="tab-panel" style={{ display: activeTab === 'layout' ? 'block' : 'none' }}>
          <LayoutTab />
        </div>
      </div>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
