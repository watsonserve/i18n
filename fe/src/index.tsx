import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import '@arco-design/web-react/dist/css/arco.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { i18n } from './api';

document.body.setAttribute('arco-theme', 'dark');

// i18n().then(t => {
//   (window as any).t = t;
//   console.log(t('open'));
// }).catch(() => undefined);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
