import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.common['X-Tenant-ID'] = import.meta.env.VITE_TENANT_ID;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
