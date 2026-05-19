import { useProjectStore } from './store/projectStore.js'
import { LayoutGrid, Camera, Box, PenLine, Grid3x3 } from 'lucide-react'
import RoomTab from './components/room/RoomTab.jsx'
import PixelizerTab from './components/pixelizer/PixelizerTab.jsx'
import ViewerTab from './components/viewer/ViewerTab.jsx'
import ExportTab from './components/export/ExportTab.jsx'
import LayoutTab from './components/layout/LayoutTab.jsx'

const TABS = [
  { id: 'room',      label: 'Комната', icon: LayoutGrid },
  { id: 'pixelizer', label: 'Фото',    icon: Camera },
  { id: 'viewer',    label: '3D',      icon: Box },
  { id: 'export',    label: 'Схема',   icon: PenLine,  stub: true },
  { id: 'layout',    label: 'Укладка', icon: Grid3x3,  stub: true },
]

export default function App() {
  const { activeTab, setActiveTab } = useProjectStore()

  return (
    <div className="app">
      <div className="tab-content">
        <div className="tab-panel" data-visible={activeTab === 'room' ? 'true' : 'false'}>
          <RoomTab />
        </div>
        <div className="tab-panel" data-visible={activeTab === 'pixelizer' ? 'true' : 'false'}>
          <PixelizerTab />
        </div>
        <div className="tab-panel" data-visible={activeTab === 'viewer' ? 'true' : 'false'}>
          <ViewerTab />
        </div>
        <div className="tab-panel" data-visible={activeTab === 'export' ? 'true' : 'false'}>
          <ExportTab />
        </div>
        <div className="tab-panel" data-visible={activeTab === 'layout' ? 'true' : 'false'}>
          <LayoutTab />
        </div>
      </div>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            data-stub={tab.stub ? 'true' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={22} strokeWidth={1.75} />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
