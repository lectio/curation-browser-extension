import React, { Component } from 'react';
// import style from './Extractedcontent.css';
import { Map } from 'immutable';
import JSONPretty from 'react-json-pretty';

export default class ExtractedContent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      json: ''
    };
  }
  render() {
    return (
      <div className="ds-u-margin--0 ds-u-font-size--small" style={{ height: '392px' }}>
        <JSONPretty id="json-pretty" data={this.props.jsonData} contentEditable={true} ></JSONPretty>
      </div>
    );
  }
}
