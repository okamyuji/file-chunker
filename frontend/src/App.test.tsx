import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { level: 1, name: 'ファイルチャンカー' });
  expect(heading).toBeInTheDocument();
});
