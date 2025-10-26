import '../styles/Header.css';

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <span className="app-header__badge">Fully Homomorphic Battle</span>
        <h1 className="app-header__title">Encrypted Wars</h1>
        <p className="app-header__subtitle">
          Challenge the system with a secret hand of numbers while keeping every move private.
        </p>
      </div>
    </header>
  );
}
