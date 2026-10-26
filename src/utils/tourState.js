export function tourReducer(state, event) {
  switch (event.type) {
    case 'READY': return state === 'loading' ? 'welcome' : state;
    case 'ENTER': return ['welcome', 'paused', 'help', 'info'].includes(state) ? 'exploring' : state;
    case 'PAUSE': return state === 'exploring' ? 'paused' : state;
    case 'HELP': return 'help';
    case 'INFO': return 'info';
    case 'SETUP': return 'setup';
    case 'EXIT': return 'welcome';
    case 'LOAD': return 'loading';
    default: return state;
  }
}
