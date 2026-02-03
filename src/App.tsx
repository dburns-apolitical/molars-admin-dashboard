import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Account } from './pages/account';
import { Auth } from './pages/auth';
import { Home } from './pages/home';
import { Post } from './pages/post';

export default function App() {
  return (
    <Routes>
      {/* Auth routes (no layout) */}
      <Route path="/auth/:pathname" element={<Auth />} />

      {/* Protected routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/account/:pathname" element={<Account />} />
      </Route>
    </Routes>
  );
}
