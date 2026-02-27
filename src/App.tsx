import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Account } from './pages/account';
import { Auth } from './pages/auth';
import { Content } from './pages/content';
import { Evaluations } from './pages/evaluations';
import { Home } from './pages/home';
import { Post } from './pages/post';
import { PostStatus } from './pages/post-status';

export default function App() {
  return (
    <Routes>
      {/* Auth routes (no layout) */}
      <Route path="/auth/:pathname" element={<Auth />} />

      {/* Protected routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/post/:postId" element={<PostStatus />} />
        <Route path="/content" element={<Content />} />
        <Route path="/evaluations" element={<Evaluations />} />
        <Route path="/account/:pathname" element={<Account />} />
      </Route>
    </Routes>
  );
}
