import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { EntryForm } from './pages/EntryForm';
import { EntryList } from './pages/EntryList';
import { NotFound } from './pages/NotFound';
import { AuthPage } from './pages/AuthPage';
import { UserProvider } from './components/UserContext';

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<NavBar />}>
          <Route index element={<EntryList />} />
          <Route path="details/:entryId" element={<EntryForm />} />
          <Route path="auth/sign-up" element={<AuthPage mode="sign-up" />} />
          <Route path="auth/sign-in" element={<AuthPage mode="sign-in" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </UserProvider>
  );
}
