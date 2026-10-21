import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.error ? <div className="error-box" role="alert"><h2>Unable to load the tour</h2><p>{this.state.error.message}</p><p>Check WebGL / hardware acceleration. For real assets, check the GLB URL, embedded textures and export format.</p><button onClick={this.props.onRetry}>Retry loading</button></div> : this.props.children; }
}
