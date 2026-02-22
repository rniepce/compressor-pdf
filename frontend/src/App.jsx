import Header from './components/Header';
import Footer from './components/Footer';
import UploadBox from './components/UploadBox';

export default function App() {
  return (
    <>
      <Header />
      <main className="main-content">
        <UploadBox />
      </main>
      <Footer />
    </>
  );
}
