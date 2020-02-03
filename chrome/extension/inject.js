import React, { Component } from 'react';
import { render } from 'react-dom';
import Dock from 'react-dock';
import { callbackify } from 'util';

class InjectApp extends Component {
  constructor(props) {
    super(props);
    this.state = { isVisible: false };
  }

  buttonOnClick = () => {
    this.setState({ isVisible: !this.state.isVisible });

  };

  render() {
    const buttonStyleLeft = {
      backgroundColor: '#008CBA',
      border: 'none',
      color: 'white',
      padding: '2px 10px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      margin: '4px 2px',
      cursor: 'pointer',
      transform: 'rotate(270deg)',
      position: 'fixed',
      top: '100px',
      right: '-25px',
      zIndex: '9999999',
      fontWeight: 'bold'
    }
    const buttonStyleRight = {
      backgroundColor: '#008CBA',
      border: 'none',
      color: 'white',
      padding: '2px 10px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      margin: '4px 2px',
      cursor: 'pointer',
      transform: 'rotate(270deg)',
      position: 'fixed',
      top: '100px',
      right: 'calc(-25px + 40%)',
      zIndex: '9999999999',
      transitionDelay: '.10s',
      fontWeight: 'bold'
    }
    return (
      <div>
        <button id="lectio-extension-enable" onClick={this.buttonOnClick} class="extension-button" style={this.state.isVisible ? buttonStyleRight : buttonStyleLeft}>
          Curate
        </button>
        <Dock
          position="right"
          dimMode="transparent"
          size={0.4}
          isVisible={this.state.isVisible}
        >
          <iframe
            style={{
              width: '100%',
              height: '97vh',
            }}
            frameBorder={0}
            allowTransparency="true"
            src={chrome.extension.getURL(`popup.html?protocol=${location.protocol}`)}
          />
        </Dock>
      </div>
    );
  }
}

window.addEventListener('load', () => {
  const injectDOM = document.createElement('div');
  injectDOM.className = 'lectio-extension-inject';
  injectDOM.style.textAlign = 'right';

  document.body.appendChild(injectDOM);
  render(<InjectApp />, injectDOM);
});
