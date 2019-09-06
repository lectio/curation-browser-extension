import React, { Component } from 'react';
import Customform from '../components/Customform';
import style from './App.css';

export default class App extends Component {
  render() {
    return (
      <div className={style.normal}>
        <Customform></Customform>
      </div>
    );
  }
}
