import { h, Component } from 'preact';

/** @jsx h */

export default class Todo extends Component {
  constructor () {
    super()

    this.state.popup = false;

    // All this popup code is kind of gross, I should 
    // have made another component for it.
    this.handler = (e) => {
      // Only close if clicking elsewhere in the document
      if (this.dropdown.contains(e.target)) {
        return;
      }

      this.setState({popup: false});
      this.removeHandler();
    };
  }

  componentDidUnmount () {
    this.removeHandler();
  }

  delete () {
    this.props.onDelete();
  }

  done () {
    this.props.onDone();
  }

  undo () {
    this.props.onUndo();
  }

  openPopup () {
    this.setState({popup: true});
    document.documentElement.addEventListener('click', this.handler);
  }

  removeHandler () {
    document.documentElement.removeEventListener('click', this.handler);
  }

  render () {
    const done = this.props.todo.done === 1;

    var menu;

    if (this.state.popup) {
      menu = 
        <ul className='mui-dropdown__menu mui--is-open mui-dropdown__menu--right'>
          <li><a href='#' onClick={(e) => {this.delete(); e.preventDefault()}}>Delete</a></li>
        </ul>;
    }

    return (
      <tr className={done ? 'done' : ''}>
        <td>
          <input
            type='checkbox'
            checked={done}
            onClick={(e) => done ? this.undo() : this.done()}
          />
        </td>
        <td>
          {this.props.todo.content}
        </td>
        <td>
          <div className='mui-dropdown' ref={(d) => {this.dropdown = d}}>
            <span
              className='delete-button'
              onClick={(e) => this.openPopup()}>
              ...
            </span>
            { menu }
          </div>
        </td>
      </tr>
    );
  }
}