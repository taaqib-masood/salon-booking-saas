import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './global.css'; 
import { AuthProvider, LangProvider } from './contexts';

ReactDOM.render(
  <AuthProvider>
    <LangProvider>
      <App />
    </LangProvider>
  </AuthProvider>,
  document.getElementById('root')
);
