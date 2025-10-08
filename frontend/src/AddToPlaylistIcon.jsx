import { FaPlus } from 'react-icons/fa';

const AddToPlaylistIcon = ({ onClick, style = {} }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '48px',
        right: '8px',
        zIndex: 11,
        opacity: style.opacity || 0,
        transition: 'opacity 0.3s ease',
        cursor: 'pointer',
        ...style
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        <FaPlus
          size="0.9rem"
          color="#fff"
          style={{
            filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
            transition: 'all 0.2s ease'
          }}
        />
      </div>
    </div>
  );
};

export default AddToPlaylistIcon;
