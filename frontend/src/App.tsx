import React from 'react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import FileUploader from './components/FileUploader';

const App: React.FC = () => {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>ファイルチャンカー</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Row>
          <Col md={8} className="mx-auto">
            <h1 className="text-center mb-4">ファイルチャンカー</h1>
            <p className="text-center">
              大きなファイルを小さなチャンクに分割してRESTful APIに送信します。
            </p>
            <FileUploader />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;