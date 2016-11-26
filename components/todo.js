import { h, Component } from 'preact';

/** @jsx h */

export default class Todo extends Component {
  delete () {
    this.props.onDelete();
  }

  done () {
    this.props.onDone();
  }

  render () {
    const done = this.props.todo.done === 1;

    return (
      <tr className={done ? 'done' : ''}>
        <td>
          <input
            type='checkbox'
            checked={done}
            onClick={(e) => this.done()}
          />
        </td>
        <td>
          {this.props.todo.content}
        </td>
        <td>
          <span
            className='delete-button'
            onClick={(e) => this.delete()}>
            🚫
          </span>
        </td>
      </tr>
    );
  }
}