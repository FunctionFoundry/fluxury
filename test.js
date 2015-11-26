var test = require('tape');

test( 'fluxury', function(t) {
  var Fluxury = require('./lib/index.js')
  t.plan(20)

  t.equal(typeof Fluxury, 'object')
  t.equal(typeof Fluxury.createActions, 'function')
  t.equal(typeof Fluxury.createStore, 'function')
  t.equal(typeof Fluxury.dispatch, 'function')
  t.equal( Object.isFrozen(Fluxury), true)

  var actions = Fluxury.createActions('INC', 'DEC', 'SET'),
  INC = actions.INC,
  DEC = actions.DEC,
  SET = actions.SET;

  t.deepEqual( actions, {
    INC: 'INC',
    DEC: 'DEC',
    SET: 'SET'
  } )

  var store = Fluxury.createStore('MapStore', {}, function(state, action) {
    switch (action.type) {
      case SET:
      // combine both objects into a single new object
      return Object.assign({}, state, action.data)
      default:
      return state;
    }
  }, {
    getFoo: (state) => state.foo,
    getBar: (state) => state.bar,
    filterHey: (state, param) => state.hey.filter((d) => d === param),
    filterNotHey: (state, param) => state.hey.filter((d) => d !== param)
  });

  var listenerCount = 0;
  store.addListener( () => listenerCount++ )
  Fluxury.dispatch(SET, { foo: 1, bar: 2 })
  t.deepEqual(store.getState(), { foo: 1, bar: 2 })
  t.equal(store.getFoo(), 1)
  t.equal(store.getBar(), 2)
  Fluxury.dispatch(SET, { foo: 2 })
  t.deepEqual(store.getState(), { foo: 2, bar: 2 })
  Fluxury.dispatch(SET, { hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.getState(), { foo: 2, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  Fluxury.dispatch(SET, { foo: 3 })
  t.deepEqual(store.getState(), { foo: 3, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.filterHey('go'), ['go']);
  t.deepEqual(store.filterNotHey('go'), ['ho', 'let\'s']);
  // ensure that callback is invoked correct number of times
  t.equal(listenerCount, 4);

  var store = Fluxury.createStore('CountStore', 0, function(state, action) {
    switch (action.type) {
      case INC:
      return state+1;
      case DEC:
      return state-1;
      default:
      return state;
    }
  });

  Fluxury.dispatch(INC)
  t.equal(store.getState(), 1)

  Fluxury.dispatch(INC)
  t.equal(store.getState(), 2)

  Fluxury.dispatch(DEC)
  t.equal(store.getState(), 1)

  Fluxury.dispatch(DEC)
  t.equal(store.getState(), 0)

  t.deepEqual( Object.keys(store), ['name', 'dispatchToken', 'addListener', 'getState'] );
})

test('ImmutableMapStore', function(t) {
  var Fluxury = require('./lib/index'),
  dispatch = Fluxury.dispatch
  SET = 'SET',
  Immutable = require('immutable');

  var store = Fluxury.createStore('MapStore', Immutable.Map(), function(state, action) {
    t.plan(9)
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

  t.deepEqual( Object.keys(store), [
    'name',
    'dispatchToken',
    'addListener',
    'getState',
    'get',
    'has',
    'includes',
    'first',
    'last',
    'all']
  );

  dispatch(SET, { states: ['CA', 'OR', 'WA'] })
  dispatch(SET, { programs: [{ name: 'A', states: ['CA']}] })
  dispatch(SET, { selectedState: 'CA' })

  t.deepEqual( store.get('states').toJS(), ['CA', 'OR', 'WA']  );
  t.deepEqual( store.get('programs').toJS(), [{ name: 'A', states: ['CA']}] );
  t.deepEqual( store.get('selectedState'), 'CA' );
  t.deepEqual( store.all(), { states: ['CA', 'OR', 'WA'], programs: [{ name: 'A', states: ['CA']}] , selectedState: 'CA' } );

  t.deepEqual( store.has('states'), true );
  t.deepEqual( store.first().toJS(), ['CA', 'OR', 'WA'] );
  t.deepEqual( store.last(), 'CA' );
  t.deepEqual( store.includes('CA'), true );

})

test('waitFor works correctly', function(t) {

  var createStore = require('./lib/index').createStore
  var dispatch = require('./lib/index').dispatch
  var dispatchCount = 0;

  t.plan(10)

  var MessageStore = createStore('MessageStore', [], function(state, action) {
    switch(action.type) {
      case 'loadMessage':
      return state.concat(action.data)
      default:
      return state
    }
  })

  var MessageCountStore = createStore( 'MessageCountStore', 0,
  function(state, action, waitFor) {
    // ensure that MessageStore reducer is executed before continuing
    waitFor([MessageStore.dispatchToken])
    switch(action.type) {
      case 'loadMessage':
      return state+1
      default:
      return state
    }
  }
)

MessageStore.addListener(function() {
  dispatchCount += 1
})

dispatch('loadMessage', 'Test')
t.equals(MessageStore.getState().length, 1)
t.equals(MessageCountStore.getState(), 1)
t.deepEqual(MessageStore.getState(), ['Test'])

dispatch('loadMessage', 'Test2')
t.equals(MessageStore.getState().length, 2)
t.equals(MessageCountStore.getState(), 2)
t.deepEqual(MessageStore.getState(), ['Test', 'Test2'])

dispatch('loadMessage', 'Test3')
t.equals(MessageStore.getState().length, 3)
t.equals(MessageCountStore.getState(), 3)
t.deepEqual(MessageStore.getState(), ['Test', 'Test2', 'Test3'])

t.equal(dispatchCount, 3)

})
