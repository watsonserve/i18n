import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Layout } from '@arco-design/web-react';
import { IconCaretRight, IconCaretLeft } from '@arco-design/web-react/icon';
import './App.css';
import Siderbar from './views/Sidebar';
import DictPage from './views/DictPage';
import ReleasePage from './views/ReleasePage';

const Sider = Layout.Sider;

export default function App() {
  const [collapsed, setCollapsed] = useState(true);

  const handleCollapsed = () => setCollapsed(!collapsed);
  
  return (
    <BrowserRouter>
      <Layout className='app'>
          <Sider
            collapsed={collapsed}
            collapsible
            onCollapse={handleCollapsed}
            trigger={collapsed ? <IconCaretRight /> : <IconCaretLeft />}
            breakpoint='xl'
          >
            <Siderbar />
          </Sider>
          <Layout>
            <Routes>
              <Route path="/dict" element={<DictPage />} />
              <Route path="/release" element={<ReleasePage />} />
            </Routes>
          </Layout>
      </Layout>
    </BrowserRouter>
  );
}