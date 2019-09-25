import React from 'react';
// import style from './Extractedcontent.css';

export default class AutoClassification extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      json: ''
    };
  }
  componentDidMount() {
    this.getMeshData();
  }
  getMeshData = (e) => {
    console.log(this.props);
  }
  render() {
    return (
      <div className="usa-accordion site-accordion-code">
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="metaDataContent"
          >
            Auto Classification
          </button>
        </h4>
        <div id="metaDataContent" className="usa-accordion__content usa-prose">
          Commin Soon!
        </div>
      </div>
    );
  }
}
