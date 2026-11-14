import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import printCssUrl from './print.css?url';

const printStylesheetLink = document.createElement('link');
printStylesheetLink.rel = 'stylesheet';
printStylesheetLink.href = printCssUrl;
printStylesheetLink.media = 'print';
document.head.appendChild(printStylesheetLink);

createRoot(document.getElementById('root')!).render(<App />);
