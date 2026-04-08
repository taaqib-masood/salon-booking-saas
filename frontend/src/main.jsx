import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import i18nConfig from './i18n.config';
import './global.css';

ReactDOM.render(<App />, document.getElementById('root'));

// Set document direction based on current language
document.dir = i18nConfig.language === 'ar' ? 'rtl' : 'ltr';