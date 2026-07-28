import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Work from './pages/Work'
import About from './pages/About'
import Resume from './pages/Resume'
import Contact from './pages/Contact'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

// dashboard.specterui.dev serves the Dashboard page at its own root instead
// of a /dashboard path on the main domain — same SPA/Worker, routed by
// hostname since the custom domain points at the same static assets build.
const isDashboardHost = window.location.hostname.startsWith('dashboard.')

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={isDashboardHost ? <Dashboard /> : <Home />} />
        <Route path="work" element={<Work />} />
        <Route path="about" element={<About />} />
        <Route path="resume" element={<Resume />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
