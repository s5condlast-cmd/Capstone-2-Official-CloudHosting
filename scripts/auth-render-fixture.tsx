import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Login } from '../src/pages/public/Login';
import { ForgotPassword } from '../src/pages/public/ForgotPassword';
import { ResetPassword } from '../src/pages/public/ResetPassword';

export { Login, ForgotPassword, ResetPassword };
export const render = (Component: React.ElementType) => renderToStaticMarkup(
  <MemoryRouter><AuthProvider><Component /></AuthProvider></MemoryRouter>,
);
