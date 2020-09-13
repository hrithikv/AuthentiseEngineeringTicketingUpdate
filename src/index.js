import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import firebase from 'firebase';
import {BrowserRouter} from "react-router-dom";



var config = {
    apiKey: "AIzaSyCgqwBI0sNpSXxeI6aLUKlglrl3DVhuCL4",
    authDomain: "staffloginauth.firebaseapp.com",
    databaseURL: "https://staffloginauth.firebaseio.com",
    projectId: "staffloginauth",
    storageBucket: "staffloginauth.appspot.com",
    messagingSenderId: "031110013"
};
firebase.initializeApp(config);

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
    , document.getElementById('root'));

registerServiceWorker();
