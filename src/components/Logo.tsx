interface LogoProps {
  onClick?: () => void;
  size?: number;
}

export default function Logo({ onClick, size = 60 }: LogoProps) {
  return (
    <img
      src="/utku-logo.svg"
      alt="Utku Logo"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: 'fixed',
        right: 24,
        top: 24,
        zIndex: 99,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, opacity 0.2s'
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }}
    />
  );
}
