import '../styles/Modal.css';

export default function LoadingOverlay() {
  return (
    <div className='loading-overlay' role='status' aria-live='polite'>
      <p>The Wumpus is thinking...</p>
    </div>
  );
}