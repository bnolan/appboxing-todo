import { h, Component } from 'preact';

/** @jsx h */

export default class CreateTodo extends Component {
  constructor () {
    super();

    this.state.content = '';
  }

  save () {
    this.props.onCreate({
      content: this.state.content
    });

    this.setState({content: ''});
  }

  render () {
    return (
      <div className='mui-panel'>
        <div className='mui-textfield'>
          <textarea
            placeholder='Add a Todo'
            value={this.state.content}
            onChange={(e) => this.setState({content: e.target.value})}
          />
        </div>
        <button
          className='mui-btn mui-btn--raised mui-btn--primary'
          onClick={(e) => this.save()}>
          Add Todo
        </button>
      </div>
    );
  }
}