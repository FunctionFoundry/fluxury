# fluxury

[![Circle CI](https://circleci.com/gh/fluxury/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/fluxury/fluxury/tree/master)

Quick start:

```sh
npm install --save fluxury
```

```js
import {dispatch, createActions, createStore} from 'fluxury'
```

## Why another "Flux framework"?

This library adds 3 functions to Facebook's flux implementation to guide you into the `(state, action) -> state` pattern.

In flux@2.1, Facebook added 3 new abstract ES 2015 classes (FluxMapStore -> FluxReduceStore -> FluxStore). These stores guide you into the reducer pattern but, unfortunately, they also lead you into classes. This library reimplements the FluxStore in Douglas Crockford's class-free object oriented programming style.

This library is similar to Reflux and Redux except that this library doesn't try to replace the dispatcher with a new implementation. The library encourages you into simple patterns but doesn't try to change the core concepts. The flux/Dispatcher and fbemitter/EventEmitter modules are the key to Flux and this project depends directly on Facebook's implementations.  

This new "Flux framework" adds a surface area of 3 new functions:

  - dispatch
  - createActions
  - createStores

Enjoy!

## API Reference

  1. dispatch( type, data ) or dispatch( action )

    Submit an action into the stores. You must specify the type and, optionally, some data.

    ```js
    import {dispatch} from 'fluxury';

    // dispatch an action with a string
    dispatch('REQUEST_SETTINGS')  // => { type: 'LOAD_SETTINGS', data: undefined }
    // or with data
    dispatch('LOAD_SETTINGS', { a: 1, b: 2 }) // => { type: 'LOAD_SETTINGS', data: { a: 1, b: 2 } }
    // or with a custom object
    dispatch({ actionType: 'move', mode: 'off the rails' })
    ```

  2. createActions(action1, action2, ..., actionN)

    Create your actions from a list of strings as `arguments`.

    _MyActions.js_
    ```js
    import {createActions} from 'fluxury';

    export default createActions('INC', 'DEC', 'SET')
    ```

    This returns a key mirrored object. The key and the value are equal. It is a useful JS hack.

    ```js
    {
      INC: 'INC',
      DEC: 'DEC',
      SET: 'SET'
    }
    ```

    To use the action in a React component:

    ```js
    import {INC} from './MyActions'

    var React = require('react');
    var {dispatch} = require('fluxury');
    var PropTypes = React.PropTypes;

    var MyComponent = React.createClass({

      handleClick: function() {
        /* Call dispatch to submit the action to the stores */
        dispatch(INC)
      },

      render: function() {
        return (
          <button onClick={this.handleClick}>+1</button>
        );
      }

    });

    module.exports = MyComponent;

    ```

  3. createStore(name, initialState, reducer[ , methods, waitFor])

    Create a new store with a name, initialState, reducer and optionally an object with methods and an array with dispatch tokens sent to waitFor.

    ```js
    import {INC} from './MyActions';
    import {createStore} from 'fluxury';

    export default createStore('CountStore', 0, function(state, action) {
      if (action.type === INC) {
        return state + 1;
      }
      return state;
    }, {
      getCount: (state) => state // state is the count itself!
    });
    ```

    Perhaps you prefer the classic switch case form:

    ```js
    import {INC} from './MyActions'
    import {createStore} from 'fluxury';

    export default createStore('CountStore', 0, (state, action) => {
      switch (action.type)
      case INC:
        return state + 1;
      default:
        return state;
    })
    ```

    In this example you can make them both disappear:

    ```js
    import {INC} from './MyActions'
    import {createStore} from 'fluxury';

    export default createStore('CountStore', 0, function(state, action) {
        return state + (action.type === INC ? 1 : 0);
    })
    ```

## Store Properties and Methods

|name|comment|
|---------|------|
| name | The name supplied when creating the store |
| dispatchToken | A number used with waitFor |
| addListener | A function to add a callback for events |
| getState | A function that returns the current state |
| waitFor |  The array passed into createStore |

## Put it all together

```js
var React = require('react');
var {dispatch, createStore, createActions} = require('fluxury');
var {INC, DEC} = createActions('INC', 'DEC');
var PureRenderMixin = require('react-addons-pure-render-mixin');


var countStore = createStore('CountStore', 0, function(state, action) {
  switch (action.type) {
    case INC:
      return state+1;
    case DEC:
      return state-1;
    default:
      return state;
  }
});

var MyComponent = React.createClass({

  mixins: [PureRenderMixin],

  componentDidMount: function() {
    this.token = countStore.addListener( this.handleStoreChange );
  },

  componentWillUnmount: function() {
    this.token.remove();
  },

  handleStoreChange: function() {
    this.setState({ count: countStore.getState() })
  },

  handleUpClick: function() {
    /* Call dispatch to submit the action to the stores */
    dispatch(INC)
  },

  handleDownClick: function() {
    /* Call dispatch to submit the action to the stores */
    dispatch(DEC)
  },

  render: function() {
    return (
      <div>
        <p>{this.state.count}</p>
        <button onClick={this.handleUpClick}>+1</button>
        <button onClick={this.handleDownClick}>-1</button>
      </div>
    );
  }

});

module.exports = MyComponent;

```

## MapStore with defensive copies

A simple store that accumulates  data on each `SET` action.

```js
var {dispatch, createStore, createActions } = require('fluxury');
var {SET} = createActions('SET');

var store = createStore('MapStore', {}, function(state, action) {
  switch (action.type) {
    case SET:
      // combine both objects into a single new object
      return Object.assign({}, state, action.data)
    default:
      return state;
  }
}, {
  getStates: (state) => state.states,
  getPrograms: (state) => state.programs,
  getSelectedState: (state) => state.selectedState
});

dispatch(SET, { states: ['CA', 'OR', 'WA'] })
// store.getStates() => { states: ['CA', 'OR', 'WA']  }

dispatch(SET, { programs: [{ name: 'A', states: ['CA']}] })
// store.getPrograms() => { programs: [{ name: 'A', states: ['CA']}] }

dispatch(SET, { selectedState: 'CA' })
// store.getSelectedState() => 'CA'

// store.getState() => { states: ['CA', 'OR', 'WA'], { states: ['CA', 'OR', 'WA'], programs: [{ name: 'A', states: ['CA']}] }, selectedState: 'CA' }

```

## MapStore with Immutable data structures

Here is a similar MapStore with Immutable.js.

```js
var {dispatch, createStore, createActions } = require('fluxury');
var {SET, DELETE} = createActions('SET', 'DELETE');
var {Map} = require('Immutable');

var store = createStore('MapStore', Map(), function(state, action) {
  t.plan(8)
  switch (action.type) {
    case SET:
      // combine both objects into a single new object
      return state.merge(action.data);
    default:
      return state;
  }
}, {
  get: (state, param) => state.get(param),
  has: (state, param) => state.has(param),
  includes: (state, param) => state.includes(param),
  first: (state) => state.first(),
  last: (state) => state.last(),
  all: (state) => state.toJS(),
});
```

## Example Applications

[CSV File Viewer](https://github.com/petermoresi/react-csv-file-viewer)
