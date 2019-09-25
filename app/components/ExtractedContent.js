import React from 'react';
// import style from './Extractedcontent.css';
import JSONPretty from 'react-json-pretty';
import ReactHtmlParser from 'react-html-parser';

export default class ExtractedContent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      json: ''
    };
  }
  render() {
    return (
      <div className="usa-accordion site-accordion-code">
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="readableContent"
          >Readable Content
          </button>
        </h4>
        <div id="readableContent" className="usa-accordion__content usa-prose">
          <div className="ds-u-margin-left--1 ds-u-font-size--small" style={{ height: '395px' }}>
            {this.props.articleTitle ? <div className="ds-l-row ds-u-fill--warn-lightest"><span className="ds-u-font-weight--bold ds-u-padding-right--1">Title:</span> {this.props.articleTitle}</div> : null}
            {this.props.articleExcerpt ? <div className="ds-l-row ds-u-fill--warn-lightest"><span className="ds-u-font-weight--bold ds-u-padding-right--1">Excerpt:</span> {this.props.articleExcerpt}</div> : null}
            {this.props.articleByline ? <div className="ds-l-row ds-u-fill--warn-lightest"><span className="ds-u-font-weight--bold ds-u-padding-right--1">Byline:</span> {this.props.articleByline}</div> : null}
            <div className="ds-l-row">{ReactHtmlParser(this.props.articleData)}</div>
          </div>
        </div>
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="metaDataContent"
          >Extracted meta data
          </button>
        </h4>
        <div id="metaDataContent" className="usa-accordion__content usa-prose" hidden>
          <div className="ds-u-margin--0 ds-u-font-size--small" style={{ height: '390px' }}>
            <JSONPretty id="json-pretty" data={this.props.jsonData} contentEditable={true} ></JSONPretty>
          </div>
        </div>
      </div>
    );
  }
}
