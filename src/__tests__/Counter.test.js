import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Counter from "../Counter";

test('Counter increases both values when button is clicked', async () => {
    render(<Counter />);

    const button = screen.getByText('+1');

    act(() => {
        fireEvent.click(button);
    });

    expect(screen.getByText('낙관적 값: 1')).toBeInTheDocument();

    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    expect(screen.getByText('실제 값: 1')).toBeInTheDocument();
});