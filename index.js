import { h, render, Component } from 'preact';
import SqliteProxy from './sqlite-proxy';

import Todo from './components/todo';
import CreateTodo from './components/create-todo';

const app = {
  name: 'todo'
};
const db = new SqliteProxy(app);

// Tell Babel to transform JSX into h() calls:
/** @jsx h */

class App extends Component {
  constructor () {
    super();

    // Loading state
    this.state.todos = [];

    // Create database
    this.initialize();
  }

  componentDidMount () {
    // Load the styles into the <head /> using node-lessify
    require('./css/mui.css');
    require('./css/style.less');

    // Set viewport meta tag
    document.head.innerHTML += '<meta name="viewport" content="width=device-width, initial-scale=1">';
  }

  initialize () {
    if (false) {
      db.run('CREATE TABLE todos (done INT, content TEXT)', (err) => {
        if (err) {
          console.error(err);
        }

        this.reload();
      });

      // db.run('DELETE FROM todos')

      // var stmt = db.prepare('INSERT INTO lorem VALUES (?)');
      // for (var i = 0; i < 10; i++) {
      //   stmt.run('Ipsum ' + i);
      // }

      // stmt.finalize(() => this.reload());
    }

    this.reload();
  }

  reload () {
    this.setState({
      todos: []
    });

    db.each('SELECT rowid AS id, done, content FROM todos ORDER BY done ASC, rowid DESC', (err, row) => {
      if (err) {
        throw err;
      }

      this.setState({
        todos: this.state.todos.concat(row)
      });
    });
  }

  onCreate (todo) {
    db.run('INSERT INTO todos VALUES (?, ?)', [0, todo.content], () => {
      this.reload();
    });
  }

  onDelete (todo) {
    db.run('DELETE FROM todos where rowid=?', todo.id, () => {
      this.reload();
    });
  }

  onDone (todo) {
    db.run('UPDATE todos SET done=1 WHERE rowid=?', todo.id, () => {
      this.reload();
    });
  }

  onUndo (todo) {
    db.run('UPDATE todos SET done=0 WHERE rowid=?', todo.id, () => {
      this.reload();
    });
  }

  render (props, state) {
    let todos = this.state.todos.map((t) => {
      return (
        <Todo 
          onDone={() => this.onDone(t)}
          onUndo={() => this.onUndo(t)}
          onDelete={() => this.onDelete(t)}
          todo={t} 
        />
      );;
    });

    return (
      <div>
        <div className='mui-appbar'>
          <h1>Todo</h1>
        </div>

        <br />

        <div className='mui-container'>
          <CreateTodo onCreate={(todo) => this.onCreate(todo)} />

          <div className='mui-panel'>
            <table className='todo-list mui-table mui-table--bordered'>
              <thead>
                <th colSpan='3'>Todo</th>
              </thead>
              <tbody>
                {todos}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

// render an instance of the app into <body>:
render(<App />, document.body);
