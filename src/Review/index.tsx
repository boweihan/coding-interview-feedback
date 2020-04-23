import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { findIndex } from 'lodash';
import { Button, message } from 'antd';
import ReactMDE from 'react-mde';
import { Redirect } from 'react-router-dom';
import * as Showdown from 'showdown';
import 'react-mde/lib/styles/css/react-mde-all.css';
import { addCommentLineWidget } from '../CommentWidget';
import { store } from '../store';
import { Editor, EditorOptions } from '../Editor';
import { Comment } from '../types';
import styles from './styles.css';
import 'antd/es/button/style';
import 'antd/es/modal/style';

const converter = new Showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});

interface ReviewProps {
  location: {
    hash: string;
  };
}

const widgets: any = [];

const Review = ({ location }: ReviewProps) => {
  const context = useContext(store);

  // get snippet from location and context
  const snippetId = location.hash.slice(1);
  const {
    state: { snippets },
  } = context;

  const snippet = snippets[findIndex(snippets, { id: snippetId })];

  if (!snippet) {
    // redirect to create page if snippet not found
    return <Redirect to="/create" />;
  }

  const { title, language, text, comments } = snippet;

  const createCommentWidgets = (cm: any) => {
    comments?.forEach((comment) => addCommentLineWidget(cm, comment));
  };

  const addComment = (comment: Comment) =>
    context.dispatch({
      type: 'SAVE_COMMENT',
      payload: {
        snippetId,
        comment,
      },
    });

  const removeInputWidgets = (cm: any) => {
    for (let i = 0; i < widgets.length; i++) {
      cm.removeLineWidget(widgets[i]);
    }
  };

  const InputWidget = ({ cm, line }: any) => {
    const [value, setValue] = useState('');
    const [selectedTab, setSelectedTab] = React.useState<'write' | 'preview'>(
      'write'
    );

    return (
      <div className={styles.widgetContainer}>
        <ReactMDE
          className="review__textarea"
          value={value}
          onChange={setValue}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          generateMarkdownPreview={(markdown) =>
            Promise.resolve(converter.makeHtml(markdown))
          }
        />
        <div className={styles.widgetButtons}>
          <Button type="dashed" onClick={() => removeInputWidgets(cm)}>
            Cancel
          </Button>
          &nbsp;
          <Button
            onClick={() => {
              addComment({
                id: String(new Date().getTime()),
                line,
                text: value,
              });
              message.success('Comment added!');
            }}
          >
            Add Comment
          </Button>
        </div>
      </div>
    );
  };

  const addInputLineWidget = (cm: any, event: any) => {
    removeInputWidgets(cm);
    const line = event.line;
    let div = document.createElement('div');
    ReactDOM.render(<InputWidget cm={cm} line={line} />, div);
    widgets.push(cm.addLineWidget(line, div));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{title}</h2>
      <p>Review Page</p>
      <div>
        <EditorOptions language={language} />
        <div className={styles.editor}>
          <Editor
            key={JSON.stringify(comments)}
            text={JSON.parse(text)}
            language={language}
            onCursor={addInputLineWidget}
            // setTimeout required to avoid JS Execution race condition with CodeMirror
            onMount={(cm: any) => setTimeout(() => createCommentWidgets(cm), 0)}
          />
        </div>
      </div>
    </div>
  );
};

export default Review;
