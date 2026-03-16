export default function Header(): React.JSX.Element {
    return (
        <header className="header">
            <div className="header__container">
                <div className="header__brand">
                    <span className="header__logo">TJMG</span>
                    <div className="header__divider" />
                    <span className="header__title">Compressor de PDF</span>
                </div>
                <nav className="header__nav">
                    <a href="#" className="active">Início</a>
                    <a href="#">Ajuda</a>
                </nav>
            </div>
        </header>
    );
}
