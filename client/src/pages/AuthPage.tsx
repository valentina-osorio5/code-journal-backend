import { Link } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';
import { SignInForm } from '../components/SignInForm';

type Mode = 'sign-in' | 'sign-up';

type Props = {
  mode: Mode;
};
export function AuthPage({ mode }: Props) {
  return (
    <div className="container">
      {mode === 'sign-up' && <RegistrationForm />}
      {mode === 'sign-in' && <SignInForm />}
      <div className="container margin-1">
        {mode === 'sign-in' && <Link to="/auth/sign-up">Register instead</Link>}
        {mode === 'sign-up' && <Link to="/auth/sign-in">Sign In instead</Link>}
      </div>
    </div>
  );
}
