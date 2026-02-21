import React from 'react';
import { render, screen } from '@testing-library/react';
import { Auth } from '../pages/Auth';
import { PublicGateway } from '../pages/PublicGateway';
import { LanguageProvider } from '../contexts/LanguageContext';

describe('web smoke tests', () => {
  it('renders auth page shell', () => {
    render(<Auth onLogin={() => undefined} />);

    expect(screen.getByText('vicoo')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, genius!')).toBeInTheDocument();
  });

  it('renders key public gateway route page', () => {
    render(
      <LanguageProvider>
        <PublicGateway onLogin={() => undefined} />
      </LanguageProvider>
    );

    expect(screen.getByText('Vision. Code.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
