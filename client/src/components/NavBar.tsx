import { Link, Outlet } from 'react-router-dom';
import { useUser } from './useUser';

export function NavBar() {
  const { user, handleSignOut } = useUser();
  return (
    <>
      <header className="purple-background">
        <div className="container">
          <div className="row justify-between align-center">
            <div className="column-half d-flex align-baseline">
              <h1 className="white-text">Code Journal</h1>
              <Link to="/" className="entries-link white-text">
                <h3>Entries</h3>
              </Link>
            </div>
            <div className="column-half">
              {user && (
                <Link
                  to="/"
                  onClick={handleSignOut}
                  className="entries-link white-text">
                  <h3>Sign Out</h3>
                </Link>
              )}
              {!user && (
                <Link to="/auth/sign-in" className="entries-link white-text">
                  <h3>Sign In</h3>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
