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
      cursor: 'pointer',
      display: 'inline-block',
      fontFamily:'sans-serif',
      fontSize: '16px',
      fontStyle: 'normal',
      fontVariant: 'normal',
      fontWeight: '700',
      lineHeight: '16px',
      margin: '4px 2px',
      padding: '2px 10px',
      position: 'fixed',
      right: '-35px',
      textAlign: 'center',
      textDecoration: 'none',
      top: '100px',
      transform: 'rotate(270deg)',
      maxWidth: '100px',
      minWidth: '69px',
      zIndex: '9999999',
      width: '100px',
      height: '35px',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
      borderTopLeftRadius: '0',
      borderTopRightRadius: '0',
      boxSizing: 'border-box',

    }
    const buttonStyleRight = {
      backgroundColor: '#008CBA',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      display: 'inline-block',
      fontFamily:'sans-serif',
      fontStyle: 'normal',
      fontSize: '16px',
      fontVariant: 'normal',
      fontWeight: '700',
      lineHeight: '16px',
      margin: '4px 2px',
      padding: '2px 10px',
      position: 'fixed',
      right: 'calc(-35px + 40%)',
      textAlign: 'center',
      textDecoration: 'none',
      transform: 'rotate(270deg)',
      transitionDelay: '.10s',
      top: '100px',
      zIndex: '9999999999',
      maxWidth: '100px',
      minWidth: '69px',
      width: '100px',
      height: '35px',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
      borderTopLeftRadius: '0',
      borderTopRightRadius: '0',
      boxSizing: 'border-box',
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
