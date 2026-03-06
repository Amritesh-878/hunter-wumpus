import PropTypes from 'prop-types';

const EDGES = ['north', 'south', 'east', 'west'];

/**
 * Renders edge-glow overlays on the player tile to indicate the
 * direction of the Wumpus stench.
 *
 * @param {{ direction: string | null }} props
 */
export default function DirectionalSense({ direction }) {
  if (!direction) {
    return null;
  }

  const lower = direction.toLowerCase();
  const edges = lower === 'all' ? EDGES : [lower];

  return (
    <>
      {edges.map((edge) => (
        <span
          key={edge}
          className={`sense-edge sense-edge--${edge}`}
          aria-label={`Stench ${edge}`}
        />
      ))}
    </>
  );
}

DirectionalSense.propTypes = {
  direction: PropTypes.string,
};
