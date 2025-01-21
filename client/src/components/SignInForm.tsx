import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import {User, useUser} from ./useUser;

type AuthData = {
  user: User;
  token: string;
};

export function SignInForm() {
  const { handleSignIn } = useUser();
  // const [isLoading, setIsLoading] = useState(false);
  // const navigate = useNavigate();

  return (
    <div className="container">
      <h2 className="text-xl font-bold">Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap mb-1">
          <div className="w-1/2">
            <label className="mb-1 block">
              Username
              <input
                required
                name="username"
                type="text"
                className="block border border-gray-600 rounded p-2 h-8 w-full mb-2"
              />
            </label>
            <label className="mb-1 block">
              Password
              <input
                required
                name="password"
                type="password"
                className="block border border-gray-600 rounded p-2 h-8 w-full mb-2"
              />
            </label>
          </div>
        </div>
        <button
          disabled={isLoading}
          className="align-middle text-center border rounded py-1 px-3 bg-blue-600 text-white">
          Sign In
        </button>
      </form>
    </div>
  );
}
