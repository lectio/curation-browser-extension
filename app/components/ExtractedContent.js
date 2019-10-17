import React from 'react';
// import style from './Extractedcontent.css';
import JSONPretty from 'react-json-pretty';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

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
            aria-expanded="false"
            aria-controls="readableMetaData"
          >Readable meta data
          </button>
        </h4>
        <div id="readableMetaData" className="usa-accordion__content usa-prose" hidden>
          {this.props.articleTitle ?
            <div className="ds-l-row">
              <div className="ds-l-col preview__label ds-u-font-style--normal ds-u-font-size--small">
                <b>Title: </b>{this.props.articleTitle}
              </div>
            </div>
            : null}
          {this.props.articleExcerpt ?
            <div className="ds-l-row">
              <div className="ds-l-col preview__label ds-u-font-style--normal ds-u-font-size--small">
                <b>Excerpt: </b>{this.props.articleExcerpt}
              </div>
            </div> : null}
          {this.props.articleByline ?
            <div className="ds-l-row">
              <div className="ds-l-col preview__label ds-u-font-style--normal ds-u-font-size--small">
                <b>Byline: </b>{this.props.articleByline}
              </div>
            </div> : null}
        </div>
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="editableMetaContent"
          >Readable content (editable)
          </button>
        </h4>
        <div id="editableMetaContent" className="usa-accordion__content usa-prose ds-u-overflow--hidden ds-u-padding-top--0 ds-u-padding-left--1" hidden>
          <div className="ds-u-margin-left--1" style={{ height: '427px' }}>
            <div className="ds-l-row ds-u-margin-top--0 preview__label ds-u-font-style--normal">
              <CKEditor
                editor={ClassicEditor}
                config={{
                  toolbar: ['heading', 'bold', 'italic', 'link', 'undo', 'redo', 'bulletedList', 'numberedList', 'blockQuote']
                }}
                data={this.props.articleData}
                onInit={(editor) => {
                  editor.setData(this.props.articleData);
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  this.props.articleData = data;
                  this.props.onContentChange(data);
                }}
              />
            </div>
          </div>
        </div>
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="metaDataContent"
          >HTML meta data
          </button>
        </h4>
        <div id="metaDataContent" className="usa-accordion__content usa-prose" hidden>
          <div className="ds-u-margin--0 ds-u-font-size--small" style={{ height: '392px' }}>
            <JSONPretty id="json-pretty" data={this.props.jsonData} />
          </div>
        </div>
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="rssFeedContent"
          >RSS Feeds
          </button>
        </h4>
        <div id="rssFeedContent" className="usa-accordion__content usa-prose" hidden>
          <div className="ds-u-margin--0 ds-u-font-size--small" style={{ height: '392px' }}>
            {this.props.rssFeed.length > 0 ? <JSONPretty id="rss-feed-pretty" data={this.props.rssFeed} /> : null }
          </div>
        </div>
      </div>
    );
  }
}
